import { supabaseAdmin } from '../config/database';

export interface ProjectData {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  owner_id: string;
  status: 'planning' | 'active' | 'completed' | 'paused' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  start_date?: Date;
  end_date?: Date;
  // 统计字段（可选）
  task_count?: number;
  tasks_completed?: number;
  progress?: number;
  tags?: string[];
  created_at: Date;
  updated_at: Date;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  parent_id?: string;
  owner_id: string;
  status?: 'planning' | 'active' | 'completed' | 'paused' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  start_date?: Date;
  end_date?: Date;
  tags?: string[];
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  parent_id?: string;
  status?: 'planning' | 'active' | 'completed' | 'paused' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  start_date?: Date;
  end_date?: Date;
  progress?: number;
  tags?: string[];
}

export interface ProjectFilters {
  status?: 'planning' | 'active' | 'completed' | 'paused' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  parent_id?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export class ProjectModel {
  // 根据用户ID获取项目列表
  static async findByUserId(userId: string, filters: ProjectFilters = {}): Promise<ProjectData[]> {
    const {
      status,
      priority,
      parent_id,
      search,
      limit = 50,
      offset = 0
    } = filters;

    // 使用 Supabase 查询构建器获取项目和关联数据
    let query = supabaseAdmin
      .from('projects')
      .select(`
        *,
        project_members(user_id),
        pending_members(id),
        tasks(id, status)
      `);

    // 用户权限过滤：项目拥有者 或 项目成员
    // 注意：Supabase 不支持直接的 OR 子查询，需要分两次查询然后合并
    // 这里使用 RPC 或者分步查询
    
    // 方案：获取所有项目，然后在代码中过滤
    const { data: allProjects, error } = await query;
    
    if (error) {
      console.error('Error finding projects:', error);
      throw error;
    }

    // 过滤用户有权限的项目
    let projects = (allProjects || []).filter(p => 
      p.owner_id === userId || 
      (p.project_members && p.project_members.some((m: any) => m.user_id === userId))
    );

    // 应用筛选条件
    if (status) {
      projects = projects.filter(p => p.status === status);
    }

    if (priority) {
      projects = projects.filter(p => p.priority === priority);
    }

    if (parent_id !== undefined) {
      if (parent_id === null || parent_id === '') {
        projects = projects.filter(p => !p.parent_id);
      } else {
        projects = projects.filter(p => p.parent_id === parent_id);
      }
    }

    if (search) {
      const searchLower = search.toLowerCase();
      projects = projects.filter(p => 
        p.name?.toLowerCase().includes(searchLower) || 
        p.description?.toLowerCase().includes(searchLower)
      );
    }

    // 计算统计数据
    const projectsWithStats = projects.map((p: any) => {
      const taskCount = p.tasks?.length || 0;
      const tasksCompleted = p.tasks?.filter((t: any) => t.status === 'completed').length || 0;
      const progress = taskCount > 0 ? Math.round((tasksCompleted / taskCount) * 100) : 0;
      
      // 计算总成员数：正式成员 + 待定成员
      const formalMemberCount = p.project_members?.length || 0;
      const pendingMemberCount = p.pending_members?.length || 0;
      const totalMemberCount = formalMemberCount + pendingMemberCount;

      return {
        ...p,
        member_count: totalMemberCount,
        task_count: taskCount,
        tasks_total: taskCount, // 兼容前端字段
        tasks_completed: tasksCompleted,
        progress,
        // 清理嵌套数据
        project_members: undefined,
        pending_members: undefined,
        tasks: undefined
      };
    });

    // 排序
    projectsWithStats.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

    // 分页
    const paginatedProjects = projectsWithStats.slice(offset, offset + limit);

    return paginatedProjects;
  }

  // 根据ID获取单个项目
  static async findById(id: string, userId: string): Promise<ProjectData | null> {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        project_members(user_id),
        pending_members(id),
        tasks(id, status)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error finding project by id:', error);
      throw error;
    }

    // 检查权限
    const hasAccess = data.owner_id === userId || 
      (data.project_members && data.project_members.some((m: any) => m.user_id === userId));

    if (!hasAccess) {
      return null;
    }

    // 计算统计数据
    const taskCount = data.tasks?.length || 0;
    const tasksCompleted = data.tasks?.filter((t: any) => t.status === 'completed').length || 0;
    const progress = taskCount > 0 ? Math.round((tasksCompleted / taskCount) * 100) : 0;
    
    // 计算总成员数：正式成员 + 待定成员
    const formalMemberCount = data.project_members?.length || 0;
    const pendingMemberCount = data.pending_members?.length || 0;
    const totalMemberCount = formalMemberCount + pendingMemberCount;

    return {
      ...data,
      member_count: totalMemberCount,
      task_count: taskCount,
      tasks_total: taskCount, // 兼容前端字段
      tasks_completed: tasksCompleted,
      progress,
      // 清理嵌套数据
      project_members: undefined,
      pending_members: undefined,
      tasks: undefined
    };
  }

  // 创建新项目
  static async create(projectData: CreateProjectData): Promise<ProjectData> {
    const {
      name,
      description,
      parent_id,
      owner_id,
      status = 'planning',
      priority = 'medium',
      start_date,
      end_date,
      tags = []
    } = projectData;

    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert({
      name,
      description,
      parent_id,
      owner_id,
      status,
      priority,
      start_date,
      end_date,
      tags
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      throw error;
    }

    return data;
  }

  // 更新项目
  static async update(id: string, userId: string, updateData: UpdateProjectData): Promise<ProjectData | null> {
    if (Object.keys(updateData).length === 0) {
      throw new Error('没有提供更新数据');
    }

    const { data, error } = await supabaseAdmin
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .eq('owner_id', userId)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error updating project:', error);
      throw error;
    }
    
    return data;
  }

  // 删除项目
  static async delete(id: string, userId: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('owner_id', userId);
    
    if (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
    
    return true;
  }

  // 获取项目统计信息
  static async getStatistics(userId: string): Promise<any> {
    // 获取用户参与的所有项目
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select(`
        id,
        owner_id,
        status,
        priority,
        project_members(user_id)
      `);
    
    if (error) {
      console.error('Error getting project statistics:', error);
      throw error;
    }

    // 过滤用户有权限的项目
    const userProjects = (projects || []).filter(p => 
      p.owner_id === userId || 
      (p.project_members && p.project_members.some((m: any) => m.user_id === userId))
    );
    
    const stats = {
      total_projects: userProjects.length,
      active_projects: userProjects.filter(p => p.status === 'active').length,
      completed_projects: userProjects.filter(p => p.status === 'completed').length,
      high_priority_projects: userProjects.filter(p => p.priority === 'high').length
    };

    return stats;
  }

  // 获取项目统计信息（别名方法）
  static async getStats(userId: string): Promise<any> {
    return await this.getStatistics(userId);
  }

  // 获取子项目
  static async getSubProjects(parentId: string, userId: string): Promise<ProjectData[]> {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        project_members(user_id),
        pending_members(id),
        tasks(id, status)
      `)
      .eq('parent_id', parentId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error getting sub projects:', error);
      throw error;
    }

    // 过滤用户有权限的项目
    const userProjects = (data || []).filter(p => 
      p.owner_id === userId || 
      (p.project_members && p.project_members.some((m: any) => m.user_id === userId))
    );

    // 计算统计数据
    return userProjects.map((p: any) => {
      const taskCount = p.tasks?.length || 0;
      const tasksCompleted = p.tasks?.filter((t: any) => t.status === 'completed').length || 0;
      
      // 计算总成员数：正式成员 + 待定成员
      const formalMemberCount = p.project_members?.length || 0;
      const pendingMemberCount = p.pending_members?.length || 0;
      const totalMemberCount = formalMemberCount + pendingMemberCount;

      return {
        ...p,
        member_count: totalMemberCount,
        task_count: taskCount,
        tasks_completed: tasksCompleted,
        // 清理嵌套数据
        project_members: undefined,
        pending_members: undefined,
        tasks: undefined
      };
    });
  }

  // 获取项目层级路径
  static async getProjectPath(projectId: string): Promise<ProjectData[]> {
    // 使用递归查询获取项目路径
    // 由于 Supabase 不直接支持递归 CTE，这里使用循环实现
    const path: ProjectData[] = [];
    let currentId: string | null = projectId;

    while (currentId) {
      const { data, error } = await supabaseAdmin
        .from('projects')
        .select('id, name, parent_id')
        .eq('id', currentId)
        .single();
      
      if (error || !data) break;
      
      path.unshift(data as any);
      currentId = data.parent_id || null;
    }

    return path;
  }
}

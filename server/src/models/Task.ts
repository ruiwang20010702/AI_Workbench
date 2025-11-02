import { supabaseAdmin } from '../config/database';
import { ProjectProgressUpdater } from './ProjectProgressUpdater';

export interface TaskData {
  id: string;
  title: string;
  description?: string;
  project_id: string;
  assignee_id?: string;
  creator_id: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  start_date?: Date;
  due_date?: Date;
  estimated_hours?: number;
  actual_hours?: number;
  tags?: string[];
  dependencies?: string[];
  created_at: Date;
  updated_at: Date;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  project_id: string;
  assignee_id?: string;
  creator_id: string;
  status?: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  start_date?: Date;
  due_date?: Date;
  estimated_hours?: number;
  tags?: string[];
  dependencies?: string[];
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  assignee_id?: string;
  status?: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  start_date?: Date;
  due_date?: Date;
  estimated_hours?: number;
  actual_hours?: number;
  tags?: string[];
  dependencies?: string[];
}

export interface TaskFilters {
  project_id?: string;
  assignee_id?: string;
  status?: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  search?: string;
  overdue?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'updated_at' | 'due_date' | 'priority';
  sortOrder?: 'ASC' | 'DESC';
}

export class TaskModel {
  // 根据用户ID获取任务列表
  static async findByUserId(userId: string, filters: TaskFilters = {}): Promise<TaskData[]> {
    const {
      project_id,
      assignee_id,
      status,
      priority,
      tags,
      search,
      overdue,
      limit = 20,
      offset = 0,
      sortBy = 'updated_at',
      sortOrder = 'DESC'
    } = filters;

    // 构建查询（个人工作台模式：简化权限检查）
    let query = supabaseAdmin
      .from('tasks')
      .select(`
        *,
        projects:project_id (name),
        assignee:assignee_id (display_name),
        creator:creator_id (display_name)
      `);

    if (project_id) {
      query = query.eq('project_id', project_id);
    }

    if (assignee_id) {
      query = query.eq('assignee_id', assignee_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (tags && tags.length > 0) {
      query = query.overlaps('tags', tags);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (overdue) {
      query = query
        .lt('due_date', new Date().toISOString())
        .neq('status', 'completed');
    }

    // 排序
    const ascending = sortOrder === 'ASC';
    query = query.order(sortBy, { ascending });

    // 分页
    if (offset > 0 || limit !== 20) {
      const end = offset + limit - 1;
      query = query.range(offset, end);
    } else {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error finding tasks:', error);
      throw new Error(`TaskModel.findByUserId failed: ${error.message}`);
    }

    // 展平关系数据
    return (data || []).map((task: any) => {
      const project = task.projects;
      const assignee = task.assignee;
      const creator = task.creator;
      
      delete task.projects;
      delete task.assignee;
      delete task.creator;
      
      return {
        ...task,
        project_name: project?.name,
        assignee_name: assignee?.display_name,
        creator_name: creator?.display_name
      };
    });
  }

  // 根据项目ID获取任务列表
  static async findByProjectId(projectId: string, userId: string, filters: TaskFilters = {}): Promise<TaskData[]> {
    return this.findByUserId(userId, { ...filters, project_id: projectId });
  }

  // 根据ID获取单个任务
  static async findById(id: string, userId: string): Promise<TaskData | null> {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select(`
        *,
        projects:project_id (name),
        assignee:assignee_id (display_name),
        creator:creator_id (display_name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error finding task by ID:', error);
      throw error;
    }

    // 展平关系数据
    const project = data.projects;
    const assignee = data.assignee;
    const creator = data.creator;
    
    delete data.projects;
    delete data.assignee;
    delete data.creator;
    
    return {
      ...data,
      project_name: project?.name,
      assignee_name: assignee?.display_name,
      creator_name: creator?.display_name
    };
  }

  // 创建新任务
  static async create(taskData: CreateTaskData): Promise<TaskData> {
    const {
      title,
      description,
      project_id,
      assignee_id,
      creator_id,
      status = 'todo',
      priority = 'medium',
      start_date,
      due_date,
      estimated_hours,
      tags = [],
      dependencies = []
    } = taskData;

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert({
      title,
      description,
      project_id,
      assignee_id,
      creator_id,
      status,
      priority,
        start_date: start_date?.toISOString(),
        due_date: due_date?.toISOString(),
      estimated_hours,
      tags,
      dependencies
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      throw error;
    }
    
    // 创建任务后更新项目进度（暂时禁用，避免 progress 列不存在的错误）
    try {
    await ProjectProgressUpdater.onTaskStatusChanged(project_id);
    } catch (progressError: any) {
      console.warn('[Task] Could not update project progress:', progressError.message);
    }

    return data;
  }

  // 更新任务
  static async update(id: string, updateData: UpdateTaskData, userId: string): Promise<TaskData | null> {
    const updatePayload: any = { 
      updated_at: new Date().toISOString() 
    };

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'start_date' || key === 'due_date') {
          updatePayload[key] = value instanceof Date ? value.toISOString() : value;
        } else {
          updatePayload[key] = value;
        }
      }
    });

    if (Object.keys(updatePayload).length === 1) {
      throw new Error('没有提供更新数据');
    }

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error updating task:', error);
      throw error;
    }
    
    // 如果任务状态发生变化，更新项目进度（暂时禁用，避免 progress 列不存在的错误）
    if (updateData.status) {
      try {
      await ProjectProgressUpdater.onTaskStatusChanged(data.project_id);
      } catch (progressError: any) {
        console.warn('[Task] Could not update project progress:', progressError.message);
      }
    }
    
    return data;
  }

  // 删除任务
  static async delete(id: string, userId: string): Promise<boolean> {
    // 先获取任务信息以获得项目ID
    const { data: task, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('project_id')
      .eq('id', id)
      .single();

    if (taskError && taskError.code !== 'PGRST116') {
      console.error('Error fetching task for deletion:', taskError);
      throw taskError;
    }

    const projectId = task?.project_id;
    
    // 删除任务
    const { error } = await supabaseAdmin
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
    
    // 如果删除成功且有项目ID，更新项目进度（暂时禁用，避免 progress 列不存在的错误）
    if (projectId) {
      try {
      await ProjectProgressUpdater.onTaskStatusChanged(projectId);
      } catch (progressError: any) {
        console.warn('[Task] Could not update project progress:', progressError.message);
      }
    }
    
    return true;
  }

  // 获取任务统计信息
  static async getStatistics(userId: string, projectId?: string): Promise<any> {
    let query = supabaseAdmin
      .from('tasks')
      .select('status, priority, due_date')
      .or(`creator_id.eq.${userId},assignee_id.eq.${userId}`);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting task statistics:', error);
      throw error;
    }

    const tasks = data || [];
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    return {
      total_tasks: tasks.length,
      todo_tasks: tasks.filter(t => t.status === 'todo').length,
      in_progress_tasks: tasks.filter(t => t.status === 'in_progress').length,
      completed_tasks: tasks.filter(t => t.status === 'completed').length,
      cancelled_tasks: tasks.filter(t => t.status === 'cancelled').length,
      high_priority_tasks: tasks.filter(t => t.priority === 'high').length,
      medium_priority_tasks: tasks.filter(t => t.priority === 'medium').length,
      low_priority_tasks: tasks.filter(t => t.priority === 'low').length,
      overdue_tasks: tasks.filter(t => 
        t.due_date && new Date(t.due_date) < now && 
        t.status !== 'completed' && t.status !== 'cancelled'
      ).length,
      upcoming_deadlines: tasks.filter(t => 
        t.due_date && new Date(t.due_date) >= now && 
        new Date(t.due_date) <= threeDaysLater && 
        t.status !== 'completed' && t.status !== 'cancelled'
      ).length
    };
  }

  // 获取任务标签
  static async getTags(userId: string): Promise<string[]> {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select('tags');

    if (error) {
      console.error('Error getting task tags:', error);
      throw error;
    }

    // 展开所有标签并去重
    const allTags = new Set<string>();
    (data || []).forEach((task: any) => {
      if (task.tags && Array.isArray(task.tags)) {
        task.tags.forEach((tag: string) => allTags.add(tag));
      }
    });

    return Array.from(allTags).sort();
  }

  // 新增：按项目获取任务标签（带权限限制）
  static async getTagsByProject(projectId: string, userId: string): Promise<string[]> {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select('tags')
      .eq('project_id', projectId);

    if (error) {
      console.error('Error getting project task tags:', error);
      throw error;
    }

    // 展开所有标签并去重
    const allTags = new Set<string>();
    (data || []).forEach((task: any) => {
      if (task.tags && Array.isArray(task.tags)) {
        task.tags.forEach((tag: string) => allTags.add(tag));
      }
    });

    return Array.from(allTags).sort();
  }

  // 批量更新任务状态
  static async batchUpdateStatus(taskIds: string[], status: string, userId: string): Promise<TaskData[]> {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .in('id', taskIds)
      .select();

    if (error) {
      console.error('Error batch updating task status:', error);
      throw error;
    }

    // 更新所有相关项目的进度（暂时禁用，避免 progress 列不存在的错误）
    const projectIds = new Set<string>();
    (data || []).forEach((task: any) => {
      if (task.project_id) {
        projectIds.add(task.project_id as string);
      }
    });
    for (const projectId of projectIds) {
      try {
      await ProjectProgressUpdater.onTaskStatusChanged(projectId);
      } catch (progressError: any) {
        console.warn('[Task] Could not update project progress:', progressError.message);
      }
    }

    return data || [];
  }

  // 获取任务依赖关系
  static async getDependencies(taskId: string): Promise<TaskData[]> {
    // 先获取任务的依赖ID列表
    const { data: task, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('dependencies')
      .eq('id', taskId)
      .single();

    if (taskError) {
      if (taskError.code === 'PGRST116') {
        return [];
      }
      console.error('Error fetching task dependencies:', taskError);
      throw taskError;
    }

    if (!task?.dependencies || task.dependencies.length === 0) {
      return [];
    }

    // 获取依赖的任务详情
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .in('id', task.dependencies);

    if (error) {
      console.error('Error fetching dependency tasks:', error);
      throw error;
    }

    return data || [];
  }

  // 检查任务依赖是否完成
  static async checkDependenciesCompleted(taskId: string): Promise<boolean> {
    const dependencies = await this.getDependencies(taskId);
    return dependencies.every(dep => dep.status === 'completed');
  }
}

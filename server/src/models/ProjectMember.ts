import { supabaseAdmin } from '../config/database';

export interface ProjectMemberData {
  id: string;
  project_id: string;
  user_id: string;
  role: 'admin' | 'member' | 'observer';
  joined_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProjectMemberData {
  project_id: string;
  user_id: string;
  role?: 'admin' | 'member' | 'observer';
}

export interface UpdateProjectMemberData {
  role?: 'admin' | 'member' | 'observer';
}

export interface ProjectMemberWithUser {
  id: string;
  project_id: string;
  user_id: string;
  role: 'admin' | 'member' | 'observer';
  joined_at: Date;
  username: string;
  email: string;
}

export class ProjectMemberModel {
  // 根据项目ID获取成员列表
  static async findByProjectId(projectId: string): Promise<ProjectMemberWithUser[]> {
    const { data, error } = await supabaseAdmin
      .from('project_members')
      .select(`
        *,
        users:user_id (
          display_name,
          email
        )
      `)
      .eq('project_id', projectId)
      .order('role')
      .order('joined_at');

    if (error) {
      console.error('Error finding project members:', error);
      throw error;
    }

    // 展平用户关系数据
    return (data || []).map((member: any) => {
      const user = member.users;
      delete member.users;
      return {
        ...member,
        username: user?.display_name || user?.email?.split('@')[0] || 'Unknown',
        email: user?.email
      };
    });
  }

  // 根据用户ID获取项目列表
  static async findByUserId(userId: string): Promise<ProjectMemberData[]> {
    const { data, error } = await supabaseAdmin
      .from('project_members')
      .select(`
        *,
        projects:project_id (
          name,
          description
        )
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('Error finding user projects:', error);
      throw error;
    }

    // 展平项目关系数据
    return (data || []).map((member: any) => {
      const project = member.projects;
      delete member.projects;
      return {
        ...member,
        project_name: project?.name,
        project_description: project?.description
      };
    });
  }

  // 根据项目ID和用户ID查找成员记录
  static async findByProjectIdAndUserId(projectId: string, userId: string): Promise<ProjectMemberData | null> {
    const { data, error } = await supabaseAdmin
      .from('project_members')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error finding project member:', error);
      throw error;
    }

    return data;
  }

  // 检查用户是否是项目成员
  static async isMember(projectId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('project_members')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error checking membership:', error);
      throw error;
    }

    return (data?.length || 0) > 0;
  }

  // 获取用户在项目中的角色
  static async getUserRole(projectId: string, userId: string): Promise<string | null> {
    const { data, error } = await supabaseAdmin
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error getting user role:', error);
      throw error;
    }

    return data?.role || null;
  }

  // 检查用户是否有项目管理权限
  static async hasManagePermission(projectId: string, userId: string): Promise<boolean> {
    // 检查是否是项目所有者
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single();

    if (projectError && projectError.code !== 'PGRST116') {
      console.error('Error checking project owner:', projectError);
      throw projectError;
    }

    if (project?.owner_id === userId) {
      return true;
    }

    // 检查是否是项目管理员
    const { data: member, error: memberError } = await supabaseAdmin
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    if (memberError && memberError.code !== 'PGRST116') {
      console.error('Error checking admin role:', memberError);
      throw memberError;
    }

    return !!member;
  }

  // 检查用户权限（通用权限检查方法）
  static async checkPermission(projectId: string, userId: string, permission: string): Promise<boolean> {
    // 个人工作台模式：允许所有权限
    return true;
  }

  // 检查用户是否是项目成员（别名方法）
  static async checkMembership(projectId: string, userId: string): Promise<boolean> {
    // 个人工作台模式：允许访问所有项目
    return true;
  }

  // 添加项目成员
  static async create(memberData: CreateProjectMemberData): Promise<ProjectMemberData> {
    const { project_id, user_id, role = 'member' } = memberData;

    // 检查是否已经是成员
    const existingMember = await this.isMember(project_id, user_id);
    if (existingMember) {
      throw new Error('用户已经是项目成员');
    }

    const { data, error } = await supabaseAdmin
      .from('project_members')
      .insert({
        project_id,
        user_id,
        role,
        joined_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project member:', error);
      throw error;
    }

    return data;
  }

  // 更新成员角色
  static async updateRole(projectId: string, userId: string, operatorId: string, updateData: UpdateProjectMemberData): Promise<ProjectMemberData | null> {
    // 检查操作者是否有管理权限
    const hasPermission = await this.hasManagePermission(projectId, operatorId);
    if (!hasPermission) {
      throw new Error('没有权限修改成员角色');
    }

    const { role } = updateData;

    const { data, error } = await supabaseAdmin
      .from('project_members')
      .update({ 
        role, 
        updated_at: new Date().toISOString() 
      })
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error updating member role:', error);
      throw error;
    }

    return data;
  }

  // 更新成员信息（别名方法）
  static async update(memberId: string, updateData: UpdateProjectMemberData): Promise<ProjectMemberData | null> {
    const { role } = updateData;

    const { data, error } = await supabaseAdmin
      .from('project_members')
      .update({ 
        role, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', memberId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error updating member:', error);
      throw error;
    }

    return data;
  }

  // 移除项目成员
  static async remove(projectId: string, userId: string, operatorId: string): Promise<boolean> {
    // 检查操作者是否有管理权限（除非是自己退出项目）
    if (userId !== operatorId) {
      const hasPermission = await this.hasManagePermission(projectId, operatorId);
      if (!hasPermission) {
        throw new Error('没有权限移除成员');
      }
    }

    // 不能移除项目所有者
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single();

    if (projectError && projectError.code !== 'PGRST116') {
      console.error('Error checking project owner:', projectError);
      throw projectError;
    }

    if (project?.owner_id === userId) {
      throw new Error('不能移除项目所有者');
    }

    const { error } = await supabaseAdmin
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing member:', error);
      throw error;
    }

    return true;
  }

  // 批量添加成员
  static async batchAdd(projectId: string, userIds: string[], role: string = 'member', operatorId: string): Promise<ProjectMemberData[]> {
    // 检查操作者是否有管理权限
    const hasPermission = await this.hasManagePermission(projectId, operatorId);
    if (!hasPermission) {
      throw new Error('没有权限添加成员');
    }

    const members: ProjectMemberData[] = [];
    
    for (const userId of userIds) {
      try {
        const member = await this.create({ project_id: projectId, user_id: userId, role: (role as any) || 'member' });
        members.push(member);
      } catch (error) {
        // 如果用户已经是成员，跳过
        console.warn(`用户 ${userId} 已经是项目成员，跳过添加`);
      }
    }

    return members;
  }

  // 获取项目成员统计
  static async getStatistics(projectId: string): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('project_members')
      .select('role')
      .eq('project_id', projectId);

    if (error) {
      console.error('Error getting member statistics:', error);
      throw error;
    }

    const members = data || [];
    
    return {
      total_members: members.length,
      admin_count: members.filter(m => m.role === 'admin').length,
      member_count: members.filter(m => m.role === 'member').length,
      observer_count: members.filter(m => m.role === 'observer').length
    };
  }

  // 搜索可添加的用户（不在项目中的用户）
  static async searchAvailableUsers(projectId: string, search: string, limit: number = 10): Promise<any[]> {
    // 获取已在项目中的用户ID
    const { data: existingMembers, error: membersError } = await supabaseAdmin
      .from('project_members')
      .select('user_id')
      .eq('project_id', projectId);

    if (membersError) {
      console.error('Error fetching existing members:', membersError);
      throw membersError;
    }

    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single();

    if (projectError && projectError.code !== 'PGRST116') {
      console.error('Error fetching project:', projectError);
      throw projectError;
    }

    const excludedUserIds = [
      ...(existingMembers || []).map(m => m.user_id),
      project?.owner_id
    ].filter(Boolean);

    // 搜索用户
    let query = supabaseAdmin
      .from('users')
      .select('id, display_name, email')
      .or(`display_name.ilike.%${search}%,email.ilike.%${search}%`)
      .limit(limit);

    if (excludedUserIds.length > 0) {
      query = query.not('id', 'in', `(${excludedUserIds.join(',')})`);
    }

    const { data, error } = await query.order('display_name');

    if (error) {
      console.error('Error searching available users:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * 根据邮箱批量查找用户（不排除已在项目中的用户）
   * 用于批量导入时判断用户是否已注册
   * @param emails 邮箱列表
   * @returns 用户列表（包含 id, display_name, email）
   */
  static async findUsersByEmails(emails: string[]): Promise<Array<{ id: string; display_name: string; email: string }>> {
    if (emails.length === 0) {
      return [];
    }

    // 将邮箱转为小写，确保不区分大小写匹配
    const lowerEmails = emails.map(e => e.toLowerCase());

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, display_name, email')
      .in('email', lowerEmails);

    if (error) {
      console.error('Error finding users by emails:', error);
      throw error;
    }

    return data || [];
  }

  // 获取用户参与的项目数量
  static async getUserProjectCount(userId: string): Promise<number> {
    const { data, error } = await supabaseAdmin
      .from('project_members')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('Error getting user project count:', error);
      throw error;
    }

    return data?.length || 0;
  }

  // 获取最近加入的成员
  static async getRecentMembers(projectId: string, limit: number = 5): Promise<ProjectMemberWithUser[]> {
    const { data, error } = await supabaseAdmin
      .from('project_members')
      .select(`
        *,
        users:user_id (
          display_name,
          email
        )
      `)
      .eq('project_id', projectId)
      .order('joined_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting recent members:', error);
      throw error;
    }

    // 展平用户关系数据
    return (data || []).map((member: any) => {
      const user = member.users;
      delete member.users;
      return {
        ...member,
        username: user?.display_name || user?.email?.split('@')[0] || 'Unknown',
        email: user?.email
      };
    });
  }
}

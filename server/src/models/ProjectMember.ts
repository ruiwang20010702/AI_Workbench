import { Pool } from 'pg';
import pool from '../config/database';

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
    const query = `
      SELECT pm.*, u.username, u.email
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $1
      ORDER BY pm.role, pm.joined_at
    `;
    
    const result = await pool.query(query, [projectId]);
    return result.rows;
  }

  // 根据用户ID获取项目列表
  static async findByUserId(userId: string): Promise<ProjectMemberData[]> {
    const query = `
      SELECT pm.*, p.name as project_name, p.description as project_description
      FROM project_members pm
      JOIN projects p ON pm.project_id = p.id
      WHERE pm.user_id = $1
      ORDER BY pm.joined_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // 检查用户是否是项目成员
  static async isMember(projectId: string, userId: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM project_members 
      WHERE project_id = $1 AND user_id = $2
    `;
    
    const result = await pool.query(query, [projectId, userId]);
    return (result.rowCount ?? 0) > 0;
  }

  // 获取用户在项目中的角色
  static async getUserRole(projectId: string, userId: string): Promise<string | null> {
    const query = `
      SELECT role FROM project_members 
      WHERE project_id = $1 AND user_id = $2
    `;
    
    const result = await pool.query(query, [projectId, userId]);
    return result.rows[0]?.role || null;
  }

  // 检查用户是否有项目管理权限
  static async hasManagePermission(projectId: string, userId: string): Promise<boolean> {
    // 检查是否是项目所有者
    const ownerQuery = `
      SELECT 1 FROM projects 
      WHERE id = $1 AND owner_id = $2
    `;
    const ownerResult = await pool.query(ownerQuery, [projectId, userId]);
    
    if (ownerResult.rows.length > 0) {
      return true;
    }

    // 检查是否是项目管理员
    const adminQuery = `
      SELECT 1 FROM project_members 
      WHERE project_id = $1 AND user_id = $2 AND role = 'admin'
    `;
    const adminResult = await pool.query(adminQuery, [projectId, userId]);
    
    return adminResult.rows.length > 0;
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

    const query = `
      INSERT INTO project_members (project_id, user_id, role, joined_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;

    const result = await pool.query(query, [project_id, user_id, role]);
    return result.rows[0];
  }

  // 更新成员角色
  static async updateRole(projectId: string, userId: string, operatorId: string, updateData: UpdateProjectMemberData): Promise<ProjectMemberData | null> {
    // 检查操作者是否有管理权限
    const hasPermission = await this.hasManagePermission(projectId, operatorId);
    if (!hasPermission) {
      throw new Error('没有权限修改成员角色');
    }

    const { role } = updateData;

    const query = `
      UPDATE project_members 
      SET role = $1, updated_at = NOW()
      WHERE project_id = $2 AND user_id = $3
      RETURNING *
    `;

    const result = await pool.query(query, [role, projectId, userId]);
    return result.rows[0] || null;
  }

  // 更新成员信息（别名方法）
  static async update(memberId: string, updateData: UpdateProjectMemberData): Promise<ProjectMemberData | null> {
    const { role } = updateData;

    const query = `
      UPDATE project_members 
      SET role = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [role, memberId]);
    return result.rows[0] || null;
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
    const ownerQuery = `
      SELECT 1 FROM projects 
      WHERE id = $1 AND owner_id = $2
    `;
    const ownerResult = await pool.query(ownerQuery, [projectId, userId]);
    
    if (ownerResult.rows.length > 0) {
      throw new Error('不能移除项目所有者');
    }

    const query = `
      DELETE FROM project_members 
      WHERE project_id = $1 AND user_id = $2
    `;
    
    const result = await pool.query(query, [projectId, userId]);
    return (result.rowCount ?? 0) > 0;
  }

  // 批量添加成员
  static async batchAdd(projectId: string, userIds: string[], role: string = 'member', operatorId: string): Promise<ProjectMemberData[]> {
    // 使用英文角色，默认member
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
    const query = `
      SELECT 
        COUNT(*) as total_members,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
        COUNT(CASE WHEN role = 'member' THEN 1 END) as member_count,
        COUNT(CASE WHEN role = 'observer' THEN 1 END) as observer_count
      FROM project_members 
      WHERE project_id = $1
    `;
    
    const result = await pool.query(query, [projectId]);
    return result.rows[0];
  }

  // 搜索可添加的用户（不在项目中的用户）
  static async searchAvailableUsers(projectId: string, search: string, limit: number = 10): Promise<any[]> {
    const query = `
      SELECT id, username, email
      FROM users 
      WHERE (username ILIKE $1 OR email ILIKE $1)
      AND id NOT IN (
        SELECT user_id FROM project_members WHERE project_id = $2
        UNION
        SELECT owner_id FROM projects WHERE id = $2
      )
      ORDER BY username
      LIMIT $3
    `;
    
    const result = await pool.query(query, [`%${search}%`, projectId, limit]);
    return result.rows;
  }

  // 获取用户参与的项目数量
  static async getUserProjectCount(userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM project_members 
      WHERE user_id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  // 获取最近加入的成员
  static async getRecentMembers(projectId: string, limit: number = 5): Promise<ProjectMemberWithUser[]> {
    const query = `
      SELECT pm.*, u.username, u.email
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $1
      ORDER BY pm.joined_at DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [projectId, limit]);
    return result.rows;
  }
}
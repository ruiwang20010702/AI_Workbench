import { Pool } from 'pg';
import pool from '../config/database';

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

    let query = `
      SELECT p.*, 
             COUNT(pm.user_id) as member_count,
             COUNT(t.id) as task_count,
             COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as tasks_completed,
             COALESCE(
               CASE 
                 WHEN COUNT(t.id) = 0 THEN 0
                 ELSE ROUND(
                   (COUNT(CASE WHEN t.status = 'completed' THEN 1 END) * 100.0 / COUNT(t.id))::numeric, 2
                 )
               END, 0
             ) as progress
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE (p.owner_id = $1 OR p.id IN (
        SELECT project_id FROM project_members WHERE user_id = $1
      ))
    `;
    
    const params: any[] = [userId];
    let paramIndex = 2;

    if (status) {
      query += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (priority) {
      query += ` AND p.priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    if (parent_id !== undefined) {
      if (parent_id === null || parent_id === '') {
        query += ` AND p.parent_id IS NULL`;
      } else {
        query += ` AND p.parent_id = $${paramIndex}`;
        params.push(parent_id);
        paramIndex++;
      }
    }

    if (search) {
      query += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += `
      GROUP BY p.id
      ORDER BY p.updated_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  // 根据ID获取单个项目
  static async findById(id: string, userId: string): Promise<ProjectData | null> {
    const query = `
      SELECT p.*, 
             COUNT(pm.user_id) as member_count,
             COUNT(t.id) as task_count,
             COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as tasks_completed,
             COALESCE(
               CASE 
                 WHEN COUNT(t.id) = 0 THEN 0
                 ELSE ROUND(
                   (COUNT(CASE WHEN t.status = 'completed' THEN 1 END) * 100.0 / COUNT(t.id))::numeric, 2
                 )
               END, 0
             ) as progress
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE p.id = $1 AND (p.owner_id = $2 OR p.id IN (
        SELECT project_id FROM project_members WHERE user_id = $2
      ))
      GROUP BY p.id
    `;
    
    const result = await pool.query(query, [id, userId]);
    return result.rows[0] || null;
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

    const query = `
      INSERT INTO projects (name, description, parent_id, owner_id, status, priority, start_date, end_date, tags)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await pool.query(query, [
      name,
      description,
      parent_id,
      owner_id,
      status,
      priority,
      start_date,
      end_date,
      tags
    ]);

    return result.rows[0];
  }

  // 更新项目
  static async update(id: string, userId: string, updateData: UpdateProjectData): Promise<ProjectData | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('没有提供更新数据');
    }

    fields.push(`updated_at = NOW()`);

    const query = `
      UPDATE projects 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex} AND owner_id = $${paramIndex + 1}
      RETURNING *
    `;

    values.push(id, userId);
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  // 删除项目
  static async delete(id: string, userId: string): Promise<boolean> {
    const query = `
      DELETE FROM projects 
      WHERE id = $1 AND owner_id = $2
    `;
    
    const result = await pool.query(query, [id, userId]);
    return (result.rowCount ?? 0) > 0;
  }

  // 获取项目统计信息
  static async getStatistics(userId: string): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_projects,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_projects,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_projects
      FROM projects 
      WHERE owner_id = $1 OR id IN (
        SELECT project_id FROM project_members WHERE user_id = $1
      )
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  // 获取项目统计信息（别名方法）
  static async getStats(userId: string): Promise<any> {
    return await this.getStatistics(userId);
  }

  // 获取子项目
  static async getSubProjects(parentId: string, userId: string): Promise<ProjectData[]> {
    const query = `
      SELECT p.*, 
             COUNT(pm.user_id) as member_count,
             COUNT(t.id) as task_count,
             COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as tasks_completed
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE p.parent_id = $1 AND (p.owner_id = $2 OR p.id IN (
        SELECT project_id FROM project_members WHERE user_id = $2
      ))
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;
    
    const result = await pool.query(query, [parentId, userId]);
    return result.rows;
  }

  // 获取项目层级路径
  static async getProjectPath(projectId: string): Promise<ProjectData[]> {
    const query = `
      WITH RECURSIVE project_path AS (
        SELECT id, name, parent_id, 0 as level
        FROM projects 
        WHERE id = $1
        
        UNION ALL
        
        SELECT p.id, p.name, p.parent_id, pp.level + 1
        FROM projects p
        INNER JOIN project_path pp ON p.id = pp.parent_id
      )
      SELECT * FROM project_path ORDER BY level DESC
    `;
    
    const result = await pool.query(query, [projectId]);
    return result.rows;
  }
}
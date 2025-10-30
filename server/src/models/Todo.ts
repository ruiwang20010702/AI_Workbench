import pool from '../config/database';
import { Todo } from '../types';

export class TodoModel {
  static async findById(id: string, userId: string): Promise<Todo | null> {
    const query = 'SELECT * FROM todos WHERE id = $1 AND user_id = $2';
    const result = await pool.query(query, [id, userId]);
    return result.rows[0] || null;
  }

  static async findByUserId(
    userId: string,
    options: {
      note_id?: string;
      status?: '未开始' | '进行中' | '已完成';
      priority?: '低' | '中' | '高';
      due_date_from?: Date;
      due_date_to?: Date;
      limit?: number;
      offset?: number;
      completed?: boolean;
      orderBy?: 'created_at' | 'updated_at' | 'due_date' | 'priority';
      orderDir?: 'ASC' | 'DESC';
    } = {}
  ): Promise<Todo[]> {
    let query = 'SELECT * FROM todos WHERE user_id = $1';
    const values: any[] = [userId];
    let paramCount = 2;

    if (options.note_id) {
      query += ` AND note_id = $${paramCount++}`;
      values.push(options.note_id);
    }

    if (options.status) {
      query += ` AND status = $${paramCount++}`;
      values.push(options.status);
    }

    if (options.priority) {
      // 同时兼容中文与英文存量数据
      const zh = options.priority;
      const en = zh === '高' ? 'high' : zh === '中' ? 'medium' : zh === '低' ? 'low' : undefined;
      if (en) {
        query += ` AND (priority = $${paramCount} OR priority = $${paramCount + 1})`;
        values.push(zh, en);
        paramCount += 2;
      } else {
        query += ` AND priority = $${paramCount++}`;
        values.push(zh);
      }
    }

    if (options.completed !== undefined) {
      query += ` AND completed = $${paramCount++}`;
      values.push(options.completed);
    }

    if (options.due_date_from) {
      query += ` AND due_date >= $${paramCount++}`;
      values.push(options.due_date_from);
    }

    if (options.due_date_to) {
      query += ` AND due_date <= $${paramCount++}`;
      values.push(options.due_date_to);
    }

    // 排序支持：默认按创建时间降序
    const dir = options.orderDir === 'ASC' ? 'ASC' : 'DESC';
    switch (options.orderBy) {
      case 'priority':
        query += ` ORDER BY CASE 
          WHEN priority IN ('高','high') THEN 3
          WHEN priority IN ('中','medium') THEN 2
          WHEN priority IN ('低','low') THEN 1
          ELSE 0
        END ${dir}`;
        break;
      case 'due_date':
        query += ` ORDER BY due_date ${dir} NULLS LAST`;
        break;
      case 'updated_at':
        query += ` ORDER BY updated_at ${dir}`;
        break;
      case 'created_at':
      default:
        query += ` ORDER BY created_at ${dir}`;
        break;
    }

    if (options.limit) {
      query += ` LIMIT $${paramCount++}`;
      values.push(options.limit);
    }

    if (options.offset) {
      query += ` OFFSET $${paramCount++}`;
      values.push(options.offset);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async create(todoData: {
    user_id: string;
    note_id: string;
    title: string;
    description?: string;
    due_date?: Date;
    priority?: '低' | '中' | '高';
  }): Promise<Todo> {
    const query = `
      INSERT INTO todos (user_id, note_id, title, description, due_date, priority)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      todoData.user_id,
      todoData.note_id,
      todoData.title,
      todoData.description || null,
      todoData.due_date || null,
      todoData.priority || '中'
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async createBatch(todos: {
    user_id: string;
    note_id: string;
    title: string;
    description?: string;
    due_date?: Date;
    priority?: '低' | '中' | '高';
  }[]): Promise<Todo[]> {
    if (todos.length === 0) return [];

    const values: any[] = [];
    const placeholders: string[] = [];
    
    todos.forEach((todo, index) => {
      const baseIndex = index * 6;
      placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6})`);
      values.push(
        todo.user_id,
        todo.note_id,
        todo.title,
        todo.description || null,
        todo.due_date || null,
        todo.priority || '中'
      );
    });

    const query = `
      INSERT INTO todos (user_id, note_id, title, description, due_date, priority)
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async update(id: string, userId: string, todoData: {
    title?: string;
    description?: string;
    due_date?: Date;
    priority?: '低' | '中' | '高';
    status?: '未开始' | '进行中' | '已完成';
    completed?: boolean;
    completed_at?: Date | null;
  }): Promise<Todo | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (todoData.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(todoData.title);
    }

    if (todoData.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(todoData.description);
    }

    if (todoData.due_date !== undefined) {
      fields.push(`due_date = $${paramCount++}`);
      values.push(todoData.due_date);
    }

    if (todoData.priority !== undefined) {
      fields.push(`priority = $${paramCount++}`);
      values.push(todoData.priority);
    }

    if (todoData.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(todoData.status);
    }

    if (todoData.completed !== undefined) {
      fields.push(`completed = $${paramCount++}`);
      values.push(todoData.completed);
    }

    if (todoData.completed_at !== undefined) {
      fields.push(`completed_at = $${paramCount++}`);
      values.push(todoData.completed_at);
    }

    if (fields.length === 0) {
      return this.findById(id, userId);
    }

    values.push(id, userId);
    const query = `
      UPDATE todos 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount++} AND user_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const query = 'DELETE FROM todos WHERE id = $1 AND user_id = $2';
    const result = await pool.query(query, [id, userId]);
    return (result.rowCount ?? 0) > 0;
  }

  static async getStatistics(userId: string): Promise<{
    total: number;
    completed: number;
    pending: number;
    in_progress: number;
    not_started: number;
    overdue: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN completed = TRUE THEN 1 END) as completed,
        COUNT(CASE WHEN completed = FALSE THEN 1 END) as pending,
        COUNT(CASE WHEN status = '进行中' AND completed = FALSE THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = '未开始' AND completed = FALSE THEN 1 END) as not_started,
        COUNT(CASE WHEN due_date IS NOT NULL AND due_date < NOW() AND completed = FALSE THEN 1 END) as overdue
      FROM todos 
      WHERE user_id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    const row = result.rows[0];
    
    return {
      total: parseInt(row.total),
      completed: parseInt(row.completed),
      pending: parseInt(row.pending),
      in_progress: parseInt(row.in_progress),
      not_started: parseInt(row.not_started),
      overdue: parseInt(row.overdue)
    };
  }

  static async batchUpdate(
    userId: string,
    ids: string[],
    todoData: {
      title?: string;
      description?: string;
      due_date?: Date;
      priority?: '低' | '中' | '高' | 'low' | 'medium' | 'high';
      status?: '未开始' | '进行中' | '已完成';
      completed?: boolean;
      completed_at?: Date | null;
    }
  ): Promise<Todo[]> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (todoData.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(todoData.title);
    }
    if (todoData.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(todoData.description);
    }
    if (todoData.due_date !== undefined) {
      fields.push(`due_date = $${paramCount++}`);
      values.push(todoData.due_date);
    }
    if (todoData.priority !== undefined) {
      fields.push(`priority = $${paramCount++}`);
      values.push(todoData.priority);
    }
    if (todoData.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(todoData.status);
    }
    if (todoData.completed !== undefined) {
      fields.push(`completed = $${paramCount++}`);
      values.push(todoData.completed);
    }
    if (todoData.completed_at !== undefined) {
      fields.push(`completed_at = $${paramCount++}`);
      values.push(todoData.completed_at);
    }

    if (fields.length === 0) {
      return [];
    }

    values.push(userId);
    values.push(ids);

    const query = `
      UPDATE todos
      SET ${fields.join(', ')}
      WHERE user_id = $${paramCount++} AND id = ANY($${paramCount}::uuid[])
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows || [];
  }

  static async batchDelete(userId: string, ids: string[]): Promise<string[]> {
    const query = `
      DELETE FROM todos
      WHERE user_id = $1 AND id = ANY($2::uuid[])
      RETURNING id
    `;
    const result = await pool.query(query, [userId, ids]);
    return (result.rows || []).map((r: any) => r.id);
  }

  // 搜索：按标题、描述，支持 ILIKE 与简易全文检索
  static async searchByUserId(
    userId: string,
    searchText: string,
    options: {
      limit?: number;
      offset?: number;
      completed?: boolean;
      priority?: '低' | '中' | '高';
      orderBy?: 'created_at' | 'updated_at' | 'due_date' | 'priority';
      orderDir?: 'ASC' | 'DESC';
    } = {}
  ): Promise<Todo[]> {
    let query = 'SELECT * FROM todos WHERE user_id = $1';
    const values: any[] = [userId];
    let paramCount = 2;

    if (options.completed !== undefined) {
      query += ` AND completed = $${paramCount++}`;
      values.push(options.completed);
    }

    if (options.priority) {
      const zh = options.priority;
      const en = zh === '高' ? 'high' : zh === '中' ? 'medium' : zh === '低' ? 'low' : undefined;
      if (en) {
        query += ` AND (priority = $${paramCount} OR priority = $${paramCount + 1})`;
        values.push(zh, en);
        paramCount += 2;
      } else {
        query += ` AND priority = $${paramCount++}`;
        values.push(zh);
      }
    }

    if (searchText && searchText.trim().length > 0) {
      query += ` AND (
        title ILIKE $${paramCount} OR 
        description ILIKE $${paramCount} OR 
        to_tsvector('simple', COALESCE(title,'') || ' ' || COALESCE(description,'')) @@ plainto_tsquery('simple', $${paramCount + 1})
      )`;
      values.push(`%${searchText}%`, searchText);
      paramCount += 2;
    }

    const dir = options.orderDir === 'ASC' ? 'ASC' : 'DESC';
    switch (options.orderBy) {
      case 'priority':
        query += ` ORDER BY CASE 
          WHEN priority IN ('高','high') THEN 3
          WHEN priority IN ('中','medium') THEN 2
          WHEN priority IN ('低','low') THEN 1
          ELSE 0
        END ${dir}`;
        break;
      case 'due_date':
        query += ` ORDER BY due_date ${dir} NULLS LAST`;
        break;
      case 'updated_at':
        query += ` ORDER BY updated_at ${dir}`;
        break;
      case 'created_at':
      default:
        query += ` ORDER BY created_at ${dir}`;
        break;
    }

    if (options.limit) {
      query += ` LIMIT $${paramCount++}`;
      values.push(options.limit);
    }

    if (options.offset) {
      query += ` OFFSET $${paramCount++}`;
      values.push(options.offset);
    }

    const result = await pool.query(query, values);
    return result.rows || [];
  }

  static async getSearchCount(
    userId: string,
    searchText: string,
    options: { completed?: boolean; priority?: '低' | '中' | '高' } = {}
  ): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM todos WHERE user_id = $1';
    const values: any[] = [userId];
    let paramCount = 2;

    if (options.completed !== undefined) {
      query += ` AND completed = $${paramCount++}`;
      values.push(options.completed);
    }

    if (options.priority) {
      const zh = options.priority;
      const en = zh === '高' ? 'high' : zh === '中' ? 'medium' : zh === '低' ? 'low' : undefined;
      if (en) {
        query += ` AND (priority = $${paramCount} OR priority = $${paramCount + 1})`;
        values.push(zh, en);
        paramCount += 2;
      } else {
        query += ` AND priority = $${paramCount++}`;
        values.push(zh);
      }
    }

    if (searchText && searchText.trim().length > 0) {
      query += ` AND (
        title ILIKE $${paramCount} OR 
        description ILIKE $${paramCount} OR 
        to_tsvector('simple', COALESCE(title,'') || ' ' || COALESCE(description,'')) @@ plainto_tsquery('simple', $${paramCount + 1})
      )`;
      values.push(`%${searchText}%`, searchText);
      paramCount += 2;
    }

    const result = await pool.query(query, values);
    return parseInt(result.rows?.[0]?.count ?? '0');
  }
}
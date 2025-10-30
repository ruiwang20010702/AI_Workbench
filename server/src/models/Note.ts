import pool from '../config/database';
import { Note } from '../types';

export class NoteModel {
  static async findById(id: string, userId: string): Promise<Note | null> {
    const query = 'SELECT * FROM notes WHERE id = $1 AND user_id = $2';
    const result = await pool.query(query, [id, userId]);
    return result.rows[0] || null;
  }

  static async findByUserId(
    userId: string,
    options: {
      notebook_id?: string;
      tags?: string[];
      is_favorite?: boolean;
      is_archived?: boolean;
      search?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Note[]> {
    let query = 'SELECT * FROM notes WHERE user_id = $1';
    const values: any[] = [userId];
    let paramCount = 2;

    if (options.notebook_id) {
      query += ` AND notebook_id = $${paramCount++}`;
      values.push(options.notebook_id);
    }

    if (options.tags && options.tags.length > 0) {
      query += ` AND tags && $${paramCount++}`;
      values.push(options.tags);
    }

    if (options.is_favorite !== undefined) {
      query += ` AND is_favorite = $${paramCount++}`;
      values.push(options.is_favorite);
    }

    if (options.is_archived !== undefined) {
      query += ` AND is_archived = $${paramCount++}`;
      values.push(options.is_archived);
    }

    if (options.search) {
      query += ` AND (
        title ILIKE $${paramCount} OR 
        content_text ILIKE $${paramCount} OR
        to_tsvector('simple', content_text) @@ plainto_tsquery('simple', $${paramCount + 1})
      )`;
      values.push(`%${options.search}%`, options.search);
      paramCount += 2;
    }

    query += ' ORDER BY updated_at DESC';

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

  static async create(noteData: {
    user_id: string;
    title?: string;
    content?: string;
    notebook_id?: string;
    tags?: string[];
  }): Promise<Note> {
    const contentText = this.extractTextFromContent(noteData.content || '');
    
    const query = `
      INSERT INTO notes (user_id, title, content, content_text, notebook_id, tags)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      noteData.user_id,
      noteData.title || '无标题',
      noteData.content || '',
      contentText,
      noteData.notebook_id || null,
      noteData.tags || []
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async update(id: string, userId: string, noteData: {
    title?: string;
    content?: string;
    notebook_id?: string;
    tags?: string[];
    is_favorite?: boolean;
    is_archived?: boolean;
  }): Promise<Note | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (noteData.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(noteData.title);
    }

    if (noteData.content !== undefined) {
      fields.push(`content = $${paramCount++}`);
      values.push(noteData.content);
      
      const contentText = this.extractTextFromContent(noteData.content);
      fields.push(`content_text = $${paramCount++}`);
      values.push(contentText);
    }

    if (noteData.notebook_id !== undefined) {
      fields.push(`notebook_id = $${paramCount++}`);
      values.push(noteData.notebook_id);
    }

    if (noteData.tags !== undefined) {
      fields.push(`tags = $${paramCount++}`);
      values.push(noteData.tags);
    }

    if (noteData.is_favorite !== undefined) {
      fields.push(`is_favorite = $${paramCount++}`);
      values.push(noteData.is_favorite);
    }

    if (noteData.is_archived !== undefined) {
      fields.push(`is_archived = $${paramCount++}`);
      values.push(noteData.is_archived);
    }

    if (fields.length === 0) {
      return this.findById(id, userId);
    }

    values.push(id, userId);
    const query = `
      UPDATE notes 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount++} AND user_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const query = 'DELETE FROM notes WHERE id = $1 AND user_id = $2';
    const result = await pool.query(query, [id, userId]);
    return (result.rowCount ?? 0) > 0;
  }

  static async getTotalCount(userId: string, options?: {
    notebookId?: string;
    tags?: string[];
    favorite?: boolean;
    archived?: boolean;
    search?: string;
  }): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM notes WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (options?.notebookId) {
      query += ` AND notebook_id = $${paramIndex}`;
      params.push(options.notebookId);
      paramIndex++;
    }

    if (options?.favorite !== undefined) {
      query += ` AND is_favorite = $${paramIndex}`;
      params.push(options.favorite);
      paramIndex++;
    }

    if (options?.archived !== undefined) {
      query += ` AND is_archived = $${paramIndex}`;
      params.push(options.archived);
      paramIndex++;
    }

    if (options?.tags && options.tags.length > 0) {
      query += ` AND tags && $${paramIndex}`;
      params.push(options.tags);
      paramIndex++;
    }

    if (options?.search) {
      query += ` AND (title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`;
      params.push(`%${options.search}%`);
      paramIndex++;
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  }

  static async updateEmbedding(id: string, embedding: number[]): Promise<boolean> {
    const query = 'UPDATE notes SET embedding = $1 WHERE id = $2';
    const result = await pool.query(query, [JSON.stringify(embedding), id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async searchBySimilarity(
    userId: string,
    queryEmbedding: number[],
    limit: number = 10,
    threshold: number = 0.7
  ): Promise<Note[]> {
    const query = `
      SELECT *, (1 - (embedding <=> $1::vector)) as similarity
      FROM notes 
      WHERE user_id = $2 
        AND embedding IS NOT NULL
        AND (1 - (embedding <=> $1::vector)) > $3
      ORDER BY similarity DESC
      LIMIT $4
    `;
    
    const result = await pool.query(query, [
      JSON.stringify(queryEmbedding),
      userId,
      threshold,
      limit
    ]);
    
    return result.rows;
  }

  static async getCountByDateRange(
    userId: string, 
    startDate?: Date | null, 
    endDate?: Date | null
  ): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM notes WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  }

  private static extractTextFromContent(content: string): string {
    // 简单的HTML/Markdown标签移除，提取纯文本
    return content
      .replace(/<[^>]*>/g, '') // 移除HTML标签
      .replace(/[#*`_~\[\]()]/g, '') // 移除Markdown标记
      .replace(/\s+/g, ' ') // 合并空白字符
      .trim();
  }
}
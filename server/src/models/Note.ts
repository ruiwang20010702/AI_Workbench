import { supabaseAdmin } from '../config/database';
import { Note } from '../types';

export class NoteModel {
  static async findById(id: string, userId: string): Promise<Note | null> {
    const { data, error } = await supabaseAdmin
      .from('notes')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error finding note by id:', error);
      throw error;
    }
    
    return data;
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
    let query = supabaseAdmin
      .from('notes')
      .select('*')
      .eq('user_id', userId);

    // 笔记本过滤
    if (options.notebook_id) {
      query = query.eq('notebook_id', options.notebook_id);
    }

    // 标签过滤 - 数组重叠
    if (options.tags && options.tags.length > 0) {
      query = query.overlaps('tags', options.tags);
    }

    // 收藏过滤
    if (options.is_favorite !== undefined) {
      query = query.eq('is_favorite', options.is_favorite);
    }

    // 归档过滤
    if (options.is_archived !== undefined) {
      query = query.eq('is_archived', options.is_archived);
    }

    // 搜索 - 标题或内容
    if (options.search) {
      query = query.or(
        `title.ilike.%${options.search}%,content_text.ilike.%${options.search}%`
      );
    }

    // 排序
    query = query.order('updated_at', { ascending: false });

    // 分页
    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      const end = options.offset + (options.limit || 20) - 1;
      query = query.range(options.offset, end);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error finding notes:', error);
      throw error;
    }
    
    return data || [];
  }

  static async create(noteData: {
    user_id: string;
    title?: string;
    content?: string;
    notebook_id?: string;
    tags?: string[];
  }): Promise<Note> {
    const contentText = this.extractTextFromContent(noteData.content || '');
    
    const { data, error } = await supabaseAdmin
      .from('notes')
      .insert({
        user_id: noteData.user_id,
        title: noteData.title || '无标题',
        content: noteData.content || '',
        content_text: contentText,
        notebook_id: noteData.notebook_id || null,
        tags: noteData.tags || []
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating note:', error);
      throw error;
    }
    
    return data;
  }

  static async update(id: string, userId: string, noteData: {
    title?: string;
    content?: string;
    notebook_id?: string;
    tags?: string[];
    is_favorite?: boolean;
    is_archived?: boolean;
  }): Promise<Note | null> {
    // 如果没有字段需要更新，直接返回当前笔记
    if (Object.keys(noteData).length === 0) {
      return this.findById(id, userId);
    }

    const updates: any = {};

    if (noteData.title !== undefined) {
      updates.title = noteData.title;
    }

    if (noteData.content !== undefined) {
      updates.content = noteData.content;
      updates.content_text = this.extractTextFromContent(noteData.content);
    }

    if (noteData.notebook_id !== undefined) {
      updates.notebook_id = noteData.notebook_id;
    }

    if (noteData.tags !== undefined) {
      updates.tags = noteData.tags;
    }

    if (noteData.is_favorite !== undefined) {
      updates.is_favorite = noteData.is_favorite;
    }

    if (noteData.is_archived !== undefined) {
      updates.is_archived = noteData.is_archived;
    }

    const { data, error } = await supabaseAdmin
      .from('notes')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error updating note:', error);
      throw error;
    }
    
    return data;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
    
    return true;
  }

  static async getTotalCount(userId: string, options?: {
    notebookId?: string;
    tags?: string[];
    favorite?: boolean;
    archived?: boolean;
    search?: string;
  }): Promise<number> {
    let query = supabaseAdmin
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (options?.notebookId) {
      query = query.eq('notebook_id', options.notebookId);
    }

    if (options?.favorite !== undefined) {
      query = query.eq('is_favorite', options.favorite);
    }

    if (options?.archived !== undefined) {
      query = query.eq('is_archived', options.archived);
    }

    if (options?.tags && options.tags.length > 0) {
      query = query.overlaps('tags', options.tags);
    }

    if (options?.search) {
      query = query.or(
        `title.ilike.%${options.search}%,content.ilike.%${options.search}%`
      );
    }

    const { count, error } = await query;
    
    if (error) {
      console.error('Error counting notes:', error);
      throw error;
    }
    
    return count || 0;
  }

  static async updateEmbedding(id: string, embedding: number[]): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('notes')
      .update({ embedding: JSON.stringify(embedding) })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating embedding:', error);
      throw error;
    }
    
    return true;
  }

  static async searchBySimilarity(
    userId: string,
    queryEmbedding: number[],
    limit: number = 10,
    threshold: number = 0.7
  ): Promise<Note[]> {
    // 使用 Supabase RPC 调用自定义函数处理向量相似度搜索
    const { data, error } = await supabaseAdmin
      .rpc('search_notes_by_similarity', {
        user_id_param: userId,
        query_embedding: JSON.stringify(queryEmbedding),
        similarity_threshold: threshold,
        match_limit: limit
      });
    
    if (error) {
      console.error('Error searching by similarity:', error);
      throw error;
    }
    
    return data || [];
  }

  static async getCountByDateRange(
    userId: string, 
    startDate?: Date | null, 
    endDate?: Date | null
  ): Promise<number> {
    let query = supabaseAdmin
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { count, error } = await query;
    
    if (error) {
      console.error('Error counting notes by date range:', error);
      throw error;
    }
    
    return count || 0;
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
import { supabaseAdmin } from '../config/database';
import { Todo } from '../types';

export class TodoModel {
  static async findById(id: string, userId: string): Promise<Todo | null> {
    const { data, error } = await supabaseAdmin
      .from('todos')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error finding todo by id:', error);
      throw error;
    }
    
    return data;
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
    let query = supabaseAdmin
      .from('todos')
      .select('*')
      .eq('user_id', userId);

    if (options.note_id) {
      query = query.eq('note_id', options.note_id);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.priority) {
      // 兼容中英文优先级
      const zh = options.priority;
      const en = zh === '高' ? 'high' : zh === '中' ? 'medium' : zh === '低' ? 'low' : undefined;
      if (en) {
        query = query.or(`priority.eq.${zh},priority.eq.${en}`);
      } else {
        query = query.eq('priority', zh);
      }
    }

    if (options.completed !== undefined) {
      query = query.eq('completed', options.completed);
    }

    if (options.due_date_from) {
      query = query.gte('due_date', options.due_date_from.toISOString());
    }

    if (options.due_date_to) {
      query = query.lte('due_date', options.due_date_to.toISOString());
    }

    // 排序
    const ascending = options.orderDir === 'ASC';
    const orderBy = options.orderBy || 'created_at';
    query = query.order(orderBy, { ascending, nullsFirst: false });

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
      console.error('Error finding todos:', error);
      throw error;
    }
    
    return data || [];
  }

  static async create(todoData: {
    user_id: string;
    note_id: string;
    title: string;
    description?: string;
    due_date?: Date;
    priority?: '低' | '中' | '高';
  }): Promise<Todo> {
    const { data, error } = await supabaseAdmin
      .from('todos')
      .insert({
        user_id: todoData.user_id,
        note_id: todoData.note_id,
        title: todoData.title,
        description: todoData.description || null,
        due_date: todoData.due_date || null,
        priority: todoData.priority || '中'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating todo:', error);
      throw error;
    }
    
    return data;
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

    const insertData = todos.map(todo => ({
      user_id: todo.user_id,
      note_id: todo.note_id,
      title: todo.title,
      description: todo.description || null,
      due_date: todo.due_date || null,
      priority: todo.priority || '中'
    }));

    const { data, error } = await supabaseAdmin
      .from('todos')
      .insert(insertData)
      .select();
    
    if (error) {
      console.error('Error creating batch todos:', error);
      throw error;
    }
    
    return data || [];
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
    if (Object.keys(todoData).length === 0) {
      return this.findById(id, userId);
    }

    const updates: any = {};

    if (todoData.title !== undefined) updates.title = todoData.title;
    if (todoData.description !== undefined) updates.description = todoData.description;
    if (todoData.due_date !== undefined) updates.due_date = todoData.due_date;
    if (todoData.priority !== undefined) updates.priority = todoData.priority;
    if (todoData.status !== undefined) updates.status = todoData.status;
    if (todoData.completed !== undefined) updates.completed = todoData.completed;
    if (todoData.completed_at !== undefined) updates.completed_at = todoData.completed_at;

    const { data, error } = await supabaseAdmin
      .from('todos')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error updating todo:', error);
      throw error;
    }
    
    return data;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('todos')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting todo:', error);
      throw error;
    }
    
    return true;
  }

  static async getStatistics(userId: string): Promise<{
    total: number;
    completed: number;
    pending: number;
    in_progress: number;
    not_started: number;
    overdue: number;
  }> {
    // 使用 RPC 调用数据库函数获取统计
    const { data, error } = await supabaseAdmin
      .rpc('get_todo_statistics', { user_id_param: userId });
    
    if (error) {
      console.error('Error getting todo statistics:', error);
      // 如果 RPC 函数不存在，回退到手动统计
      const { data: todos, error: fetchError } = await supabaseAdmin
        .from('todos')
        .select('completed, status, due_date')
        .eq('user_id', userId);
      
      if (fetchError) throw fetchError;
      
      const now = new Date();
      const stats = {
        total: todos?.length || 0,
        completed: 0,
        pending: 0,
        in_progress: 0,
        not_started: 0,
        overdue: 0
      };
      
      todos?.forEach(todo => {
        if (todo.completed) {
          stats.completed++;
        } else {
          stats.pending++;
          if (todo.status === '进行中') stats.in_progress++;
          if (todo.status === '未开始') stats.not_started++;
          if (todo.due_date && new Date(todo.due_date) < now) {
            stats.overdue++;
          }
        }
      });
      
      return stats;
    }
    
    return data || {
      total: 0,
      completed: 0,
      pending: 0,
      in_progress: 0,
      not_started: 0,
      overdue: 0
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
    console.log('[TodoModel.batchUpdate] 输入参数:', { userId, ids, todoData });
    
    if (Object.keys(todoData).length === 0 || ids.length === 0) {
      console.log('[TodoModel.batchUpdate] 跳过：空数据或空ID列表');
      return [];
    }

    const updates: any = {};
    if (todoData.title !== undefined) updates.title = todoData.title;
    if (todoData.description !== undefined) updates.description = todoData.description;
    if (todoData.due_date !== undefined) updates.due_date = todoData.due_date;
    if (todoData.priority !== undefined) updates.priority = todoData.priority;
    if (todoData.status !== undefined) updates.status = todoData.status;
    if (todoData.completed !== undefined) updates.completed = todoData.completed;
    if (todoData.completed_at !== undefined) updates.completed_at = todoData.completed_at;

    console.log('[TodoModel.batchUpdate] 更新字段:', updates);

    const { data, error } = await supabaseAdmin
      .from('todos')
      .update(updates)
      .eq('user_id', userId)
      .in('id', ids)
      .select();
    
    if (error) {
      console.error('[TodoModel.batchUpdate] 错误:', error);
      throw error;
    }
    
    console.log('[TodoModel.batchUpdate] 成功更新:', data?.length, '条记录');
    return data || [];
  }

  static async batchDelete(userId: string, ids: string[]): Promise<string[]> {
    const { data, error } = await supabaseAdmin
      .from('todos')
      .delete()
      .eq('user_id', userId)
      .in('id', ids)
      .select('id');
    
    if (error) {
      console.error('Error batch deleting todos:', error);
      throw error;
    }
    
    return (data || []).map((r: any) => r.id);
  }

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
    let query = supabaseAdmin
      .from('todos')
      .select('*')
      .eq('user_id', userId);

    if (options.completed !== undefined) {
      query = query.eq('completed', options.completed);
    }

    if (options.priority) {
      const zh = options.priority;
      const en = zh === '高' ? 'high' : zh === '中' ? 'medium' : zh === '低' ? 'low' : undefined;
      if (en) {
        query = query.or(`priority.eq.${zh},priority.eq.${en}`);
      } else {
        query = query.eq('priority', zh);
      }
    }

    if (searchText && searchText.trim().length > 0) {
      query = query.or(
        `title.ilike.%${searchText}%,description.ilike.%${searchText}%`
      );
    }

    // 排序
    const ascending = options.orderDir === 'ASC';
    const orderBy = options.orderBy || 'created_at';
    query = query.order(orderBy, { ascending, nullsFirst: false });

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
      console.error('Error searching todos:', error);
      throw error;
    }
    
    return data || [];
  }

  static async getSearchCount(
    userId: string,
    searchText: string,
    options: { completed?: boolean; priority?: '低' | '中' | '高' } = {}
  ): Promise<number> {
    let query = supabaseAdmin
      .from('todos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (options.completed !== undefined) {
      query = query.eq('completed', options.completed);
    }

    if (options.priority) {
      const zh = options.priority;
      const en = zh === '高' ? 'high' : zh === '中' ? 'medium' : zh === '低' ? 'low' : undefined;
      if (en) {
        query = query.or(`priority.eq.${zh},priority.eq.${en}`);
      } else {
        query = query.eq('priority', zh);
      }
    }

    if (searchText && searchText.trim().length > 0) {
      query = query.or(
        `title.ilike.%${searchText}%,description.ilike.%${searchText}%`
      );
    }

    const { count, error } = await query;
    
    if (error) {
      console.error('Error counting search todos:', error);
      throw error;
    }
    
    return count || 0;
  }
}

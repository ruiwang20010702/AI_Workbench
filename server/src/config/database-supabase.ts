import { supabaseAdmin } from './supabase';

// 数据库查询包装器，使用 Supabase 客户端替代 PostgreSQL 连接池
export class SupabaseDatabase {
  // 执行原始 SQL 查询
  static async query(text: string, params: any[] = []): Promise<any> {
    try {
      // 使用 Supabase RPC 功能执行原始 SQL
      const { data, error } = await supabaseAdmin.rpc('execute_sql', {
        sql_query: text,
        sql_params: params
      });

      if (error) {
        throw error;
      }

      return {
        rows: data || [],
        rowCount: data?.length || 0
      };
    } catch (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
  }

  // 模拟连接池的 connect 方法
  static async connect() {
    return {
      query: this.query.bind(this),
      release: () => {} // Supabase 客户端不需要释放连接
    };
  }

  // 模拟连接池的 end 方法
  static async end() {
    // Supabase 客户端不需要显式关闭连接
    return Promise.resolve();
  }
}

// 为了兼容现有代码，导出一个类似 pool 的对象
const supabasePool = {
  query: SupabaseDatabase.query.bind(SupabaseDatabase),
  connect: SupabaseDatabase.connect.bind(SupabaseDatabase),
  end: SupabaseDatabase.end.bind(SupabaseDatabase),
  on: (event: string, callback: Function) => {
    // 模拟事件监听器
    if (event === 'connect') {
      console.log('Connected to Supabase database');
    }
  }
};

export default supabasePool;
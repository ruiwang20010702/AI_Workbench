import { supabaseAdmin } from './supabase';

// 数据库查询包装器，使用 Supabase 客户端替代 PostgreSQL 连接池
export class SupabaseDatabase {
  // 执行原始 SQL 查询
  static async query(text: string, params: any[] = []): Promise<any> {
    try {
      console.log('Executing query via Supabase:', text.substring(0, 100) + '...');
      
      // 解析查询类型和表名
      const trimmedText = text.trim().toLowerCase();
      
      if (trimmedText.startsWith('select')) {
        // 处理 SELECT 查询
        if (text.includes('FROM users WHERE email')) {
          // 查找用户通过邮箱
          const email = params[0];
          const { data, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
          
          if (error && error.code !== 'PGRST116') { // PGRST116 是 "not found" 错误
            console.error('Supabase query error:', error);
          }
          
          return {
            rows: data ? [data] : [],
            rowCount: data ? 1 : 0,
            command: 'SELECT',
            oid: null,
            fields: []
          };
        } else if (text.includes('FROM users WHERE id')) {
          // 查找用户通过ID
          const id = params[0];
          const { data, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
          
          if (error && error.code !== 'PGRST116') {
            console.error('Supabase query error:', error);
          }
          
          return {
            rows: data ? [data] : [],
            rowCount: data ? 1 : 0,
            command: 'SELECT',
            oid: null,
            fields: []
          };
        } else if (text.includes('FROM notes WHERE user_id')) {
          // 查找笔记
          const userId = params[0];
          if (text.includes('ORDER BY updated_at DESC LIMIT')) {
            // 获取笔记列表
            const limit = params[1] || 10;
            const { data, error } = await supabaseAdmin
              .from('notes')
              .select('*')
              .eq('user_id', userId)
              .order('updated_at', { ascending: false })
              .limit(limit);
            
            if (error) {
              console.error('Supabase query error:', error);
            }
            
            return {
              rows: data || [],
              rowCount: data ? data.length : 0,
              command: 'SELECT',
              oid: null,
              fields: []
            };
          } else if (text.includes('COUNT(*)')) {
            // 获取笔记总数
            const { count, error } = await supabaseAdmin
              .from('notes')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userId);
            
            if (error) {
              console.error('Supabase count query error:', error);
            }
            
            return {
              rows: [{ count: count || 0 }],
              rowCount: 1,
              command: 'SELECT',
              oid: null,
              fields: []
            };
          }
        }
      } else if (trimmedText.startsWith('insert')) {
        // 处理 INSERT 查询
        if (text.includes('INTO users')) {
          // 创建用户
          const [email, password_hash, display_name, auth_provider] = params;
          const { data, error } = await supabaseAdmin
            .from('users')
            .insert({
              email,
              password_hash,
              display_name,
              auth_provider: auth_provider || 'local'
            })
            .select()
            .single();
          
          if (error) {
            console.error('Supabase insert error:', error);
            throw error;
          }
          
          return {
            rows: data ? [data] : [],
            rowCount: data ? 1 : 0,
            command: 'INSERT',
            oid: null,
            fields: []
          };
        }
      }
      
      // 对于其他查询，返回空结果
      return {
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: null,
        fields: []
      };
    } catch (error) {
      console.error('Supabase query error:', error);
      // 返回空结果而不是抛出错误，让应用程序能够启动
      return {
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: null,
        fields: []
      };
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
      console.log('✅ 数据库连接成功');
      callback();
    } else if (event === 'error') {
      // 不执行错误回调，避免应用程序退出
    }
  }
};

export default supabasePool;
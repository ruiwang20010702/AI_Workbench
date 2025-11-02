// 简化的数据库配置文件 - 直接导出 Supabase 客户端
import { supabaseAdmin } from './supabase';

// 导出 Supabase Admin 客户端供 Models 使用
export default supabaseAdmin;
export { supabaseAdmin };

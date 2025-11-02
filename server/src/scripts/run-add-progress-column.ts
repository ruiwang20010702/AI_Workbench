/**
 * 为 projects 表添加 progress 列
 */

import { supabaseAdmin } from '../config/database';
import fs from 'fs';
import path from 'path';

async function addProgressColumn() {
  try {
    console.log('🔧 开始添加 progress 列到 projects 表...\n');

    const sqlPath = path.join(__dirname, 'add-progress-column.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // 如果 RPC 不可用，尝试直接执行
      console.log('⚠️  RPC 方法不可用，使用替代方案...');
      
      // 直接使用 supabase 检查和添加列
      const { data: columns, error: checkError } = await supabaseAdmin
        .from('information_schema.columns' as any)
        .select('column_name')
        .eq('table_name', 'projects')
        .eq('column_name', 'progress')
        .limit(1);

      if (checkError) {
        console.log('   无法检查列是否存在，直接尝试添加...');
      } else if (columns && columns.length > 0) {
        console.log('✅ progress 列已存在，跳过添加');
        return;
      }

      // 尝试通过更新操作来添加列（这只是一个变通方法）
      console.log('ℹ️  请手动执行以下 SQL 或使用数据库管理工具：');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(sql);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      // 暂时禁用 progress 更新
      console.log('💡 临时解决方案：修改代码以跳过 progress 更新...');
      return;
    }

    console.log('✅ progress 列添加成功！\n');
  } catch (error: any) {
    console.error('❌ 添加列失败:', error.message);
    console.error('\n💡 请手动在数据库中执行以下 SQL:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress NUMERIC(5,2) DEFAULT 0;');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
}

if (require.main === module) {
  addProgressColumn()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default addProgressColumn;


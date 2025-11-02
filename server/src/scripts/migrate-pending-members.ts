/**
 * 数据库迁移脚本：创建 pending_members 表
 * 用于存储待定成员（未注册用户的邮箱邀请）
 * 
 * 运行方式：
 * npx tsx server/src/scripts/migrate-pending-members.ts
 */

import { supabaseAdmin } from '../config/database';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  console.log('🚀 开始数据库迁移：创建 pending_members 表...\n');

  try {
    // 读取 SQL 文件
    const sqlFilePath = path.join(__dirname, '../config/20251101_create_pending_members.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

    console.log('📄 读取 SQL 文件:', sqlFilePath);
    console.log('📝 SQL 内容:\n', sqlContent.substring(0, 200) + '...\n');

    // 使用 Supabase RPC 执行原始 SQL（如果支持）
    // 注意：Supabase 可能不支持直接执行 DDL，需要在 Supabase Dashboard 中执行
    console.log('⚠️  Supabase 客户端不支持直接执行 DDL 语句');
    console.log('📋 请在 Supabase Dashboard 中执行以下 SQL:\n');
    console.log('=' .repeat(80));
    console.log(sqlContent);
    console.log('=' .repeat(80));
    console.log('\n操作步骤:');
    console.log('1. 访问 Supabase Dashboard: https://app.supabase.com');
    console.log('2. 选择您的项目');
    console.log('3. 进入 SQL Editor');
    console.log('4. 粘贴上述 SQL 代码');
    console.log('5. 点击 Run 执行');
    console.log('\n或者，如果你有直接数据库访问权限：');
    console.log('psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres" -f server/src/config/20251101_create_pending_members.sql');

    // 尝试验证表是否已存在（通过查询）
    console.log('\n🔍 检查 pending_members 表是否已存在...');
    const { data, error } = await supabaseAdmin
      .from('pending_members')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        // 表不存在
        console.log('❌ 表尚未创建，请按上述步骤在 Supabase Dashboard 中执行 SQL');
        process.exit(1);
      } else {
        console.error('❌ 查询错误:', error);
        process.exit(1);
      }
    } else {
      console.log('✅ pending_members 表已存在！');
      console.log('✅ 迁移验证成功！');
    }

  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  }
}

// 执行迁移
runMigration().then(() => {
  console.log('\n✨ 迁移脚本执行完成');
  process.exit(0);
}).catch((error) => {
  console.error('❌ 迁移脚本执行失败:', error);
  process.exit(1);
});


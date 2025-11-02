/**
 * 数据库迁移执行脚本
 * 用法: node server/database/run-migration.js
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// 检查环境变量
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ 错误: 缺少数据库配置');
  console.error('请确保.env文件中包含:');
  console.error('  - DATABASE_URL (PostgreSQL连接字符串)');
  console.error('\n示例:');
  console.error('  DATABASE_URL=postgresql://user:password@host:5432/database');
  process.exit(1);
}

/**
 * 执行SQL文件
 */
async function executeSqlFile(filePath) {
  const { Pool } = require('pg');
  let pool;
  
  try {
    console.log(`\n📄 读取SQL文件: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log('⚙️  连接数据库...');
    
    // 创建PostgreSQL连接池
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('supabase.co') ? { rejectUnauthorized: false } : false
    });
    
    console.log('✅ 数据库连接成功');
    console.log('⚙️  执行SQL...');
    
    // 执行SQL
    const result = await pool.query(sql);
    
    console.log('✅ SQL执行成功！');
    return result;
  } catch (error) {
    console.error('❌ SQL执行失败:', error.message);
    throw error;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始数据库迁移...\n');
  
  const migrationType = process.argv[2] || 'up';
  
  if (migrationType === 'up') {
    // 执行迁移
    const migrationFile = path.join(__dirname, 'migrations/create-assistant-tables.sql');
    await executeSqlFile(migrationFile);
    console.log('\n✅ 数据库迁移完成！');
  } else if (migrationType === 'down') {
    // 回滚迁移
    const rollbackFile = path.join(__dirname, 'migrations/rollback-assistant-tables.sql');
    console.log('⚠️  警告: 即将回滚数据库，所有数据将被删除！');
    console.log('⚠️  按Ctrl+C取消，或等待5秒后自动继续...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await executeSqlFile(rollbackFile);
    console.log('\n✅ 数据库回滚完成！');
  } else {
    console.error('❌ 未知的迁移类型:', migrationType);
    console.log('用法:');
    console.log('  node run-migration.js up   - 执行迁移');
    console.log('  node run-migration.js down - 回滚迁移');
    process.exit(1);
  }
}

// 执行
main().catch(error => {
  console.error('\n❌ 迁移失败:', error);
  process.exit(1);
});


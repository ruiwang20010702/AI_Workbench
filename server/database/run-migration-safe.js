/**
 * 安全的数据库迁移执行脚本（分批执行）
 * 用法: node server/database/run-migration-safe.js
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
 * 分割SQL语句
 */
function splitSqlStatements(sql) {
  // 移除注释
  sql = sql.replace(/--.*$/gm, '');
  sql = sql.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // 按分号分割，但保留函数定义中的分号
  const statements = [];
  let current = '';
  let inFunction = false;
  
  const lines = sql.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    
    // 检测函数定义开始
    if (trimmed.match(/CREATE\s+(OR\s+REPLACE\s+)?FUNCTION/i)) {
      inFunction = true;
    }
    
    current += line + '\n';
    
    // 检测函数定义结束
    if (inFunction && trimmed.match(/\$\$\s*LANGUAGE/i)) {
      inFunction = false;
      statements.push(current.trim());
      current = '';
      continue;
    }
    
    // 普通语句以分号结束
    if (!inFunction && trimmed.endsWith(';')) {
      statements.push(current.trim());
      current = '';
    }
  }
  
  if (current.trim()) {
    statements.push(current.trim());
  }
  
  return statements.filter(s => s.length > 0);
}

/**
 * 执行SQL文件（分批执行）
 */
async function executeSqlFile(filePath) {
  const { Pool } = require('pg');
  let pool;
  
  try {
    console.log(`\n📄 读取SQL文件: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log('⚙️  解析SQL语句...');
    const statements = splitSqlStatements(sql);
    console.log(`✅ 共解析出 ${statements.length} 条SQL语句`);
    
    console.log('⚙️  连接数据库...');
    
    // 创建PostgreSQL连接池
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('supabase.co') ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
      max: 1
    });
    
    // 测试连接
    const client = await pool.connect();
    console.log('✅ 数据库连接成功');
    
    console.log('⚙️  开始执行SQL语句...\n');
    
    // 逐条执行SQL语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 60).replace(/\s+/g, ' ');
      
      try {
        console.log(`[${i + 1}/${statements.length}] 执行: ${preview}...`);
        await client.query(statement);
        console.log(`✅ 完成\n`);
      } catch (error) {
        console.error(`❌ 失败: ${error.message}\n`);
        console.error('失败的SQL语句:');
        console.error(statement.substring(0, 200));
        throw error;
      }
    }
    
    client.release();
    console.log('✅ 所有SQL语句执行成功！');
    
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
    console.log('  node run-migration-safe.js up   - 执行迁移');
    console.log('  node run-migration-safe.js down - 回滚迁移');
    process.exit(1);
  }
}

// 执行
main().catch(error => {
  console.error('\n❌ 迁移失败:', error);
  process.exit(1);
});


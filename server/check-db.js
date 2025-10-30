const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkTodos() {
  try {
    const result = await pool.query(`
      SELECT id, title, user_id, completed, status, created_at 
      FROM todos 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log('查询结果:');
    console.table(result.rows);
    
    if (result.rows.length > 0) {
      console.log('\n第一条记录的ID类型:', typeof result.rows[0].id);
      console.log('第一条记录的ID值:', result.rows[0].id);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('查询失败:', error);
    process.exit(1);
  }
}

checkTodos();
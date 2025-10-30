import pool from '../config/database';

async function fixConstraint() {
  console.log('开始修复 ai_usage_logs.action_type 检查约束...');
  const dropSql = `ALTER TABLE ai_usage_logs DROP CONSTRAINT IF EXISTS ai_usage_logs_action_type_check;`;
  const addSql = `ALTER TABLE ai_usage_logs ADD CONSTRAINT ai_usage_logs_action_type_check CHECK (action_type IN ('generate','rewrite','summarize','extract_todos','search','translate','assistant_qa','analyze'));`;

  try {
    await pool.query(dropSql);
    await pool.query(addSql);
    console.log('约束修复完成：已允许 generate/rewrite/summarize/extract_todos/search/translate/assistant_qa/analyze');
  } catch (error) {
    console.error('修复约束失败:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixConstraint();
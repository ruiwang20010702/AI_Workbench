-- 添加 'recommend' 和 'predict' 到 ai_usage_logs.action_type 约束
-- 这个脚本用于支持智能推荐和预测分析功能

-- 删除现有约束
ALTER TABLE ai_usage_logs DROP CONSTRAINT IF EXISTS ai_usage_logs_action_type_check;

-- 添加新约束，包含 'recommend' 和 'predict'
ALTER TABLE ai_usage_logs ADD CONSTRAINT ai_usage_logs_action_type_check 
CHECK (action_type IN (
  'generate', 
  'rewrite', 
  'summarize', 
  'extract_todos', 
  'search', 
  'translate', 
  'assistant_qa', 
  'analyze',
  'recommend',
  'predict'
));

-- 验证约束
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'ai_usage_logs_action_type_check';


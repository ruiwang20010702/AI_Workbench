-- 检查todos表中的数据
SELECT id, title, user_id, completed, status, created_at 
FROM todos 
ORDER BY created_at DESC 
LIMIT 10;
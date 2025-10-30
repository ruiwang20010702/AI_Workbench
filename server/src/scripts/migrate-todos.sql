-- 为todos表添加缺失的字段
ALTER TABLE todos ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- 根据status字段更新completed字段
UPDATE todos SET completed = (status = '已完成') WHERE completed IS NULL;

-- 为已完成的todos设置completed_at时间戳
UPDATE todos SET completed_at = updated_at WHERE status = '已完成' AND completed_at IS NULL;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
CREATE INDEX IF NOT EXISTS idx_todos_completed_at ON todos(completed_at);
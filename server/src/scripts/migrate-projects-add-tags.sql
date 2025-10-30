-- 为 projects 表添加 tags 字段并创建索引
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 为 tags 创建 GIN 索引，提升按标签筛选的性能
CREATE INDEX IF NOT EXISTS idx_projects_tags ON projects USING GIN (tags);

-- 可选：将现有空值统一为默认空数组
UPDATE projects SET tags = '{}' WHERE tags IS NULL;
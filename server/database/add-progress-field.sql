-- 添加项目进度字段
ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress DECIMAL(5,2) DEFAULT 0.00 CHECK (progress >= 0 AND progress <= 100);

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_projects_progress ON projects(progress);

-- 更新现有项目的进度（基于任务完成情况）
UPDATE projects SET progress = (
    SELECT CASE 
        WHEN COUNT(t.id) = 0 THEN 0
        ELSE ROUND((COUNT(CASE WHEN t.status = 'completed' THEN 1 END) * 100.0 / COUNT(t.id)), 2)
    END
    FROM tasks t 
    WHERE t.project_id = projects.id
);
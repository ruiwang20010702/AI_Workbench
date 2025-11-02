-- 为 projects 表添加 progress 列（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'progress'
    ) THEN
        ALTER TABLE projects ADD COLUMN progress NUMERIC(5,2) DEFAULT 0;
        COMMENT ON COLUMN projects.progress IS '项目进度百分比 (0-100)';
        
        RAISE NOTICE 'Column progress added to projects table';
    ELSE
        RAISE NOTICE 'Column progress already exists in projects table';
    END IF;
END $$;


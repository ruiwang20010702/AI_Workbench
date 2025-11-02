-- 项目文档表字段迁移
-- 添加文件存储和版本管理相关字段
-- 创建时间: 2025-11-01

-- 1. 添加新字段
ALTER TABLE project_documents
ADD COLUMN IF NOT EXISTS file_path VARCHAR(500) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS file_size INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS parent_document_id UUID REFERENCES project_documents(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_latest BOOLEAN DEFAULT TRUE;

-- 2. 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_project_documents_parent ON project_documents(parent_document_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_latest ON project_documents(project_id, is_latest);
CREATE INDEX IF NOT EXISTS idx_project_documents_version ON project_documents(project_id, title, version);

-- 3. 添加注释
COMMENT ON COLUMN project_documents.file_path IS '文件存储路径 (相对于 uploads 目录)';
COMMENT ON COLUMN project_documents.file_size IS '文件大小 (bytes)';
COMMENT ON COLUMN project_documents.mime_type IS '文件 MIME 类型';
COMMENT ON COLUMN project_documents.version IS '文档版本号 (从1开始)';
COMMENT ON COLUMN project_documents.parent_document_id IS '父文档ID (用于版本追踪)';
COMMENT ON COLUMN project_documents.is_latest IS '是否为最新版本';

-- 4. 验证迁移
DO $$
BEGIN
  -- 检查所有字段是否存在
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'project_documents'
      AND column_name IN ('file_path', 'file_size', 'mime_type', 'version', 'parent_document_id', 'is_latest')
  ) THEN
    RAISE NOTICE '✅ 项目文档表迁移成功';
  ELSE
    RAISE EXCEPTION '❌ 项目文档表迁移失败，请检查字段';
  END IF;
END $$;


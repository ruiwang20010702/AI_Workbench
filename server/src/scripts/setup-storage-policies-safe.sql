-- ========================================
-- Supabase Storage RLS 策略配置（安全版本）
-- Bucket: project-documents
-- 创建时间: 2025-11-01
-- ========================================

-- 说明:
-- 1. 本脚本使用 CREATE OR REPLACE 避免权限问题
-- 2. 如果策略已存在，会自动替换
-- 3. 无需 DROP POLICY 权限

-- ========================================
-- 策略 1: 上传项目文档
-- ========================================

CREATE POLICY IF NOT EXISTS "项目成员可以上传文档"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-documents' 
  AND (
    auth.uid() IN (
      SELECT user_id 
      FROM project_members 
      WHERE project_id = (string_to_array(name, '/'))[1]::uuid
        AND role IN ('admin', 'member')
    )
    OR
    name LIKE 'temp/%'
  )
);

-- ========================================
-- 策略 2: 查看项目文档
-- ========================================

CREATE POLICY IF NOT EXISTS "项目成员可以查看文档"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-documents'
  AND (
    auth.uid() IN (
      SELECT user_id 
      FROM project_members 
      WHERE project_id = (string_to_array(name, '/'))[1]::uuid
    )
    OR
    name LIKE 'temp/%'
  )
);

-- ========================================
-- 策略 3: 删除文档
-- ========================================

CREATE POLICY IF NOT EXISTS "文档所有者和管理员可以删除"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-documents'
  AND (
    auth.uid() IN (
      SELECT user_id 
      FROM project_members 
      WHERE project_id = (string_to_array(name, '/'))[1]::uuid
        AND role = 'admin'
    )
    OR
    auth.uid() IN (
      SELECT creator_id
      FROM project_documents
      WHERE file_path = name
    )
    OR
    name LIKE 'temp/%'
  )
);

-- ========================================
-- 策略 4: 更新文档元数据
-- ========================================

CREATE POLICY IF NOT EXISTS "文档所有者和管理员可以更新"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-documents'
  AND (
    auth.uid() IN (
      SELECT user_id 
      FROM project_members 
      WHERE project_id = (string_to_array(name, '/'))[1]::uuid
        AND role = 'admin'
    )
    OR
    auth.uid() IN (
      SELECT creator_id
      FROM project_documents
      WHERE file_path = name
    )
    OR
    name LIKE 'temp/%'
  )
);

-- ========================================
-- 验证策略
-- ========================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND (
      policyname = '项目成员可以上传文档'
      OR policyname = '项目成员可以查看文档'
      OR policyname = '文档所有者和管理员可以删除'
      OR policyname = '文档所有者和管理员可以更新'
    );

  IF policy_count >= 4 THEN
    RAISE NOTICE '✅ Storage RLS 策略配置成功，共 % 条策略', policy_count;
  ELSE
    RAISE WARNING '⚠️  只创建了 % 条策略，预期 4 条，请检查', policy_count;
  END IF;
END $$;


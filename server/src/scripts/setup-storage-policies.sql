-- ========================================
-- Supabase Storage RLS 策略配置
-- Bucket: project-documents
-- 创建时间: 2025-11-01
-- ========================================

-- 说明:
-- 1. 本脚本为 project-documents bucket 配置访问策略
-- 2. 文件路径格式: {projectId}/documents/{filename} 或 temp/{filename}
-- 3. 策略基于项目成员关系进行权限控制

-- ========================================
-- 清理旧策略（如果存在）
-- ========================================

DROP POLICY IF EXISTS "项目成员可以上传文档" ON storage.objects;
DROP POLICY IF EXISTS "项目成员可以查看文档" ON storage.objects;
DROP POLICY IF EXISTS "项目成员可以下载文档" ON storage.objects;
DROP POLICY IF EXISTS "文档所有者和管理员可以删除" ON storage.objects;
DROP POLICY IF EXISTS "任何认证用户可以上传临时文件" ON storage.objects;
DROP POLICY IF EXISTS "用户可以删除自己的临时文件" ON storage.objects;

-- ========================================
-- 策略 1: 上传项目文档
-- ========================================
-- 规则: 项目成员（admin、member）可以上传文档到自己的项目
-- 路径格式: {projectId}/documents/{filename}

CREATE POLICY "项目成员可以上传文档"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-documents' 
  AND (
    -- 提取路径中的项目ID (格式: projectId/documents/filename)
    -- 检查用户是否是该项目的 admin 或 member
    auth.uid() IN (
      SELECT user_id 
      FROM project_members 
      WHERE project_id = (string_to_array(name, '/'))[1]::uuid
        AND role IN ('admin', 'member')
    )
    OR
    -- 允许上传临时文件 (路径以 temp/ 开头)
    name LIKE 'temp/%'
  )
);

COMMENT ON POLICY "项目成员可以上传文档" ON storage.objects IS 
'允许项目成员(admin/member)上传文档到所属项目，或任何认证用户上传临时文件';

-- ========================================
-- 策略 2: 查看/列出文档
-- ========================================
-- 规则: 项目成员（admin、member、observer）可以查看文档列表

CREATE POLICY "项目成员可以查看文档"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-documents'
  AND (
    -- 检查用户是否是该项目的成员（任何角色）
    auth.uid() IN (
      SELECT user_id 
      FROM project_members 
      WHERE project_id = (string_to_array(name, '/'))[1]::uuid
    )
    OR
    -- 允许访问自己的临时文件
    name LIKE 'temp/%'
  )
);

COMMENT ON POLICY "项目成员可以查看文档" ON storage.objects IS 
'允许项目所有成员(包括 observer)查看文档列表';

-- ========================================
-- 策略 3: 下载文档（读取内容）
-- ========================================
-- 规则: 项目成员可以下载文档

CREATE POLICY "项目成员可以下载文档"
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

COMMENT ON POLICY "项目成员可以下载文档" ON storage.objects IS 
'允许项目成员下载文档内容（与查看策略相同，确保下载权限）';

-- ========================================
-- 策略 4: 删除文档
-- ========================================
-- 规则: 
--   1. 项目管理员可以删除任何文档
--   2. 文档上传者可以删除自己上传的文档
--   3. 任何人可以删除自己的临时文件

CREATE POLICY "文档所有者和管理员可以删除"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-documents'
  AND (
    -- 项目管理员可以删除
    auth.uid() IN (
      SELECT user_id 
      FROM project_members 
      WHERE project_id = (string_to_array(name, '/'))[1]::uuid
        AND role = 'admin'
    )
    OR
    -- 文档上传者可以删除（通过 project_documents 表关联）
    auth.uid() IN (
      SELECT creator_id
      FROM project_documents
      WHERE file_path = name
    )
    OR
    -- 允许删除临时文件
    name LIKE 'temp/%'
  )
);

COMMENT ON POLICY "文档所有者和管理员可以删除" ON storage.objects IS 
'允许项目管理员、文档上传者删除文档，任何人可删除临时文件';

-- ========================================
-- 策略 5: 更新文档（不常用，预留）
-- ========================================
-- 规则: 与删除权限相同

CREATE POLICY "文档所有者和管理员可以更新"
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

COMMENT ON POLICY "文档所有者和管理员可以更新" ON storage.objects IS 
'允许项目管理员、文档上传者更新文档元数据';

-- ========================================
-- 验证策略
-- ========================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- 统计策略数量
  SELECT COUNT(*)
  INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE '%文档%' OR policyname LIKE '%临时文件%';

  IF policy_count >= 5 THEN
    RAISE NOTICE '✅ Storage RLS 策略配置成功，共 % 条策略', policy_count;
  ELSE
    RAISE WARNING '⚠️  只创建了 % 条策略，请检查', policy_count;
  END IF;

  -- 列出所有策略
  RAISE NOTICE '========================================';
  RAISE NOTICE '已创建的策略列表:';
  RAISE NOTICE '========================================';
  
  FOR policy_count IN 
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (policyname LIKE '%文档%' OR policyname LIKE '%临时%')
  LOOP
    RAISE NOTICE '  - %', policy_count;
  END LOOP;
  
  RAISE NOTICE '========================================';
END $$;

-- ========================================
-- 使用说明
-- ========================================

-- 1. 在 Supabase Dashboard 中执行本脚本:
--    Storage > Policies > Run SQL

-- 2. 文件路径规范:
--    - 项目文档: {projectId}/documents/{filename}
--    - 临时文件: temp/{filename}

-- 3. 权限说明:
--    - Admin: 可以上传、查看、下载、删除项目内所有文档
--    - Member: 可以上传、查看、下载，只能删除自己上传的文档
--    - Observer: 只能查看和下载文档

-- 4. 测试策略:
--    -- 测试上传权限
--    SELECT auth.uid() IN (
--      SELECT user_id FROM project_members 
--      WHERE project_id = 'YOUR_PROJECT_ID' 
--        AND role IN ('admin', 'member')
--    );

--    -- 测试查看权限
--    SELECT auth.uid() IN (
--      SELECT user_id FROM project_members 
--      WHERE project_id = 'YOUR_PROJECT_ID'
--    );

-- 5. 安全建议:
--    - bucket 应设置为 private (不勾选 Public bucket)
--    - 定期清理 temp/ 目录下的过期文件
--    - 监控存储使用量和带宽

-- ========================================
-- 完成
-- ========================================


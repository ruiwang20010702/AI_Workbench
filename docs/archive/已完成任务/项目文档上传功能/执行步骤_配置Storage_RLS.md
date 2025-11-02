# 🚀 执行步骤：配置 Supabase Storage RLS 策略

## ✅ 当前状态

- ✅ **Bucket 已创建**: `project-documents` bucket 已存在
- ✅ **Bucket 设置正确**: 已设置为私有（非公开）
- ⏭️ **下一步**: 配置 RLS 策略

---

## 📝 步骤 1：打开 Supabase Dashboard

1. 登录 Supabase: https://supabase.com/dashboard
2. 选择你的项目
3. 在左侧菜单找到 **SQL Editor**
4. 点击打开 SQL Editor

---

## 📝 步骤 2：执行 SQL 脚本

### 方法 A：复制文件内容（推荐）

1. 打开文件：`/Users/ruiwang/Desktop/AI_Workbench/server/src/scripts/setup-storage-policies.sql`

2. 复制**全部内容**（大约 250 行）

3. 粘贴到 Supabase SQL Editor 中

4. 点击右下角的 **Run** 按钮（或按 `Cmd/Ctrl + Enter`）

---

### 方法 B：使用下面的 SQL（简化版）

如果你无法访问文件，可以直接复制下面的 SQL：

```sql
-- ========================================
-- Supabase Storage RLS 策略配置
-- Bucket: project-documents
-- ========================================

-- 清理旧策略
DROP POLICY IF EXISTS "项目成员可以上传文档" ON storage.objects;
DROP POLICY IF EXISTS "项目成员可以查看文档" ON storage.objects;
DROP POLICY IF EXISTS "项目成员可以下载文档" ON storage.objects;
DROP POLICY IF EXISTS "文档所有者和管理员可以删除" ON storage.objects;
DROP POLICY IF EXISTS "文档所有者和管理员可以更新" ON storage.objects;

-- 策略 1: 上传文档
CREATE POLICY "项目成员可以上传文档"
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

-- 策略 2: 查看文档
CREATE POLICY "项目成员可以查看文档"
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

-- 策略 3: 下载文档
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

-- 策略 4: 删除文档
CREATE POLICY "文档所有者和管理员可以删除"
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

-- 策略 5: 更新文档
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

-- 验证
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE '%文档%';

  IF policy_count >= 5 THEN
    RAISE NOTICE '✅ Storage RLS 策略配置成功，共 % 条策略', policy_count;
  ELSE
    RAISE WARNING '⚠️  只创建了 % 条策略，请检查', policy_count;
  END IF;
END $$;
```

---

## 📝 步骤 3：验证结果

执行完成后，你应该看到：

### 成功输出示例：
```
NOTICE:  ✅ Storage RLS 策略配置成功，共 5 条策略
```

### 验证方式：

1. 在 Supabase Dashboard 左侧菜单点击 **Storage**
2. 点击 **Policies** 标签
3. 应该看到 5 条策略：
   - ✅ 项目成员可以上传文档
   - ✅ 项目成员可以查看文档
   - ✅ 项目成员可以下载文档
   - ✅ 文档所有者和管理员可以删除
   - ✅ 文档所有者和管理员可以更新

---

## ❗ 常见问题

### 问题 1: 提示 "table project_members does not exist"

**原因**: 数据库表还没有创建

**解决方案**: 
```bash
cd /Users/ruiwang/Desktop/AI_Workbench/server
npx ts-node src/scripts/run-migrate-documents.ts
```

然后重新执行 RLS 策略 SQL。

---

### 问题 2: 提示 "permission denied for schema storage"

**原因**: 当前用户权限不足

**解决方案**: 
- 确保你使用的是 Supabase Dashboard 的 SQL Editor
- SQL Editor 有足够的权限执行这些操作
- 如果还是不行，联系 Supabase 支持

---

### 问题 3: 看不到 Policies 标签

**解决方案**:
1. 进入 **Storage**
2. 点击 `project-documents` bucket
3. 在 bucket 详情页面找到 **Policies** 标签

---

## ✅ 完成确认

执行完成后，请确认以下内容：

- [ ] SQL 执行成功，没有错误
- [ ] 看到 "✅ Storage RLS 策略配置成功" 消息
- [ ] 在 Storage > Policies 中看到 5 条策略
- [ ] 每条策略的名称正确

---

## 🎉 下一步

RLS 策略配置完成后，你可以：

1. ✅ **测试上传功能** - 在应用中尝试上传文档
2. ✅ **测试权限控制** - 使用不同角色账号测试
3. ✅ **安装 Supabase SDK** - 准备迁移到 Supabase Storage
4. ✅ **创建存储服务** - 实现 `SupabaseStorageService`

---

## 📞 需要帮助？

如果遇到问题：
1. 检查本文档的"常见问题"部分
2. 查看 Supabase Dashboard 中的错误信息
3. 告诉我具体的错误消息，我会帮你解决

---

**执行时间**: 约 2 分钟  
**难度**: ⭐⭐ 简单  
**状态**: ⏭️ 待执行


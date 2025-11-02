# 🖱️ 使用 Supabase Dashboard 配置 Storage 策略（图文指南）

## ⚠️ 为什么使用 Dashboard？

SQL Editor 执行 `DROP POLICY` 需要特殊权限，会报错：
```
ERROR: 42501: must be owner of relation objects
```

**解决方案**: 使用 Supabase Dashboard 的图形界面配置策略（推荐方式）

---

## 📝 准备工作

### 确认 Bucket 已创建

✅ 已确认：`project-documents` bucket 已存在并设置为私有

---

## 🚀 配置步骤

### 步骤 1: 进入 Storage Policies

1. **登录 Supabase Dashboard**
   - 访问：https://supabase.com/dashboard
   - 选择你的项目

2. **导航到 Storage**
   - 左侧菜单 → **Storage**
   - 点击 **Policies** 标签

3. **选择 Bucket**
   - 在 Bucket 下拉菜单中选择 `project-documents`
   - 或者点击 `project-documents` bucket，然后点击 **Policies** 标签

---

### 步骤 2: 创建策略 1 - 上传文档

1. **点击 "New Policy" 按钮**

2. **选择模板**
   - 选择 "Create a policy from scratch"
   - 或选择 "Custom" 模板

3. **填写策略信息**

**Policy Name**:
```
项目成员可以上传文档
```

**Allowed operation**:
- ☑️ **INSERT**（上传）

**Target roles**:
- ☑️ **authenticated**

**USING expression** (留空)

**WITH CHECK expression**:
```sql
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
```

4. **点击 "Review"**

5. **点击 "Save policy"**

---

### 步骤 3: 创建策略 2 - 查看/下载文档

1. **点击 "New Policy" 按钮**

2. **填写策略信息**

**Policy Name**:
```
项目成员可以查看文档
```

**Allowed operation**:
- ☑️ **SELECT**（查看/下载）

**Target roles**:
- ☑️ **authenticated**

**USING expression**:
```sql
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
```

**WITH CHECK expression** (留空)

3. **点击 "Review" → "Save policy"**

---

### 步骤 4: 创建策略 3 - 删除文档

1. **点击 "New Policy" 按钮**

2. **填写策略信息**

**Policy Name**:
```
文档所有者和管理员可以删除
```

**Allowed operation**:
- ☑️ **DELETE**（删除）

**Target roles**:
- ☑️ **authenticated**

**USING expression**:
```sql
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
```

**WITH CHECK expression** (留空)

3. **点击 "Review" → "Save policy"**

---

### 步骤 5: 创建策略 4 - 更新文档元数据

1. **点击 "New Policy" 按钮**

2. **填写策略信息**

**Policy Name**:
```
文档所有者和管理员可以更新
```

**Allowed operation**:
- ☑️ **UPDATE**（更新）

**Target roles**:
- ☑️ **authenticated**

**USING expression**:
```sql
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
```

**WITH CHECK expression** (同上)

3. **点击 "Review" → "Save policy"**

---

## ✅ 验证配置

### 检查策略列表

在 Storage > Policies 页面，你应该看到：

```
✅ 项目成员可以上传文档 (INSERT)
✅ 项目成员可以查看文档 (SELECT)
✅ 文档所有者和管理员可以删除 (DELETE)
✅ 文档所有者和管理员可以更新 (UPDATE)
```

### 测试策略

使用 SQL Editor 验证：

```sql
-- 查看所有策略
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  roles
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    policyname LIKE '%文档%'
    OR policyname LIKE '%project-documents%'
  )
ORDER BY policyname;
```

应该返回 4 行记录。

---

## 🎯 策略说明

### 策略 1: 上传文档
- **权限**: Admin、Member
- **操作**: INSERT（上传）
- **限制**: 只能上传到自己的项目或临时目录

### 策略 2: 查看文档
- **权限**: Admin、Member、Observer
- **操作**: SELECT（查看/下载）
- **限制**: 只能查看自己项目的文档

### 策略 3: 删除文档
- **权限**: Admin、文档所有者
- **操作**: DELETE（删除）
- **限制**: 
  - Admin 可以删除项目内所有文档
  - 普通成员只能删除自己上传的文档

### 策略 4: 更新文档
- **权限**: Admin、文档所有者
- **操作**: UPDATE（更新元数据）
- **限制**: 同删除策略

---

## 📂 文件路径格式

### 项目文档
```
{projectId}/documents/{filename}
例如: 550e8400-e29b-41d4-a716-446655440000/documents/report.pdf
```

### 临时文件
```
temp/{timestamp}-{filename}
例如: temp/1698765432000-upload.pdf
```

---

## ❗ 常见问题

### 问题 1: "Policy name already exists"

**原因**: 策略名称已存在

**解决方案**:
1. 在策略列表中找到同名策略
2. 点击 **Delete** 删除旧策略
3. 重新创建策略

---

### 问题 2: "syntax error in expression"

**原因**: SQL 表达式有语法错误

**解决方案**:
1. 仔细检查 SQL 表达式
2. 确保所有括号匹配
3. 复制粘贴时注意不要包含多余的空格或换行

---

### 问题 3: "relation project_members does not exist"

**原因**: 数据库表还没有创建

**解决方案**:
```bash
cd /Users/ruiwang/Desktop/AI_Workbench/server
npx ts-node src/scripts/run-migrate-documents.ts
```

执行数据库迁移后，策略才能正常工作。

---

### 问题 4: 策略无法保存

**原因**: 表达式中引用的表或字段不存在

**解决方案**:
1. 确认 `project_members` 表已创建
2. 确认 `project_documents` 表已创建
3. 使用 SQL Editor 验证：
```sql
SELECT * FROM project_members LIMIT 1;
SELECT * FROM project_documents LIMIT 1;
```

---

## 🔧 高级选项

### 调试策略

如果策略不生效，可以在 SQL Editor 中测试：

```sql
-- 测试当前用户是否能访问某个文件
SELECT 
  bucket_id,
  name,
  auth.uid() as current_user,
  EXISTS(
    SELECT 1 
    FROM project_members 
    WHERE user_id = auth.uid()
      AND project_id = (string_to_array('your-project-id/documents/file.pdf', '/'))[1]::uuid
  ) as has_access
FROM storage.objects
WHERE bucket_id = 'project-documents'
  AND name = 'your-project-id/documents/file.pdf';
```

### 临时禁用策略

在测试时，可以暂时禁用策略：
1. 进入 Storage > Policies
2. 找到要禁用的策略
3. 点击右侧的 **⋮** 菜单
4. 选择 **Disable**

---

## 📊 配置时间估算

| 步骤 | 预计时间 |
|------|---------|
| 步骤 1: 进入 Policies | 30 秒 |
| 步骤 2-5: 创建 4 个策略 | 5-10 分钟 |
| 验证配置 | 2 分钟 |
| **总计** | **约 10 分钟** |

---

## ✅ 完成清单

配置完成后，请确认：

- [ ] 看到 4 条策略（上传、查看、删除、更新）
- [ ] 每条策略的操作类型正确
- [ ] 策略状态都是 **Enabled**
- [ ] SQL 验证查询返回 4 行记录

---

## 🎉 下一步

策略配置完成后：

1. ✅ **安装 Supabase SDK**
   ```bash
   cd /Users/ruiwang/Desktop/AI_Workbench/server
   npm install @supabase/supabase-js
   ```

2. ✅ **创建 SupabaseStorageService** - 我会帮你创建

3. ✅ **测试上传功能** - 在应用中测试

4. ✅ **测试权限控制** - 使用不同角色测试

---

## 💡 提示

- **保存每个策略后再创建下一个** - 避免混淆
- **复制 SQL 时注意格式** - 不要包含多余的空格
- **如果出错可以删除重建** - 策略可以随时修改
- **先测试简单的策略** - 比如先创建上传策略

---

## 📞 需要帮助？

如果遇到问题：
1. 检查本文档的"常见问题"部分
2. 查看 Supabase Dashboard 中的错误提示
3. 使用 SQL Editor 测试表达式
4. 告诉我具体的错误信息

---

**配置难度**: ⭐⭐ 简单  
**推荐方式**: ✅ Dashboard 图形界面（避免权限问题）  
**预计时间**: ⏱️ 10 分钟  
**状态**: 📝 待执行


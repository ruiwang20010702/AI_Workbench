# 配置 Supabase Storage RLS 策略指南

## 📋 前提条件

- ✅ 已在 Supabase 项目中创建 `project-documents` bucket
- ✅ Bucket 设置为 **Private**（不勾选 Public）
- ✅ 数据库中已存在 `project_members` 和 `project_documents` 表

---

## 🚀 方法 1: 使用自动脚本（推荐）

### 步骤 1: 执行配置脚本

```bash
cd /Users/ruiwang/Desktop/AI_Workbench/server
npx ts-node src/scripts/run-setup-storage-policies.ts
```

### 步骤 2: 查看输出

脚本会自动：
1. 连接到 Supabase 数据库
2. 创建所有必要的 RLS 策略
3. 验证配置结果
4. 显示已创建的策略列表

### 预期输出

```
========================================
🚀 开始配置 Supabase Storage RLS 策略
========================================

📡 连接到 Supabase 数据库...
✅ 数据库连接成功

📄 读取策略配置脚本...
✅ 脚本读取成功

⚙️  执行策略配置...
----------------------------------------
✅ Storage RLS 策略配置成功，共 5 条策略
----------------------------------------
✅ 策略配置执行成功

📋 查询已创建的策略...

✅ 成功创建 5 条策略:

1. 项目成员可以上传文档
   操作: INSERT

2. 项目成员可以查看文档
   操作: SELECT

3. 项目成员可以下载文档
   操作: SELECT

4. 文档所有者和管理员可以删除
   操作: DELETE

5. 文档所有者和管理员可以更新
   操作: UPDATE

========================================
🔍 验证 Storage Bucket...

✅ Bucket 已存在
   ID: project-documents
   名称: project-documents
   公开: 否

========================================
✅ Storage RLS 策略配置完成!
========================================
```

---

## 🖱️ 方法 2: 手动在 Supabase Dashboard 执行

如果自动脚本失败，可以手动执行：

### 步骤 1: 打开 Supabase SQL Editor

1. 登录 Supabase Dashboard
2. 选择你的项目
3. 进入 **SQL Editor**

### 步骤 2: 复制并执行 SQL

打开文件：`server/src/scripts/setup-storage-policies.sql`

复制全部内容，粘贴到 SQL Editor 中，点击 **Run**。

### 步骤 3: 验证结果

执行后应该看到：

```
✅ Storage RLS 策略配置成功，共 5 条策略
========================================
已创建的策略列表:
========================================
  - 项目成员可以上传文档
  - 项目成员可以查看文档
  - 项目成员可以下载文档
  - 文档所有者和管理员可以删除
  - 文档所有者和管理员可以更新
========================================
```

---

## 🔒 策略说明

### 策略 1: 上传文档

**名称**: 项目成员可以上传文档

**权限**: 
- Admin 和 Member 可以上传文档到所属项目
- 所有认证用户可以上传临时文件（`temp/` 目录）

**文件路径**:
- 项目文档: `{projectId}/documents/{filename}`
- 临时文件: `temp/{filename}`

---

### 策略 2 & 3: 查看和下载文档

**名称**: 项目成员可以查看文档 / 项目成员可以下载文档

**权限**:
- 所有项目成员（Admin、Member、Observer）都可以查看和下载
- 用户可以访问自己的临时文件

---

### 策略 4: 删除文档

**名称**: 文档所有者和管理员可以删除

**权限**:
- Admin 可以删除项目内任何文档
- Member 只能删除自己上传的文档
- Observer 不能删除文档
- 所有人可以删除自己的临时文件

---

### 策略 5: 更新文档

**名称**: 文档所有者和管理员可以更新

**权限**:
- 与删除权限相同
- 用于更新文档元数据（较少使用）

---

## ✅ 验证配置

### 方法 1: 在 Supabase Dashboard 中查看

1. 进入 **Storage** > **Policies**
2. 选择 `project-documents` bucket
3. 应该看到 5 条策略

### 方法 2: 使用 SQL 查询

在 SQL Editor 中执行：

```sql
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN '查看/下载'
    WHEN cmd = 'INSERT' THEN '上传'
    WHEN cmd = 'DELETE' THEN '删除'
    WHEN cmd = 'UPDATE' THEN '更新'
  END as operation
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND bucket_id = 'project-documents'
ORDER BY policyname;
```

应该返回 5 行结果。

---

## 🧪 测试策略

### 测试 1: 上传权限

**测试用户**: Admin / Member

1. 登录应用
2. 进入项目详情页
3. 切换到"项目文档"标签
4. 上传一个文件
5. **预期结果**: ✅ 上传成功

**测试用户**: Observer

1. 尝试上传文件
2. **预期结果**: ❌ 上传失败（权限不足）

---

### 测试 2: 查看和下载权限

**测试用户**: Admin / Member / Observer

1. 查看文档列表
2. **预期结果**: ✅ 可以看到所有文档
3. 点击"下载"按钮
4. **预期结果**: ✅ 下载成功

---

### 测试 3: 删除权限

**测试用户**: Admin

1. 点击任意文档的"删除"按钮
2. **预期结果**: ✅ 删除成功

**测试用户**: Member

1. 点击自己上传的文档的"删除"按钮
2. **预期结果**: ✅ 删除成功
3. 尝试删除其他人上传的文档
4. **预期结果**: ❌ 删除失败（权限不足）

**测试用户**: Observer

1. 尝试删除任何文档
2. **预期结果**: ❌ 删除失败（权限不足）

---

## 🛠️ 故障排查

### 问题 1: 执行脚本时提示 "permission denied"

**原因**: 数据库用户权限不足

**解决方案**:
1. 使用方法 2 在 Supabase Dashboard 中手动执行
2. 或确保 `DATABASE_URL` 使用的是有足够权限的连接

---

### 问题 2: 提示 "table does not exist"

**原因**: `project_members` 或 `project_documents` 表不存在

**解决方案**:
1. 先执行数据库迁移创建表：
```bash
npx ts-node src/scripts/run-migrate-documents.ts
```
2. 然后再执行策略配置

---

### 问题 3: 上传文件时提示 "new row violates row-level security policy"

**原因**: RLS 策略配置有误或用户不是项目成员

**解决方案**:
1. 检查用户是否是项目成员
2. 检查用户角色是否为 Admin 或 Member
3. 验证策略是否正确创建
4. 查看 Supabase 日志获取详细错误

---

### 问题 4: 查看策略时显示为空

**原因**: 策略可能没有成功创建

**解决方案**:
1. 重新执行配置脚本
2. 检查 SQL 脚本中的语法错误
3. 在 Supabase Dashboard 中手动创建策略

---

## 📊 权限对照表

| 操作 | Admin | Member | Observer | 非成员 |
|------|-------|--------|----------|--------|
| 上传文档 | ✅ | ✅ | ❌ | ❌ |
| 查看文档列表 | ✅ | ✅ | ✅ | ❌ |
| 下载文档 | ✅ | ✅ | ✅ | ❌ |
| 预览文档 | ✅ | ✅ | ✅ | ❌ |
| 删除自己的文档 | ✅ | ✅ | ❌ | ❌ |
| 删除他人的文档 | ✅ | ❌ | ❌ | ❌ |
| 上传临时文件 | ✅ | ✅ | ✅ | ✅* |
| 删除临时文件 | ✅ | ✅ | ✅ | ✅* |

\* 认证用户可以上传和删除临时文件，但只能访问自己的临时文件

---

## 🔐 安全建议

1. **Bucket 设置**
   - ✅ 保持 Private（不勾选 Public）
   - ✅ 设置合理的文件大小限制（如 20MB）
   - ✅ 限制允许的 MIME 类型

2. **定期清理**
   - 设置定时任务清理 `temp/` 目录
   - 建议每天清理超过 24 小时的临时文件

3. **监控使用**
   - 定期查看存储空间使用情况
   - 关注带宽消耗
   - 设置告警通知

4. **审计日志**
   - 启用 Supabase 审计日志
   - 定期检查异常访问

---

## 📝 下一步

配置完成后，继续以下步骤：

1. ✅ 配置 RLS 策略（当前步骤）
2. ⏭️ 安装 Supabase 客户端依赖
3. ⏭️ 创建 `SupabaseStorageService`
4. ⏭️ 修改控制器使用新服务
5. ⏭️ 测试所有功能
6. ⏭️ 迁移现有文件（可选）

---

## 💡 提示

如果遇到任何问题：
1. 查看本文档的"故障排查"部分
2. 检查 Supabase Dashboard 中的日志
3. 在 SQL Editor 中手动测试策略
4. 联系技术支持

---

**最后更新**: 2025-11-01  
**版本**: 1.0  
**状态**: ✅ 可用


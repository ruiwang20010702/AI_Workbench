# 🚀 Storage 策略配置 - 快速参考卡片

## 📌 配置方式

**推荐**: 使用 Supabase Dashboard 图形界面  
**原因**: SQL Editor 没有 DROP POLICY 权限

---

## 🎯 配置路径

```
Supabase Dashboard → Storage → Policies → 选择 "project-documents"
```

---

## 📋 策略清单（共 4 个）

### 1️⃣ 策略 1: 上传文档

| 配置项 | 值 |
|--------|---|
| **Name** | `项目成员可以上传文档` |
| **Operation** | ☑️ INSERT |
| **Target** | authenticated |
| **WITH CHECK** | 见下方 ⬇️ |

```sql
bucket_id = 'project-documents' 
AND (
  auth.uid() IN (
    SELECT user_id FROM project_members 
    WHERE project_id = (string_to_array(name, '/'))[1]::uuid
      AND role IN ('admin', 'member')
  )
  OR name LIKE 'temp/%'
)
```

---

### 2️⃣ 策略 2: 查看/下载文档

| 配置项 | 值 |
|--------|---|
| **Name** | `项目成员可以查看文档` |
| **Operation** | ☑️ SELECT |
| **Target** | authenticated |
| **USING** | 见下方 ⬇️ |

```sql
bucket_id = 'project-documents'
AND (
  auth.uid() IN (
    SELECT user_id FROM project_members 
    WHERE project_id = (string_to_array(name, '/'))[1]::uuid
  )
  OR name LIKE 'temp/%'
)
```

---

### 3️⃣ 策略 3: 删除文档

| 配置项 | 值 |
|--------|---|
| **Name** | `文档所有者和管理员可以删除` |
| **Operation** | ☑️ DELETE |
| **Target** | authenticated |
| **USING** | 见下方 ⬇️ |

```sql
bucket_id = 'project-documents'
AND (
  auth.uid() IN (
    SELECT user_id FROM project_members 
    WHERE project_id = (string_to_array(name, '/'))[1]::uuid
      AND role = 'admin'
  )
  OR auth.uid() IN (
    SELECT creator_id FROM project_documents WHERE file_path = name
  )
  OR name LIKE 'temp/%'
)
```

---

### 4️⃣ 策略 4: 更新文档

| 配置项 | 值 |
|--------|---|
| **Name** | `文档所有者和管理员可以更新` |
| **Operation** | ☑️ UPDATE |
| **Target** | authenticated |
| **USING** | 同策略 3 ⬆️ |

---

## ✅ 验证命令

在 SQL Editor 中执行：

```sql
SELECT policyname, cmd 
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%文档%'
ORDER BY policyname;
```

**预期结果**: 4 行记录

---

## ⏱️ 配置时间

- **单个策略**: 2-3 分钟
- **全部 4 个**: 10 分钟
- **验证测试**: 2 分钟

---

## 📖 详细文档

- [使用Dashboard配置Storage策略_图文指南.md](./使用Dashboard配置Storage策略_图文指南.md) - 详细步骤
- [Supabase_Storage_迁移总结.md](./Supabase_Storage_迁移总结.md) - 完整进度

---

## 💡 提示

✅ **DO**:
- 复制粘贴 SQL 表达式
- 保存每个策略后再创建下一个
- 配置完成后验证

❌ **DON'T**:
- 手动输入 SQL（容易出错）
- 修改 SQL 表达式
- 使用 SQL Editor 执行 DROP POLICY

---

## 🆘 遇到问题？

| 错误 | 原因 | 解决方案 |
|------|------|---------|
| Policy name exists | 重名 | 删除旧策略 |
| Syntax error | SQL 错误 | 重新复制粘贴 |
| Relation not found | 表不存在 | 先执行数据库迁移 |
| Permission denied | 权限不足 | 使用 Dashboard |

---

**快速上手**: 10 分钟 ⏱️  
**难度**: ⭐⭐ 简单  
**状态**: 📝 待配置


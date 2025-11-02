# Supabase数据库迁移指南

由于直接的PostgreSQL连接可能被网络限制，我们使用Supabase SQL Editor来执行迁移。

## 📋 执行步骤

### 1. 打开Supabase SQL Editor

访问你的项目SQL编辑器：

👉 **https://supabase.com/dashboard/project/dkczfihkowivzcvsnxpo/sql/new**

或者：
1. 进入你的Supabase项目
2. 点击左侧菜单的 **"SQL Editor"**
3. 点击 **"New query"**

### 2. 复制迁移脚本

打开文件：`server/database/migrations/supabase-migration.sql`

**复制全部内容**

### 3. 粘贴并执行

1. 将复制的SQL脚本粘贴到SQL Editor中
2. 点击右下角的 **"Run"** 按钮（或按 `Cmd/Ctrl + Enter`）
3. 等待执行完成

### 4. 验证结果

执行成功后，你应该看到：

```
✅ 多助手系统数据库表创建成功！
📊 创建的表: assistants, topics, messages
🔍 创建的索引: 9个
⚡ 创建的触发器: 2个
```

### 5. 检查表是否创建

在左侧的 **"Table Editor"** 中，你应该能看到新创建的表：
- `assistants`
- `topics`
- `messages`

---

## 🔍 验证迁移

执行以下SQL来验证表结构：

```sql
-- 查看所有表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 查看assistants表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'assistants'
ORDER BY ordinal_position;
```

---

## 🔄 回滚迁移（如果需要）

如果需要删除这些表，执行：

```sql
-- 删除表（注意：会删除所有数据！）
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS topics CASCADE;
DROP TABLE IF EXISTS assistants CASCADE;

-- 删除函数
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

---

## ⚠️ 注意事项

1. **users表依赖**：迁移脚本假设已存在`users`表。如果没有，请先创建users表。

2. **权限问题**：确保你使用的是有足够权限的账号（通常Supabase项目所有者有完整权限）。

3. **备份**：如果是生产环境，建议先备份数据库。

4. **RLS策略**：迁移完成后，可能需要配置Row Level Security (RLS)策略来保护数据。

---

## 📊 表结构说明

### assistants（助手表）
- 存储用户创建的AI助手配置
- 包含系统提示词、模型参数等

### topics（主题表）
- 存储助手下的对话主题
- 一个助手可以有多个主题

### messages（消息表）
- 存储对话消息
- 支持user、assistant、system三种角色

---

## 🆘 遇到问题？

### 问题1：users表不存在

**错误信息**：`relation "users" does not exist`

**解决方案**：先创建users表，或修改外键引用。

### 问题2：权限不足

**错误信息**：`permission denied`

**解决方案**：确保使用项目所有者账号，或在Supabase Dashboard的Settings中检查数据库权限。

### 问题3：表已存在

**错误信息**：`relation "assistants" already exists`

**解决方案**：这是正常的，`CREATE TABLE IF NOT EXISTS`会跳过已存在的表。

---

## ✅ 完成后

迁移完成后，你可以：

1. 启动后端服务：`npm run dev`
2. 测试API接口
3. 在前端创建和管理助手

祝你使用愉快！🎉


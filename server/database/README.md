# 数据库迁移指南

## 📋 概述

本目录包含多助手系统的数据库迁移脚本。

## 📁 文件结构

```
database/
├── migrations/
│   ├── create-assistant-tables.sql  # 创建表脚本
│   └── rollback-assistant-tables.sql # 回滚脚本
├── run-migration.js                  # 迁移执行脚本
└── README.md                         # 本文件
```

## 🚀 执行迁移

### 方法1: 使用Node.js脚本（推荐）

```bash
# 安装依赖（如果还没安装）
npm install pg

# 执行迁移
node server/database/run-migration.js up

# 回滚迁移
node server/database/run-migration.js down
```

### 方法2: 使用Supabase Dashboard

1. 登录Supabase Dashboard
2. 进入项目的SQL Editor
3. 复制`migrations/create-assistant-tables.sql`的内容
4. 粘贴到SQL Editor并执行

### 方法3: 使用psql命令行

```bash
# 执行迁移
psql $DATABASE_URL -f server/database/migrations/create-assistant-tables.sql

# 回滚迁移
psql $DATABASE_URL -f server/database/migrations/rollback-assistant-tables.sql
```

## 📊 创建的表

### 1. assistants（助手表）

存储用户创建的AI助手信息。

**字段**:
- `id` - UUID主键
- `user_id` - 用户ID（外键）
- `name` - 助手名称
- `description` - 助手描述
- `icon` - 助手图标（emoji）
- `system_prompt` - 系统提示词
- `model_name` - 模型名称（可选）
- `temperature` - 温度参数（0-2）
- `top_p` - Top P参数（0-1）
- `is_default` - 是否为默认助手
- `is_preset` - 是否为预设模板
- `sort_order` - 排序顺序
- `created_at` - 创建时间
- `updated_at` - 更新时间

### 2. topics（主题表）

存储助手下的对话主题。

**字段**:
- `id` - UUID主键
- `assistant_id` - 助手ID（外键）
- `user_id` - 用户ID（外键）
- `title` - 主题标题
- `is_auto_title` - 是否自动生成标题
- `message_count` - 消息数量（缓存）
- `created_at` - 创建时间
- `updated_at` - 更新时间

### 3. messages（消息表）

存储对话消息。

**字段**:
- `id` - UUID主键
- `topic_id` - 主题ID（外键）
- `role` - 角色（user/assistant/system）
- `content` - 消息内容
- `metadata` - 元数据（JSONB）
- `created_at` - 创建时间

## 🔍 索引

### assistants表
- `idx_assistants_user_id` - 用户ID索引
- `idx_assistants_user_sort` - 用户ID+排序索引
- `idx_assistants_is_default` - 默认助手索引

### topics表
- `idx_topics_assistant_id` - 助手ID索引
- `idx_topics_user_id` - 用户ID索引
- `idx_topics_updated_at` - 更新时间索引

### messages表
- `idx_messages_topic_id` - 主题ID索引
- `idx_messages_created_at` - 创建时间索引

## ⚡ 触发器

- `update_assistants_updated_at` - 自动更新assistants表的updated_at
- `update_topics_updated_at` - 自动更新topics表的updated_at

## ⚠️ 注意事项

1. **备份数据**: 执行迁移前请备份数据库
2. **权限检查**: 确保数据库用户有CREATE TABLE权限
3. **依赖关系**: 确保users表已存在
4. **回滚风险**: 回滚操作将删除所有相关数据，不可恢复

## 🔧 环境变量

确保`.env`文件包含以下变量：

```env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 📝 验证迁移

执行迁移后，可以运行以下SQL验证：

```sql
-- 检查表是否创建
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('assistants', 'topics', 'messages');

-- 检查索引是否创建
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('assistants', 'topics', 'messages');

-- 检查触发器是否创建
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%assistants%' OR trigger_name LIKE '%topics%';
```

## 🐛 故障排查

### 问题1: 权限不足

**错误**: `permission denied to create table`

**解决**: 使用具有足够权限的数据库用户，或联系数据库管理员

### 问题2: 表已存在

**错误**: `relation "assistants" already exists`

**解决**: 
- 如果是重复执行，可以忽略（脚本使用了`IF NOT EXISTS`）
- 如果需要重建，先执行回滚脚本

### 问题3: 外键约束失败

**错误**: `foreign key constraint fails`

**解决**: 确保`users`表已存在

## 📞 支持

如有问题，请查看项目文档或联系开发团队。


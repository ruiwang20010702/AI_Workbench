# 数据库迁移说明

## 问题描述

智能推荐和预测分析功能无法正常工作，因为数据库的 `ai_usage_logs` 表的 `action_type` 约束不包含 `recommend` 和 `predict` 这两个新的操作类型。

## 解决方案

需要在 Supabase 数据库中执行以下 SQL 语句来更新约束。

## 执行步骤

### 方法1: 使用 Supabase Dashboard（推荐）

1. 打开 Supabase Dashboard: https://app.supabase.com/project/dkczfihkowivzcvsnxpo
2. 点击左侧菜单的 "SQL Editor"
3. 点击 "New query"
4. 复制并粘贴以下 SQL 代码：

```sql
-- 删除现有约束
ALTER TABLE ai_usage_logs DROP CONSTRAINT IF EXISTS ai_usage_logs_action_type_check;

-- 添加新约束，包含 'recommend' 和 'predict'
ALTER TABLE ai_usage_logs ADD CONSTRAINT ai_usage_logs_action_type_check 
CHECK (action_type IN (
  'generate', 
  'rewrite', 
  'summarize', 
  'extract_todos', 
  'search', 
  'translate', 
  'assistant_qa', 
  'analyze',
  'recommend',
  'predict'
));
```

5. 点击 "Run" 按钮执行
6. 验证执行成功（应该显示 "Success. No rows returned"）

### 方法2: 使用 psql 命令行

如果您有数据库的直接访问权限：

```bash
cd /Users/ruiwang/Desktop/AI_Workbench/server
psql "your-database-connection-string" -f src/scripts/add-recommend-predict-actions.sql
```

## 验证

执行以下 SQL 来验证约束已正确更新：

```sql
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'ai_usage_logs_action_type_check';
```

应该看到约束定义中包含 `recommend` 和 `predict`。

## 测试

迁移完成后，可以使用以下命令测试 API：

```bash
# 获取认证 token（使用您的实际用户凭据）
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}' \
  | jq -r '.data.token')

# 测试推荐 API
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/ai/recommendations

# 测试预测 API
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/ai/predict
```

## 相关文件

- SQL 脚本: `server/src/scripts/add-recommend-predict-actions.sql`
- TypeScript 类型定义: `server/src/types/index.ts` (已更新)
- 控制器实现: `server/src/controllers/aiController.ts`

## 注意事项

- 此迁移是向后兼容的，不会影响现有数据
- 执行后无需重启服务器
- 如果遇到权限问题，请确保使用具有 ALTER TABLE 权限的数据库用户


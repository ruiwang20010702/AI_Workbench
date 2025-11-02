# CONSENSUS：数据库架构重构 - 迁移到 Supabase 客户端

**日期**: 2025-10-31  
**状态**: ✅ 已确认

---

## 明确的需求描述

### 核心目标
完全移除 `server/src/config/database.ts` 中的 SQL 包装器逻辑，让所有 Model 层直接使用 Supabase 客户端进行数据库操作。

### 具体要求
1. ✅ 删除 375 行的 SQL 解析包装器代码
2. ✅ 保留 Supabase 客户端配置
3. ✅ 重写所有 Model 文件，使用 Supabase 查询构建器
4. ✅ 保持所有现有功能完全一致
5. ✅ 不修改 API 接口和 Controller 层

---

## 技术实现方案

### 1. 保留的配置文件

**`server/src/config/database.ts`** - 简化为纯配置：
```typescript
import { supabaseAdmin } from './supabase';

// 导出 Supabase 客户端供 Models 使用
export default supabaseAdmin;
export { supabaseAdmin };
```

**`server/src/config/supabase.ts`** - 保持不变：
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);
```

### 2. 需要迁移的 Model 文件

按优先级排序：

| 优先级 | 文件 | 原因 | 复杂度 |
|--------|------|------|--------|
| 1 | `Note.ts` | 已暴露多个BUG，急需重构 | 高 |
| 2 | `User.ts` | 认证核心，简单查询 | 低 |
| 3 | `Todo.ts` | 核心功能，复杂查询 | 高 |
| 4 | `Project.ts` | 项目管理，JOIN查询 | 高 |
| 5 | `Task.ts` | 任务管理 | 中 |
| 6 | `ProjectMember.ts` | 成员管理 | 低 |
| 7 | `Notification.ts` | 通知管理 | 中 |
| 8 | `AIUsageLog.ts` | AI使用日志 | 低 |
| 9 | `ProjectProgressUpdater.ts` | 进度更新工具 | 中 |
| 10 | `ReportTemplate.ts` | 报告模板 | 低 |

**已使用 Supabase 的文件：**
- ✅ `WeeklyReport.ts` - 已直接使用 Supabase，无需迁移

### 3. Supabase API 映射

| SQL 操作 | Supabase 方法 | 示例 |
|---------|--------------|------|
| `SELECT *` | `.select('*')` | `select('*')` |
| `WHERE x = $1` | `.eq('x', value)` | `eq('user_id', userId)` |
| `WHERE x != $1` | `.neq('x', value)` | `neq('status', 'deleted')` |
| `WHERE x > $1` | `.gt('x', value)` | `gt('created_at', date)` |
| `WHERE x < $1` | `.lt('x', value)` | `lt('due_date', date)` |
| `WHERE x IN (...)` | `.in('x', array)` | `in('status', ['active', 'pending'])` |
| `WHERE x IS NULL` | `.is('x', null)` | `is('parent_id', null)` |
| `WHERE x ILIKE '%y%'` | `.ilike('x', '%y%')` | `ilike('title', '%search%')` |
| `WHERE tags && $1` | `.overlaps('tags', array)` | `overlaps('tags', ['前端'])` |
| `OR` | `.or('...')` | `or('title.ilike.%x%,content.ilike.%x%')` |
| `ORDER BY x DESC` | `.order('x', {ascending: false})` | `order('created_at', {ascending: false})` |
| `LIMIT $1` | `.limit(n)` | `limit(20)` |
| `OFFSET $1` | `.range(start, end)` | `range(0, 19)` |
| `COUNT(*)` | `.select('*', {count: 'exact', head: true})` | 返回 `count` |
| `INSERT INTO` | `.insert(data).select()` | `.insert({...}).select()` |
| `UPDATE` | `.update(data).eq(...)` | `.update({...}).eq('id', id)` |
| `DELETE` | `.delete().eq(...)` | `.delete().eq('id', id)` |
| `JOIN` | `.select('*, table!inner(*)')` | 使用 Supabase 外键关系 |

---

## 技术约束

### 环境变量
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx...  # 服务端操作，跳过 RLS
SUPABASE_ANON_KEY=eyJxxx...     # 客户端操作，遵守 RLS
```

### 依赖包
- ✅ `@supabase/supabase-js` - 已安装

### Supabase 客户端特性
- ✅ 类型安全（TypeScript）
- ✅ 自动连接池管理
- ✅ 支持事务（通过 RPC）
- ✅ 支持 JOIN（通过外键关系）
- ✅ 支持全文搜索
- ✅ 支持数组操作

---

## 验收标准

### 功能完整性
1. ✅ **用户认证**
   - 登录/注册正常
   - Token 验证正常
   - 用户信息查询正常

2. ✅ **笔记管理**
   - 创建笔记（返回完整数据含 ID）
   - 更新笔记（标题、内容、标签、收藏、归档）
   - 删除笔记
   - 查询笔记列表（分页、筛选、搜索）
   - 标签筛选正常
   - 分类筛选正常（收藏、归档）

3. ✅ **待办事项**
   - CRUD 操作正常
   - 状态更新正常
   - 通知调度正常

4. ✅ **项目管理**
   - 项目 CRUD
   - 任务管理
   - 成员管理
   - 进度统计

5. ✅ **通知系统**
   - 通知创建
   - 通知查询
   - 已读状态更新

### 代码质量
1. ✅ TypeScript 类型安全
2. ✅ 代码简洁易读
3. ✅ 统一的错误处理
4. ✅ 遵循项目代码规范

### 性能
1. ✅ 查询响应时间不增加
2. ✅ 无 N+1 查询问题
3. ✅ 分页查询高效

### 服务稳定性
1. ✅ 服务器启动无错误
2. ✅ 运行时无异常日志
3. ✅ 前端功能完全正常

---

## 任务边界限制

### 包含范围
- ✅ Model 层代码重写
- ✅ `database.ts` 简化
- ✅ 导入语句更新

### 不包含
- ❌ 数据库表结构修改
- ❌ API 路由修改
- ❌ Controller 逻辑修改
- ❌ 前端代码修改
- ❌ 环境配置修改

---

## 风险与缓解

### 风险1：迁移过程功能损坏
**缓解措施：**
- 逐个 Model 迁移并测试
- 保持 git 版本控制
- 迁移前后功能对比测试

### 风险2：复杂查询难以实现
**缓解措施：**
- Supabase 支持 RPC 调用复杂 SQL
- 可以使用 `.rpc()` 方法调用数据库函数
- Project 的 JOIN 查询可能需要 RPC

### 风险3：性能下降
**缓解措施：**
- Supabase 客户端性能通常更好
- 减少了一层 SQL 解析抽象
- 如有问题可以针对性优化

---

## 关键假设确认

### ✅ 假设1：Supabase 支持所有现有查询
- **确认**: Supabase 完全兼容 PostgreSQL
- **证据**: WeeklyReport.ts 已成功使用 Supabase

### ✅ 假设2：不需要修改 Controller 层
- **确认**: Model 层返回格式保持一致
- **证据**: 只改变数据获取方式，不改变接口

### ✅ 假设3：可以删除旧代码
- **确认**: 用户明确要求"抛弃旧代码"
- **策略**: 使用 git 版本控制，可随时回滚

---

## 最终共识

### 同意事项
1. ✅ 完全移除 `database.ts` 的 SQL 包装器
2. ✅ 所有 Model 直接使用 Supabase 客户端
3. ✅ 保持现有功能和性能
4. ✅ 不保留旧代码备份（通过 git 管理）

### 实施原则
1. **渐进式迁移** - 按优先级逐个 Model 迁移
2. **充分测试** - 每个 Model 迁移后立即测试
3. **保持简洁** - 使用 Supabase 最佳实践
4. **类型安全** - 充分利用 TypeScript

---

## 下一步

进入 **Architect（架构阶段）**，详细设计每个 Model 的重写方案。


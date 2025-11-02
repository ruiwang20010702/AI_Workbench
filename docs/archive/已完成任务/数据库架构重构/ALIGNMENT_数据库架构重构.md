# ALIGNMENT：数据库架构重构 - 迁移到 Supabase 客户端

**日期**: 2025-10-31  
**任务名称**: 数据库架构重构

---

## 原始需求

用户要求：
> 直接使用 Supabase 客户端，帮我修改所有相关代码并抛弃旧代码

---

## 项目上下文分析

### 1. 现有架构

**当前实现：**
- `server/src/config/database.ts` - 自定义的 Supabase 包装器
  - 通过字符串匹配解析 SQL 语句
  - 手动映射到 Supabase API 调用
  - 容易遗漏过滤条件（已导致多个BUG）

**现有 Models：**
- `UserModel` - 用户管理
- `NoteModel` - 笔记管理（已暴露多个问题）
- `TodoModel` - 待办事项管理
- `DataSourceModel` - 数据源管理
- `RecordModel` - 记录管理
- `AuditLogModel` - 审计日志

**技术栈：**
- TypeScript
- Supabase（PostgreSQL）
- Express.js
- 已有 `@supabase/supabase-js` 依赖

### 2. 已知问题

参考 `docs/项目诊断/TODO_数据库架构优化建议.md`：

1. **手动 SQL 解析不可维护**
   - 每次添加新字段需要修改包装器
   - 字符串匹配容易出错
   - 代码重复难以测试

2. **缺少未处理查询的告警**
   - 静默失败，调试困难
   - 已导致笔记分类过滤失效BUG
   - 已导致笔记标签筛选失效BUG

3. **参数解析顺序依赖**
   - 依赖 SQL 语句中条件的顺序
   - 容易出错且难以调试

---

## 需求理解

### 目标
1. ✅ 移除 `database.ts` 的 SQL 包装器逻辑
2. ✅ 所有 Model 直接使用 Supabase 客户端
3. ✅ 保持现有功能完全一致
4. ✅ 删除旧代码，不保留备份（用户明确要求）

### 边界确认

**包含：**
- ✅ 重写所有 Model 层代码
- ✅ 使用 Supabase 查询构建器
- ✅ 类型安全的数据访问
- ✅ 完整的功能测试
- ✅ 删除旧的 database.ts 包装器

**不包含：**
- ❌ 数据库表结构修改
- ❌ API 接口修改
- ❌ 前端代码修改
- ❌ 业务逻辑修改

### 验收标准

1. **功能完整性**
   - 所有现有功能正常工作
   - 笔记 CRUD、筛选、搜索、分页
   - 用户认证、授权
   - 待办事项管理
   - 数据源管理

2. **代码质量**
   - 使用 TypeScript 类型安全
   - 代码简洁易读
   - 遵循项目现有规范

3. **性能**
   - 查询性能不下降
   - 响应时间保持或改善

4. **测试**
   - 所有功能手动测试通过
   - 服务器启动无错误

---

## 技术实现方案

### 1. 保留 Supabase 配置

`database.ts` 保留为简单的配置文件：
```typescript
// server/src/config/database.ts
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);
```

### 2. Model 层改造

**原有模式：**
```typescript
const result = await pool.query(
  'SELECT * FROM notes WHERE user_id = $1 AND is_favorite = $2',
  [userId, true]
);
```

**新模式：**
```typescript
const { data, error } = await supabaseAdmin
  .from('notes')
  .select('*')
  .eq('user_id', userId)
  .eq('is_favorite', true);
```

### 3. 迁移的 Models

优先级顺序：
1. **NoteModel** - 已暴露多个问题，优先迁移
2. **UserModel** - 用户认证核心
3. **TodoModel** - 待办事项管理
4. **DataSourceModel** - 数据源管理
5. **RecordModel** - 记录管理
6. **AuditLogModel** - 审计日志

---

## 技术约束

### 环境变量
- `SUPABASE_URL` - 已存在
- `SUPABASE_SERVICE_KEY` - 已存在（用于服务端操作）
- `SUPABASE_ANON_KEY` - 已存在（用于客户端操作）

### 依赖
- `@supabase/supabase-js` - 已安装

### Supabase API 特性
- ✅ 完全兼容 PostgreSQL
- ✅ 支持复杂查询（JOIN、子查询）
- ✅ 支持事务
- ✅ 支持全文搜索
- ✅ 支持数组操作（overlaps、contains）

---

## 风险评估

### 主要风险

1. **迁移过程中功能损坏**
   - 缓解：逐个 Model 迁移并测试
   - 缓解：保持 API 接口不变

2. **查询语义变化**
   - 缓解：仔细对比原 SQL 和新查询
   - 缓解：完整功能测试

3. **性能问题**
   - 缓解：Supabase 客户端性能通常更好
   - 缓解：减少了一层抽象

### 回滚策略

- Git 版本控制
- 迁移过程分多个 commit
- 如有问题可快速回滚

---

## 疑问与澄清

### Q1: 是否需要保留旧代码作为备份？
**A**: 用户明确要求"抛弃旧代码"，因此完全删除旧的包装器逻辑。

### Q2: 是否需要修改 API 接口？
**A**: 不需要，Model 层的改造对 Controller 层透明。

### Q3: 是否需要数据迁移？
**A**: 不需要，只是改变数据访问方式，数据库结构不变。

### Q4: 测试策略？
**A**: 手动测试所有核心功能，确保功能完整性。

---

## 下一步

等待确认后，进入 **Architect（架构阶段）**，详细设计迁移方案。


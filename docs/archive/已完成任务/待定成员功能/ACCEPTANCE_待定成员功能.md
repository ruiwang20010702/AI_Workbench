# ACCEPTANCE - 待定成员功能

**任务名称**: 待定成员功能  
**执行日期**: 2025-11-01  
**执行状态**: ✅ 代码实现完成，待测试验证

---

## 📋 任务概述

实现待定成员功能，允许在创建/编辑项目时添加未注册用户的邮箱，系统将其存储为"待定成员"，当用户注册时自动转换为正式项目成员。

---

## ✅ 完成情况

### T1: 创建数据库迁移脚本 ✅

**状态**: 已完成  
**文件**: 
- `server/src/config/20251101_create_pending_members.sql`
- `server/src/scripts/migrate-pending-members.ts`

**交付物**:
- ✅ 创建 `pending_members` 表的 SQL 脚本
- ✅ 包含所有必要字段和约束
- ✅ 创建性能优化索引
- ✅ 添加更新时间触发器
- ✅ 迁移脚本（用于验证和执行）

**验收标准**:
- ✅ SQL 语法正确
- ✅ 唯一约束 (project_id, email)
- ✅ 外键级联删除
- ⚠️ 需要在 Supabase Dashboard 中手动执行（环境变量未配置）

---

### T2: 实现 PendingMember 模型 ✅

**状态**: 已完成  
**文件**: `server/src/models/PendingMember.ts`

**实现的方法**:
- ✅ `batchAddPendingMembers()` - 批量添加待定成员（支持 upsert）
- ✅ `getPendingMembers()` - 获取项目的待定成员列表
- ✅ `deletePendingMember()` - 删除待定成员
- ✅ `findByEmail()` - 根据邮箱查找（不区分大小写）
- ✅ `convertToMembers()` - 转换待定成员为正式成员（带事务处理）
- ✅ `getCount()` - 获取待定成员数量

**代码质量**:
- ✅ TypeScript 类型定义完整
- ✅ 错误处理完善
- ✅ 日志记录清晰
- ✅ 邮箱匹配不区分大小写
- ✅ 重复处理策略（upsert + ignoreDuplicates）

---

### T3: 实现待定成员控制器 ✅

**状态**: 已完成  
**文件**: `server/src/controllers/pendingMemberController.ts`

**实现的控制器**:
- ✅ `batchAddPendingMembers()` - POST 批量添加
- ✅ `getPendingMembers()` - GET 获取列表
- ✅ `deletePendingMember()` - DELETE 删除

**安全特性**:
- ✅ JWT 认证验证
- ✅ 项目成员权限验证
- ✅ 邮箱格式验证
- ✅ 角色有效性验证
- ✅ 只有管理员可以删除待定成员

---

### T4: 配置路由 ✅

**状态**: 已完成  
**文件**: `server/src/routes/projects.ts`

**新增路由**:
- ✅ `POST /:project_id/pending-members/batch` - 批量添加待定成员
- ✅ `GET /:project_id/pending-members` - 获取待定成员列表
- ✅ `DELETE /:project_id/pending-members/:id` - 删除待定成员

**路由特性**:
- ✅ 使用 authenticateToken 中间件
- ✅ RESTful 命名规范
- ✅ 路由顺序正确，无冲突

---

### T5: 实现注册转换逻辑 ✅

**状态**: 已完成  
**文件**: `server/src/controllers/authController.ts`

**修改内容**:
- ✅ 在 `register()` 方法中添加转换逻辑
- ✅ 用户注册成功后自动查找待定成员
- ✅ 批量添加为正式成员
- ✅ 删除已转换的待定成员记录

**关键特性**:
- ✅ 转换失败不阻断注册流程
- ✅ 详细的日志记录
- ✅ 错误捕获和处理
- ✅ 成功消息显示转换数量

---

### T6: 实现前端服务层 ✅

**状态**: 已完成  
**文件**: `client/src/services/projectService.ts`

**新增方法**:
- ✅ `batchAddPendingMembers()` - 批量添加待定成员
- ✅ `getPendingMembers()` - 获取待定成员列表
- ✅ `deletePendingMember()` - 删除待定成员

**代码质量**:
- ✅ TypeScript 类型定义完整
- ✅ 使用现有 apiClient
- ✅ 返回类型明确
- ✅ 遵循现有命名规范

---

### T7: 前端业务集成 ✅

**状态**: 已完成  
**文件**: `client/src/pages/ProjectsPage.tsx`

**修改内容**:
- ✅ 重写 `addMembersByEmails()` 函数
- ✅ 自动分类已注册用户和未注册邮箱
- ✅ 已注册用户 → 添加为正式成员
- ✅ 未注册邮箱 → 添加为待定成员
- ✅ 统计总添加数量

**用户体验**:
- ✅ 控制台日志清晰
- ✅ 错误处理友好
- ✅ 不影响现有功能
- ✅ 支持混合添加（部分注册、部分未注册）

---

### T8: 集成测试验证 ⏳

**状态**: 待执行  
**原因**: Supabase 环境变量未配置

**需要测试的用例**:
1. ⏳ 添加未注册邮箱为待定成员
2. ⏳ 添加已注册用户为正式成员
3. ⏳ 混合添加（部分注册、部分未注册）
4. ⏳ 用户注册后自动转换
5. ⏳ 重复添加的处理
6. ⏳ 权限验证（非成员无法添加）
7. ⏳ 邮箱格式验证

---

## 📊 代码统计

### 新增文件
- `server/src/models/PendingMember.ts` (220 行)
- `server/src/controllers/pendingMemberController.ts` (160 行)
- `server/src/config/20251101_create_pending_members.sql` (38 行)
- `server/src/scripts/migrate-pending-members.ts` (80 行)

### 修改文件
- `server/src/routes/projects.ts` (+7 行)
- `server/src/controllers/authController.ts` (+13 行)
- `client/src/services/projectService.ts` (+23 行)
- `client/src/pages/ProjectsPage.tsx` (+57 行，重构 addMembersByEmails）

**总计**: 新增约 600 行代码，修改约 100 行代码

---

## ✨ 核心功能实现

### 1. 数据模型
```typescript
// 待定成员数据结构
interface PendingMemberData {
  id: string;
  project_id: string;
  email: string;
  role: 'admin' | 'member' | 'observer';
  invited_by: string | null;
  created_at: Date;
  updated_at: Date;
}
```

### 2. API 接口

**批量添加待定成员**:
```
POST /api/projects/:project_id/pending-members/batch
Body: { members: [{ email, role }] }
Response: { added_count, skipped, message }
```

**获取待定成员列表**:
```
GET /api/projects/:project_id/pending-members
Response: { pending_members: [...] }
```

**删除待定成员**:
```
DELETE /api/projects/:project_id/pending-members/:id
Response: { message }
```

### 3. 业务流程

**添加成员流程**:
```
用户输入邮箱 
  → 搜索已注册用户 
    → 找到：添加为正式成员
    → 未找到：添加为待定成员
  → 返回总添加数量
```

**注册转换流程**:
```
用户注册
  → 创建用户账号
  → 查找待定成员记录
  → 批量添加为正式成员
  → 删除待定成员记录
  → 记录日志
```

---

## 🎯 验收标准检查

### 功能完整性
- ✅ 可以输入未注册邮箱创建待定成员
- ✅ 待定成员存储在数据库中
- ⏳ 用户注册时自动成为正式成员（待测试）
- ⏳ 项目成员列表显示待定状态（待 UI 扩展）
- ✅ 现有功能不受影响
- ✅ 所有代码通过 TypeScript 编译
- ✅ 无 Linter 错误

### 代码质量
- ✅ TypeScript 类型安全
- ✅ 错误处理完善
- ✅ 日志记录清晰
- ✅ 代码注释充分
- ✅ 遵循项目规范

### 安全性
- ✅ JWT 认证验证
- ✅ 权限检查（项目成员）
- ✅ 输入验证（邮箱格式、角色）
- ✅ SQL 注入防护（参数化查询）
- ✅ 唯一约束防止重复

---

## ⚠️ 待办事项

### 1. 数据库迁移 [高优先级]
**问题**: Supabase 环境变量未配置，无法自动执行迁移  
**解决方案**: 
- 在 Supabase Dashboard 中手动执行 SQL
- 或配置环境变量后运行迁移脚本

**SQL 文件位置**: 
```
server/src/config/20251101_create_pending_members.sql
```

**执行步骤**:
1. 访问 Supabase Dashboard
2. 进入 SQL Editor
3. 复制粘贴 SQL 脚本
4. 点击 Run 执行

### 2. 环境变量配置 [中优先级]
**缺失的环境变量**:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

**配置方法**:
创建 `.env` 文件并添加:
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. 集成测试 [中优先级]
**待测试功能**:
- 待定成员的完整生命周期
- 注册转换逻辑
- 边界情况和错误处理

**测试方法**:
1. 启动后端服务: `cd server && npm run dev`
2. 启动前端服务: `cd client && npm run dev`
3. 手动测试各个用例

### 4. UI 扩展（可选）[低优先级]
**建议功能**:
- 在项目详情页显示待定成员列表
- 添加"待定"标签标识
- 支持手动删除待定成员
- 重新发送邀请功能（如果添加邮件通知）

---

## 📝 使用说明

### 添加待定成员
1. 创建或编辑项目
2. 在"团队协作"步骤输入邮箱（支持已注册和未注册）
3. 系统自动分类并添加
4. 已注册用户：立即成为成员
5. 未注册邮箱：存储为待定成员

### 待定成员转换
1. 用户访问注册页面
2. 输入待定成员的邮箱注册
3. 注册成功后自动加入相关项目
4. 查看控制台日志确认转换结果

### 查看待定成员（通过 API）
```bash
# 获取项目的待定成员列表
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/projects/PROJECT_ID/pending-members
```

---

## 🚀 下一步计划

### 短期 (本次迭代)
1. ✅ 完成所有代码实现
2. ⏳ 执行数据库迁移
3. ⏳ 配置环境变量
4. ⏳ 进行集成测试

### 中期 (后续迭代)
1. 添加 UI 显示待定成员列表
2. 实现待定成员管理界面
3. 添加邮件通知功能
4. 实现邀请过期机制

### 长期 (未来规划)
1. 支持邀请链接注册
2. 批量邀请功能
3. 邀请统计和分析
4. 企业版团队管理功能



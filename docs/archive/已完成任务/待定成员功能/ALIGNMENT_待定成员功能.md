# ALIGNMENT - 待定成员功能

## 原始需求
实现"待定成员"功能，允许在创建项目时添加未注册用户的邮箱，当这些用户注册时自动关联到项目。

## 项目上下文分析

### 现有技术栈
- **后端**: Node.js + Express + TypeScript + Supabase (PostgreSQL)
- **前端**: React + TypeScript + Vite
- **认证**: JWT + Supabase Auth
- **数据库**: PostgreSQL (通过 Supabase)

### 现有项目结构
```
server/src/
├── models/ProjectMember.ts        # 项目成员模型
├── controllers/
│   ├── projectMemberController.ts # 成员控制器
│   └── authController.ts          # 认证控制器
├── routes/projects.ts             # 项目路由
└── migrations/                    # 数据库迁移

client/src/
├── components/CreateProjectModal.tsx  # 创建项目模态框
├── services/
│   ├── projectService.ts          # 项目服务
│   └── apiClient.ts               # API 客户端
└── pages/ProjectsPage.tsx         # 项目页面
```

### 现有成员添加流程
1. 用户在 CreateProjectModal 的"团队协作"步骤输入邮箱
2. 提交时调用 `addMembersByEmails` 函数
3. 函数调用 `searchAvailableUsers` API 搜索已注册用户
4. 调用 `batchAddProjectMembers` API 添加成员
5. **问题**: 如果邮箱未注册，搜索返回空，无法添加

## 需求理解和边界确认

### 核心需求
1. ✅ 允许添加未注册用户的邮箱到项目
2. ✅ 将这些邮箱存储为"待定成员"
3. ✅ 用户注册时，自动关联到相应项目
4. ✅ 在项目成员列表中显示待定成员状态

### 任务范围
**包含**：
- 创建 `pending_members` 数据表
- 实现待定成员的 CRUD API
- 修改项目创建流程支持待定成员
- 用户注册时自动转换待定成员为正式成员
- 前端显示待定成员（带状态标识）

**不包含**：
- 邮箱邀请功能（不发送邮件）
- 待定成员的权限管理（使用默认权限）
- 待定成员的删除/管理界面（可后续扩展）

### 技术约束
1. 复用现有的 Supabase 数据库
2. 遵循现有的 API 设计模式
3. 保持前端组件的现有结构
4. 使用现有的认证机制

### 验收标准
1. ✅ 可以输入未注册邮箱创建待定成员
2. ✅ 待定成员存储在数据库中
3. ✅ 用户注册时自动成为正式成员
4. ✅ 项目成员列表显示待定状态
5. ✅ 现有功能不受影响
6. ✅ 所有代码通过 TypeScript 编译

## 疑问澄清

### 已确认的设计决策
1. **待定成员的角色**: 使用项目创建时指定的默认角色（member/admin/observer）
2. **邮箱验证**: 基本格式验证即可，不发送邮件
3. **转换时机**: 用户注册成功后立即转换
4. **数据清理**: 暂不实现过期待定成员的清理（可后续扩展）
5. **UI 显示**: 在成员列表中用标签标识"待定"状态

### 无需询问的技术决策
- 使用独立的 `pending_members` 表存储待定成员
- 邮箱匹配不区分大小写
- 一个邮箱可以有多个待定成员记录（不同项目）
- 转换后自动删除对应的待定成员记录

## 技术实现方案

### 数据库设计
```sql
CREATE TABLE pending_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, email)
);
```

### API 设计
- `POST /api/projects/:project_id/pending-members` - 添加待定成员
- `GET /api/projects/:project_id/pending-members` - 获取待定成员列表
- `DELETE /api/projects/:project_id/pending-members/:id` - 删除待定成员

### 集成点
1. **项目创建流程**: `ProjectsPage.tsx` 的 `addMembersByEmails` 函数
2. **用户注册**: `authController.ts` 的 `register` 函数
3. **成员列表**: `ProjectMemberList` 组件（需要合并正式成员和待定成员）



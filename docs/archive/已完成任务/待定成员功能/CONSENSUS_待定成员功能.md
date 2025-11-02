# CONSENSUS - 待定成员功能

## 需求描述
实现待定成员功能，允许在创建/编辑项目时添加未注册用户的邮箱，系统将其存储为"待定成员"，当用户注册时自动转换为正式项目成员。

## 技术实现方案

### 1. 数据模型
**新增表**: `pending_members`
- `id` (UUID, 主键)
- `project_id` (UUID, 外键 → projects)
- `email` (VARCHAR(255), 待定用户邮箱)
- `role` (VARCHAR(20), 默认角色: member/admin/observer)
- `invited_by` (UUID, 外键 → users, 邀请人)
- `created_at` (TIMESTAMP, 创建时间)
- 唯一约束: (project_id, email)

### 2. 后端 API
**新增接口**:
- `POST /api/projects/:project_id/pending-members/batch` - 批量添加待定成员
- `GET /api/projects/:project_id/pending-members` - 获取待定成员列表
- `DELETE /api/projects/:project_id/pending-members/:id` - 删除待定成员

**修改接口**:
- `POST /api/auth/register` - 注册时自动转换待定成员

### 3. 前端集成
**修改组件**:
- `ProjectsPage.tsx` - 修改 `addMembersByEmails` 支持待定成员
- `CreateProjectModal.tsx` - 无需修改（已支持邮箱输入）

**可选扩展**（暂不实现）:
- 项目详情页显示待定成员列表
- 待定成员管理界面

### 4. 业务流程

#### 添加待定成员流程
```
用户输入邮箱 → 搜索已注册用户 → 添加正式成员
                          ↓ (未找到)
                    创建待定成员记录
```

#### 注册转换流程
```
用户注册 → 查找匹配邮箱的待定成员
         → 批量添加为正式成员
         → 删除待定成员记录
```

## 技术约束
1. ✅ 邮箱匹配不区分大小写
2. ✅ 使用 Supabase 数据库事务保证数据一致性
3. ✅ 复用现有的认证和权限机制
4. ✅ 遵循现有的 TypeScript 代码规范

## 验收标准
1. ✅ 创建项目时可以输入未注册邮箱
2. ✅ 未注册邮箱被存储为待定成员
3. ✅ 已注册邮箱正常添加为正式成员
4. ✅ 用户注册时自动成为所有匹配项目的成员
5. ✅ 转换后待定成员记录被删除
6. ✅ 前端正确显示添加成功的成员数量
7. ✅ 后端 API 通过测试验证
8. ✅ 不影响现有项目成员功能

## 集成方案
- 使用现有的 `projectService` 添加新的 API 方法
- 使用现有的 `ProjectMember` 模型添加待定成员方法
- 最小化修改现有组件，确保向后兼容

## 风险控制
- ⚠️ 邮箱格式验证（前后端都需要）
- ⚠️ 避免重复添加（数据库唯一约束）
- ⚠️ 事务处理确保数据一致性
- ⚠️ 错误处理和日志记录



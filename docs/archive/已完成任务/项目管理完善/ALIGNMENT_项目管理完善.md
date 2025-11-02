# 项目管理功能完善 - 对齐文档

## 任务概述
完善项目管理功能中缺失的UI元素和交互功能，确保E2E测试能够通过。

## 原始需求
> 帮我实现一下项目管理功能中还未实现的功能，并且实现相应的ui功能

## 项目上下文分析

### 现有技术栈
- **前端**: React + TypeScript + Tailwind CSS
- **后端**: Express + TypeScript + PostgreSQL
- **测试**: Playwright E2E测试
- **状态管理**: React Hooks (useState, useEffect)

### 现有项目结构
```
client/src/
  ├── components/projects/
  │   ├── ProjectCreateModal.tsx      # 项目创建/编辑弹窗（4步向导）
  │   ├── ProjectDashboard.tsx        # 项目仪表盘
  │   ├── ProjectFilters.tsx          # 项目筛选器
  │   ├── ProjectGanttChart.tsx       # 甘特图视图
  │   ├── ProjectHierarchy.tsx        # 层级视图
  │   ├── ProjectMemberCard.tsx       # 成员卡片
  │   └── TaskCard.tsx                # 任务卡片
  ├── pages/
  │   └── ProjectsPage.tsx            # 项目主页面（包含多视图模式）
  └── services/
      ├── projectService.ts           # 项目API服务
      └── taskService.ts              # 任务API服务

server/src/
  ├── controllers/
  │   ├── projectController.ts        # 项目控制器
  │   ├── taskController.ts           # 任务控制器
  │   └── projectMemberController.ts  # 项目成员控制器
  ├── models/
  │   ├── Project.ts                  # 项目模型
  │   ├── Task.ts                     # 任务模型
  │   └── ProjectMember.ts            # 项目成员模型
  └── routes/
      └── projects.ts                 # 项目路由
```

### 已实现的功能

#### 后端API（完整）
✅ 项目CRUD操作
- `GET /api/projects` - 获取项目列表（支持筛选）
- `GET /api/projects/:id` - 获取单个项目详情
- `POST /api/projects` - 创建新项目
- `PUT /api/projects/:id` - 更新项目
- `DELETE /api/projects/:id` - 删除项目
- `GET /api/projects/:id/stats` - 获取项目统计
- `GET /api/projects/:id/sub-projects` - 获取子项目

✅ 任务管理
- `GET /api/projects/tasks` - 获取任务列表
- `GET /api/projects/:project_id/tasks` - 获取项目任务
- `POST /api/projects/:project_id/tasks` - 创建任务
- `PUT /api/projects/tasks/:id` - 更新任务
- `DELETE /api/projects/tasks/:id` - 删除任务
- `GET /api/projects/tasks/stats` - 获取任务统计

✅ 项目成员管理
- `GET /api/projects/:project_id/members` - 获取项目成员
- `POST /api/projects/:project_id/members` - 添加成员
- `POST /api/projects/:project_id/members/batch` - 批量添加成员
- `PUT /api/projects/:project_id/members/:member_id` - 更新成员角色
- `DELETE /api/projects/:project_id/members/:member_id` - 移除成员
- `GET /api/projects/:project_id/members/search` - 搜索可添加用户
- `GET /api/projects/user/projects` - 获取用户参与的项目

#### 前端UI（大部分完整）
✅ 项目视图模式
- 仪表盘视图（Dashboard）
- 看板视图（Kanban）
- 甘特图视图（Gantt）
- 层级视图（Hierarchy）

✅ 项目管理功能
- 项目创建/编辑（4步向导：基本信息、项目设置、团队协作、初始任务）
- 项目筛选（状态、优先级、日期范围、团队成员、标签等）
- 项目统计展示
- 子项目创建和管理
- 项目范围切换（所有项目 / 我参与的）

✅ 任务管理功能
- 任务创建/编辑
- 任务状态变更
- 任务分配
- 任务看板拖拽
- 任务甘特图展示

### 发现的问题

#### 1. UI可访问性问题
❌ `ProjectCreateModal` 缺少 `role="dialog"` 属性
- **影响**: E2E测试无法通过 `[role="dialog"]` 选择器找到弹窗
- **位置**: `client/src/components/projects/ProjectCreateModal.tsx:265`
- **当前代码**:
  ```tsx
  <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
  ```
- **需要添加**: `role="dialog"` 和 `aria-modal="true"`

#### 2. 项目详情查看功能不明确
⚠️ E2E测试期望有项目详情查看功能
- **测试代码**: `tests/e2e/projects.spec.ts:87-122`
- **期望**: 点击项目卡片或"查看详情"按钮后，显示项目详情
- **当前状态**: 不清楚是否已实现，需要检查
- **可能的实现方式**:
  - 弹窗形式（Modal）
  - 独立页面（Route）
  - 侧边栏（Drawer）

#### 3. 项目卡片编辑/删除按钮位置
⚠️ E2E测试期望在项目卡片上有编辑和删除按钮
- **测试代码**: `tests/e2e/projects.spec.ts:124-194`
- **期望**: 项目卡片上有"更多"按钮（⋮）或直接的编辑/删除按钮
- **当前状态**: 需要检查 ProjectDashboard 是否渲染项目卡片

## 边界确认

### 任务范围
✅ **包含**:
1. 修复 `ProjectCreateModal` 的可访问性属性
2. 实现或修复项目详情查看功能
3. 确保项目卡片上有编辑/删除操作按钮
4. 修复E2E测试失败的问题

❌ **不包含**:
- 修改后端API（已完整实现）
- 重构现有架构
- 添加新的业务功能
- 性能优化

### 技术约束
- 必须使用现有的技术栈
- 必须保持与现有代码风格一致
- 必须使用项目现有的组件库（lucide-react图标）
- 必须支持无障碍访问（ARIA属性）

## 需求理解

### 核心需求
完善项目管理的UI交互，使其符合E2E测试的预期：
1. **弹窗可访问性**: 添加正确的ARIA属性
2. **项目详情查看**: 实现项目详情查看功能（如果缺失）
3. **项目操作按钮**: 确保项目卡片上有编辑/删除按钮

### 用户故事
1. 作为用户，我希望能够查看项目的详细信息
2. 作为用户，我希望能够快速编辑或删除项目
3. 作为开发者，我希望E2E测试能够正常运行

## 疑问与决策

### 需要澄清的问题

#### Q1: 项目详情查看的展示方式？
**选项**:
- A. 弹窗（Modal）- 快速查看，不改变URL
- B. 独立页面（Route）- 深度查看，可分享链接
- C. 右侧抽屉（Drawer）- 查看同时保留列表

**建议**: 选择 A（弹窗），原因：
- E2E测试代码显示期望是弹窗形式（检查 `[role="dialog"]`）
- 与创建/编辑项目的交互方式保持一致
- 实现成本最低

#### Q2: 项目卡片在哪里渲染？
**需要检查**:
- `ProjectDashboard` 组件是否渲染项目卡片？
- 还是在 `ProjectsPage` 的网格/列表视图中？
- 当前仪表盘视图下，是否有项目卡片？

**行动**: 需要检查代码以确认项目卡片的位置

#### Q3: 项目卡片的操作按钮设计？
**选项**:
- A. 更多按钮（⋮）+ 下拉菜单 - 节省空间，操作集中
- B. 直接显示编辑/删除按钮 - 操作明确，点击快捷
- C. 悬停时显示操作按钮 - 界面简洁，交互友好

**建议**: 选择 A（更多按钮 + 下拉菜单），原因：
- E2E测试代码明确检查了这种模式
- 可以容纳更多操作（查看详情、编辑、删除、归档等）
- 现代化的UI模式

## 技术实现建议

### 1. 修复弹窗可访问性
```tsx
// client/src/components/projects/ProjectCreateModal.tsx
<div 
  className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
  <h2 id="modal-title" className="text-2xl font-bold text-gray-900">
    {editProject ? '编辑项目' : parentProject ? '创建子项目' : '创建新项目'}
  </h2>
  ...
</div>
```

### 2. 实现项目详情查看弹窗
创建新组件 `ProjectDetailModal.tsx`：
- 展示项目完整信息（名称、描述、时间、状态、优先级等）
- 展示项目统计（任务数、完成率、团队成员数等）
- 展示项目成员列表
- 展示最近任务
- 提供"编辑"和"关闭"按钮

### 3. 创建项目卡片组件
创建新组件 `ProjectCard.tsx`：
- 展示项目基本信息
- 显示项目进度条
- 提供更多操作按钮（⋮）
- 下拉菜单包含：查看详情、编辑、删除

### 4. 集成到 ProjectsPage
在仪表盘视图下，添加项目卡片网格展示：
- 在统计卡片下方添加"最近项目"或"所有项目"卡片网格
- 使用新创建的 `ProjectCard` 组件
- 处理查看详情、编辑、删除的回调

## 验收标准
1. ✅ `ProjectCreateModal` 有正确的 `role="dialog"` 属性
2. ✅ 点击"创建项目"按钮后，弹窗能被 E2E 测试找到
3. ✅ 项目列表中有可点击的项目卡片
4. ✅ 项目卡片上有"更多"操作按钮
5. ✅ 点击"查看详情"后显示项目详情弹窗
6. ✅ 点击"编辑"后打开编辑弹窗
7. ✅ 点击"删除"后提示确认并删除项目
8. ✅ 所有E2E测试用例通过

## 时间估算
- 修复弹窗可访问性：30分钟
- 创建项目详情弹窗：2小时
- 创建项目卡片组件：1.5小时
- 集成到主页面：1小时
- 调试和测试：1小时
- **总计**: 约 6 小时

## 风险评估
- **低风险**: 修改现有组件的属性
- **中风险**: 创建新组件可能与现有样式不一致
- **低风险**: E2E测试可能需要微调选择器


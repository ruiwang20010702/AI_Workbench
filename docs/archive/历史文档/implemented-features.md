# C1 产品已实现功能说明

> 生成时间：2025-10-24（根据当前代码库自动梳理）
> 范围：仅包含代码中已实现并接入前/后端的功能，不含尚未落地的规划项。
> 测试账号：邮箱：123456@123.com 密码：Asd123！@#

## 概览
- 后端所有业务 API 统一前缀：`/api`。
- 模块：`/auth`、`/notes`、`/todos`、`/ai`、`/notifications`。
- 鉴权：除注册与登录外，其余业务路由均需登录态。
- 前端页面：首页概览、笔记管理、待办管理、AI 助手等，均已完成接口接入与交互实现。

## 鉴权与路由
- 注册：`POST /api/auth/register`（免登录）
- 登录：`POST /api/auth/login`（免登录）
- 当前用户：`GET /api/auth/me`（需登录）
- 更新资料：`PUT /api/auth/profile`（需登录）
- 修改密码：`PUT /api/auth/password`（需登录）
- 健康检查：`GET /api/health`

## 笔记功能（Notes）
后端接口（均需登录）：
- 列表与过滤：`GET /api/notes`，支持 `notebook_id`、`tags`、`is_favorite`、`is_archived`、`search`、分页。
- 详情：`GET /api/notes/:id`
- 创建：`POST /api/notes`（标题、内容、`notebook_id`、标签）
- 更新：`PUT /api/notes/:id`
- 删除：`DELETE /api/notes/:id`
- 标签：`GET /api/notes/tags`（返回用户唯一标签集合）
- 统计：`GET /api/notes/stats`（总笔记、收藏、归档及增长百分比）
- 搜索：`GET /api/notes/search`（智能搜索）
- 收藏/归档切换：提供对应状态切换接口（需登录）

前端实现：
- NotesPage：笔记列表、搜索、防抖、标签筛选、收藏/归档切换、删除、分页、列表/网格切换、统计展示。
- NoteEditorPage：TipTap 富文本编辑器；标题、标签管理；自动保存与手动保存；收藏/归档切换；删除；预览模式；常用文本格式。

## 待办功能（Todos）
后端接口（均需登录）：
- 列表与过滤：`GET /api/todos`，支持 `completed`、`priority`、`tags`、`search`、分页与排序（`createdAt`、`updatedAt`、`dueDate`、`priority`）。
- 详情：`GET /api/todos/:id`
- 创建：`POST /api/todos`（单个创建）
- 更新：`PUT /api/todos/:id`
- 删除：`DELETE /api/todos/:id`
- 批量创建：`POST /api/todos/batch`
- 批量更新：`PATCH /api/todos/batch`
- 批量删除：`DELETE /api/todos/batch`
- 状态切换：提供完成/未完成切换接口（需登录）
- 标签：`GET /api/todos/tags`
- 统计：`GET /api/todos/stats`（总数、完成、待完成、逾期）
- 搜索：`GET /api/todos/search`
- 导出：`GET /api/todos/export?format=json`（当前仅支持 `json`）

前端实现：
- TodosPage：搜索防抖；状态筛选（全部/待完成/已完成）；优先级筛选；标签过滤；排序（创建/截止/优先级，升/降序）；多选与批量操作（标记完成、批量删除）；导出 `json`；完成状态切换；逾期高亮；总数与统计卡片展示。
- TodoEditorPage：查看/新建/编辑；标题、描述、优先级、截止时间、标签；保存与删除。

## AI 助手功能（AI）
后端接口（均需登录）：
- 文本生成：`POST /api/ai/generate`
- 总结：`POST /api/ai/summarize`
- 改写：`POST /api/ai/rewrite`
- 翻译：`POST /api/ai/translate`
- 文本分析：`POST /api/ai/analyze`（情感、关键词、主题、可读性；实现不依赖外部 API）
- 写作建议：`POST /api/ai/suggest/writing`
- 标题建议：`POST /api/ai/suggest/title`
- 标签建议：`POST /api/ai/suggest/tags`
- 向量嵌入：`POST /api/ai/embed`
- 使用历史：`GET /api/ai/history`
- 使用统计：`GET /api/ai/stats`（总请求、总 tokens、类型分布、月度汇总）

前端实现：
- AIAssistantPage：生成/改写/总结/翻译/分析交互，支持分析类型切换。
- aiService：封装上述接口，并提供 `getUsageStats`、`getSupportedLanguages`、`getAvailableModels`。

## 通知中心（Notifications）
后端接口（均需登录）：
- 列表：获取用户通知列表
- 未读数：获取未读数量
- 标记已读：支持单条与全部标记已读
- 创建通知：内部使用
- 清理过期通知：管理员使用

服务端：启动时运行通知调度器，维护通知相关任务。

## 前端页面与路由
- 受保护页面：`/todos`、`/todos/new`、`/todos/:id`、`/todos/:id/edit`、`/ai`、`/activity`、`/settings`、`/test`。
- 认证页面：`/login`、`/register`。
- 笔记页面：`/notes`（列表与编辑已接入）。
- 首页（HomePage）：展示笔记、待办、AI 使用的快捷统计及增长百分比；呈现近期活动（笔记/待办/AI）。
- 导航：Sidebar 提供“首页/所有笔记/待办事项/AI 助手”，Header 展示 Logo 与导航高亮。

## 统计与活动
- 统计聚合：前端通过 `noteService.getStats` 与 `todoService.getStats` 展示总笔记、收藏、归档、总待办、已完成、AI 使用与增长指标。
- 活动流：HomePage 聚合最近笔记、待办与 AI 使用作为活动概览。

## 系统与运维
- 中间件：`express`、`cors`、`helmet`、`morgan`、`compression`、`express-rate-limit`。
- 服务启动：启动 HTTP 服务器；测试数据库连接；启动通知调度器。

## 健康检查
- `GET /api/health` 用于基础可用性检测。

## 数据校验与错误处理
- 请求体验证：全局使用 `Joi` 中间件校验各接口的请求体。
- 注册字段：`username`、`email`、`password`；`username` 支持中文及 Unicode，长度 1–30。
- 错误返回：校验失败返回 `400`，`message: 请求数据验证失败`，并包含 `errors` 明细数组。

## 已知限制
- 待办导出：当前仅支持 `json` 格式。
- AI 文本分析：默认内置实现；如配置 `AI_ANALYZE_API_URL` 与 `AI_ANALYZE_API_KEY`（或 `AI_ANALYZE_USE_EXTERNAL=true`）则调用第三方 API。

---
如需导出为 PDF 或补充接口参数示例（请求/响应结构），可在此文档基础上进一步生成与扩展。
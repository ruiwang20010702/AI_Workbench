# CONSENSUS — AI应用功能

## 明确需求与验收标准

- 必须交付
  - 后端新增：`GET /api/ai/recommendations`、`GET /api/ai/predict`（均需认证），返回结构化结果。
  - 前端服务层新增：`aiService.getRecommendations()`、`aiService.getPredictiveInsights()` 方法。
  - 文档：说明文档与 6A 文档齐全且可追踪进度。

- 验收标准（可测试）
  - 推荐接口在存在笔记/任务数据时返回至少 1 类建议项，含来源/理由/优先级。
  - 预测接口在存在历史完成数据时返回平均完成率与未来 7 天预测值；在数据不足时返回安全的默认/提示。
  - 前端服务层方法可在本地（或集成页面）正常调用并得到结构化响应。

## 技术实现与约束

- 与现有 Express/TS 分层一致：`controllers/aiController.ts`、`services/aiService.ts`、`routes/ai.ts`。
- 数据访问通过既有模型层：`NoteModel`、`TodoModel`、`TaskModel` 等。
- 速率限制与认证沿用 `app.ts` 现有中间件；日志记录按需扩展至 `AIUsageLogModel`。
- 环境变量通过 `.env` 管理；严禁提交真实密钥。

## 集成方案

- 服务端：新增控制器方法与路由；复用现有错误处理与类型定义。
- 前端：在 `client/src/services/aiService.ts` 新增方法；UI 暂不改动，后续再添加入口。

## 任务边界与限制

- 本轮不包含 CV 实现与复杂推荐/预测模型；先交付启发式版本。
- 不变更数据库结构；充分复用现有数据与索引。

## 不确定性解决

- 若数据分布稀疏，推荐与预测返回“数据不足”说明并降级为通用建议。
- 后续性能与准确性通过 A/B 和日志评估逐步优化。
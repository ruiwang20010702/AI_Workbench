import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { weeklyReportLimiter, aiLimiter, exportLimiter } from '../middleware/rateLimit';
import {
  generateWeeklyReport,
  getWeeklyReports,
  getWeeklyReport,
  updateWeeklyReport,
  deleteWeeklyReport,
  publishWeeklyReport,
  exportWeeklyReport,
  optimizeWeeklyReport,
  getSuggestions,
  getWeeklyReportStats,
} from '../controllers/weeklyReportController';
import {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
  previewTemplate,
  getPublicTemplates,
} from '../controllers/templateController';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// ==================== 周报路由 ====================

// 生成周报（应用限流）
router.post('/weekly/generate', weeklyReportLimiter, generateWeeklyReport);

// 获取周报统计
router.get('/weekly/stats', getWeeklyReportStats);

// 获取周报列表
router.get('/weekly', getWeeklyReports);

// 获取单个周报
router.get('/weekly/:id', getWeeklyReport);

// 更新周报
router.put('/weekly/:id', updateWeeklyReport);

// 删除周报
router.delete('/weekly/:id', deleteWeeklyReport);

// 发布周报
router.post('/weekly/:id/publish', publishWeeklyReport);

// 导出周报（应用限流）
router.get('/weekly/:id/export', exportLimiter, exportWeeklyReport);

// AI优化周报（应用限流）
router.post('/weekly/:id/optimize', aiLimiter, optimizeWeeklyReport);

// 获取AI建议（应用限流）
router.post('/weekly/:id/suggestions', aiLimiter, getSuggestions);

// ==================== 模板路由 ====================

// 获取公共模板（放在前面避免被/:id捕获）
router.get('/templates/public', getPublicTemplates);

// 获取模板列表
router.get('/templates', getTemplates);

// 获取单个模板
router.get('/templates/:id', getTemplate);

// 创建模板
router.post('/templates', createTemplate);

// 更新模板
router.put('/templates/:id', updateTemplate);

// 删除模板
router.delete('/templates/:id', deleteTemplate);

// 设置默认模板
router.post('/templates/:id/set-default', setDefaultTemplate);

// 预览模板
router.post('/templates/:id/preview', previewTemplate);

export default router;


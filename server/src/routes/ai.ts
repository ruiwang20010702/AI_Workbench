import { Router } from 'express';
import { AIController } from '../controllers/aiController';
import { 
  validate, 
  aiGenerateSchema, 
  aiRewriteSchema, 
  aiSummarizeSchema, 
  aiTranslateSchema 
} from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 所有AI路由都需要认证
router.use(authenticateToken);

// 使用统计
router.get('/stats', AIController.getStats);
// 智能推荐与预测分析
router.get('/recommendations', AIController.getRecommendations);
router.get('/predict', AIController.getPredictiveInsights);

// AI文本生成
router.post('/generate', validate(aiGenerateSchema), AIController.generateText);

// 智能摘要
router.post('/summarize', validate(aiSummarizeSchema), AIController.summarize);

// 智能改写
router.post('/rewrite', validate(aiRewriteSchema), AIController.rewrite);

// 智能翻译
router.post('/translate', validate(aiTranslateSchema), AIController.translate);

// 文本分析（不依赖外部API，返回结构化分析）
router.post('/analyze', AIController.analyze);

// 生成写作建议
router.post('/suggestions/writing', AIController.getWritingSuggestions);

// 生成标题建议
router.post('/suggestions/titles', AIController.getTitleSuggestions);

// 生成标签建议
router.post('/suggestions/tags', AIController.getTagSuggestions);

// 生成文本嵌入向量
router.post('/embedding', AIController.generateEmbedding);

// 获取AI使用历史记录
router.get('/usage/history', AIController.getUsageHistory);

// 获取最近的AI使用记录
router.get('/usage/recent', AIController.getRecentUsage);

// 智能问答对话
router.post('/chat', AIController.chat);

export default router;
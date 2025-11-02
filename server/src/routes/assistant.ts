/**
 * Assistant Routes - 助手路由
 */

import express from 'express';
import { AssistantController } from '../controllers/assistantController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取预设模板（放在前面，避免被/:id匹配）
router.get('/presets', AssistantController.getPresets);

// 迁移对话
router.post('/migrate', AssistantController.migrate);

// 助手CRUD
router.get('/', AssistantController.list);
router.post('/', AssistantController.create);
router.put('/:id', AssistantController.update);
router.delete('/:id', AssistantController.delete);

export default router;


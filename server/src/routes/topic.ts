/**
 * Topic Routes - 主题路由
 */

import express from 'express';
import { TopicController } from '../controllers/topicController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 批量删除（放在前面，避免被/:id匹配）
router.delete('/batch', TopicController.batchDelete);

// 主题CRUD
router.put('/:id', TopicController.update);
router.delete('/:id', TopicController.delete);

export default router;


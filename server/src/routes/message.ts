/**
 * Message Routes - 消息路由
 */

import express from 'express';
import { MessageController } from '../controllers/messageController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router({ mergeParams: true }); // 合并父路由的params

// 所有路由都需要认证
router.use(authenticateToken);

// 消息CRUD（这些路由会在主路由中挂载到/api/topics/:topicId/messages）
router.get('/', MessageController.list);
router.post('/', MessageController.create);

export default router;


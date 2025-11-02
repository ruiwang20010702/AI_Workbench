import { Router } from 'express';
import authRoutes from './auth';
import noteRoutes from './notes';
import todoRoutes from './todos';
import aiRoutes from './ai';
import notificationRoutes from './notifications';
import projectRoutes from './projects';
import weeklyReportsRoutes from './weeklyReports';
import projectDocumentRoutes from './projectDocuments';
import assistantRoutes from './assistant';
import topicRoutes from './topic';
import messageRoutes from './message';
import { TopicController } from '../controllers/topicController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 认证相关路由
router.use('/auth', authRoutes);

// 笔记相关路由
router.use('/notes', noteRoutes);

// Todo相关路由
router.use('/todos', todoRoutes);

// AI相关路由
router.use('/ai', aiRoutes);

// 通知相关路由
router.use('/notifications', notificationRoutes);

// 项目管理相关路由
router.use('/projects', projectRoutes);

// 项目文档相关路由
router.use('/', projectDocumentRoutes);

// 周报相关路由
router.use('/reports', weeklyReportsRoutes);

// 多助手系统路由
router.use('/assistants', assistantRoutes);
router.use('/topics', topicRoutes);

// 助手的主题列表（嵌套路由）
router.get('/assistants/:assistantId/topics', authenticateToken, TopicController.list);
router.post('/assistants/:assistantId/topics', authenticateToken, TopicController.create);

// 主题的消息列表（嵌套路由）
router.use('/topics/:topicId/messages', messageRoutes);

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API服务运行正常',
    timestamp: new Date().toISOString()
  });
});

export default router;
import { Router } from 'express';
import authRoutes from './auth';
import noteRoutes from './notes';
import todoRoutes from './todos';
import aiRoutes from './ai';
import notificationRoutes from './notifications';
import projectRoutes from './projects';

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

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API服务运行正常',
    timestamp: new Date().toISOString()
  });
});

export default router;
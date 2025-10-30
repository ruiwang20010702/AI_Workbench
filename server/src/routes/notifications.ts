import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 所有通知路由都需要认证
router.use(authenticateToken);

// 获取用户通知列表
// GET /api/notifications?isRead=false&limit=20&offset=0
router.get('/', NotificationController.getNotifications);

// 获取未读通知数量
// GET /api/notifications/unread-count
router.get('/unread-count', NotificationController.getUnreadCount);

// 标记通知为已读
// PATCH /api/notifications/:id/read
router.patch('/:id/read', NotificationController.markAsRead);

// 标记所有通知为已读
// PATCH /api/notifications/read-all
router.patch('/read-all', NotificationController.markAllAsRead);

// 创建通知（内部使用，通常由系统自动调用）
// POST /api/notifications
router.post('/', NotificationController.createNotification);

// 清理过期通知（管理员功能）
// DELETE /api/notifications/cleanup
router.delete('/cleanup', NotificationController.cleanupExpired);

export default router;
import { Request, Response } from 'express';
import { NotificationModel, CreateNotificationRequest } from '../models/Notification';

export class NotificationController {
  // 获取用户通知列表
  static async getNotifications(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      const { isRead, limit = 20, offset = 0 } = req.query;
      
      // 构建查询选项对象
      const queryOptions: {
        limit: number;
        offset: number;
        isRead?: boolean;
      } = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      };
      
      // 只有当isRead有值时才添加到选项中
      if (isRead !== undefined) {
        queryOptions.isRead = isRead === 'true';
      }
      
      const notifications = await NotificationModel.findByUserId(req.user.id, queryOptions);
      const unreadCount = await NotificationModel.getUnreadCount(req.user.id);

      res.json({
        success: true,
        data: {
          notifications,
          unreadCount,
          total: notifications.length
        }
      });
    } catch (error) {
      console.error('获取通知列表错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 获取未读通知数量
  static async getUnreadCount(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      const unreadCount = await NotificationModel.getUnreadCount(req.user.id);

      res.json({
        success: true,
        data: {
          unreadCount
        }
      });
    } catch (error) {
      console.error('获取未读通知数量错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 标记通知为已读
  static async markAsRead(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: '缺少通知ID参数'
        });
      }

      const notification = await NotificationModel.markAsRead(id, req.user.id);
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: '通知不存在'
        });
      }

      res.json({
        success: true,
        message: '通知已标记为已读',
        data: {
          notification
        }
      });
    } catch (error) {
      console.error('标记通知已读错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 标记所有通知为已读
  static async markAllAsRead(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      await NotificationModel.markAllAsRead(req.user.id);

      res.json({
        success: true,
        message: '所有通知已标记为已读'
      });
    } catch (error) {
      console.error('标记所有通知已读错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 创建通知（内部使用）
  static async createNotification(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      const notificationData: CreateNotificationRequest = {
        ...req.body,
        user_id: req.user.id
      };

      // 检查是否已存在相同类型的通知
      const exists = await NotificationModel.existsForTodo(
        req.user.id,
        notificationData.todo_id,
        notificationData.type
      );

      if (exists) {
        return res.status(409).json({
          success: false,
          message: '该类型的通知已存在'
        });
      }

      const notification = await NotificationModel.create(notificationData);

      res.status(201).json({
        success: true,
        message: '通知创建成功',
        data: {
          notification
        }
      });
    } catch (error) {
      console.error('创建通知错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 清理过期通知
  static async cleanupExpired(req: Request, res: Response): Promise<Response | void> {
    try {
      await NotificationModel.deleteExpired();

      res.json({
        success: true,
        message: '过期通知清理完成'
      });
    } catch (error) {
      console.error('清理过期通知错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
}
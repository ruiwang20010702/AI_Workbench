import { NotificationModel } from '../models/Notification';
import { TodoModel } from '../models/Todo';
import { Notification, NotificationType } from '../types';

export class NotificationService {
  /**
   * 检查并生成待办事项的通知
   * 根据截止日期生成1天、3小时、5分钟和即刻提醒
   */
  static async generateTodoNotifications(): Promise<void> {
    try {
      // 获取需要生成通知的待办事项
      const todos = await NotificationModel.getTodosNeedingNotification();
      
      for (const todo of todos) {
        if (!todo.due_date) continue;
        
        const dueDate = new Date(todo.due_date);
        const now = new Date();
        const timeDiff = dueDate.getTime() - now.getTime();
        
        // 定义通知类型和对应的时间阈值（毫秒）
        const notificationTypes = [
          { type: 'one_day' as NotificationType, threshold: 24 * 60 * 60 * 1000, label: '1天' },
          { type: 'three_hours' as NotificationType, threshold: 3 * 60 * 60 * 1000, label: '3小时' },
          { type: 'five_minutes' as NotificationType, threshold: 5 * 60 * 1000, label: '5分钟' },
          { type: 'immediate' as NotificationType, threshold: 0, label: '即刻' }
        ];
        
        for (const { type, threshold, label } of notificationTypes) {
          // 检查是否应该发送此类型的通知
          if (timeDiff <= threshold && timeDiff > (threshold - 60 * 1000)) { // 1分钟容错
            // 检查是否已经存在相同类型的通知
            const existingNotification = await NotificationModel.existsForTodo(
              todo.user_id, 
              todo.id, 
              type
            );
            
            if (!existingNotification) {
              // 创建通知
              const notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'> = {
                user_id: todo.user_id,
                todo_id: todo.id,
                type,
                title: `待办事项提醒 - ${label}`,
                message: `您的待办事项"${todo.title}"将在${label}后到期`,
                is_read: false
              };
              
              await NotificationModel.create(notification);
              console.log(`Created ${type} notification for todo: ${todo.title}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating todo notifications:', error);
      throw error;
    }
  }
  
  /**
   * 清理过期的通知（已读超过一周的通知）
   */
  static async cleanupExpiredNotifications(): Promise<number> {
    try {
      const deletedCount = await NotificationModel.deleteExpired();
      console.log(`Cleaned up ${deletedCount} expired notifications`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      throw error;
    }
  }
  
  /**
   * 当待办事项被删除时，删除相关的通知
   */
  static async deleteTodoNotifications(todoId: string): Promise<void> {
    try {
      await NotificationModel.deleteByTodoId(todoId);
      console.log(`Deleted notifications for todo: ${todoId}`);
    } catch (error) {
      console.error('Error deleting todo notifications:', error);
      throw error;
    }
  }
  
  /**
   * 获取用户的通知列表
   */
  static async getUserNotifications(
    userId: string, 
    isRead?: boolean, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<Notification[]> {
    try {
      const options: { limit: number; offset: number; isRead?: boolean } = { limit, offset };
      if (isRead !== undefined) {
        options.isRead = isRead;
      }
      return await NotificationModel.findByUserId(userId, options);
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }
  
  /**
   * 获取用户未读通知数量
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      return await NotificationModel.getUnreadCount(userId);
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }
  
  /**
   * 标记通知为已读
   */
  static async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await NotificationModel.markAsRead(notificationId, userId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }
  
  /**
   * 标记用户所有通知为已读
   */
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      await NotificationModel.markAllAsRead(userId);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
}
import pool from '../config/database';
import { Notification, NotificationType } from '../types';

export interface CreateNotificationRequest {
  user_id: string;
  todo_id: string;
  type: NotificationType;
  title: string;
  message: string;
}

export interface UpdateNotificationRequest {
  is_read?: boolean;
}

export class NotificationModel {
  // 创建通知
  static async create(notificationData: CreateNotificationRequest): Promise<Notification> {
    const query = `
      INSERT INTO notifications (user_id, todo_id, type, title, message, is_read)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      notificationData.user_id,
      notificationData.todo_id,
      notificationData.type,
      notificationData.title,
      notificationData.message,
      false
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // 根据用户ID获取通知列表
  static async findByUserId(
    userId: string,
    options: {
      isRead?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Notification[]> {
    let query = `
      SELECT n.*, t.title as todo_title, t.due_date as todo_due_date
      FROM notifications n
      LEFT JOIN todos t ON n.todo_id = t.id
      WHERE n.user_id = $1
    `;
    const values: any[] = [userId];
    let paramCount = 2;

    if (options.isRead !== undefined) {
      query += ` AND n.is_read = $${paramCount++}`;
      values.push(options.isRead);
    }

    query += ` ORDER BY n.created_at DESC`;

    if (options.limit) {
      query += ` LIMIT $${paramCount++}`;
      values.push(options.limit);
    }

    if (options.offset) {
      query += ` OFFSET $${paramCount++}`;
      values.push(options.offset);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  // 获取未读通知数量
  static async getUnreadCount(userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = $1 AND is_read = false
    `;
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  // 标记通知为已读
  static async markAsRead(id: string, userId: string): Promise<Notification | null> {
    const query = `
      UPDATE notifications
      SET is_read = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0] || null;
  }

  // 批量标记为已读
  static async markAllAsRead(userId: string): Promise<void> {
    const query = `
      UPDATE notifications
      SET is_read = true, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND is_read = false
    `;
    await pool.query(query, [userId]);
  }

  // 删除过期通知（已读且超过一周）
  static async deleteExpired(): Promise<number> {
    const query = `
      DELETE FROM notifications
      WHERE is_read = true 
      AND updated_at < NOW() - INTERVAL '7 days'
    `;
    const result = await pool.query(query);
    return result.rowCount || 0;
  }

  // 检查是否已存在相同类型的通知
  static async existsForTodo(
    userId: string,
    todoId: string,
    type: NotificationType
  ): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = $1 AND todo_id = $2 AND type = $3
    `;
    const result = await pool.query(query, [userId, todoId, type]);
    return parseInt(result.rows[0].count) > 0;
  }

  // 根据待办事项ID删除相关通知
  static async deleteByTodoId(todoId: string): Promise<void> {
    const query = `
      DELETE FROM notifications
      WHERE todo_id = $1
    `;
    await pool.query(query, [todoId]);
  }

  // 获取需要发送通知的待办事项
  static async getTodosNeedingNotification(): Promise<any[]> {
    const now = new Date();
    const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000);

    const query = `
      SELECT DISTINCT t.*, u.email as user_email
      FROM todos t
      JOIN users u ON t.user_id = u.id
      WHERE t.due_date IS NOT NULL 
      AND t.completed = false
      AND (
        -- 1天前提醒
        (t.due_date <= $1 AND t.due_date > $2 AND NOT EXISTS (
          SELECT 1 FROM notifications n 
          WHERE n.todo_id = t.id AND n.type = 'due_1_day'
        ))
        OR
        -- 3小时前提醒
        (t.due_date <= $3 AND t.due_date > $4 AND NOT EXISTS (
          SELECT 1 FROM notifications n 
          WHERE n.todo_id = t.id AND n.type = 'due_3_hours'
        ))
        OR
        -- 5分钟前提醒
        (t.due_date <= $5 AND t.due_date > $6 AND NOT EXISTS (
          SELECT 1 FROM notifications n 
          WHERE n.todo_id = t.id AND n.type = 'due_5_minutes'
        ))
        OR
        -- 即时提醒
        (t.due_date <= $7 AND NOT EXISTS (
          SELECT 1 FROM notifications n 
          WHERE n.todo_id = t.id AND n.type = 'due_now'
        ))
      )
    `;

    const values = [
      oneDayLater,
      now,
      threeHoursLater,
      now,
      fiveMinutesLater,
      now,
      now
    ];

    const result = await pool.query(query, values);
    return result.rows;
  }
}
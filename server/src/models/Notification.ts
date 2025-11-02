import { supabaseAdmin } from '../config/database';
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
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: notificationData.user_id,
        todo_id: notificationData.todo_id,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        is_read: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }

    return data;
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
    let query = supabaseAdmin
      .from('notifications')
      .select(`
        *,
        todos:todo_id (
          title,
          due_date
        )
      `)
      .eq('user_id', userId);

    if (options.isRead !== undefined) {
      query = query.eq('is_read', options.isRead);
    }

    query = query.order('created_at', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      const end = options.offset + (options.limit || 20) - 1;
      query = query.range(options.offset, end);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error finding notifications:', error);
      throw error;
    }

    // 展平 todos 关系数据
    return (data || []).map((notification: any) => {
      const todo = notification.todos;
      delete notification.todos;
      return {
        ...notification,
        todo_title: todo?.title,
        todo_due_date: todo?.due_date
      };
    });
  }

  // 获取未读通知数量
  static async getUnreadCount(userId: string): Promise<number> {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }

    return data?.length || 0;
  }

  // 标记通知为已读
  static async markAsRead(id: string, userId: string): Promise<Notification | null> {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ 
        is_read: true, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error marking notification as read:', error);
      throw error;
    }

    return data;
  }

  // 批量标记为已读
  static async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ 
        is_read: true, 
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }

  // 删除过期通知（已读且超过一周）
  static async deleteExpired(): Promise<number> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('is_read', true)
      .lt('updated_at', oneWeekAgo.toISOString())
      .select('id');

    if (error) {
      console.error('Error deleting expired notifications:', error);
      throw error;
    }

    return data?.length || 0;
  }

  // 检查是否已存在相同类型的通知
  static async existsForTodo(
    userId: string,
    todoId: string,
    type: NotificationType
  ): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('todo_id', todoId)
      .eq('type', type);

    if (error) {
      console.error('Error checking notification existence:', error);
      throw error;
    }

    return (data?.length || 0) > 0;
  }

  // 根据待办事项ID删除相关通知
  static async deleteByTodoId(todoId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('todo_id', todoId);

    if (error) {
      console.error('Error deleting notifications by todo ID:', error);
      throw error;
    }
  }

  // 获取需要发送通知的待办事项
  static async getTodosNeedingNotification(): Promise<any[]> {
    const now = new Date();
    const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000);

    // 获取所有未完成且有截止日期的待办事项
    const { data: todos, error: todosError } = await supabaseAdmin
      .from('todos')
      .select(`
        *,
        users:user_id (email)
      `)
      .eq('completed', false)
      .not('due_date', 'is', null);

    if (todosError) {
      console.error('Error fetching todos needing notification:', todosError);
      throw todosError;
    }

    if (!todos || todos.length === 0) {
      return [];
    }

    // 获取所有现有通知
    const { data: existingNotifications, error: notificationsError } = await supabaseAdmin
      .from('notifications')
      .select('todo_id, type')
      .in('todo_id', todos.map(t => t.id));

    if (notificationsError) {
      console.error('Error fetching existing notifications:', notificationsError);
      throw notificationsError;
    }

    const notificationMap = new Map<string, Set<string>>();
    (existingNotifications || []).forEach((n: any) => {
      if (!notificationMap.has(n.todo_id)) {
        notificationMap.set(n.todo_id, new Set());
      }
      notificationMap.get(n.todo_id)!.add(n.type);
    });

    // 筛选需要发送通知的待办事项
    const needsNotification: any[] = [];

    for (const todo of todos) {
      const dueDate = new Date(todo.due_date);
      const existingTypes = notificationMap.get(todo.id) || new Set();
      const user = Array.isArray(todo.users) ? todo.users[0] : todo.users;

      const todoWithEmail = {
        ...todo,
        user_email: user?.email
      };
      delete todoWithEmail.users;

      // 1天前提醒
      if (dueDate <= oneDayLater && dueDate > now && !existingTypes.has('due_1_day')) {
        needsNotification.push({ ...todoWithEmail, notification_type: 'due_1_day' });
      }
      // 3小时前提醒
      else if (dueDate <= threeHoursLater && dueDate > now && !existingTypes.has('due_3_hours')) {
        needsNotification.push({ ...todoWithEmail, notification_type: 'due_3_hours' });
      }
      // 5分钟前提醒
      else if (dueDate <= fiveMinutesLater && dueDate > now && !existingTypes.has('due_5_minutes')) {
        needsNotification.push({ ...todoWithEmail, notification_type: 'due_5_minutes' });
      }
      // 即时提醒
      else if (dueDate <= now && !existingTypes.has('due_now')) {
        needsNotification.push({ ...todoWithEmail, notification_type: 'due_now' });
      }
    }

    return needsNotification;
  }
}

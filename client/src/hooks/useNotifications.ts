import { useState, useEffect, useCallback } from 'react';
import { Notification } from '../types/notification';
import { notificationService } from '../services/notificationService';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  loadNotifications: () => Promise<void>;
  loadUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载通知列表
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationService.getNotifications();
      setNotifications(response.notifications);
    } catch (err: any) {
      setError(err.message || '加载通知失败');
      console.error('加载通知失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载未读数量
  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err: any) {
      console.error('加载未读数量失败:', err);
    }
  }, []);

  // 标记单个通知为已读
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // 更新本地状态
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      );
      
      // 更新未读数量
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      setError(err.message || '标记通知为已读失败');
      console.error('标记通知为已读失败:', err);
    }
  }, []);

  // 标记所有通知为已读
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      
      // 更新本地状态
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
      
      // 重置未读数量
      setUnreadCount(0);
    } catch (err: any) {
      setError(err.message || '标记所有通知为已读失败');
      console.error('标记所有通知为已读失败:', err);
    }
  }, []);

  // 刷新所有数据
  const refresh = useCallback(async () => {
    await Promise.all([
      loadNotifications(),
      loadUnreadCount()
    ]);
  }, [loadNotifications, loadUnreadCount]);

  // 组件挂载时加载数据
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,
    refresh
  };
};
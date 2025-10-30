import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Notification } from '../types/notification';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../hooks/useAuth';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  loadNotifications: () => Promise<void>;
  loadUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
  updateUnreadCount: (count: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载通知列表
  const loadNotifications = useCallback(async () => {
    if (!user) return;
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
  }, [user]);

  // 加载未读数量
  const loadUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err: any) {
      console.error('加载未读数量失败:', err);
    }
  }, [user]);

  // 标记单个通知为已读
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
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
      setNotifications(prev => prev.map(notification => ({ ...notification, is_read: true })));
      setUnreadCount(0);
    } catch (err: any) {
      setError(err.message || '标记所有通知为已读失败');
      console.error('标记所有通知为已读失败:', err);
    }
  }, []);

  // 刷新所有数据
  const refresh = useCallback(async () => {
    await Promise.all([loadNotifications(), loadUnreadCount()]);
  }, [loadNotifications, loadUnreadCount]);

  // 更新未读数量（外部调用）
  const updateUnreadCount = useCallback((count: number) => {
    setUnreadCount(count);
  }, []);

  // 用户登录时加载数据，并设置定期刷新
  useEffect(() => {
    if (user) {
      refresh();
      
      // 每10秒刷新一次未读数量
      const interval = setInterval(loadUnreadCount, 10000);
      return () => clearInterval(interval);
    } else {
      // 用户登出时清空数据
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
    }
  }, [user]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    error,
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,
    refresh,
    updateUnreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
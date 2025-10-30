import { apiClient } from './apiClient';
import { Notification, NotificationResponse, CreateNotificationRequest } from '../types/notification';

export const notificationService = {
  /**
   * 获取用户通知列表
   */
  async getNotifications(params?: {
    isRead?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<NotificationResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.isRead !== undefined) {
      queryParams.append('isRead', params.isRead.toString());
    }
    if (params?.limit !== undefined) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params?.offset !== undefined) {
      queryParams.append('offset', params.offset.toString());
    }

    const response = await apiClient.get<{
      success: boolean;
      data: NotificationResponse;
    }>(`/notifications?${queryParams.toString()}`);
    
    return response.data.data;
  },

  /**
   * 获取未读通知数量
   */
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<{
      success: boolean;
      data: { unreadCount?: number; count?: number };
    }>(
      '/notifications/unread-count'
    );
    
    // 兼容后端返回字段名，优先使用 unreadCount
    const count = response.data.data.unreadCount ?? response.data.data.count ?? 0;
    return count;
  },

  /**
   * 标记通知为已读
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await apiClient.patch<{
      success: boolean;
      data: { notification: Notification };
    }>(`/notifications/${notificationId}/read`);
    
    return response.data.data.notification;
  },

  /**
   * 标记所有通知为已读
   */
  async markAllAsRead(): Promise<void> {
    await apiClient.patch('/notifications/read-all');
  },

  /**
   * 创建通知（内部使用）
   */
  async createNotification(data: CreateNotificationRequest): Promise<Notification> {
    const response = await apiClient.post<{
      success: boolean;
      data: { notification: Notification };
    }>('/notifications', data);
    
    return response.data.data.notification;
  },

  /**
   * 清理过期通知
   */
  async cleanupExpired(): Promise<void> {
    await apiClient.delete('/notifications/cleanup');
  }
};
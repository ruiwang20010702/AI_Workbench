export interface Notification {
  id: string;
  user_id: string;
  todo_id: string;
  type: 'one_day' | 'three_hours' | 'five_minutes' | 'immediate';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  todo_title?: string;
  todo_due_date?: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
  total: number;
}

export interface CreateNotificationRequest {
  todo_id: string;
  type: 'one_day' | 'three_hours' | 'five_minutes' | 'immediate';
  title: string;
  message: string;
}

export interface NotificationTypeConfig {
  type: 'one_day' | 'three_hours' | 'five_minutes' | 'immediate';
  label: string;
  timeOffset: number; // 毫秒
  icon: string;
  color: string;
}

export const NOTIFICATION_TYPES: NotificationTypeConfig[] = [
  {
    type: 'one_day',
    label: '1天前提醒',
    timeOffset: 24 * 60 * 60 * 1000,
    icon: '📅',
    color: 'text-blue-600'
  },
  {
    type: 'three_hours',
    label: '3小时前提醒',
    timeOffset: 3 * 60 * 60 * 1000,
    icon: '⏰',
    color: 'text-yellow-600'
  },
  {
    type: 'five_minutes',
    label: '5分钟前提醒',
    timeOffset: 5 * 60 * 1000,
    icon: '⚡',
    color: 'text-orange-600'
  },
  {
    type: 'immediate',
    label: '即时提醒',
    timeOffset: 0,
    icon: '🔔',
    color: 'text-red-600'
  }
];

export const getNotificationTypeConfig = (type: string): NotificationTypeConfig | undefined => {
  return NOTIFICATION_TYPES.find(config => config.type === type);
};
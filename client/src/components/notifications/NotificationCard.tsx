import React from 'react';
import { Clock } from 'lucide-react';
import { Notification, getNotificationTypeConfig } from '../../types/notification';

interface NotificationCardProps {
  notification: Notification;
  onClick: () => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onClick
}) => {
  const config = getNotificationTypeConfig(notification.type) ?? {
    type: 'immediate',
    label: '即时提醒',
    timeOffset: 0,
    icon: '🔔',
    color: 'text-gray-600'
  };
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return '刚刚';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}分钟前`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}小时前`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}天前`;
    }
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors relative ${
        !notification.is_read ? 'bg-blue-50' : ''
      }`}
    >
      {/* 未读指示器 */}
      {!notification.is_read && (
        <div className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full"></div>
      )}
      
      <div className="flex items-start space-x-3">
        {/* 图标 */}
        <div 
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100`}
        >
          <span className={`text-base ${config.color}`}>{config.icon}</span>
        </div>
        
        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-medium ${
            !notification.is_read ? 'text-gray-900' : 'text-gray-700'
          }`}>
            {notification.title}
          </h4>
          <p className={`text-sm mt-1 ${
            !notification.is_read ? 'text-gray-700' : 'text-gray-500'
          }`}>
            {notification.message}
          </p>
          <div className="flex items-center mt-2 text-xs text-gray-400">
            <Clock className="w-3 h-3 mr-1" />
            {formatTime(notification.created_at)}
          </div>
        </div>
      </div>
    </div>
  );
};
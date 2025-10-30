import React, { useEffect, useRef } from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import { Notification } from '../../types/notification';
import { NotificationCard } from './NotificationCard';
import { useNotificationContext } from '../../contexts/NotificationContext';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose
}) => {
  const { 
    notifications, 
    loading, 
    loadNotifications, 
    markAsRead, 
    markAllAsRead,
    unreadCount,
    loadUnreadCount
  } = useNotificationContext();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 处理通知卡片点击
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  // 点击外部关闭下拉框，同时在打开时刷新列表与未读数
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      loadNotifications();
      loadUnreadCount();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden"
    >
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">通知</h3>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <CheckCheck className="w-4 h-4" />
              <span>全部已读</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-500">加载中...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Bell className="w-12 h-12 mb-2 text-gray-300" />
            <p className="text-sm">暂无通知</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 底部 */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            通知将在已读后保存一周
          </p>
        </div>
      )}
    </div>
  );
};
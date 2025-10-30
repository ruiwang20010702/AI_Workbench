import React from 'react';
import { Clock, CheckCircle, Play, Circle, FileText, Calendar, MessageSquare } from 'lucide-react';
import { cn } from '../../utils/cn';

interface Activity {
  id: string;
  type: 'task_created' | 'task_completed' | 'task_updated' | 'project_created' | 'project_updated' | 'comment_added';
  title: string;
  description: string;
  user: string;
  timestamp: string;
  metadata?: {
    projectName?: string;
    taskTitle?: string;
    status?: string;
    priority?: string;
  };
}

interface RecentActivityProps {
  activities: Activity[];
  title?: string;
  maxItems?: number;
  className?: string;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  activities,
  title = "最近活动",
  maxItems = 10,
  className
}) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_created':
        return <Circle className="w-4 h-4 text-blue-600" />;
      case 'task_completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'task_updated':
        return <Play className="w-4 h-4 text-yellow-600" />;
      case 'project_created':
        return <FileText className="w-4 h-4 text-purple-600" />;
      case 'project_updated':
        return <Calendar className="w-4 h-4 text-orange-600" />;
      case 'comment_added':
        return <MessageSquare className="w-4 h-4 text-indigo-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'task_created':
        return 'bg-blue-50 border-blue-200';
      case 'task_completed':
        return 'bg-green-50 border-green-200';
      case 'task_updated':
        return 'bg-yellow-50 border-yellow-200';
      case 'project_created':
        return 'bg-purple-50 border-purple-200';
      case 'project_updated':
        return 'bg-orange-50 border-orange-200';
      case 'comment_added':
        return 'bg-indigo-50 border-indigo-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return '刚刚';
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}小时前`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}天前`;
    
    return time.toLocaleDateString('zh-CN');
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'task_created':
        return '创建了任务';
      case 'task_completed':
        return '完成了任务';
      case 'task_updated':
        return '更新了任务';
      case 'project_created':
        return '创建了项目';
      case 'project_updated':
        return '更新了项目';
      case 'comment_added':
        return '添加了评论';
      default:
        return '进行了操作';
    }
  };

  const displayActivities = activities.slice(0, maxItems);

  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <span className="text-sm text-gray-500">
          {displayActivities.length} 条活动
        </span>
      </div>

      {/* Activity List */}
      <div className="space-y-4">
        {displayActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-3" />
            <p>暂无活动记录</p>
          </div>
        ) : (
          displayActivities.map((activity, index) => (
            <div
              key={activity.id}
              className={cn(
                "flex items-start space-x-3 p-3 rounded-lg border transition-colors hover:shadow-sm",
                getActivityColor(activity.type)
              )}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon(activity.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-gray-900 text-sm">
                    {activity.user}
                  </span>
                  <span className="text-gray-600 text-sm">
                    {getTypeLabel(activity.type)}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>

                <h4 className="font-medium text-gray-900 text-sm mb-1 truncate">
                  {activity.title}
                </h4>

                {activity.description && (
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {activity.description}
                  </p>
                )}

                {/* Metadata */}
                {activity.metadata && (
                  <div className="flex items-center space-x-3 mt-2">
                    {activity.metadata.projectName && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <FileText className="w-3 h-3 mr-1" />
                        {activity.metadata.projectName}
                      </span>
                    )}
                    {activity.metadata.status && (
                      <span className={cn(
                        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                        activity.metadata.status === 'completed' ? 'bg-green-100 text-green-800' :
                        activity.metadata.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      )}>
                        {activity.metadata.status === 'completed' ? '已完成' :
                         activity.metadata.status === 'in_progress' ? '进行中' : '待处理'}
                      </span>
                    )}
                    {activity.metadata.priority && (
                      <span className={cn(
                        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                        activity.metadata.priority === 'high' ? 'bg-red-100 text-red-800' :
                        activity.metadata.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      )}>
                        {activity.metadata.priority === 'high' ? '高优先级' :
                         activity.metadata.priority === 'medium' ? '中优先级' : '低优先级'}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Timeline Connector */}
              {index < displayActivities.length - 1 && (
                <div className="absolute left-8 mt-8 w-px h-4 bg-gray-200" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Show More */}
      {activities.length > maxItems && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            查看更多活动 ({activities.length - maxItems} 条)
          </button>
        </div>
      )}

      {/* Quick Stats */}
      {activities.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {activities.filter(a => a.type.includes('task')).length}
              </p>
              <p className="text-xs text-gray-500">任务相关</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {activities.filter(a => a.type.includes('project')).length}
              </p>
              <p className="text-xs text-gray-500">项目相关</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
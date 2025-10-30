import React from 'react';
import { Calendar, Clock, User, Tag, AlertTriangle, CheckCircle, Circle, Play } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Task } from '../../services/taskService';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: string) => void;
  viewMode?: 'list' | 'kanban' | 'calendar';
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  viewMode = 'list'
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Play className="w-4 h-4 text-blue-600" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      default:
        return '低';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'in_progress':
        return '进行中';
      default:
        return '待处理';
    }
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
  const daysUntilDue = task.due_date ? Math.ceil((new Date(task.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    });
  };

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = task.status === 'pending' ? 'in_progress' : 
                      task.status === 'in_progress' ? 'completed' : 'pending';
    onStatusChange(task.id, nextStatus);
  };

  return (
    <div
      className={cn(
        "bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer",
        isOverdue && "border-red-300 bg-red-50",
        viewMode === 'kanban' && "mb-3"
      )}
      onClick={() => onEdit(task)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          <button
            onClick={handleStatusClick}
            className="mt-1 hover:scale-110 transition-transform"
          >
            {getStatusIcon(task.status)}
          </button>
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-medium text-gray-900 truncate",
              task.status === 'completed' && "line-through text-gray-500"
            )}>
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Priority Badge */}
        <span className={cn(
          "px-2 py-1 rounded-full text-xs font-medium border",
          getPriorityColor(task.priority)
        )}>
          {getPriorityLabel(task.priority)}
        </span>
      </div>

      {/* Status and Project */}
      <div className="flex items-center space-x-2 mb-3">
        <span className={cn(
          "px-2 py-1 rounded-full text-xs font-medium border",
          getStatusColor(task.status)
        )}>
          {getStatusLabel(task.status)}
        </span>
        {task.project_name && (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
            {task.project_name}
          </span>
        )}
      </div>

      {/* Meta Information */}
      <div className="space-y-2">
        {/* Due Date */}
        {task.due_date && (
          <div className={cn(
            "flex items-center space-x-2 text-sm",
            isOverdue ? "text-red-600" : "text-gray-600"
          )}>
            <Calendar className="w-4 h-4" />
            <span>{formatDate(task.due_date)}</span>
            {isOverdue && (
              <div className="flex items-center space-x-1 text-red-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-medium">逾期</span>
              </div>
            )}
            {!isOverdue && daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue >= 0 && (
              <span className="text-xs font-medium text-orange-600">
                {daysUntilDue === 0 ? '今天到期' : `${daysUntilDue}天后到期`}
              </span>
            )}
          </div>
        )}

        {/* Assignee */}
        {task.assignee_name && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>{task.assignee_name}</span>
          </div>
        )}

        {/* Estimated Hours */}
        {task.estimated_hours && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{task.estimated_hours}小时</span>
          </div>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-gray-400" />
            <div className="flex flex-wrap gap-1">
              {task.tags.slice(0, 3).map((tag: string, index: number) => (
                <span
                  key={index}
                  className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                >
                  {tag}
                </span>
              ))}
              {task.tags.length > 3 && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  +{task.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          创建于 {formatDate(task.created_at)}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            编辑
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('确定要删除这个任务吗？')) {
                onDelete(task.id);
              }
            }}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            删除
          </button>
        </div>
      </div>

      {/* Progress Bar for Kanban View */}
      {viewMode === 'kanban' && task.estimated_hours && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>进度</span>
            <span>{task.status === 'completed' ? '100%' : task.status === 'in_progress' ? '50%' : '0%'}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                task.status === 'completed' ? 'bg-green-500 w-full' :
                task.status === 'in_progress' ? 'bg-blue-500 w-1/2' : 'bg-gray-300 w-0'
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
};
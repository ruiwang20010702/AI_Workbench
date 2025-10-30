import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Task } from '../../services/projectService';
import { cn } from '../../utils/cn';
import { Calendar, User, Clock, Tag } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onStatusChange?: (task: Task, status: Task['status']) => void;
  className?: string;
  showProject?: boolean;
}

const statusColors = {
  todo: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
};

const statusLabels = {
  todo: '待办',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消'
};

const priorityLabels = {
  low: '低',
  medium: '中',
  high: '高'
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  className,
  showProject = false
}) => {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
  const daysUntilDue = task.due_date ? 
    Math.ceil((new Date(task.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                {task.description}
              </p>
            )}
            
            {/* 项目信息 */}
            {showProject && task.project && (
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <span>项目: {task.project.name}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <span className={cn(
              'px-2 py-1 text-xs font-medium rounded-full',
              statusColors[task.status]
            )}>
              {statusLabels[task.status]}
            </span>
            <span className={cn(
              'px-2 py-1 text-xs font-medium rounded-full',
              priorityColors[task.priority]
            )}>
              {priorityLabels[task.priority]}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* 标签 */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {task.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </span>
            ))}
            {task.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 bg-gray-50 text-gray-700 text-xs rounded-md">
                +{task.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* 任务信息 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* 负责人 */}
          {task.assignee && (
            <div className="flex items-center text-sm text-gray-600">
              <User className="w-4 h-4 mr-2" />
              <span>{task.assignee.name}</span>
            </div>
          )}

          {/* 截止日期 */}
          {task.due_date && (
            <div className={cn(
              'flex items-center text-sm',
              isOverdue ? 'text-red-600' : 'text-gray-600'
            )}>
              <Calendar className="w-4 h-4 mr-2" />
              <span>
                {new Date(task.due_date).toLocaleDateString()}
                {daysUntilDue !== null && (
                  <span className="ml-1">
                    ({daysUntilDue > 0 ? `${daysUntilDue}天后` : daysUntilDue === 0 ? '今天' : `逾期${Math.abs(daysUntilDue)}天`})
                  </span>
                )}
              </span>
            </div>
          )}

          {/* 预估工时 */}
          {task.estimated_hours && (
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              <span>预估 {task.estimated_hours}h</span>
            </div>
          )}

          {/* 实际工时 */}
          {task.actual_hours && (
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              <span>实际 {task.actual_hours}h</span>
            </div>
          )}
        </div>

        {/* 创建时间 */}
        <div className="text-xs text-gray-500 mb-4">
          创建时间: {new Date(task.created_at).toLocaleDateString()}
          {task.creator && (
            <span className="ml-2">创建者: {task.creator.name}</span>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {onStatusChange && task.status !== 'completed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(task, task.status === 'todo' ? 'in_progress' : 'completed')}
                className="text-green-600 hover:text-green-700 hover:border-green-300"
              >
                {task.status === 'todo' ? '开始' : '完成'}
              </Button>
            )}
            {onStatusChange && task.status === 'completed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(task, 'todo')}
                className="text-blue-600 hover:text-blue-700 hover:border-blue-300"
              >
                重新打开
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(task)}
              >
                编辑
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(task)}
                className="text-red-600 hover:text-red-700 hover:border-red-300"
              >
                删除
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
import React from 'react';
import { Plus, Circle, Play, CheckCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Task } from '../../services/taskService.ts';
import { TaskCard } from './TaskCard';

interface TaskKanbanBoardProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: string) => void;
  onCreateTask: (status?: string) => void;
}

export const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
  onCreateTask
}) => {
  const columns = [
    {
      id: 'pending',
      title: '待处理',
      icon: Circle,
      color: 'bg-gray-100 border-gray-300',
      headerColor: 'text-gray-700',
      tasks: tasks.filter(task => task.status === 'pending')
    },
    {
      id: 'in_progress',
      title: '进行中',
      icon: Play,
      color: 'bg-blue-50 border-blue-300',
      headerColor: 'text-blue-700',
      tasks: tasks.filter(task => task.status === 'in_progress')
    },
    {
      id: 'completed',
      title: '已完成',
      icon: CheckCircle,
      color: 'bg-green-50 border-green-300',
      headerColor: 'text-green-700',
      tasks: tasks.filter(task => task.status === 'completed')
    }
  ];

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(task));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    try {
      const taskData = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (taskData.id && taskData.status !== status) {
        onStatusChange(taskData.id, status);
      }
    } catch (error) {
      console.error('拖拽处理失败:', error);
    }
  };

  return (
    <div className="flex space-x-6 overflow-x-auto pb-6">
      {columns.map((column) => {
        const IconComponent = column.icon;
        return (
          <div
            key={column.id}
            className={cn(
              "flex-shrink-0 w-80 rounded-lg border-2 border-dashed p-4",
              column.color
            )}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <IconComponent className={cn("w-5 h-5", column.headerColor)} />
                <h3 className={cn("font-semibold", column.headerColor)}>
                  {column.title}
                </h3>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  column.headerColor === 'text-gray-700' ? 'bg-gray-200 text-gray-700' :
                  column.headerColor === 'text-blue-700' ? 'bg-blue-200 text-blue-700' :
                  'bg-green-200 text-green-700'
                )}>
                  {column.tasks.length}
                </span>
              </div>
              <button
                onClick={() => onCreateTask(column.id)}
                className={cn(
                  "p-1 rounded-full hover:bg-white/50 transition-colors",
                  column.headerColor
                )}
                title={`在${column.title}中创建任务`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Tasks */}
            <div className="space-y-3 min-h-[200px]">
              {column.tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <IconComponent className="w-8 h-8 mb-2" />
                  <p className="text-sm">暂无任务</p>
                  <button
                    onClick={() => onCreateTask(column.id)}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                  >
                    创建第一个任务
                  </button>
                </div>
              ) : (
                column.tasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    className="cursor-move"
                  >
                    <TaskCard
                      task={task}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onStatusChange={onStatusChange}
                      viewMode="kanban"
                    />
                  </div>
                ))
              )}
            </div>

            {/* Column Footer */}
            {column.tasks.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>总计: {column.tasks.length} 个任务</span>
                  {column.id !== 'completed' && (
                    <button
                      onClick={() => onCreateTask(column.id)}
                      className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>添加任务</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
import React, { useState } from 'react';
import { Plus, Circle, Play, CheckCircle, CheckSquare, Square, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Task } from '../../services/taskService.ts';
import { TaskCard } from './TaskCard';
import taskService from '../../services/taskService';
import toast from 'react-hot-toast';

interface TaskKanbanBoardProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: string) => void;
  onCreateTask: (status?: string) => void;
  onBatchUpdate?: () => void; // 新增：批量更新后的回调
}

export const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
  onCreateTask,
  onBatchUpdate
}) => {
  // 新增：批量选择状态
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isBatchMode, setIsBatchMode] = useState(false);
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

  // 新增：切换任务选择
  const toggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedTaskIds);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTaskIds(newSelected);
  };

  // 新增：全选/取消全选
  const toggleSelectAll = () => {
    if (selectedTaskIds.size === tasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(tasks.map(t => t.id)));
    }
  };

  // 新增：批量更新状态
  const handleBatchUpdateStatus = async (newStatus: Task['status']) => {
    if (selectedTaskIds.size === 0) {
      toast.error('请先选择任务');
      return;
    }

    const toastId = toast.loading(`正在更新 ${selectedTaskIds.size} 个任务...`);
    try {
      await taskService.batchUpdateTaskStatus(Array.from(selectedTaskIds), newStatus);
      toast.success(`成功更新 ${selectedTaskIds.size} 个任务状态`, { id: toastId });
      setSelectedTaskIds(new Set());
      setIsBatchMode(false);
      onBatchUpdate?.();
    } catch (error) {
      console.error('批量更新失败:', error);
      toast.error('批量更新失败', { id: toastId });
    }
  };

  // 新增：取消批量模式
  const cancelBatchMode = () => {
    setIsBatchMode(false);
    setSelectedTaskIds(new Set());
  };

  return (
    <div>
      {/* 新增：批量操作工具栏 */}
      {isBatchMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleSelectAll}
                className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900"
              >
                {selectedTaskIds.size === tasks.length ? (
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
                <span>
                  {selectedTaskIds.size === tasks.length ? '取消全选' : '全选'}
                  {selectedTaskIds.size > 0 && ` (已选 ${selectedTaskIds.size})`}
                </span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              {selectedTaskIds.size > 0 && (
                <>
                  <span className="text-sm text-gray-600 mr-2">批量操作：</span>
                  <button
                    onClick={() => handleBatchUpdateStatus('pending')}
                    className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700"
                  >
                    设为待处理
                  </button>
                  <button
                    onClick={() => handleBatchUpdateStatus('in_progress')}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    设为进行中
                  </button>
                  <button
                    onClick={() => handleBatchUpdateStatus('completed')}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                  >
                    设为已完成
                  </button>
                </>
              )}
              <button
                onClick={cancelBatchMode}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 flex items-center space-x-1"
              >
                <X className="w-4 h-4" />
                <span>取消</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新增：批量模式切换按钮 */}
      {!isBatchMode && tasks.length > 0 && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setIsBatchMode(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
          >
            <CheckSquare className="w-4 h-4" />
            <span>批量操作</span>
          </button>
        </div>
      )}

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
                    draggable={!isBatchMode}
                    onDragStart={(e) => handleDragStart(e, task)}
                    className={cn(
                      isBatchMode ? 'cursor-pointer' : 'cursor-move',
                      'relative'
                    )}
                  >
                    {/* 新增：批量模式复选框 */}
                    {isBatchMode && (
                      <div className="absolute top-2 left-2 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskSelection(task.id);
                          }}
                          className="w-6 h-6 flex items-center justify-center bg-white rounded border-2 hover:border-blue-500 shadow-sm"
                        >
                          {selectedTaskIds.has(task.id) ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    )}
                    <div
                      onClick={() => {
                        if (isBatchMode) {
                          toggleTaskSelection(task.id);
                        }
                      }}
                      className={cn(
                        isBatchMode && selectedTaskIds.has(task.id) && 'ring-2 ring-blue-500 rounded-lg'
                      )}
                  >
                    <TaskCard
                      task={task}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onStatusChange={onStatusChange}
                      viewMode="kanban"
                    />
                    </div>
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
    </div>
  );
};
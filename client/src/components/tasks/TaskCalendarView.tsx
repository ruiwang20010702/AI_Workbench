import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Plus, Clock } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Task } from '../../services/taskService.ts';
import { TaskCard } from './TaskCard';

interface TaskCalendarViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: string) => void;
  onCreateTask: (dueDate?: string) => void;
}

export const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
  onCreateTask
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 获取当前月份的日期信息
  const monthInfo = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return {
      year,
      month,
      firstDay,
      lastDay,
      days
    };
  }, [currentDate]);

  // 按日期分组任务
  const tasksByDate = useMemo(() => {
    const grouped: { [key: string]: Task[] } = {};
    
    tasks.forEach(task => {
      if (task.due_date) {
        const dateKey = new Date(task.due_date).toDateString();
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(task);
      }
    });
    
    return grouped;
  }, [tasks]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long'
    });
  };

  const getDayTasks = (date: Date) => {
    return tasksByDate[date.toDateString()] || [];
  };

  const getTaskCountByStatus = (tasks: Task[]) => {
    return {
      pending: tasks.filter(t => t.status === 'pending').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length
    };
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            {formatDate(currentDate)}
          </h2>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 rounded hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
            >
              今天
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-1 rounded hover:bg-gray-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <button
          onClick={() => onCreateTask()}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>创建任务</span>
        </button>
      </div>

      <div className="flex">
        {/* Calendar Grid */}
        <div className="flex-1 p-4">
          {/* Week Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {monthInfo.days.map((date, index) => {
              const dayTasks = getDayTasks(date);
              const taskCounts = getTaskCountByStatus(dayTasks);
              const isSelected = selectedDate?.toDateString() === date.toDateString();
              
              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-[120px] p-2 border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors",
                    !isCurrentMonth(date) && "bg-gray-50 text-gray-400",
                    isToday(date) && "bg-blue-50 border-blue-200",
                    isSelected && "ring-2 ring-blue-500"
                  )}
                  onClick={() => setSelectedDate(date)}
                >
                  {/* Date Number */}
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      "text-sm font-medium",
                      isToday(date) && "text-blue-600"
                    )}>
                      {date.getDate()}
                    </span>
                    {dayTasks.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateTask(date.toISOString().split('T')[0]);
                        }}
                        className="p-1 rounded hover:bg-white/50"
                      >
                        <Plus className="w-3 h-3 text-gray-400" />
                      </button>
                    )}
                  </div>

                  {/* Task Indicators */}
                  {dayTasks.length > 0 && (
                    <div className="space-y-1">
                      {/* Task Count Indicators */}
                      <div className="flex space-x-1">
                        {taskCounts.pending > 0 && (
                          <div className="w-2 h-2 rounded-full bg-gray-400" title={`${taskCounts.pending} 个待处理任务`} />
                        )}
                        {taskCounts.in_progress > 0 && (
                          <div className="w-2 h-2 rounded-full bg-blue-500" title={`${taskCounts.in_progress} 个进行中任务`} />
                        )}
                        {taskCounts.completed > 0 && (
                          <div className="w-2 h-2 rounded-full bg-green-500" title={`${taskCounts.completed} 个已完成任务`} />
                        )}
                      </div>

                      {/* Task Previews */}
                      {dayTasks.slice(0, 2).map((task) => (
                        <div
                          key={task.id}
                          className={cn(
                            "text-xs p-1 rounded truncate cursor-pointer",
                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(task);
                          }}
                          title={task.title}
                        >
                          {task.title}
                        </div>
                      ))}

                      {/* More Tasks Indicator */}
                      {dayTasks.length > 2 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayTasks.length - 2} 更多
                        </div>
                      )}
                    </div>
                  )}

                  {/* Empty State */}
                  {dayTasks.length === 0 && isCurrentMonth(date) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateTask(date.toISOString().split('T')[0]);
                      }}
                      className="w-full h-full flex items-center justify-center text-gray-300 hover:text-gray-400 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details */}
        {selectedDate && (
          <div className="w-80 border-l border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">
                {selectedDate.toLocaleDateString('zh-CN', {
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              {getDayTasks(selectedDate).length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Clock className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">这一天没有任务</p>
                  <button
                    onClick={() => onCreateTask(selectedDate.toISOString().split('T')[0])}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    创建任务
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {getDayTasks(selectedDate).length} 个任务
                    </span>
                    <button
                      onClick={() => onCreateTask(selectedDate.toISOString().split('T')[0])}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>添加</span>
                    </button>
                  </div>
                  {getDayTasks(selectedDate).map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onStatusChange={onStatusChange}
                      viewMode="calendar"
                    />
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
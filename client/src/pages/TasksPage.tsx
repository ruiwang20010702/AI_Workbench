import React, { useState, useEffect } from 'react';
import { Plus, Filter, Calendar, Tag, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskCreateModal } from '../components/tasks/TaskCreateModal';
import { TaskFilters as TaskFiltersComponent } from '../components/tasks/TaskFilters.tsx';
import taskService, { 
  type Task, 
  type CreateTaskRequest, 
  type TaskStats
} from '../services/taskService.ts';

type ViewMode = 'list' | 'kanban' | 'calendar';

// 本地UI过滤类型，匹配TaskFilters组件的结构
type UITaskFilters = {
  search: string;
  status: string[];
  priority: string[];
  assignee: string[];
  project: string[];
  tags: string[];
  dueDate: { start: string; end: string };
  overdue: boolean;
};

export const TasksPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>({
    total_tasks: 0,
    completed_tasks: 0,
    in_progress_tasks: 0,
    todo_tasks: 0,
    cancelled_tasks: 0,
    overdue_tasks: 0,
    upcoming_deadlines: 0,
    high_priority_tasks: 0,
    medium_priority_tasks: 0,
    low_priority_tasks: 0
  });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const [filters, setFilters] = useState<UITaskFilters>({
    search: '',
    status: [],
    priority: [],
    assignee: [],
    project: [],
    tags: [],
    dueDate: { start: '', end: '' },
    overdue: false
  });

  // 加载任务数据
  useEffect(() => {
    loadTasks();
    loadStats();
  }, [filters]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const params = {
        search: filters.search || undefined,
        status: filters.status.length > 0 ? filters.status.join(',') : undefined,
        priority: filters.priority.length > 0 ? filters.priority.join(',') : undefined,
        assignee_id: filters.assignee.length > 0 ? filters.assignee.join(',') : undefined,
        project_id: filters.project.length > 0 ? filters.project.join(',') : undefined,
        due_date_start: filters.dueDate.start || undefined,
        due_date_end: filters.dueDate.end || undefined,
        tags: filters.tags.length > 0 ? filters.tags : undefined
      };
      const response = await taskService.getTasks(params);
      let fetchedTasks: Task[] = response.tasks;
      if (filters.overdue) {
        const now = new Date();
        fetchedTasks = fetchedTasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'completed');
      }
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('加载任务失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await taskService.getTaskStats();
      setStats(statsData);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setShowCreateModal(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowCreateModal(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('确定要删除这个任务吗？此操作不可撤销。')) {
      try {
        await taskService.deleteTask(taskId);
        setTasks(prev => prev.filter(t => t.id !== taskId));
        await loadStats();
      } catch (error) {
        console.error('删除任务失败:', error);
        alert('删除任务失败，请稍后重试');
      }
    }
  };

  const handleStatusChange = async (taskId: string, status: Task['status']) => {
    try {
      await taskService.updateTask(taskId, { status });
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status } : t
      ));
      await loadStats();
    } catch (error) {
      console.error('更新任务状态失败:', error);
      alert('更新任务状态失败，请稍后重试');
    }
  };

  const handleTaskSubmit = async (taskData: CreateTaskRequest) => {
    try {
      if (editingTask) {
        // Update existing task
        const updatedTask = await taskService.updateTask(editingTask.id, taskData);
        setTasks(prev => prev.map(t => 
          t.id === editingTask.id ? updatedTask : t
        ));
      } else {
        // Create new task
        const newTask = await taskService.createTask(taskData);
        setTasks(prev => [...prev, newTask]);
      }
      
      setShowCreateModal(false);
      setEditingTask(null);
      await loadStats();
    } catch (error) {
      console.error('保存任务失败:', error);
      const err: any = error;
      const serverMsg = err?.response?.data?.error || err?.response?.data?.detail;
      alert(serverMsg ? `保存任务失败：${serverMsg}` : '保存任务失败，请稍后重试');
    }
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: [],
      priority: [],
      assignee: [],
      project: [],
      tags: [],
      dueDate: { start: '', end: '' },
      overdue: false
    });
  };

  // 按状态分组任务（用于看板视图）
  const tasksByStatus = {
    pending: tasks.filter(t => t.status === 'pending'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    completed: tasks.filter(t => t.status === 'completed')
  };

  const statusColumns = [
    { key: 'pending', title: '待处理', color: 'bg-gray-100', count: tasksByStatus.pending.length },
    { key: 'in_progress', title: '进行中', color: 'bg-blue-100', count: tasksByStatus.in_progress.length },
    { key: 'completed', title: '已完成', color: 'bg-green-100', count: tasksByStatus.completed.length }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">任务管理</h1>
              <p className="text-sm text-gray-600">管理和跟踪您的所有任务</p>
            </div>
            <button 
              onClick={handleCreateTask}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>创建任务</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total_tasks}</div>
              <div className="text-sm text-gray-600">总任务</div>
            </div>
            <div className="text-center">
               <div className="text-2xl font-bold text-yellow-600">{stats.todo_tasks}</div>
               <div className="text-sm text-gray-600">待处理</div>
             </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.in_progress_tasks}</div>
              <div className="text-sm text-gray-600">进行中</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed_tasks}</div>
              <div className="text-sm text-gray-600">已完成</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.overdue_tasks}</div>
              <div className="text-sm text-gray-600">已逾期</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.high_priority_tasks}</div>
              <div className="text-sm text-gray-600">高优先级</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <TaskFiltersComponent
              filters={filters}
              onFiltersChange={(next: UITaskFilters) => setFilters(next)}
              onClearFilters={handleClearFilters}
            />
          </div>

          {/* Tasks Content */}
          <div className="lg:col-span-3">
            {/* View Mode Selector */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  显示 {tasks.length} 个任务
                </span>
                {filters.overdue && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    仅显示逾期任务
                  </span>
                )}
              </div>

              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors",
                    viewMode === 'list'
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  <Filter className="w-4 h-4" />
                  <span>列表</span>
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={cn(
                    "flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors",
                    viewMode === 'kanban'
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  <Tag className="w-4 h-4" />
                  <span>看板</span>
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={cn(
                    "flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors",
                    viewMode === 'calendar'
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  <Calendar className="w-4 h-4" />
                  <span>日历</span>
                </button>
              </div>
            </div>

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">加载中...</p>
                  </div>
                ) : tasks.length > 0 ? (
                  tasks.map((task) => (
                    <TaskCard 
                       key={task.id} 
                       task={task}
                       onEdit={handleEditTask}
                       onDelete={handleDeleteTask}
                       onStatusChange={(id, s) => { void handleStatusChange(id, s as Task['status']); }}
                     />
                  ))
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Plus className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">还没有任务</h3>
                    <p className="text-gray-600 mb-4">创建您的第一个任务开始工作</p>
                    <button 
                      onClick={handleCreateTask}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      创建任务
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Kanban View */}
            {viewMode === 'kanban' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statusColumns.map((column) => (
                  <div key={column.key} className={cn("rounded-lg p-4", column.color)}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900">{column.title}</h3>
                      <span className="bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-600">
                        {column.count}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {tasksByStatus[column.key as keyof typeof tasksByStatus].map((task) => (
                        <TaskCard 
                           key={task.id} 
                           task={task}
                           viewMode="kanban"
                           onEdit={handleEditTask}
                           onDelete={handleDeleteTask}
                           onStatusChange={(id, s) => { void handleStatusChange(id, s as Task['status']); }}
                         />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Calendar View */}
            {viewMode === 'calendar' && (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">日历视图</h3>
                <p className="text-gray-600">日历视图功能正在开发中...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <TaskCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleTaskSubmit}
        editTask={editingTask}
      />
    </div>
  );
};
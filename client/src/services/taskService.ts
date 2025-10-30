import { apiClient } from './apiClient';

// 导入Task接口
export interface Task {
  id: string;
  title: string;
  description?: string;
  project_id: string;
  assignee_id?: string;
  creator_id: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled' | 'pending';
  priority: 'low' | 'medium' | 'high';
  start_date?: string;
  due_date?: string;
  tags?: string[];
  estimated_hours?: number;
  actual_hours?: number;
  created_at: string;
  updated_at: string;
  // 扩展属性 - 用于组件显示
  project_name?: string;
  assignee_name?: string;
  // 关联信息
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
  };
}

export interface TaskStats {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  todo_tasks: number;
  cancelled_tasks: number;
  overdue_tasks: number;
  upcoming_deadlines: number;
  high_priority_tasks: number;
  medium_priority_tasks: number;
  low_priority_tasks: number;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  assignee_id?: string;
  project_id?: string;
  due_date_start?: string;
  due_date_end?: string;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
}

export interface TaskResponse {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  project_id: string;
  assignee_id?: string;
  status?: 'todo' | 'in_progress' | 'completed' | 'cancelled' | 'pending';
  priority?: 'low' | 'medium' | 'high';
  start_date?: string;
  due_date?: string;
  tags?: string[];
  estimated_hours?: number;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  assignee_id?: string;
  status?: 'todo' | 'in_progress' | 'completed' | 'cancelled' | 'pending';
  priority?: 'low' | 'medium' | 'high';
  start_date?: string;
  due_date?: string;
  tags?: string[];
  estimated_hours?: number;
  actual_hours?: number;
}

// 获取任务列表
export const getTasks = async (filters: TaskFilters = {}): Promise<TaskResponse> => {
  try {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await apiClient.get(`/projects/tasks?${params.toString()}`);
    return adaptTaskResponse(response.data);
  } catch (error) {
    console.error('获取任务列表失败:', error);
    throw error;
  }
};

// 获取任务统计信息
export const getTaskStats = async (params?: { project_id?: string }): Promise<TaskStats> => {
  try {
    const response = await apiClient.get('/projects/tasks/stats', { params });
    return response.data;
  } catch (error) {
    console.error('获取任务统计失败:', error);
    throw error;
  }
};

// 创建任务
export const createTask = async (taskData: CreateTaskRequest): Promise<Task> => {
  try {
    const response = await apiClient.post(`/projects/${taskData.project_id}/tasks`, taskData);
    return normalizeTask(response.data);
  } catch (error) {
    console.error('创建任务失败:', error);
    throw error;
  }
};

// 更新任务
export const updateTask = async (taskId: string, taskData: UpdateTaskRequest): Promise<Task> => {
  try {
    const response = await apiClient.put(`/projects/tasks/${taskId}`, taskData);
    return normalizeTask(response.data);
  } catch (error) {
    console.error('更新任务失败:', error);
    throw error;
  }
};

// 删除任务
export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    await apiClient.delete(`/projects/tasks/${taskId}`);
  } catch (error) {
    console.error('删除任务失败:', error);
    throw error;
  }
};

// 获取单个任务详情
export const getTask = async (taskId: string): Promise<Task> => {
  try {
    const response = await apiClient.get(`/projects/tasks/${taskId}`);
    return normalizeTask(response.data);
  } catch (error) {
    console.error('获取任务详情失败:', error);
    throw error;
  }
};

// 批量更新任务状态
export const batchUpdateTaskStatus = async (taskIds: string[], status: string): Promise<void> => {
  try {
    await apiClient.put('/projects/tasks/batch/status', { task_ids: taskIds, status });
  } catch (error) {
    console.error('批量更新任务状态失败:', error);
    throw error;
  }
};

// 获取项目的任务列表
export const getProjectTasks = async (projectId: string, filters: TaskFilters = {}): Promise<TaskResponse> => {
  try {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await apiClient.get(`/projects/${projectId}/tasks?${params.toString()}`);
    return adaptTaskResponse(response.data);
  } catch (error) {
    console.error('获取项目任务列表失败:', error);
    throw error;
  }
};

export default {
  getTasks,
  getTaskStats,
  createTask,
  updateTask,
  deleteTask,
  getTask,
  batchUpdateTaskStatus,
  getProjectTasks,
};

// =============================
// 响应数据规范化（中⇄英 映射 + 结构统一）
// =============================

const normalizeStatus = (value?: string): Task['status'] => {
  switch (value) {
    case 'pending':
    case 'todo':
      return 'pending';
    case 'in_progress':
      return 'in_progress';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    case '待办':
      return 'pending';
    case '进行中':
      return 'in_progress';
    case '已完成':
      return 'completed';
    case '已取消':
      return 'cancelled';
    default:
      return 'pending';
  }
};

const normalizePriority = (value?: string): 'low' | 'medium' | 'high' => {
  switch (value) {
    case 'low':
      return 'low';
    case 'medium':
      return 'medium';
    case 'high':
      return 'high';
    case '低':
      return 'low';
    case '中':
      return 'medium';
    case '高':
      return 'high';
    default:
      return 'medium';
  }
};

const normalizeTask = (raw: any): Task => {
  return {
    id: String(raw.id),
    title: String(raw.title || ''),
    description: raw.description || '',
    project_id: String(raw.project_id),
    assignee_id: raw.assignee_id || undefined,
    creator_id: String(raw.creator_id || raw.creator?.id || ''),
    status: normalizeStatus(raw.status),
    priority: normalizePriority(raw.priority),
    start_date: raw.start_date || undefined,
    due_date: raw.due_date || undefined,
    tags: Array.isArray(raw.tags) ? raw.tags : (typeof raw.tags === 'string' ? raw.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []),
    estimated_hours: raw.estimated_hours ?? undefined,
    actual_hours: raw.actual_hours ?? undefined,
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),
    // 展示用扩展字段
    project_name: raw.project_name || raw.project?.name || undefined,
    assignee_name: raw.assignee_name || raw.assignee?.name || undefined,
    assignee: raw.assignee || undefined,
    creator: raw.creator || undefined,
    project: raw.project || undefined,
  };
};

const adaptTaskResponse = (data: any): TaskResponse => {
  if (Array.isArray(data)) {
    const tasks = data.map(normalizeTask);
    return { tasks, total: tasks.length, page: 1, limit: tasks.length };
  }
  if (data && Array.isArray(data.tasks)) {
    const tasks = data.tasks.map(normalizeTask);
    return {
      tasks,
      total: typeof data.total === 'number' ? data.total : tasks.length,
      page: typeof data.page === 'number' ? data.page : 1,
      limit: typeof data.limit === 'number' ? data.limit : tasks.length,
    };
  }
  // 兜底：尝试把单对象当成数组
  if (data && typeof data === 'object') {
    const maybeTask = normalizeTask(data);
    return { tasks: [maybeTask], total: 1, page: 1, limit: 1 };
  }
  return { tasks: [], total: 0, page: 1, limit: 0 };
};
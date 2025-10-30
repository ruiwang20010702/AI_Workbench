import { apiClient } from './apiClient';

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  tags?: string[];
}

export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  tags?: string[];
}

export interface TodosResponse {
  todos: Todo[];
  total: number;
  page: number;
  limit: number;
}

export interface GetTodosParams {
  page?: number;
  limit?: number;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

function unwrap<T = any>(data: any): T {
  // 后端统一返回 { success, message, data } 或直接返回数据
  if (data && typeof data === 'object' && 'data' in data) {
    return data.data as T;
  }
  return data as T;
}

// 将后端返回的蛇形命名与中文优先级转换为前端使用的结构
const toClientTodo = (apiTodo: any): Todo => {
  const p = apiTodo?.priority;
  let priority: 'low' | 'medium' | 'high' = 'medium';
  if (p === '高' || p === 'high') priority = 'high';
  else if (p === '中' || p === 'medium') priority = 'medium';
  else if (p === '低' || p === 'low') priority = 'low';

  return {
    id: apiTodo?.id,
    title: apiTodo?.title ?? '',
    description: apiTodo?.description ?? '',
    completed: !!(apiTodo?.completed ?? (apiTodo?.status === '已完成')),
    priority,
    dueDate: apiTodo?.due_date ?? apiTodo?.dueDate,
    tags: Array.isArray(apiTodo?.tags) ? apiTodo.tags : [],
    createdAt: apiTodo?.created_at ?? apiTodo?.createdAt,
    updatedAt: apiTodo?.updated_at ?? apiTodo?.updatedAt,
    userId: apiTodo?.user_id ?? apiTodo?.userId,
  };
};

// 将创建/更新请求转换为后端预期的蛇形命名
const toApiCreateBody = (body: CreateTodoRequest) => {
  const { dueDate, ...rest } = body;
  return {
    ...rest,
    ...(dueDate ? { due_date: dueDate } : {})
  };
};

const toApiUpdateBody = (body: UpdateTodoRequest) => {
  const { dueDate, ...rest } = body;
  return {
    ...rest,
    ...(dueDate !== undefined ? { due_date: body.dueDate } : {})
  };
};

export const todoService = {
  // 获取待办事项列表
  async getTodos(params: GetTodosParams = {}, signal?: AbortSignal): Promise<TodosResponse> {
    const response = await apiClient.get('/todos', { params, signal });
    const payload = unwrap<any>(response.data);

    // 两种可能结构：
    // 1) { todos: [], pagination: { total, page, limit } }
    // 2) { todos: [], total, page, limit }
    if (payload?.todos && payload?.pagination) {
      return {
        todos: payload.todos.map(toClientTodo),
        total: payload.pagination.total ?? payload.todos.length,
        page: payload.pagination.page ?? params.page ?? 1,
        limit: payload.pagination.limit ?? params.limit ?? 20,
      };
    }

    if (payload?.todos && typeof payload.total === 'number') {
      return {
        todos: payload.todos.map(toClientTodo),
        total: payload.total,
        page: payload.page ?? params.page ?? 1,
        limit: payload.limit ?? params.limit ?? 20,
      };
    }

    // 兜底：直接返回列表
    const list = Array.isArray(payload) ? payload : payload?.todos ?? [];
    return {
      todos: list.map(toClientTodo),
      total: payload?.total ?? (Array.isArray(list) ? list.length : 0),
      page: payload?.page ?? params.page ?? 1,
      limit: payload?.limit ?? params.limit ?? 20,
    };
  },

  // 获取单个待办事项
  async getTodo(id: string): Promise<Todo> {
    const response = await apiClient.get(`/todos/${id}`);
    const data = unwrap<any>(response.data);
    // 可能是 { todo } 或直接是 todo
    return toClientTodo(data?.todo ?? data);
  },

  // 创建待办事项
  async createTodo(body: CreateTodoRequest): Promise<Todo> {
    const response = await apiClient.post('/todos', toApiCreateBody(body));
    const data = unwrap<any>(response.data);
    return toClientTodo(data?.todo ?? data);
  },

  // 更新待办事项
  async updateTodo(id: string, body: UpdateTodoRequest): Promise<Todo> {
    const response = await apiClient.put(`/todos/${id}`, toApiUpdateBody(body));
    const data = unwrap<any>(response.data);
    return toClientTodo(data?.todo ?? data);
  },

  // 删除待办事项
  async deleteTodo(id: string): Promise<void> {
    await apiClient.delete(`/todos/${id}`);
  },

  // 切换完成状态
  async toggleComplete(id: string): Promise<Todo> {
    const response = await apiClient.patch(`/todos/${id}/toggle`);
    const data = unwrap<any>(response.data);
    return toClientTodo(data?.todo ?? data);
  },

  // 批量操作
  async batchUpdate(ids: string[], data: Partial<UpdateTodoRequest>): Promise<Todo[]> {
    const response = await apiClient.patch('/todos/batch', { ids, data });
    const payload = unwrap<any>(response.data);
    // 可能是 { todos } 或直接是数组
    const list = payload?.todos ?? payload ?? [];
    return (Array.isArray(list) ? list : []).map(toClientTodo);
  },

  async batchDelete(ids: string[]): Promise<void> {
    await apiClient.delete('/todos/batch', { data: { ids } });
  },

  // 统计信息
  async getStats(): Promise<any> {
    const response = await apiClient.get('/todos/stats');
    const payload = unwrap<any>(response.data);
    const raw = payload?.statistics ?? payload ?? {};
    const pending = (raw.pending ?? ((raw.not_started ?? 0) + (raw.in_progress ?? 0)));
    return { ...raw, pending } as any;
  },

  // 搜索待办事项
  async searchTodos(query: string, params: Omit<GetTodosParams, 'search'> = {}, signal?: AbortSignal): Promise<TodosResponse> {
    const response = await apiClient.get('/todos/search', {
      params: { q: query, ...params },
      signal
    });
    const payload = unwrap<any>(response.data);

    if (payload?.todos && typeof payload.total === 'number') {
      return {
        todos: (payload.todos || []).map(toClientTodo),
        total: payload.total,
        page: payload.page ?? params.page ?? 1,
        limit: payload.limit ?? params.limit ?? 20,
      };
    }

    // 兜底
    const list = payload?.todos ?? [];
    return {
      todos: (Array.isArray(list) ? list : []).map(toClientTodo),
      total: payload?.total ?? 0,
      page: payload?.page ?? params.page ?? 1,
      limit: payload?.limit ?? params.limit ?? 20,
    };
  },

  // 获取标签列表
  async getTags(): Promise<string[]> {
    const response = await apiClient.get('/todos/tags');
    const payload = unwrap<any>(response.data);
    return (payload?.tags ?? payload ?? []) as string[];
  },

  // 导出待办事项
  async exportTodos(format: 'json' | 'csv' = 'json'): Promise<Blob> {
    const response = await apiClient.get(`/todos/export?format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};
import { apiClient } from './apiClient';

export interface Note {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  tags?: string[];
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  tags?: string[];
  isFavorite?: boolean;
  isArchived?: boolean;
}

export interface NotesResponse {
  notes: Note[];
  total: number;
  page: number;
  limit: number;
}

// 将后端返回的蛇形命名转换为前端使用的驼峰命名
const toClientNote = (apiNote: any): Note => ({
  id: apiNote?.id,
  title: apiNote?.title ?? '',
  content: apiNote?.content ?? '',
  tags: Array.isArray(apiNote?.tags) ? apiNote.tags : [],
  isFavorite: !!apiNote?.is_favorite,
  isArchived: !!apiNote?.is_archived,
  createdAt: apiNote?.created_at ?? apiNote?.createdAt,
  updatedAt: apiNote?.updated_at ?? apiNote?.updatedAt,
});

export const noteService = {
  // 获取笔记列表
  getNotes: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    tags?: string[];
    isFavorite?: boolean;
    isArchived?: boolean;
  }): Promise<NotesResponse> => {
    const query = {
      page: params?.page,
      limit: params?.limit,
      search: params?.search,
      tags: params?.tags && params.tags.length > 0 ? params.tags.join(',') : undefined,
      is_favorite: params?.isFavorite,
      is_archived: params?.isArchived,
    };
    const response = await apiClient.get('/notes', { params: query });
    const data = response.data?.data;
    const pagination = data?.pagination || {};
    return {
      notes: Array.isArray(data?.notes) ? data.notes.map(toClientNote) : [],
      total: pagination.total ?? 0,
      page: pagination.page ?? (params?.page ?? 1),
      limit: pagination.limit ?? (params?.limit ?? 12),
    };
  },

  // 获取单个笔记
  getNote: async (id: string): Promise<Note> => {
    const response = await apiClient.get(`/notes/${id}`);
    return toClientNote(response.data?.data?.note);
  },

  // 创建笔记
  createNote: async (data: CreateNoteRequest): Promise<Note> => {
    try {
      const response = await apiClient.post('/notes', data);
      return toClientNote(response.data?.data?.note);
    } catch (error: any) {
      const message = error?.response?.data?.message || '创建笔记失败';
      throw new Error(message);
    }
  },

  // 更新笔记
  updateNote: async (id: string, data: UpdateNoteRequest): Promise<Note> => {
    try {
      const response = await apiClient.put(`/notes/${id}`, data);
      return toClientNote(response.data?.data?.note);
    } catch (error: any) {
      const message = error?.response?.data?.message || '更新笔记失败';
      throw new Error(message);
    }
  },

  // 删除笔记
  deleteNote: async (id: string): Promise<void> => {
    await apiClient.delete(`/notes/${id}`);
  },

  // 搜索笔记
  searchNotes: async (queryText: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<NotesResponse> => {
    const response = await apiClient.get('/notes/search', {
      params: { query: queryText, ...params }
    });
    const data = response.data?.data;
    return {
      notes: Array.isArray(data?.notes) ? data.notes.map(toClientNote) : [],
      total: data?.total ?? 0,
      page: params?.page ?? 1,
      limit: params?.limit ?? 12,
    };
  },



  // 切换收藏状态
  toggleFavorite: async (id: string): Promise<Note> => {
    const response = await apiClient.patch(`/notes/${id}/favorite`);
    return toClientNote(response.data?.data?.note);
  },

  // 切换归档状态
  toggleArchive: async (id: string): Promise<Note> => {
    const response = await apiClient.patch(`/notes/${id}/archive`);
    return toClientNote(response.data?.data?.note);
  },

  // 获取所有标签
  getTags: async (): Promise<string[]> => {
    const response = await apiClient.get('/notes/tags');
    return Array.isArray(response.data) ? response.data : [];
  },

  // 获取用户统计数据
  getStats: async (): Promise<{
    totalNotes: number;
    favoriteNotes: number;
    archivedNotes: number;
    totalTodos: number;
    completedTodos: number;
    aiUsage: number;
    notesGrowthPercent?: number;
    aiUsageGrowth?: number;
  }> => {
    const response = await apiClient.get('/notes/stats');
    return response.data?.data || {
      totalNotes: 0,
      favoriteNotes: 0,
      archivedNotes: 0,
      totalTodos: 0,
      completedTodos: 0,
      aiUsage: 0,
      notesGrowthPercent: 0,
      aiUsageGrowth: 0
    };
  }
};
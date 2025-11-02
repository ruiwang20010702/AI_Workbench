/**
 * Assistant API Service - 助手API服务
 */

import { apiClient as api } from './apiClient';

export interface Assistant {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  system_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssistantPreset {
  name: string;
  description: string;
  system_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
  icon?: string;
}

export interface CreateAssistantDto {
  name: string;
  description?: string;
  system_prompt: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  is_default?: boolean;
}

export interface UpdateAssistantDto {
  name?: string;
  description?: string;
  system_prompt?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  is_default?: boolean;
}

export interface MigrateConversationDto {
  targetAssistantId: string;
}

/**
 * 获取助手列表
 */
export const getAssistants = async (): Promise<Assistant[]> => {
  const response = await api.get('/assistants');
  return response.data.data.assistants;
};

/**
 * 获取预设模板
 */
export const getAssistantPresets = async (): Promise<AssistantPreset[]> => {
  const response = await api.get('/assistants/presets');
  return response.data.data.presets;
};

/**
 * 创建助手
 */
export const createAssistant = async (data: CreateAssistantDto): Promise<Assistant> => {
  const response = await api.post('/assistants', data);
  return response.data.data.assistant;
};

/**
 * 更新助手
 */
export const updateAssistant = async (id: string, data: UpdateAssistantDto): Promise<Assistant> => {
  const response = await api.put(`/assistants/${id}`, data);
  return response.data.data.assistant;
};

/**
 * 删除助手
 */
export const deleteAssistant = async (id: string): Promise<void> => {
  await api.delete(`/assistants/${id}`);
};

/**
 * 迁移对话到其他助手
 */
export const migrateConversation = async (data: MigrateConversationDto): Promise<void> => {
  await api.post('/assistants/migrate', data);
};


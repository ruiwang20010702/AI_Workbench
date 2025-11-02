/**
 * Topic API Service - 主题API服务
 */

import { apiClient as api } from './apiClient';

export interface Topic {
  id: string;
  assistant_id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
  last_message_at?: string;
}

export interface CreateTopicDto {
  title?: string;
}

export interface UpdateTopicDto {
  title: string;
}

/**
 * 获取助手的主题列表
 */
export const getTopics = async (assistantId: string): Promise<Topic[]> => {
  const response = await api.get(`/assistants/${assistantId}/topics`);
  return response.data.data.topics;
};

/**
 * 创建主题
 */
export const createTopic = async (assistantId: string, data?: CreateTopicDto): Promise<Topic> => {
  const response = await api.post(`/assistants/${assistantId}/topics`, data || {});
  return response.data.data.topic;
};

/**
 * 更新主题（重命名）
 */
export const updateTopic = async (id: string, data: UpdateTopicDto): Promise<Topic> => {
  const response = await api.put(`/topics/${id}`, data);
  return response.data.data.topic;
};

/**
 * 删除主题
 */
export const deleteTopic = async (id: string): Promise<void> => {
  await api.delete(`/topics/${id}`);
};

/**
 * 批量删除主题
 */
export const batchDeleteTopics = async (topicIds: string[]): Promise<number> => {
  const response = await api.delete('/topics/batch', {
    data: { topicIds }
  });
  return response.data.data.deletedCount;
};


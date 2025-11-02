/**
 * Message API Service - 消息API服务
 */

import { apiClient as api } from './apiClient';

export interface Message {
  id: string;
  topic_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  tokens?: number;
  created_at: string;
}

export interface SendMessageDto {
  content: string;
}

export interface ChatResponse {
  userMessage: Message;
  assistantMessage: Message;
}

export interface GetMessagesResponse {
  messages: Message[];
  total: number;
  hasMore: boolean;
}

/**
 * 获取主题的消息列表
 */
export const getMessages = async (
  topicId: string,
  limit: number = 50,
  offset: number = 0
): Promise<GetMessagesResponse> => {
  const response = await api.get(`/topics/${topicId}/messages`, {
    params: { limit, offset }
  });
  return response.data.data;
};

/**
 * 发送消息（对话）
 */
export const sendMessage = async (topicId: string, data: SendMessageDto): Promise<ChatResponse> => {
  const response = await api.post(`/topics/${topicId}/messages`, data);
  return response.data.data;
};


/**
 * 多助手系统 - 类型定义
 */

// ============================================
// 助手相关类型
// ============================================

export interface Assistant {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string;
  system_prompt: string;
  model_name: string | null;
  temperature: number;
  top_p: number;
  is_default: boolean;
  is_preset: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAssistantDto {
  name: string;
  description?: string;
  icon?: string;
  system_prompt: string;
  model_name?: string;
  temperature?: number;
  top_p?: number;
}

export interface UpdateAssistantDto {
  name?: string;
  description?: string;
  icon?: string;
  system_prompt?: string;
  model_name?: string;
  temperature?: number;
  top_p?: number;
  sort_order?: number;
}

export interface AssistantPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  system_prompt: string;
}

// ============================================
// 主题相关类型
// ============================================

export interface Topic {
  id: string;
  assistant_id: string;
  user_id: string;
  title: string;
  is_auto_title: boolean;
  message_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTopicDto {
  assistant_id: string;
  user_id: string;
  title?: string;
}

export interface UpdateTopicDto {
  title: string;
}

// ============================================
// 消息相关类型
// ============================================

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  topic_id: string;
  role: MessageRole;
  content: string;
  metadata: MessageMetadata;
  created_at: Date;
}

export interface MessageMetadata {
  intent?: string;
  dataSource?: string[];
  itemsFound?: number;
  tokensUsed?: number;
  [key: string]: any;
}

export interface CreateMessageDto {
  topic_id: string;
  role: MessageRole;
  content: string;
  metadata?: MessageMetadata;
}

// ============================================
// API响应类型
// ============================================

export interface MessageListResponse {
  messages: Message[];
  total: number;
  hasMore: boolean;
}

export interface SendMessageResponse {
  userMessage: Message;
  assistantMessage: Message;
  metadata: MessageMetadata;
}

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  defaultAssistant: Assistant;
}

// ============================================
// 上下文消息类型
// ============================================

export interface ContextMessage {
  role: MessageRole;
  content: string;
}

// ============================================
// 对话历史类型（用于迁移）
// ============================================

export interface Conversation {
  id: string;
  title: string;
  messages: {
    role: MessageRole;
    content: string;
    metadata?: any;
  }[];
  createdAt: Date;
  updatedAt: Date;
}


/**
 * Message Service - 消息服务层
 */

import { MessageModel } from '../models/Message';
import { TopicModel } from '../models/Topic';
import { Message, CreateMessageDto, MessageListResponse } from '../types/assistant';

export class MessageService {
  /**
   * 获取主题的消息列表（分页）
   */
  static async getTopicMessages(
    topicId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<MessageListResponse> {
    console.log('[MessageService.getTopicMessages] Parameters:', {
      topicId,
      userId,
      limit,
      offset
    });

    // 验证权限
    const topic = await TopicModel.findById(topicId);
    console.log('[MessageService.getTopicMessages] Topic found:', topic);
    
    if (!topic || topic.user_id !== userId) {
      console.error('[MessageService.getTopicMessages] Access denied:', {
        topicExists: !!topic,
        topicUserId: topic?.user_id,
        requestUserId: userId
      });
      throw new Error('Forbidden: You do not have access to this topic');
    }

    // 获取消息列表
    const { messages, total } = await MessageModel.findByTopicId(topicId, limit, offset);

    return {
      messages,
      total,
      hasMore: offset + messages.length < total
    };
  }

  /**
   * 创建用户消息
   */
  static async createUserMessage(topicId: string, content: string): Promise<Message> {
    return await MessageModel.create({
      topic_id: topicId,
      role: 'user',
      content,
      metadata: {}
    });
  }

  /**
   * 创建AI消息
   */
  static async createAssistantMessage(
    topicId: string,
    content: string,
    metadata?: any
  ): Promise<Message> {
    return await MessageModel.create({
      topic_id: topicId,
      role: 'assistant',
      content,
      metadata: metadata || {}
    });
  }

  /**
   * 获取最近的消息（用于构建上下文）
   */
  static async getRecentMessages(topicId: string, limit: number = 50): Promise<Message[]> {
    return await MessageModel.getRecentMessages(topicId, limit);
  }
}


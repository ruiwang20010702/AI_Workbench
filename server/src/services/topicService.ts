/**
 * Topic Service - 主题服务层
 */

import { TopicModel } from '../models/Topic';
import { MessageModel } from '../models/Message';
import { AssistantModel } from '../models/Assistant';
import { Topic, CreateTopicDto, UpdateTopicDto } from '../types/assistant';

export class TopicService {
  /**
   * 获取助手的主题列表
   */
  static async getAssistantTopics(assistantId: string, userId: string): Promise<Topic[]> {
    // 验证助手权限
    const assistant = await AssistantModel.findById(assistantId);
    if (!assistant || assistant.user_id !== userId) {
      throw new Error('Forbidden: You do not have access to this assistant');
    }

    return await TopicModel.findByAssistantId(assistantId);
  }

  /**
   * 根据ID获取主题
   */
  static async getTopicById(id: string, userId: string): Promise<Topic | null> {
    const topic = await TopicModel.findById(id);
    
    // 验证权限
    if (topic && topic.user_id !== userId) {
      throw new Error('Forbidden: You do not have access to this topic');
    }
    
    return topic;
  }

  /**
   * 创建主题
   */
  static async createTopic(
    assistantId: string,
    userId: string,
    title?: string
  ): Promise<Topic> {
    // 验证助手权限
    const assistant = await AssistantModel.findById(assistantId);
    if (!assistant || assistant.user_id !== userId) {
      throw new Error('Forbidden: You do not have access to this assistant');
    }

    // 创建主题
    return await TopicModel.create({
      assistant_id: assistantId,
      user_id: userId,
      title: title || '新对话'
    });
  }

  /**
   * 更新主题（重命名）
   */
  static async updateTopic(
    id: string,
    userId: string,
    data: UpdateTopicDto
  ): Promise<Topic> {
    // 验证权限
    const topic = await this.getTopicById(id, userId);
    if (!topic) {
      throw new Error('Topic not found');
    }

    // 验证输入
    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Topic title cannot be empty');
    }

    if (data.title.length > 200) {
      throw new Error('Topic title is too long (max 200 characters)');
    }

    return await TopicModel.update(id, data);
  }

  /**
   * 删除主题
   */
  static async deleteTopic(id: string, userId: string): Promise<void> {
    // 验证权限
    const topic = await this.getTopicById(id, userId);
    if (!topic) {
      throw new Error('Topic not found');
    }

    // 删除主题（会级联删除所有消息）
    await TopicModel.delete(id);
  }

  /**
   * 批量删除主题
   */
  static async batchDeleteTopics(ids: string[], userId: string): Promise<number> {
    // 验证所有主题的权限
    for (const id of ids) {
      const topic = await this.getTopicById(id, userId);
      if (!topic) {
        throw new Error(`Topic not found: ${id}`);
      }
    }

    // 批量删除
    return await TopicModel.batchDelete(ids);
  }

  /**
   * 自动生成主题标题
   */
  static async generateTitle(firstMessage: string): Promise<string> {
    // 策略1: 如果消息很短（<20字），直接使用
    if (firstMessage.length <= 20) {
      return firstMessage;
    }

    // 策略2: 提取前20字 + "..."
    if (firstMessage.length <= 50) {
      return firstMessage.substring(0, 20) + '...';
    }

    // 策略3: 使用AI生成简洁标题（可选，这里使用简单策略）
    // TODO: 可以调用AI生成更好的标题
    return firstMessage.substring(0, 20) + '...';
  }

  /**
   * 更新主题标题（如果是自动生成的）
   */
  static async updateTitleIfAuto(topicId: string, firstMessage: string): Promise<void> {
    const topic = await TopicModel.findById(topicId);
    if (!topic) {
      return;
    }

    // 只有自动生成的标题才更新
    if (topic.is_auto_title) {
      const newTitle = await this.generateTitle(firstMessage);
      await TopicModel.update(topicId, { title: newTitle });
    }
  }

  /**
   * 更新消息计数
   */
  static async updateMessageCount(topicId: string): Promise<void> {
    const count = await MessageModel.countByTopicId(topicId);
    await TopicModel.updateMessageCount(topicId, count);
  }

  /**
   * 更新主题的更新时间
   */
  static async touchTopic(topicId: string): Promise<void> {
    await TopicModel.touch(topicId);
  }
}


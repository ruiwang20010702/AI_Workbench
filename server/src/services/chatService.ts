/**
 * Chat Service - 对话服务层
 * 整合意图识别、数据检索、AI生成的完整对话流程
 */

import { MessageService } from './messageService';
import { TopicService } from './topicService';
import { ContextManager } from './contextManager';
import { AssistantModel } from '../models/Assistant';
import { TopicModel } from '../models/Topic';
import { MessageModel } from '../models/Message';
import { IntentService } from './intentService';
import { AIService } from './aiService';
import { SendMessageResponse, ContextMessage } from '../types/assistant';
import { supabaseAdmin } from '../config/supabase';

export class ChatService {
  /**
   * 处理对话的完整流程
   */
  static async chat(
    topicId: string,
    userId: string,
    userMessage: string
  ): Promise<SendMessageResponse> {
    // 1. 获取主题和助手信息
    const topic = await TopicModel.findById(topicId);
    if (!topic || topic.user_id !== userId) {
      throw new Error('Forbidden: You do not have access to this topic');
    }

    const assistant = await AssistantModel.findById(topic.assistant_id);
    if (!assistant) {
      throw new Error('Assistant not found');
    }

    // 2. 创建用户消息
    const userMsg = await MessageService.createUserMessage(topicId, userMessage);

    // 3. 意图识别
    let intent: any = { type: 'general', filters: {} };
    let retrievedData: any = null;

    try {
      intent = await IntentService.recognizeIntent(userMessage);

      // 4. 数据检索（如果需要）
      if (intent.type !== 'general') {
        retrievedData = await this.retrieveData(intent, userId);
      }
    } catch (error) {
      console.error('Intent recognition or data retrieval failed:', error);
      // 降级为通用对话
      intent = { type: 'general', filters: {} };
    }

    // 5. 构建上下文
    const context = await ContextManager.buildContext(topicId, assistant, retrievedData);

    // 6. 调用AI生成回答
    const aiResponse = await this.generateAIResponse(context, assistant);

    // 7. 创建AI消息
    const assistantMsg = await MessageService.createAssistantMessage(
      topicId,
      aiResponse.content,
      {
        intent: intent.type,
        dataSource: retrievedData?.sources || [],
        itemsFound: retrievedData?.count || 0,
        tokensUsed: aiResponse.usage?.total_tokens || 0
      }
    );

    // 8. 更新主题
    await TopicService.updateMessageCount(topicId);
    await TopicService.touchTopic(topicId);

    // 9. 如果是第一条消息，自动生成标题
    const messageCount = await MessageModel.countByTopicId(topicId);
    if (messageCount === 2) {
      // 只有用户消息和AI消息，说明是第一轮对话
      await TopicService.updateTitleIfAuto(topicId, userMessage);
    }

    // 10. 记录使用日志
    await this.logUsage(userId, aiResponse);

    return {
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      metadata: assistantMsg.metadata
    };
  }

  /**
   * 数据检索
   */
  private static async retrieveData(intent: any, userId: string): Promise<any> {
    const items: any[] = [];
    const sources: string[] = [];

    try {
      // 根据意图类型检索数据
      switch (intent.type) {
        case 'query_notes':
          const notes = await this.queryNotes(userId, intent.filters);
          items.push(...notes);
          sources.push('notes');
          break;

        case 'query_projects':
          const projects = await this.queryProjects(userId, intent.filters);
          items.push(...projects);
          sources.push('projects');
          break;

        case 'query_todos':
          const todos = await this.queryTodos(userId, intent.filters);
          items.push(...todos);
          sources.push('todos');
          break;

        case 'statistics':
          // 统计查询，可能涉及多个数据源
          const stats = await this.queryStatistics(userId, intent.filters);
          items.push(stats);
          sources.push('statistics');
          break;
      }
    } catch (error) {
      console.error('Data retrieval error:', error);
    }

    return {
      items,
      sources,
      count: items.length
    };
  }

  /**
   * 查询笔记
   */
  private static async queryNotes(userId: string, filters: any): Promise<any[]> {
    let query = supabaseAdmin
      .from('notes')
      .select('*')
      .eq('user_id', userId);

    // 应用过滤条件
    if (filters.keyword) {
      query = query.or(`title.ilike.%${filters.keyword}%,content.ilike.%${filters.keyword}%`);
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    // 限制返回数量
    query = query.limit(10);

    const { data, error } = await query;

    if (error) {
      console.error('Query notes error:', error);
      return [];
    }

    return data || [];
  }

  /**
   * 查询项目
   */
  private static async queryProjects(userId: string, filters: any): Promise<any[]> {
    let query = supabaseAdmin
      .from('projects')
      .select('*')
      .eq('owner_id', userId);

    // 应用过滤条件
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters.keyword) {
      query = query.or(`name.ilike.%${filters.keyword}%,description.ilike.%${filters.keyword}%`);
    }

    // 限制返回数量
    query = query.limit(10);

    const { data, error } = await query;

    if (error) {
      console.error('Query projects error:', error);
      return [];
    }

    return data || [];
  }

  /**
   * 查询待办
   */
  private static async queryTodos(userId: string, filters: any): Promise<any[]> {
    let query = supabaseAdmin
      .from('todos')
      .select('*')
      .eq('user_id', userId);

    // 应用过滤条件
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters.keyword) {
      query = query.or(`title.ilike.%${filters.keyword}%,description.ilike.%${filters.keyword}%`);
    }

    // 限制返回数量
    query = query.limit(10);

    const { data, error } = await query;

    if (error) {
      console.error('Query todos error:', error);
      return [];
    }

    return data || [];
  }

  /**
   * 查询统计信息
   */
  private static async queryStatistics(userId: string, filters: any): Promise<any> {
    const stats: any = {};

    try {
      // 笔记统计
      const { count: notesCount } = await supabaseAdmin
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      stats.notesCount = notesCount || 0;

      // 项目统计
      const { count: projectsCount } = await supabaseAdmin
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId);
      stats.projectsCount = projectsCount || 0;

      // 待办统计
      const { count: todosCount } = await supabaseAdmin
        .from('todos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      stats.todosCount = todosCount || 0;

      // 完成的待办统计
      const { count: completedTodosCount } = await supabaseAdmin
        .from('todos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed');
      stats.completedTodosCount = completedTodosCount || 0;
    } catch (error) {
      console.error('Query statistics error:', error);
    }

    return stats;
  }

  /**
   * 生成AI回答
   */
  private static async generateAIResponse(
    context: ContextMessage[],
    assistant: any
  ): Promise<any> {
    try {
      console.log('[ChatService.generateAIResponse] 开始生成AI回复');
      console.log('[ChatService.generateAIResponse] Assistant配置:', {
        model: assistant.model_name,
        temperature: assistant.temperature,
        top_p: assistant.top_p
      });
      
      // 构建消息列表
      const messages = context.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      console.log('[ChatService.generateAIResponse] 消息数量:', messages.length);

      // 调用AI服务
      console.log('[ChatService.generateAIResponse] 调用 AIService.chatCompletion...');
      const response = await AIService.chatCompletion({
        messages,
        model: assistant.model_name || undefined,
        temperature: assistant.temperature,
        top_p: assistant.top_p,
        max_tokens: 2000
      });

      console.log('[ChatService.generateAIResponse] AI回复成功:', {
        contentLength: response.content.length,
        model: response.model
      });

      return {
        content: response.content,
        usage: response.usage,
        model: response.model
      };
    } catch (error: any) {
      console.error('[ChatService.generateAIResponse] AI generation error:', error);
      console.error('[ChatService.generateAIResponse] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(`AI生成失败: ${error.message}`);
    }
  }

  /**
   * 记录使用日志
   */
  private static async logUsage(userId: string, aiResponse: any): Promise<void> {
    try {
      const usage = aiResponse.usage || {};
      const inputTokens = usage.prompt_tokens || 0;
      const outputTokens = usage.completion_tokens || 0;

      // 计算成本（假设每1000 tokens = 0.01元 = 1分）
      const costCents = Math.ceil((inputTokens + outputTokens) / 1000);

      await supabaseAdmin
        .from('ai_usage_logs')
        .insert({
          user_id: userId,
          action_type: 'assistant_chat',
          model_name: aiResponse.model || 'unknown',
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          cost_cents: costCents
        });
    } catch (error) {
      console.error('Log usage error:', error);
      // 不抛出错误，避免影响主流程
    }
  }
}


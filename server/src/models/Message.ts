/**
 * Message Model - 消息数据模型
 */

import { supabaseAdmin } from '../config/supabase';
import { Message, CreateMessageDto } from '../types/assistant';

export class MessageModel {
  /**
   * 根据主题ID查找消息列表（分页）
   */
  static async findByTopicId(
    topicId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ messages: Message[]; total: number }> {
    // 获取总数
    const { count } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('topic_id', topicId);

    // 获取消息列表
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    return {
      messages: data || [],
      total: count || 0
    };
  }

  /**
   * 根据ID查找消息
   */
  static async findById(id: string): Promise<Message | null> {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // 未找到
      }
      throw new Error(`Failed to fetch message: ${error.message}`);
    }

    return data;
  }

  /**
   * 创建消息
   */
  static async create(data: CreateMessageDto): Promise<Message> {
    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert({
        topic_id: data.topic_id,
        role: data.role,
        content: data.content,
        metadata: data.metadata || {}
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create message: ${error.message}`);
    }

    return message;
  }

  /**
   * 统计主题的消息数量
   */
  static async countByTopicId(topicId: string): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('topic_id', topicId);

    if (error) {
      throw new Error(`Failed to count messages: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * 获取主题的最近N条消息
   */
  static async getRecentMessages(topicId: string, limit: number = 50): Promise<Message[]> {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch recent messages: ${error.message}`);
    }

    // 反转顺序，使其按时间正序排列
    return (data || []).reverse();
  }

  /**
   * 删除主题的所有消息
   */
  static async deleteByTopicId(topicId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('messages')
      .delete()
      .eq('topic_id', topicId);

    if (error) {
      throw new Error(`Failed to delete messages: ${error.message}`);
    }
  }

  /**
   * 获取主题的第一条用户消息
   */
  static async getFirstUserMessage(topicId: string): Promise<Message | null> {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('topic_id', topicId)
      .eq('role', 'user')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // 未找到
      }
      throw new Error(`Failed to fetch first user message: ${error.message}`);
    }

    return data;
  }
}


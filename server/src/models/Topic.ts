/**
 * Topic Model - 主题数据模型
 */

import { supabaseAdmin } from '../config/supabase';
import { Topic, CreateTopicDto, UpdateTopicDto } from '../types/assistant';

export class TopicModel {
  /**
   * 根据助手ID查找主题列表
   */
  static async findByAssistantId(assistantId: string): Promise<Topic[]> {
    const { data, error } = await supabaseAdmin
      .from('topics')
      .select('*')
      .eq('assistant_id', assistantId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch topics: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 根据ID查找主题
   */
  static async findById(id: string): Promise<Topic | null> {
    console.log('[TopicModel.findById] Looking for topic with ID:', id);
    console.log('[TopicModel.findById] ID type:', typeof id);
    
    const { data, error } = await supabaseAdmin
      .from('topics')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[TopicModel.findById] Error:', error);
      if (error.code === 'PGRST116') {
        return null; // 未找到
      }
      throw new Error(`Failed to fetch topic: ${error.message}`);
    }

    console.log('[TopicModel.findById] Topic found:', data);
    return data;
  }

  /**
   * 创建主题
   */
  static async create(data: CreateTopicDto): Promise<Topic> {
    const { data: topic, error } = await supabaseAdmin
      .from('topics')
      .insert({
        assistant_id: data.assistant_id,
        user_id: data.user_id,
        title: data.title || '新对话',
        is_auto_title: !data.title, // 如果没有提供标题，标记为自动生成
        message_count: 0
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create topic: ${error.message}`);
    }

    return topic;
  }

  /**
   * 更新主题
   */
  static async update(id: string, data: UpdateTopicDto): Promise<Topic> {
    const { data: topic, error } = await supabaseAdmin
      .from('topics')
      .update({
        title: data.title,
        is_auto_title: false // 手动更新标题后，标记为非自动生成
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update topic: ${error.message}`);
    }

    return topic;
  }

  /**
   * 更新消息计数
   */
  static async updateMessageCount(id: string, count: number): Promise<void> {
    const { error } = await supabaseAdmin
      .from('topics')
      .update({ message_count: count })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update message count: ${error.message}`);
    }
  }

  /**
   * 增加消息计数
   */
  static async incrementMessageCount(id: string): Promise<void> {
    // 使用RPC函数更安全，但这里用简单的方式
    const topic = await this.findById(id);
    if (topic) {
      await this.updateMessageCount(id, topic.message_count + 1);
    }
  }

  /**
   * 更新updated_at时间戳
   */
  static async touch(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('topics')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to touch topic: ${error.message}`);
    }
  }

  /**
   * 删除主题
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('topics')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete topic: ${error.message}`);
    }
  }

  /**
   * 批量删除主题
   */
  static async batchDelete(ids: string[]): Promise<number> {
    const { error, count } = await supabaseAdmin
      .from('topics')
      .delete({ count: 'exact' })
      .in('id', ids);

    if (error) {
      throw new Error(`Failed to batch delete topics: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * 统计助手的主题数量
   */
  static async countByAssistantId(assistantId: string): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('topics')
      .select('*', { count: 'exact', head: true })
      .eq('assistant_id', assistantId);

    if (error) {
      throw new Error(`Failed to count topics: ${error.message}`);
    }

    return count || 0;
  }
}


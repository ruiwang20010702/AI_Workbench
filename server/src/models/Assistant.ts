/**
 * Assistant Model - 助手数据模型
 */

import { supabaseAdmin } from '../config/supabase';
import { Assistant, CreateAssistantDto, UpdateAssistantDto } from '../types/assistant';

export class AssistantModel {
  /**
   * 根据用户ID查找助手列表
   */
  static async findByUserId(userId: string): Promise<Assistant[]> {
    const { data, error } = await supabaseAdmin
      .from('assistants')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch assistants: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 根据ID查找助手
   */
  static async findById(id: string): Promise<Assistant | null> {
    const { data, error } = await supabaseAdmin
      .from('assistants')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // 未找到
      }
      throw new Error(`Failed to fetch assistant: ${error.message}`);
    }

    return data;
  }

  /**
   * 创建助手
   */
  static async create(data: CreateAssistantDto & { user_id: string }): Promise<Assistant> {
    const { data: assistant, error } = await supabaseAdmin
      .from('assistants')
      .insert({
        user_id: data.user_id,
        name: data.name,
        description: data.description || null,
        icon: data.icon || '🤖',
        system_prompt: data.system_prompt,
        model_name: data.model_name || null,
        temperature: data.temperature ?? 0.70,
        top_p: data.top_p ?? 0.90,
        is_default: false,
        is_preset: false,
        sort_order: 0
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create assistant: ${error.message}`);
    }

    return assistant;
  }

  /**
   * 更新助手
   */
  static async update(id: string, data: UpdateAssistantDto): Promise<Assistant> {
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.system_prompt !== undefined) updateData.system_prompt = data.system_prompt;
    if (data.model_name !== undefined) updateData.model_name = data.model_name;
    if (data.temperature !== undefined) updateData.temperature = data.temperature;
    if (data.top_p !== undefined) updateData.top_p = data.top_p;
    if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;

    const { data: assistant, error } = await supabaseAdmin
      .from('assistants')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update assistant: ${error.message}`);
    }

    return assistant;
  }

  /**
   * 删除助手
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('assistants')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete assistant: ${error.message}`);
    }
  }

  /**
   * 统计用户的助手数量
   */
  static async countByUserId(userId: string): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('assistants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to count assistants: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * 查找用户的默认助手
   */
  static async findDefaultByUserId(userId: string): Promise<Assistant | null> {
    const { data, error } = await supabaseAdmin
      .from('assistants')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // 未找到
      }
      throw new Error(`Failed to fetch default assistant: ${error.message}`);
    }

    return data;
  }

  /**
   * 设置默认助手
   */
  static async setDefault(id: string, userId: string): Promise<void> {
    // 1. 先取消所有默认助手
    await supabaseAdmin
      .from('assistants')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true);

    // 2. 设置新的默认助手
    const { error } = await supabaseAdmin
      .from('assistants')
      .update({ is_default: true })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to set default assistant: ${error.message}`);
    }
  }
}


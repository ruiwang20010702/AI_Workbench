/**
 * Assistant Service - 助手服务层
 */

import { AssistantModel } from '../models/Assistant';
import { TopicModel } from '../models/Topic';
import { Assistant, CreateAssistantDto, UpdateAssistantDto, AssistantPreset } from '../types/assistant';
import { ASSISTANT_PRESETS, getPresetById } from '../constants/assistantPresets';

export class AssistantService {
  // 助手数量限制
  private static readonly MAX_ASSISTANTS = 50;

  /**
   * 获取用户的助手列表
   */
  static async getUserAssistants(userId: string): Promise<Assistant[]> {
    return await AssistantModel.findByUserId(userId);
  }

  /**
   * 根据ID获取助手
   */
  static async getAssistantById(id: string, userId: string): Promise<Assistant | null> {
    const assistant = await AssistantModel.findById(id);
    
    // 验证权限
    if (assistant && assistant.user_id !== userId) {
      throw new Error('Forbidden: You do not have access to this assistant');
    }
    
    return assistant;
  }

  /**
   * 创建助手
   */
  static async createAssistant(userId: string, data: CreateAssistantDto): Promise<Assistant> {
    // 检查数量限制
    const count = await AssistantModel.countByUserId(userId);
    if (count >= this.MAX_ASSISTANTS) {
      throw new Error(`Cannot create more than ${this.MAX_ASSISTANTS} assistants`);
    }

    // 验证输入
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Assistant name is required');
    }

    if (!data.system_prompt || data.system_prompt.trim().length < 10) {
      throw new Error('System prompt must be at least 10 characters');
    }

    // 验证参数范围
    if (data.temperature !== undefined && (data.temperature < 0 || data.temperature > 2)) {
      throw new Error('Temperature must be between 0 and 2');
    }

    if (data.top_p !== undefined && (data.top_p < 0 || data.top_p > 1)) {
      throw new Error('Top P must be between 0 and 1');
    }

    // 创建助手
    return await AssistantModel.create({
      ...data,
      user_id: userId
    });
  }

  /**
   * 从预设模板创建助手
   */
  static async createFromPreset(userId: string, presetId: string): Promise<Assistant> {
    const preset = getPresetById(presetId);
    if (!preset) {
      throw new Error('Preset not found');
    }

    return await this.createAssistant(userId, {
      name: preset.name,
      description: preset.description,
      icon: preset.icon,
      system_prompt: preset.system_prompt
    });
  }

  /**
   * 更新助手
   */
  static async updateAssistant(
    id: string,
    userId: string,
    data: UpdateAssistantDto
  ): Promise<Assistant> {
    // 验证权限
    const assistant = await this.getAssistantById(id, userId);
    if (!assistant) {
      throw new Error('Assistant not found');
    }

    // 验证输入
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new Error('Assistant name cannot be empty');
    }

    if (data.system_prompt !== undefined && data.system_prompt.trim().length < 10) {
      throw new Error('System prompt must be at least 10 characters');
    }

    // 验证参数范围
    if (data.temperature !== undefined && (data.temperature < 0 || data.temperature > 2)) {
      throw new Error('Temperature must be between 0 and 2');
    }

    if (data.top_p !== undefined && (data.top_p < 0 || data.top_p > 1)) {
      throw new Error('Top P must be between 0 and 1');
    }

    return await AssistantModel.update(id, data);
  }

  /**
   * 删除助手
   */
  static async deleteAssistant(id: string, userId: string): Promise<void> {
    // 验证权限
    const assistant = await this.getAssistantById(id, userId);
    if (!assistant) {
      throw new Error('Assistant not found');
    }

    // 检查是否有主题
    const topicCount = await TopicModel.countByAssistantId(id);
    if (topicCount > 0) {
      // 可以选择：
      // 1. 禁止删除（需要先删除所有主题）
      // 2. 级联删除（数据库外键已设置CASCADE）
      // 这里选择级联删除，数据库会自动删除相关主题和消息
    }

    await AssistantModel.delete(id);
  }

  /**
   * 初始化默认助手
   */
  static async initializeDefaultAssistant(userId: string): Promise<Assistant> {
    // 检查是否已有默认助手
    const existingDefault = await AssistantModel.findDefaultByUserId(userId);
    if (existingDefault) {
      return existingDefault;
    }

    // 创建默认助手（使用通用助手模板）
    const generalPreset = getPresetById('general');
    if (!generalPreset) {
      throw new Error('General preset not found');
    }

    const assistant = await AssistantModel.create({
      user_id: userId,
      name: generalPreset.name,
      description: generalPreset.description,
      icon: generalPreset.icon,
      system_prompt: generalPreset.system_prompt,
      temperature: 0.70,
      top_p: 0.90
    });

    // 设置为默认助手
    await AssistantModel.setDefault(assistant.id, userId);

    return assistant;
  }

  /**
   * 获取预设模板列表
   */
  static getPresets(): AssistantPreset[] {
    return ASSISTANT_PRESETS;
  }

  /**
   * 设置默认助手
   */
  static async setDefaultAssistant(id: string, userId: string): Promise<void> {
    // 验证权限
    const assistant = await this.getAssistantById(id, userId);
    if (!assistant) {
      throw new Error('Assistant not found');
    }

    await AssistantModel.setDefault(id, userId);
  }
}


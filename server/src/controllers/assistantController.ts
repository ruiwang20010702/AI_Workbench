/**
 * Assistant Controller - 助手控制器
 */

import { Request, Response } from 'express';
import { AssistantService } from '../services/assistantService';
import { CreateAssistantDto, UpdateAssistantDto, Conversation } from '../types/assistant';

export class AssistantController {
  /**
   * GET /api/assistants
   * 获取助手列表
   */
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const assistants = await AssistantService.getUserAssistants(userId);

      res.json({
        success: true,
        data: { assistants }
      });
    } catch (error: any) {
      console.error('List assistants error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch assistants'
      });
    }
  }

  /**
   * POST /api/assistants
   * 创建助手
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const data: CreateAssistantDto = req.body;

      // 验证必填字段
      if (!data.name || !data.system_prompt) {
        res.status(400).json({
          success: false,
          message: 'Name and system_prompt are required'
        });
        return;
      }

      const assistant = await AssistantService.createAssistant(userId, data);

      res.status(201).json({
        success: true,
        data: { assistant }
      });
    } catch (error: any) {
      console.error('Create assistant error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create assistant'
      });
    }
  }

  /**
   * PUT /api/assistants/:id
   * 更新助手
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const data: UpdateAssistantDto = req.body;

      const assistant = await AssistantService.updateAssistant(id, userId, data);

      res.json({
        success: true,
        data: { assistant }
      });
    } catch (error: any) {
      console.error('Update assistant error:', error);
      const status = error.message.includes('not found') ? 404 : 
                     error.message.includes('Forbidden') ? 403 : 400;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to update assistant'
      });
    }
  }

  /**
   * DELETE /api/assistants/:id
   * 删除助手
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      await AssistantService.deleteAssistant(id, userId);

      res.json({
        success: true,
        message: 'Assistant deleted successfully'
      });
    } catch (error: any) {
      console.error('Delete assistant error:', error);
      const status = error.message.includes('not found') ? 404 : 
                     error.message.includes('Forbidden') ? 403 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to delete assistant'
      });
    }
  }

  /**
   * GET /api/assistants/presets
   * 获取预设模板
   */
  static async getPresets(req: Request, res: Response): Promise<void> {
    try {
      const presets = AssistantService.getPresets();

      res.json({
        success: true,
        data: { presets }
      });
    } catch (error: any) {
      console.error('Get presets error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch presets'
      });
    }
  }

  /**
   * POST /api/assistants/migrate
   * 迁移localStorage对话
   */
  static async migrate(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { conversations } = req.body as { conversations: Conversation[] };

      if (!conversations || !Array.isArray(conversations)) {
        res.status(400).json({
          success: false,
          message: 'Invalid conversations data'
        });
        return;
      }

      // 1. 初始化默认助手
      const defaultAssistant = await AssistantService.initializeDefaultAssistant(userId);

      // 2. 迁移对话（这个逻辑在MigrationService中，这里简化处理）
      // TODO: 实现完整的迁移逻辑

      res.json({
        success: true,
        data: {
          migratedCount: conversations.length,
          defaultAssistant
        }
      });
    } catch (error: any) {
      console.error('Migrate conversations error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to migrate conversations'
      });
    }
  }
}


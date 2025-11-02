/**
 * Topic Controller - 主题控制器
 */

import { Request, Response } from 'express';
import { TopicService } from '../services/topicService';

export class TopicController {
  /**
   * GET /api/assistants/:assistantId/topics
   * 获取助手的主题列表
   */
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { assistantId } = req.params;

      const topics = await TopicService.getAssistantTopics(assistantId, userId);

      res.json({
        success: true,
        data: { topics }
      });
    } catch (error: any) {
      console.error('List topics error:', error);
      const status = error.message.includes('Forbidden') ? 403 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to fetch topics'
      });
    }
  }

  /**
   * POST /api/assistants/:assistantId/topics
   * 创建主题
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { assistantId } = req.params;
      const { title } = req.body;

      const topic = await TopicService.createTopic(assistantId, userId, title);

      res.status(201).json({
        success: true,
        data: { topic }
      });
    } catch (error: any) {
      console.error('Create topic error:', error);
      const status = error.message.includes('Forbidden') ? 403 : 400;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to create topic'
      });
    }
  }

  /**
   * PUT /api/topics/:id
   * 更新主题（重命名）
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { title } = req.body;

      if (!title) {
        res.status(400).json({
          success: false,
          message: 'Title is required'
        });
        return;
      }

      const topic = await TopicService.updateTopic(id, userId, { title });

      res.json({
        success: true,
        data: { topic }
      });
    } catch (error: any) {
      console.error('Update topic error:', error);
      const status = error.message.includes('not found') ? 404 : 
                     error.message.includes('Forbidden') ? 403 : 400;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to update topic'
      });
    }
  }

  /**
   * DELETE /api/topics/:id
   * 删除主题
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      await TopicService.deleteTopic(id, userId);

      res.json({
        success: true,
        message: 'Topic deleted successfully'
      });
    } catch (error: any) {
      console.error('Delete topic error:', error);
      const status = error.message.includes('not found') ? 404 : 
                     error.message.includes('Forbidden') ? 403 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to delete topic'
      });
    }
  }

  /**
   * DELETE /api/topics/batch
   * 批量删除主题
   */
  static async batchDelete(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { topicIds } = req.body;

      if (!topicIds || !Array.isArray(topicIds) || topicIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Invalid topicIds'
        });
        return;
      }

      const deletedCount = await TopicService.batchDeleteTopics(topicIds, userId);

      res.json({
        success: true,
        data: { deletedCount }
      });
    } catch (error: any) {
      console.error('Batch delete topics error:', error);
      const status = error.message.includes('not found') ? 404 : 
                     error.message.includes('Forbidden') ? 403 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to batch delete topics'
      });
    }
  }
}


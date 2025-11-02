/**
 * Message Controller - 消息控制器
 */

import { Request, Response } from 'express';
import { MessageService } from '../services/messageService';
import { ChatService } from '../services/chatService';

export class MessageController {
  /**
   * GET /api/topics/:topicId/messages
   * 获取主题的消息列表
   */
  static async list(req: Request, res: Response): Promise<void> {
    try {
      console.log('[MessageController.list] Full request details:', {
        user: req.user,
        params: req.params,
        query: req.query,
        headers: req.headers.authorization
      });

      const userId = req.user?.id;
      console.log('[MessageController.list] User ID:', userId);
      console.log('[MessageController.list] User ID type:', typeof userId);
      
      if (!userId) {
        console.error('[MessageController.list] No user ID found, user object:', req.user);
        res.status(401).json({ success: false, message: 'Unauthorized: No user ID' });
        return;
      }

      const { topicId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      console.log('[MessageController.list] Request params:', {
        topicId,
        topicIdType: typeof topicId,
        userId,
        userIdType: typeof userId,
        limit,
        offset
      });

      const result = await MessageService.getTopicMessages(topicId, userId, limit, offset);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('List messages error:', error);
      const status = error.message.includes('Forbidden') ? 403 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to fetch messages'
      });
    }
  }

  /**
   * POST /api/topics/:topicId/messages
   * 发送消息（对话）
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { topicId } = req.params;
      const { content } = req.body;

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Message content is required'
        });
        return;
      }

      // 处理对话
      const result = await ChatService.chat(topicId, userId, content);

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Create message error:', error);
      const status = error.message.includes('Forbidden') ? 403 : 
                     error.message.includes('not found') ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to send message'
      });
    }
  }
}


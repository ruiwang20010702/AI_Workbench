import { Request, Response } from 'express';
import { NoteModel } from '../models/Note';
import { CreateNoteRequest, UpdateNoteRequest, NotesResponse } from '../types';
import { AIUsageLogModel } from '../models/AIUsageLog';

export class NoteController {
  // 获取用户的所有笔记
  static async getNotes(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      const {
        notebook_id,
        tags,
        is_favorite,
        is_archived,
        search,
        page = '1',
        limit = '20'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      // 按模型签名构造options，避免可选属性为undefined
      const options = {
        ...(notebook_id ? { notebook_id: notebook_id as string } : {}),
        ...(tags ? { tags: (tags as string).split(',') } : {}),
        ...(is_favorite === 'true' ? { is_favorite: true } : is_favorite === 'false' ? { is_favorite: false } : {}),
        ...(is_archived === 'true' ? { is_archived: true } : is_archived === 'false' ? { is_archived: false } : {}),
        ...(search ? { search: search as string } : {}),
        limit: limitNum,
        offset: (pageNum - 1) * limitNum
      };

      const notes = await NoteModel.findByUserId(req.user!.id, options);
      
      // 构造 getTotalCount 的参数，过滤掉 undefined 值
      const countOptions: {
        notebookId?: string;
        tags?: string[];
        favorite?: boolean;
        archived?: boolean;
        search?: string;
      } = {};
      
      if (options.notebook_id) countOptions.notebookId = options.notebook_id;
      if (options.tags) countOptions.tags = options.tags;
      if (options.is_favorite !== undefined) countOptions.favorite = options.is_favorite;
      if (options.is_archived !== undefined) countOptions.archived = options.is_archived;
      if (options.search) countOptions.search = options.search;
      
      const total = await NoteModel.getTotalCount(req.user!.id, countOptions);

      const response: NotesResponse = {
        success: true,
        message: '获取笔记列表成功',
        data: {
          notes,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            hasMore: (pageNum - 1) * limitNum + limitNum < total
          }
        }
      };

      res.json(response);
    } catch (error) {
      console.error('获取笔记列表错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 根据ID获取单个笔记
  static async getNoteById(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: '缺少笔记ID参数'
        });
      }

      const note = await NoteModel.findById(id, req.user!.id);

      if (!note) {
        return res.status(404).json({
          success: false,
          message: '笔记不存在'
        });
      }

      // 检查笔记是否属于当前用户
      if (note.user_id !== req.user!.id) {
        return res.status(403).json({
          success: false,
          message: '无权访问此笔记'
        });
      }

      res.json({
        success: true,
        message: '获取笔记成功',
        data: {
          note
        }
      });
    } catch (error) {
      console.error('获取笔记错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 更新笔记
  static async updateNote(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: '缺少笔记ID参数'
        });
      }
      
      const updateData: UpdateNoteRequest = req.body;

      // 检查笔记是否存在且属于当前用户
      const existingNote = await NoteModel.findById(id, req.user!.id);
      if (!existingNote) {
        return res.status(404).json({
          success: false,
          message: '笔记不存在'
        });
      }

      if (existingNote.user_id !== req.user!.id) {
        return res.status(403).json({
          success: false,
          message: '无权修改此笔记'
        });
      }

      const updatedNote = await NoteModel.update(id, req.user!.id, updateData);

      res.json({
        success: true,
        message: '笔记更新成功',
        data: {
          note: updatedNote
        }
      });
    } catch (error) {
      console.error('更新笔记错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 智能搜索笔记（使用AI）
  static async searchNotes(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      const { query, limit = 10 } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          message: '搜索查询不能为空'
        });
      }

      // 使用新的getTotalCount方法获取搜索结果的总数
      const total = await NoteModel.getTotalCount(req.user!.id, {
        search: query as string
      });

      // 获取用户的所有笔记
      const notes = await NoteModel.findByUserId(req.user!.id, { 
        search: query as string,
        limit: parseInt(limit as string)
      });

      res.json({
        success: true,
        message: '搜索完成',
        data: {
          notes,
          total,
          query
        }
      });
    } catch (error: any) {
      console.error('搜索笔记错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 获取用户统计数据
  static async getStats(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      // 获取当前统计数据
      const totalNotes = await NoteModel.getTotalCount(req.user!.id);
      const favoriteNotes = await NoteModel.getTotalCount(req.user!.id, { favorite: true });
      const archivedNotes = await NoteModel.getTotalCount(req.user!.id, { archived: true });

      // 计算增长百分比（基于上周数据）
      const lastWeekDate = new Date();
      lastWeekDate.setDate(lastWeekDate.getDate() - 7);
      
      // 获取上周的笔记数量（通过created_at字段过滤）
      const lastWeekNotes = await NoteModel.getCountByDateRange(req.user!.id, null, lastWeekDate);
      const currentWeekNotes = totalNotes - lastWeekNotes;
      
      // 计算增长百分比
      const notesGrowthPercent = lastWeekNotes > 0 
        ? Math.round(((currentWeekNotes / lastWeekNotes) * 100)) 
        : currentWeekNotes > 0 ? 100 : 0;

      // 新增：真实AI使用统计
      const aiTotals = await AIUsageLogModel.getUsageStats(req.user!.id);
      const totalAIRequests = aiTotals.total_requests;
      const aiLastPeriod = await AIUsageLogModel.getUsageStatsByDateRange(req.user!.id, undefined, lastWeekDate);
      const currentWeekAIRequests = totalAIRequests - aiLastPeriod.total_requests;
      const aiUsageGrowth = aiLastPeriod.total_requests > 0
        ? Math.round((currentWeekAIRequests / aiLastPeriod.total_requests) * 100)
        : currentWeekAIRequests > 0 ? 100 : 0;

      res.json({
        success: true,
        message: '获取统计数据成功',
        data: {
          totalNotes,
          favoriteNotes,
          archivedNotes,
          // 增长数据
          notesGrowthPercent,
          aiUsageGrowth,
          // 这些数据暂时使用模拟值，后续可以从其他表获取
          totalTodos: 0,
          completedTodos: 0,
          aiUsage: totalAIRequests
        }
      });
    } catch (error) {
      console.error('获取统计数据错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 获取所有标签
  static async getTags(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      // 获取用户的所有笔记，然后提取标签
      const notes = await NoteModel.findByUserId(req.user!.id, {});
      
      // 提取所有标签并去重
      const allTags = notes.flatMap(note => note.tags || []);
      const uniqueTags = [...new Set(allTags)].sort();

      res.json(uniqueTags);
    } catch (error) {
      console.error('获取标签错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 创建新笔记
  static async createNote(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      const { title, content, notebook_id, tags } = req.body as CreateNoteRequest;
      const payload: { user_id: string; title?: string; content?: string; notebook_id?: string; tags?: string[] } = {
        user_id: req.user!.id
      };
      if (title !== undefined) payload.title = title;
      if (content !== undefined) payload.content = content;
      if (notebook_id !== undefined) payload.notebook_id = notebook_id;
      if (tags !== undefined) payload.tags = tags;

      const note = await NoteModel.create(payload);

      res.json({
        success: true,
        message: '创建笔记成功',
        data: { note }
      });
    } catch (error) {
      console.error('创建笔记错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 删除笔记
  static async deleteNote(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: '缺少笔记ID参数'
        });
      }

      const deleted = await NoteModel.delete(id, req.user!.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: '笔记不存在或无权删除'
        });
      }

      res.json({
        success: true,
        message: '删除笔记成功'
      });
    } catch (error) {
      console.error('删除笔记错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 收藏/取消收藏笔记
  static async toggleFavorite(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: '缺少笔记ID参数'
        });
      }

      const existingNote = await NoteModel.findById(id, req.user!.id);
      if (!existingNote) {
        return res.status(404).json({
          success: false,
          message: '笔记不存在'
        });
      }

      const updated = await NoteModel.update(id, req.user!.id, {
        is_favorite: !existingNote.is_favorite
      });

      res.json({
        success: true,
        message: '更新收藏状态成功',
        data: { note: updated }
      });
    } catch (error) {
      console.error('更新收藏状态错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 归档/取消归档笔记
  static async toggleArchive(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: '缺少笔记ID参数'
        });
      }

      const existingNote = await NoteModel.findById(id, req.user!.id);
      if (!existingNote) {
        return res.status(404).json({
          success: false,
          message: '笔记不存在'
        });
      }

      const updated = await NoteModel.update(id, req.user!.id, {
        is_archived: !existingNote.is_archived
      });

      res.json({
        success: true,
        message: '更新归档状态成功',
        data: { note: updated }
      });
    } catch (error) {
      console.error('更新归档状态错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
}
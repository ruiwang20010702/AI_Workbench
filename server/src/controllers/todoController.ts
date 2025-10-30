import { Request, Response } from 'express';
import { TodoModel } from '../models/Todo';
import { CreateTodoRequest, UpdateTodoRequest } from '../types';

export class TodoController {
  // 获取用户的所有Todo
  static async getTodos(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      const {
        completed,
        priority,
        tags,
        search,
        page = '1',
        limit = '20',
        sortBy,
        sortOrder
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      // 仅传递模型允许的筛选项，并进行必要的映射
      const priorityZh: '低' | '中' | '高' | undefined =
        priority === 'low' ? '低' : priority === 'medium' ? '中' : priority === 'high' ? '高' : undefined;

      // 将 completed 查询参数解析为布尔值
      const completedBool: boolean | undefined =
        completed === 'true' ? true : completed === 'false' ? false : undefined;

      // 排序字段与方向映射
      const orderBy: 'created_at' | 'updated_at' | 'due_date' | 'priority' | undefined =
        sortBy === 'createdAt' ? 'created_at'
        : sortBy === 'updatedAt' ? 'updated_at'
        : sortBy === 'dueDate' ? 'due_date'
        : sortBy === 'priority' ? 'priority'
        : undefined;
      const orderDir: 'ASC' | 'DESC' | undefined =
        sortOrder === 'asc' ? 'ASC' : sortOrder === 'desc' ? 'DESC' : undefined;

      const options: {
        note_id?: string;
        status?: '未开始' | '进行中' | '已完成';
        priority?: '低' | '中' | '高';
        due_date_from?: Date;
        due_date_to?: Date;
        limit?: number;
        offset?: number;
        completed?: boolean;
        orderBy?: 'created_at' | 'updated_at' | 'due_date' | 'priority';
        orderDir?: 'ASC' | 'DESC';
      } = {
        ...(priorityZh ? { priority: priorityZh } : {}),
        ...(completedBool !== undefined ? { completed: completedBool } : {}),
        ...(orderBy ? { orderBy } : {}),
        ...(orderDir ? { orderDir } : {}),
        limit: limitNum,
        offset: (pageNum - 1) * limitNum
      };

      const todos = await TodoModel.findByUserId(req.user!.id, options);

      res.json({
        success: true,
        message: '获取Todo列表成功',
        data: {
          todos,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: todos.length
          }
        }
      });
    } catch (error) {
      console.error('获取Todo列表错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 根据ID获取单个Todo
  static async getTodoById(req: Request, res: Response): Promise<Response | void> {
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
          message: '缺少Todo ID参数'
        });
      }

      const todo = await TodoModel.findById(id, req.user!.id);

      if (!todo) {
        return res.status(404).json({
          success: false,
          message: 'Todo不存在'
        });
      }

      // 检查Todo是否属于当前用户
      if (todo.user_id !== req.user!.id) {
        return res.status(403).json({
          success: false,
          message: '无权访问此Todo'
        });
      }

      res.json({
        success: true,
        message: '获取Todo成功',
        data: {
          todo
        }
      });
    } catch (error) {
      console.error('获取Todo错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 创建新Todo
  static async createTodo(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      const todoData: CreateTodoRequest = req.body;
      
      // 转换due_date字符串为Date对象，并规范化优先级（英文->中文）
      const { due_date, ...restCreate } = todoData;
      const priorityMap: Record<string, '低' | '中' | '高'> = { low: '低', medium: '中', high: '高' };
      const normalizedPriority = (restCreate as any).priority !== undefined
        ? (priorityMap[((restCreate as any).priority as string)] ?? (restCreate as any).priority)
        : undefined;

      const createData = {
        ...restCreate,
        ...(normalizedPriority !== undefined ? { priority: normalizedPriority } : {}),
        user_id: req.user!.id,
        ...(due_date !== undefined ? { due_date: new Date(due_date) } : {})
      };
      
      const todo = await TodoModel.create(createData);

      res.status(201).json({
        success: true,
        message: 'Todo创建成功',
        data: {
          todo
        }
      });
    } catch (error) {
      console.error('创建Todo错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 批量创建Todo
  static async createBatchTodos(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      const { todos }: { todos: CreateTodoRequest[] } = req.body;

      if (!Array.isArray(todos) || todos.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Todo列表不能为空'
        });
      }

      const todosWithUserId = todos.map(todo => {
        const { due_date, ...rest } = todo;
        return {
          ...rest,
          user_id: req.user!.id,
          ...(due_date !== undefined ? { due_date: new Date(due_date) } : {})
        };
      });

      const createdTodos = await TodoModel.createBatch(todosWithUserId);

      res.status(201).json({
        success: true,
        message: `成功创建${createdTodos.length}个Todo`,
        data: {
          todos: createdTodos
        }
      });
    } catch (error) {
      console.error('批量创建Todo错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 更新Todo
  static async updateTodo(req: Request, res: Response): Promise<Response | void> {
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
          message: '缺少Todo ID参数'
        });
      }
      
      const updateData: UpdateTodoRequest = req.body;

      // 检查Todo是否存在且属于当前用户
      const existingTodo = await TodoModel.findById(id, req.user!.id);
      if (!existingTodo) {
        return res.status(404).json({
          success: false,
          message: 'Todo不存在'
        });
      }

      if (existingTodo.user_id !== req.user!.id) {
        return res.status(403).json({
          success: false,
          message: '无权修改此Todo'
        });
      }

      // 转换due_date字符串为Date对象，并规范化优先级（英文->中文）
      const { due_date: updateDueDate, ...restUpdate } = updateData;
      const priorityMap: Record<string, '低' | '中' | '高'> = { low: '低', medium: '中', high: '高' };
      const normalized = { ...restUpdate } as any;
      if (normalized.priority !== undefined) {
        normalized.priority = priorityMap[(normalized.priority as string)] ?? normalized.priority;
      }

      const processedUpdateData = {
        ...normalized,
        ...(updateDueDate !== undefined ? { due_date: new Date(updateDueDate) } : {})
      };

      const updatedTodo = await TodoModel.update(id, req.user!.id, processedUpdateData);

      if (!updatedTodo) {
        return res.status(404).json({
          success: false,
          message: 'Todo更新失败'
        });
      }

      res.json({
        success: true,
        message: 'Todo更新成功',
        data: {
          todo: updatedTodo
        }
      });
    } catch (error) {
      console.error('更新Todo错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 删除Todo
  static async deleteTodo(req: Request, res: Response): Promise<Response | void> {
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
          message: '缺少Todo ID参数'
        });
      }

      // 检查Todo是否存在且属于当前用户
      const existingTodo = await TodoModel.findById(id, req.user!.id);
      if (!existingTodo) {
        return res.status(404).json({
          success: false,
          message: 'Todo不存在'
        });
      }

      if (existingTodo.user_id !== req.user!.id) {
        return res.status(403).json({
          success: false,
          message: '无权删除此Todo'
        });
      }

      await TodoModel.delete(id, req.user!.id);

      res.json({
        success: true,
        message: 'Todo删除成功'
      });
    } catch (error) {
      console.error('删除Todo错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 切换Todo完成状态
  static async toggleComplete(req: Request, res: Response): Promise<Response | void> {
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
          message: '缺少Todo ID参数'
        });
      }

      // 检查Todo是否存在且属于当前用户
      const existingTodo = await TodoModel.findById(id, req.user!.id);
      if (!existingTodo) {
        return res.status(404).json({
          success: false,
          message: 'Todo不存在'
        });
      }

      if (existingTodo.user_id !== req.user!.id) {
        return res.status(403).json({
          success: false,
          message: '无权修改此Todo'
        });
      }

      const updatedTodo = await TodoModel.update(id, req.user!.id, {
        completed: !existingTodo.completed,
        completed_at: !existingTodo.completed ? new Date() : null
      });

      if (!updatedTodo) {
        return res.status(404).json({
          success: false,
          message: 'Todo更新失败'
        });
      }

      res.json({
        success: true,
        message: updatedTodo.completed ? 'Todo已完成' : 'Todo已标记为未完成',
        data: {
          todo: updatedTodo
        }
      });
    } catch (error) {
      console.error('切换完成状态错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 获取Todo统计信息
  static async getStatistics(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      const statistics = await TodoModel.getStatistics(req.user!.id);

      res.json({
        success: true,
        message: '获取统计信息成功',
        data: {
          statistics
        }
      });
    } catch (error) {
      console.error('获取Todo统计信息错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 获取标签列表
  static async getTags(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      // 这里应该从数据库获取用户的所有标签
      // 暂时返回空数组，需要根据实际数据模型实现
      const tags: string[] = [];

      res.json({
        success: true,
        message: '获取标签列表成功',
        data: tags
      });
    } catch (error) {
      console.error('获取标签列表错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 搜索待办事项
  static async searchTodos(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      const { q: query, page = '1', limit = '20', sortBy, sortOrder, completed, priority } = req.query;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          message: '搜索关键词不能为空'
        });
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      // 解析排序
      const orderBy: 'created_at' | 'updated_at' | 'due_date' | 'priority' | undefined =
        sortBy === 'createdAt' ? 'created_at'
        : sortBy === 'updatedAt' ? 'updated_at'
        : sortBy === 'dueDate' ? 'due_date'
        : sortBy === 'priority' ? 'priority'
        : undefined;
      const orderDir: 'ASC' | 'DESC' | undefined =
        sortOrder === 'asc' ? 'ASC' : sortOrder === 'desc' ? 'DESC' : undefined;

      // 解析筛选
      const completedBool: boolean | undefined = completed === 'true' ? true : completed === 'false' ? false : undefined;
      const priorityZh: '低' | '中' | '高' | undefined =
        priority === 'low' ? '低' : priority === 'medium' ? '中' : priority === 'high' ? '高' : undefined;

      const total = await TodoModel.getSearchCount(req.user!.id, String(query), {
        ...(completedBool !== undefined ? { completed: completedBool } : {}),
        ...(priorityZh ? { priority: priorityZh } : {})
      });

      const todos = await TodoModel.searchByUserId(req.user!.id, String(query), {
        limit: limitNum,
        offset: (pageNum - 1) * limitNum,
        ...(orderBy ? { orderBy } : {}),
        ...(orderDir ? { orderDir } : {}),
        ...(completedBool !== undefined ? { completed: completedBool } : {}),
        ...(priorityZh ? { priority: priorityZh } : {})
      });

      res.json({
        success: true,
        message: '搜索完成',
        data: {
          todos,
          total,
          page: pageNum,
          limit: limitNum
        }
      });
    } catch (error) {
      console.error('搜索待办事项错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 导出待办事项
  static async exportTodos(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      const { format = 'json' } = req.query;

      // 获取用户的所有待办事项
      const todos = await TodoModel.findByUserId(req.user!.id, {});

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="todos.json"');
        res.json(todos);
      } else {
        return res.status(400).json({
          success: false,
          message: '不支持的导出格式'
        });
      }
    } catch (error) {
      console.error('导出待办事项错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 批量更新
  static async batchUpdate(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      const { ids, data } = req.body as { ids: string[]; data: Partial<UpdateTodoRequest> & { due_date?: string; dueDate?: string } };

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的Todo ID列表'
        });
      }

      if (!data || typeof data !== 'object') {
        return res.status(400).json({
          success: false,
          message: '请提供有效的更新数据'
        });
      }

      // 规范化更新数据：处理优先级、截止日期、完成时间
      const priorityMap: Record<string, '低' | '中' | '高'> = {
        low: '低',
        medium: '中',
        high: '高'
      };

      const normalized: any = {};

      if (data.title !== undefined) normalized.title = data.title;
      if (data.description !== undefined) normalized.description = data.description;

      // 支持 due_date 或 dueDate 两种输入
      if ((data as any).due_date !== undefined) {
        normalized.due_date = (data as any).due_date ? new Date((data as any).due_date as string) : null;
      }
      if ((data as any).dueDate !== undefined) {
        normalized.due_date = (data as any).dueDate ? new Date((data as any).dueDate as string) : null;
      }

      if (data.priority !== undefined) {
        const zh = priorityMap[(data.priority as string)];
        normalized.priority = zh ?? data.priority;
      }

      if (data.completed !== undefined) {
        normalized.completed = !!data.completed;
        normalized.completed_at = data.completed ? new Date() : null;
      }

      if ((data as any).status !== undefined) {
        normalized.status = (data as any).status;
      }

      const updatedTodos = await TodoModel.batchUpdate(req.user!.id, ids, normalized);

      return res.json({
        success: true,
        message: `批量更新成功，共更新 ${updatedTodos.length} 条`,
        data: { todos: updatedTodos }
      });
    } catch (error) {
      console.error('批量更新错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 批量删除
  static async batchDelete(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      const { ids } = req.body as { ids: string[] };

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的Todo ID列表'
        });
      }

      const deletedIds = await TodoModel.batchDelete(req.user!.id, ids);

      return res.json({
        success: true,
        message: `批量删除成功，已删除 ${deletedIds.length} 条`,
        data: { ids: deletedIds }
      });
    } catch (error) {
      console.error('批量删除错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
}
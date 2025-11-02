import { NoteModel } from '../models/Note';
import { ProjectModel } from '../models/Project';
import { TodoModel } from '../models/Todo';
import { IntentResult } from './intentService';
import { Note, Todo } from '../types';
import { ProjectData } from '../models/Project';

/**
 * 检索结果
 */
export interface RetrievalResult {
  notes?: Note[];
  projects?: ProjectData[];
  todos?: Todo[];
  statistics?: {
    total: number;
    completed?: number;
    pending?: number;
    completionRate?: number;
  };
}

/**
 * 数据检索服务
 * 根据意图识别结果检索用户数据
 */
export class DataRetrievalService {
  // 最大返回数量
  private static readonly MAX_ITEMS = 20;

  /**
   * 根据意图检索数据
   * @param userId 用户ID
   * @param intent 意图识别结果
   * @returns 检索到的数据
   */
  static async retrieveData(
    userId: string,
    intent: IntentResult
  ): Promise<RetrievalResult> {
    const result: RetrievalResult = {};

    try {
      switch (intent.type) {
        case 'query_notes':
          result.notes = await this.queryNotes(userId, intent.filters);
          break;

        case 'query_projects':
          result.projects = await this.queryProjects(userId, intent.filters);
          break;

        case 'query_todos':
          result.todos = await this.queryTodos(userId, intent.filters);
          break;

        case 'statistics':
          result.statistics = await this.queryStatistics(userId, intent.filters);
          break;

        case 'general':
          // 一般对话不需要检索数据
          break;

        default:
          console.warn('未知的意图类型:', intent.type);
      }

      return result;
    } catch (error: any) {
      console.error('数据检索错误:', error);
      throw new Error(`数据检索失败: ${error.message}`);
    }
  }

  /**
   * 查询笔记
   */
  private static async queryNotes(
    userId: string,
    filters: IntentResult['filters']
  ): Promise<Note[]> {
    const options: any = {
      limit: this.MAX_ITEMS,
      is_archived: false // 默认不包含归档的笔记
    };

    // 应用关键词搜索
    if (filters.keyword) {
      options.search = filters.keyword;
    }

    // 应用标签过滤
    if (filters.tags && filters.tags.length > 0) {
      options.tags = filters.tags;
    }

    // 查询笔记
    let notes = await NoteModel.findByUserId(userId, options);

    // 应用时间范围过滤
    if (filters.timeRange) {
      notes = this.filterByTimeRange(notes, filters.timeRange, 'updated_at');
    }

    return notes.slice(0, this.MAX_ITEMS);
  }

  /**
   * 查询项目
   */
  private static async queryProjects(
    userId: string,
    filters: IntentResult['filters']
  ): Promise<ProjectData[]> {
    const options: any = {
      limit: this.MAX_ITEMS
    };

    // 应用优先级过滤
    if (filters.priority) {
      options.priority = filters.priority;
    }

    // 应用状态过滤
    if (filters.status) {
      // 映射中文状态到英文
      const statusMap: Record<string, string> = {
        '计划中': 'planning',
        '进行中': 'active',
        '已完成': 'completed',
        '已暂停': 'paused',
        '已取消': 'cancelled'
      };
      options.status = statusMap[filters.status] || filters.status;
    }

    // 应用关键词搜索
    if (filters.keyword) {
      options.search = filters.keyword;
    }

    // 查询项目
    let projects = await ProjectModel.findByUserId(userId, options);

    // 应用时间范围过滤
    if (filters.timeRange) {
      projects = this.filterByTimeRange(projects, filters.timeRange, 'updated_at');
    }

    return projects.slice(0, this.MAX_ITEMS);
  }

  /**
   * 查询待办事项
   */
  private static async queryTodos(
    userId: string,
    filters: IntentResult['filters']
  ): Promise<Todo[]> {
    const options: any = {
      limit: this.MAX_ITEMS,
      completed: false // 默认只查询未完成的
    };

    // 应用优先级过滤
    if (filters.priority) {
      // 映射英文优先级到中文
      const priorityMap: Record<string, string> = {
        'low': '低',
        'medium': '中',
        'high': '高'
      };
      options.priority = priorityMap[filters.priority] || filters.priority;
    }

    // 应用状态过滤
    if (filters.status) {
      if (filters.status === '已完成') {
        options.completed = true;
        delete options.status;
      } else {
        options.status = filters.status;
        delete options.completed;
      }
    }

    // 查询待办
    let todos = await TodoModel.findByUserId(userId, options);

    // 应用时间范围过滤（基于due_date或updated_at）
    if (filters.timeRange) {
      todos = this.filterByTimeRange(todos, filters.timeRange, 'updated_at');
    }

    return todos.slice(0, this.MAX_ITEMS);
  }

  /**
   * 查询统计信息
   */
  private static async queryStatistics(
    userId: string,
    filters: IntentResult['filters']
  ): Promise<RetrievalResult['statistics']> {
    // 根据时间范围获取待办事项
    const timeRange = filters.timeRange || 'week';
    const allTodos = await TodoModel.findByUserId(userId, { limit: 1000 });

    // 过滤时间范围内的待办
    const filteredTodos = this.filterByTimeRange(allTodos, timeRange, 'created_at');

    // 计算统计信息
    const total = filteredTodos.length;
    const completed = filteredTodos.filter(todo => todo.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? completed / total : 0;

    return {
      total,
      completed,
      pending,
      completionRate
    };
  }

  /**
   * 根据时间范围过滤数据
   */
  private static filterByTimeRange<T extends Record<string, any>>(
    items: T[],
    timeRange: 'recent' | 'today' | 'week' | 'month',
    dateField: string
  ): T[] {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;

      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;

      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;

      case 'recent':
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
    }

    return items.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= startDate;
    });
  }

  /**
   * 格式化数据为上下文文本
   * @param data 检索到的数据
   * @returns 格式化的上下文文本
   */
  static formatDataAsContext(data: RetrievalResult): string {
    const parts: string[] = [];

    // 格式化笔记
    if (data.notes && data.notes.length > 0) {
      parts.push('【笔记列表】');
      data.notes.forEach((note, index) => {
        const tags = note.tags && note.tags.length > 0 ? ` [标签: ${note.tags.join(', ')}]` : '';
        const updatedAt = new Date(note.updated_at).toLocaleDateString('zh-CN');
        parts.push(
          `${index + 1}. ${note.title || '(无标题)'}${tags}\n` +
          `   更新时间: ${updatedAt}\n` +
          `   内容摘要: ${this.truncateText(note.content_text || '', 100)}`
        );
      });
      parts.push('');
    }

    // 格式化项目
    if (data.projects && data.projects.length > 0) {
      parts.push('【项目列表】');
      data.projects.forEach((project, index) => {
        const statusMap: Record<string, string> = {
          'planning': '计划中',
          'active': '进行中',
          'completed': '已完成',
          'paused': '已暂停',
          'cancelled': '已取消'
        };
        const priorityMap: Record<string, string> = {
          'low': '低',
          'medium': '中',
          'high': '高'
        };
        const status = statusMap[project.status] || project.status;
        const priority = priorityMap[project.priority] || project.priority;
        const progress = project.progress !== undefined ? ` (进度: ${project.progress}%)` : '';
        
        parts.push(
          `${index + 1}. ${project.name}\n` +
          `   状态: ${status} | 优先级: ${priority}${progress}\n` +
          `   描述: ${this.truncateText(project.description || '无描述', 100)}`
        );
      });
      parts.push('');
    }

    // 格式化待办事项
    if (data.todos && data.todos.length > 0) {
      parts.push('【待办事项列表】');
      data.todos.forEach((todo, index) => {
        const priorityMap: Record<string, string> = {
          '低': '低',
          '中': '中',
          '高': '高',
          'low': '低',
          'medium': '中',
          'high': '高'
        };
        const priority = priorityMap[todo.priority] || todo.priority;
        const status = todo.completed ? '已完成' : (todo.status || '未开始');
        const dueDate = todo.due_date 
          ? ` | 截止: ${new Date(todo.due_date).toLocaleDateString('zh-CN')}` 
          : '';
        
        parts.push(
          `${index + 1}. ${todo.title}\n` +
          `   状态: ${status} | 优先级: ${priority}${dueDate}\n` +
          `   描述: ${this.truncateText(todo.description || '无描述', 100)}`
        );
      });
      parts.push('');
    }

    // 格式化统计信息
    if (data.statistics) {
      parts.push('【统计信息】');
      parts.push(`总数: ${data.statistics.total}`);
      if (data.statistics.completed !== undefined) {
        parts.push(`已完成: ${data.statistics.completed}`);
      }
      if (data.statistics.pending !== undefined) {
        parts.push(`待完成: ${data.statistics.pending}`);
      }
      if (data.statistics.completionRate !== undefined) {
        parts.push(`完成率: ${(data.statistics.completionRate * 100).toFixed(1)}%`);
      }
      parts.push('');
    }

    return parts.join('\n');
  }

  /**
   * 截断过长的文本
   */
  private static truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}


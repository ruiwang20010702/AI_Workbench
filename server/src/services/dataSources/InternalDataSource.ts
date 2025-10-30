// @ts-nocheck
import { IDataSource, WeeklyData, DataSourceConfig } from './IDataSource';
import { TaskModel } from '../../models/Task';
import { ProjectModel } from '../../models/Project';
import { NoteModel } from '../../models/Note';

/**
 * 内部数据源实现
 * 从系统内部的任务、项目、笔记中聚合周报数据
 */
export class InternalDataSource implements IDataSource {
  readonly name = 'internal';
  readonly description = '系统内部数据源（任务、项目、笔记）';

  /**
   * 检查数据源是否启用
   */
  isEnabled(): boolean {
    // 内部数据源始终启用
    return true;
  }

  /**
   * 获取指定周期的数据
   * @param userId 用户ID
   * @param startDate 开始日期（ISO格式：YYYY-MM-DD）
   * @param endDate 结束日期（ISO格式：YYYY-MM-DD）
   * @param config 配置选项
   * @returns 周报数据
   */
  async fetchData(
    userId: string,
    startDate: string,
    endDate: string,
    config?: DataSourceConfig
  ): Promise<Partial<WeeklyData>> {
    try {
      console.log(`[InternalDataSource] Fetching data for user ${userId} from ${startDate} to ${endDate}`);

      // 并行获取任务、项目、笔记数据
      const [tasksData, projectsData, notesData, hoursData] = await Promise.all([
        this.fetchTasksData(userId, startDate, endDate),
        this.fetchProjectsData(userId, startDate, endDate),
        this.fetchNotesData(userId, startDate, endDate),
        this.fetchHoursData(userId, startDate, endDate),
      ]);

      const result: Partial<WeeklyData> = {
        tasks: tasksData,
        projects: projectsData,
        notes: notesData,
        hours: hoursData,
        metadata: {
          data_source: this.name,
          generated_at: new Date().toISOString(),
          week_start: startDate,
          week_end: endDate,
        },
      };

      console.log(`[InternalDataSource] Data fetched successfully:`, {
        tasks_total: tasksData.total,
        completed: tasksData.completed_count,
        projects: projectsData.total,
        notes: notesData.total,
      });

      return result;
    } catch (error) {
      console.error('[InternalDataSource] Error fetching data:', error);
      throw new Error(`Failed to fetch internal data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 获取任务数据
   */
  private async fetchTasksData(userId: string, startDate: string, endDate: string) {
    try {
      // 获取所有任务
      const allTasks = await TaskModel.findByUserId(userId, {
        limit: 1000, // 获取足够多的任务
      });

      // 筛选本周任务
      const weekTasks = allTasks.tasks.filter((task) => {
        const taskDate = task.completed_at || task.updated_at || task.created_at;
        return taskDate >= startDate && taskDate <= endDate;
      });

      // 分类任务
      const completed = weekTasks
        .filter((task) => task.status === 'completed')
        .map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description || undefined,
          project_name: task.project_name || undefined,
          priority: task.priority,
          completed_at: task.completed_at || task.updated_at,
          tags: task.tags || [],
        }));

      const inProgress = allTasks.tasks
        .filter((task) => task.status === 'in_progress')
        .map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description || undefined,
          project_name: task.project_name || undefined,
          priority: task.priority,
          progress: this.calculateTaskProgress(task),
          due_date: task.due_date || undefined,
          tags: task.tags || [],
        }));

      // 获取下周计划（即将到期的待办任务）
      const nextWeekStart = this.addDays(endDate, 1);
      const nextWeekEnd = this.addDays(endDate, 7);
      const upcoming = allTasks.tasks
        .filter((task) => {
          if (task.status === 'completed' || task.status === 'cancelled') return false;
          if (!task.due_date) return false;
          return task.due_date >= nextWeekStart && task.due_date <= nextWeekEnd;
        })
        .map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description || undefined,
          project_name: task.project_name || undefined,
          priority: task.priority,
          start_date: task.start_date || undefined,
          due_date: task.due_date || undefined,
          tags: task.tags || [],
        }))
        .slice(0, 10); // 最多返回10个

      const total = weekTasks.length;
      const completedCount = completed.length;
      const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

      return {
        completed,
        in_progress: inProgress.slice(0, 10), // 最多返回10个进行中的任务
        upcoming,
        total,
        completed_count: completedCount,
        completion_rate: completionRate,
      };
    } catch (error) {
      console.error('[InternalDataSource] Error fetching tasks:', error);
      return {
        completed: [],
        in_progress: [],
        upcoming: [],
        total: 0,
        completed_count: 0,
        completion_rate: 0,
      };
    }
  }

  /**
   * 获取项目数据
   */
  private async fetchProjectsData(userId: string, startDate: string, endDate: string) {
    try {
      // 获取所有项目
      const allProjects = await ProjectModel.findByUserId(userId, {
        limit: 100,
      });

      // 活跃项目（进行中）
      const active = allProjects
        .filter((project) => project.status === 'active' || project.status === 'planning')
        .map((project) => ({
          id: project.id,
          name: project.name,
          description: project.description || undefined,
          progress: project.progress || 0,
          status: project.status,
          tasks_completed: project.tasks_completed || 0,
          tasks_total: (project as any).tasks_total || 0,
        }));

      // 本周完成的项目
      const completed = allProjects
        .filter((project) => {
          if (project.status !== 'completed') return false;
          const completedDate = project.updated_at;
          return new Date(completedDate) >= new Date(startDate) && new Date(completedDate) <= new Date(endDate);
        })
        .map((project) => ({
          id: project.id,
          name: project.name,
          description: project.description || undefined,
          completed_at: project.updated_at,
        }));

      return {
        active,
        completed,
        total: allProjects.length,
      };
    } catch (error) {
      console.error('[InternalDataSource] Error fetching projects:', error);
      return {
        active: [],
        completed: [],
        total: 0,
      };
    }
  }

  /**
   * 获取笔记数据
   */
  private async fetchNotesData(userId: string, startDate: string, endDate: string) {
    try {
      // 获取本周创建的笔记
      const allNotes = await NoteModel.findByUserId(userId, {
        limit: 1000,
      });

      const created = allNotes
        .filter((note) => note.created_at >= startDate && note.created_at <= endDate)
        .map((note) => ({
          id: note.id,
          title: note.title,
          tags: note.tags || [],
          created_at: note.created_at.toISOString(),
        }));

      // 本周更新的笔记（排除本周创建的）
      const updated = allNotes
        .filter((note) => {
          const isCreatedThisWeek = note.created_at >= startDate && note.created_at <= endDate;
          const isUpdatedThisWeek = note.updated_at >= startDate && note.updated_at <= endDate;
          return !isCreatedThisWeek && isUpdatedThisWeek;
        })
        .map((note) => ({
          id: note.id,
          title: note.title,
          tags: note.tags || [],
          updated_at: note.updated_at.toISOString(),
        }));

      return {
        created,
        updated,
        total: allNotes.length,
      };
    } catch (error) {
      console.error('[InternalDataSource] Error fetching notes:', error);
      return {
        created: [],
        updated: [],
        total: 0,
      };
    }
  }

  /**
   * 获取工时数据
   */
  private async fetchHoursData(userId: string, startDate: string, endDate: string) {
    try {
      // 从任务的estimated_hours和actual_hours统计工时
      const allTasks = await TaskModel.findByUserId(userId, {
        limit: 1000,
      });

      const weekTasks = allTasks.tasks.filter((task) => {
        const taskDate = task.completed_at || task.updated_at || task.created_at;
        return taskDate >= startDate && taskDate <= endDate;
      });

      // 计算总工时（使用actual_hours，如果没有则使用estimated_hours）
      const total = weekTasks.reduce((sum, task) => {
        const hours = task.actual_hours || task.estimated_hours || 0;
        return sum + hours;
      }, 0);

      // 按项目统计工时
      const byProject: Record<string, number> = {};
      weekTasks.forEach((task) => {
        const projectName = task.project_name || '未分类';
        const hours = task.actual_hours || task.estimated_hours || 0;
        byProject[projectName] = (byProject[projectName] || 0) + hours;
      });

      // 按天统计工时（简化版，实际应该按日期分组）
      const byDay: Record<string, number> = {};
      // 这里暂时平均分配到每一天
      const daysInWeek = 7;
      const avgHoursPerDay = total / daysInWeek;
      for (let i = 0; i < daysInWeek; i++) {
        const date = this.addDays(startDate, i);
        byDay[date] = Math.round(avgHoursPerDay * 10) / 10;
      }

      return {
        total: Math.round(total * 10) / 10,
        by_project: byProject,
        by_day: byDay,
      };
    } catch (error) {
      console.error('[InternalDataSource] Error fetching hours:', error);
      return {
        total: 0,
        by_project: {},
        by_day: {},
      };
    }
  }

  /**
   * 计算任务进度（基于启发式规则）
   */
  private calculateTaskProgress(task: any): number {
    // 如果任务已完成，返回100
    if (task.status === 'completed') return 100;

    // 如果有明确的进度字段（未来可能添加）
    if (task.progress !== undefined) return task.progress;

    // 基于状态推算进度
    switch (task.status) {
      case 'todo':
        return 0;
      case 'in_progress':
        // 基于时间推算：如果有开始和截止日期，根据当前时间计算进度
        if (task.start_date && task.due_date) {
          const start = new Date(task.start_date).getTime();
          const end = new Date(task.due_date).getTime();
          const now = Date.now();
          if (now < start) return 10; // 还未开始但已标记进行中
          if (now > end) return 90; // 已逾期但未完成
          const progress = ((now - start) / (end - start)) * 100;
          return Math.min(Math.max(Math.round(progress), 10), 90);
        }
        return 50; // 默认进行中为50%
      case 'cancelled':
        return 0;
      default:
        return 0;
    }
  }

  /**
   * 日期加减天数
   */
  private addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  /**
   * 验证配置
   */
  async validateConfig(config?: DataSourceConfig): Promise<boolean> {
    // 内部数据源不需要额外配置
    return true;
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      // 简单测试：尝试查询数据库
      await TaskModel.getStatistics('test');
      return true;
    } catch (error) {
      console.error('[InternalDataSource] Connection test failed:', error);
      return false;
    }
  }
}


// @ts-nocheck
import { DataSourceFactory, WeeklyData } from './dataSources';

/**
 * 周报聚合配置接口
 */
export interface AggregatorConfig {
  data_sources?: string[]; // 要使用的数据源名称列表
  include_git?: boolean; // 是否包含Git数据
  include_calendar?: boolean; // 是否包含日历数据
  merge_strategy?: 'override' | 'merge'; // 数据合并策略
}

/**
 * 周报数据聚合服务
 * 负责从多个数据源聚合数据，生成完整的周报数据结构
 */
export class WeeklyReportAggregator {
  /**
   * 聚合周报数据
   * @param userId 用户ID
   * @param startDate 周开始日期（ISO格式：YYYY-MM-DD）
   * @param endDate 周结束日期（ISO格式：YYYY-MM-DD）
   * @param config 聚合配置
   * @returns 聚合后的周报数据
   */
  static async aggregate(
    userId: string,
    startDate: string,
    endDate: string,
    config?: AggregatorConfig
  ): Promise<WeeklyData> {
    console.log(`[WeeklyReportAggregator] Starting aggregation for user ${userId}`);
    console.log(`[WeeklyReportAggregator] Period: ${startDate} to ${endDate}`);

    try {
      // 获取要使用的数据源
      const dataSources = this.getDataSources(config);
      console.log(`[WeeklyReportAggregator] Using ${dataSources.length} data sources`);

      // 并行从所有数据源获取数据
      const dataPromises = dataSources.map(async (ds) => {
        try {
          console.log(`[WeeklyReportAggregator] Fetching data from ${ds.name}`);
          const data = await ds.fetchData(userId, startDate, endDate);
          console.log(`[WeeklyReportAggregator] Data from ${ds.name}:`, Object.keys(data));
          return data;
        } catch (error) {
          console.error(`[WeeklyReportAggregator] Error fetching from ${ds.name}:`, error);
          return {}; // 单个数据源失败不影响整体
        }
      });

      const allData = await Promise.all(dataPromises);

      // 合并所有数据源的数据
      const mergedData = this.mergeData(allData, config);

      // 添加聚合元数据
      mergedData.metadata = {
        ...mergedData.metadata,
        aggregated_at: new Date().toISOString(),
        data_sources_used: dataSources.map((ds) => ds.name),
        week_start: startDate,
        week_end: endDate,
        user_id: userId,
      };

      console.log(`[WeeklyReportAggregator] Aggregation completed successfully`);
      return mergedData;
    } catch (error) {
      console.error('[WeeklyReportAggregator] Aggregation failed:', error);
      throw new Error(
        `Failed to aggregate weekly report data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 获取要使用的数据源列表
   */
  private static getDataSources(config?: AggregatorConfig) {
    // 如果指定了数据源列表，则使用指定的
    if (config?.data_sources && config.data_sources.length > 0) {
      const sources = config.data_sources
        .map((name) => DataSourceFactory.get(name))
        .filter((ds) => ds !== undefined && ds.isEnabled());
      return sources as any[];
    }

    // 否则使用所有启用的数据源
    return DataSourceFactory.getEnabled();
  }

  /**
   * 合并多个数据源的数据
   */
  private static mergeData(allData: Partial<WeeklyData>[], config?: AggregatorConfig): WeeklyData {
    const strategy = config?.merge_strategy || 'merge';

    // 初始化结果对象
    const result: WeeklyData = {
      tasks: {
        completed: [],
        in_progress: [],
        upcoming: [],
        total: 0,
        completed_count: 0,
        completion_rate: 0,
      },
      projects: {
        active: [],
        completed: [],
        total: 0,
      },
      notes: {
        created: [],
        updated: [],
        total: 0,
      },
      hours: {
        total: 0,
        by_project: {},
        by_day: {},
      },
    };

    // 合并数据
    for (const data of allData) {
      if (!data) continue;

      // 合并任务数据
      if (data.tasks) {
        if (strategy === 'override') {
          result.tasks = data.tasks;
        } else {
          // merge策略：合并数组并去重
          result.tasks!.completed = this.mergeUniqueById(
            result.tasks!.completed,
            data.tasks.completed || []
          );
          result.tasks!.in_progress = this.mergeUniqueById(
            result.tasks!.in_progress,
            data.tasks.in_progress || []
          );
          result.tasks!.upcoming = this.mergeUniqueById(
            result.tasks!.upcoming,
            data.tasks.upcoming || []
          );
          result.tasks!.total += data.tasks.total || 0;
          result.tasks!.completed_count += data.tasks.completed_count || 0;
          // 重新计算完成率
          if (result.tasks!.total > 0) {
            result.tasks!.completion_rate = Math.round(
              (result.tasks!.completed_count / result.tasks!.total) * 100
            );
          }
        }
      }

      // 合并项目数据
      if (data.projects) {
        if (strategy === 'override') {
          result.projects = data.projects;
        } else {
          result.projects!.active = this.mergeUniqueById(
            result.projects!.active,
            data.projects.active || []
          );
          result.projects!.completed = this.mergeUniqueById(
            result.projects!.completed,
            data.projects.completed || []
          );
          result.projects!.total = Math.max(result.projects!.total, data.projects.total || 0);
        }
      }

      // 合并笔记数据
      if (data.notes) {
        if (strategy === 'override') {
          result.notes = data.notes;
        } else {
          result.notes!.created = this.mergeUniqueById(
            result.notes!.created,
            data.notes.created || []
          );
          result.notes!.updated = this.mergeUniqueById(
            result.notes!.updated,
            data.notes.updated || []
          );
          result.notes!.total = Math.max(result.notes!.total, data.notes.total || 0);
        }
      }

      // 合并工时数据
      if (data.hours) {
        result.hours!.total += data.hours.total || 0;
        if (data.hours.by_project) {
          result.hours!.by_project = {
            ...result.hours!.by_project,
            ...data.hours.by_project,
          };
        }
        if (data.hours.by_day) {
          result.hours!.by_day = {
            ...result.hours!.by_day,
            ...data.hours.by_day,
          };
        }
      }

      // 添加Git数据（如果存在）
      if (data.git) {
        result.git = data.git;
      }

      // 添加日历数据（如果存在）
      if (data.calendar) {
        result.calendar = data.calendar;
      }

      // 合并元数据
      if (data.metadata) {
        result.metadata = {
          ...result.metadata,
          ...data.metadata,
        };
      }
    }

    return result;
  }

  /**
   * 合并数组并根据ID去重
   */
  private static mergeUniqueById<T extends { id: string }>(arr1: T[], arr2: T[]): T[] {
    const map = new Map<string, T>();

    // 先添加arr1的元素
    arr1.forEach((item) => map.set(item.id, item));

    // 再添加arr2的元素（如果ID已存在则覆盖）
    arr2.forEach((item) => map.set(item.id, item));

    return Array.from(map.values());
  }

  /**
   * 计算周报摘要信息
   * @param data 周报数据
   * @returns 摘要信息
   */
  static generateSummary(data: WeeklyData): {
    title: string;
    highlights: string[];
    concerns: string[];
  } {
    const highlights: string[] = [];
    const concerns: string[] = [];

    // 任务完成情况
    if (data.tasks) {
      if (data.tasks.completion_rate >= 80) {
        highlights.push(`任务完成率达 ${data.tasks.completion_rate}%，表现优秀`);
      } else if (data.tasks.completion_rate < 50) {
        concerns.push(`任务完成率仅 ${data.tasks.completion_rate}%，需要关注`);
      }

      if (data.tasks.completed_count > 0) {
        highlights.push(`本周完成 ${data.tasks.completed_count} 项任务`);
      }
    }

    // 项目进展
    if (data.projects && data.projects.completed.length > 0) {
      highlights.push(`完成 ${data.projects.completed.length} 个项目`);
    }

    // Git贡献
    if (data.git && data.git.commits > 0) {
      highlights.push(`提交 ${data.git.commits} 次代码，新增 ${data.git.additions} 行，删除 ${data.git.deletions} 行`);
    }

    // 工时统计
    if (data.hours && data.hours.total > 0) {
      highlights.push(`本周工作 ${data.hours.total.toFixed(1)} 小时`);
    }

    // 生成标题
    const weekStart = data.metadata?.week_start || '';
    const weekEnd = data.metadata?.week_end || '';
    const title = `周报 ${weekStart} - ${weekEnd}`;

    return {
      title,
      highlights: highlights.length > 0 ? highlights : ['本周工作正常推进'],
      concerns: concerns.length > 0 ? concerns : [],
    };
  }

  /**
   * 验证周报数据的完整性
   * @param data 周报数据
   * @returns 验证结果
   */
  static validateData(data: WeeklyData): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 检查必需字段
    if (!data.metadata || !data.metadata.week_start || !data.metadata.week_end) {
      errors.push('缺少周报时间范围信息');
    }

    // 检查数据完整性
    if (!data.tasks || data.tasks.total === 0) {
      warnings.push('本周没有任务数据');
    }

    if (!data.projects || data.projects.total === 0) {
      warnings.push('没有项目数据');
    }

    if (!data.hours || data.hours.total === 0) {
      warnings.push('没有工时统计数据');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}


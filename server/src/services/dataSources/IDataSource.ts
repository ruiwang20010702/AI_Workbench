/**
 * 数据源接口
 * 定义周报数据聚合的标准接口
 */

/**
 * 周报数据接口
 */
export interface WeeklyData {
  // 任务相关数据
  tasks?: {
    completed: Array<{
      id: string;
      title: string;
      description?: string;
      project_name?: string;
      priority: string;
      completed_at: string;
      tags?: string[];
    }>;
    in_progress: Array<{
      id: string;
      title: string;
      description?: string;
      project_name?: string;
      priority: string;
      progress?: number;
      due_date?: string;
      tags?: string[];
    }>;
    upcoming: Array<{
      id: string;
      title: string;
      description?: string;
      project_name?: string;
      priority: string;
      start_date?: string;
      due_date?: string;
      tags?: string[];
    }>;
    total: number;
    completed_count: number;
    completion_rate: number;
  };

  // 项目相关数据
  projects?: {
    active: Array<{
      id: string;
      name: string;
      description?: string;
      progress: number;
      status: string;
      tasks_completed: number;
      tasks_total: number;
    }>;
    completed: Array<{
      id: string;
      name: string;
      description?: string;
      completed_at: string;
    }>;
    total: number;
  };

  // 笔记相关数据
  notes?: {
    created: Array<{
      id: string;
      title: string;
      tags?: string[];
      created_at: string;
    }>;
    updated: Array<{
      id: string;
      title: string;
      tags?: string[];
      updated_at: string;
    }>;
    total: number;
  };

  // 工时统计
  hours?: {
    total: number;
    by_project?: Record<string, number>;
    by_day?: Record<string, number>;
  };

  // Git统计（如果有）
  git?: {
    commits: number;
    additions: number;
    deletions: number;
    repositories?: string[];
    top_files?: Array<{
      file: string;
      changes: number;
    }>;
  };

  // 日历事件（如果有）
  calendar?: {
    events: Array<{
      title: string;
      start: string;
      end: string;
      type: string;
    }>;
    meetings_count: number;
    total_hours: number;
  };

  // 元数据
  metadata?: {
    data_source: string;
    generated_at: string;
    week_start: string;
    week_end: string;
    [key: string]: any;
  };
}

/**
 * 数据源配置接口
 */
export interface DataSourceConfig {
  enabled: boolean;
  priority?: number; // 数据源优先级
  options?: Record<string, any>;
}

/**
 * 数据源接口定义
 */
export interface IDataSource {
  /**
   * 数据源名称
   */
  readonly name: string;

  /**
   * 数据源描述
   */
  readonly description: string;

  /**
   * 是否启用
   */
  isEnabled(): boolean;

  /**
   * 获取指定周期的数据
   * @param userId 用户ID
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @param config 配置选项
   * @returns 周报数据
   */
  fetchData(
    userId: string,
    startDate: string,
    endDate: string,
    config?: DataSourceConfig
  ): Promise<Partial<WeeklyData>>;

  /**
   * 验证数据源配置
   * @param config 配置选项
   * @returns 是否有效
   */
  validateConfig(config?: DataSourceConfig): Promise<boolean>;

  /**
   * 测试数据源连接
   * @returns 是否连接成功
   */
  testConnection(): Promise<boolean>;
}


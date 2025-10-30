import { supabase } from '../config/supabase';

/**
 * 周报状态类型
 */
export type ReportStatus = 'draft' | 'published' | 'archived';

/**
 * AI建议接口
 */
export interface AISuggestion {
  id: string;
  type: 'improvement' | 'warning' | 'highlight';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  section?: string; // 相关章节
  created_at: string;
}

/**
 * 周报元数据接口
 */
export interface ReportMetadata {
  data_sources?: string[]; // 使用的数据源
  tasks_completed?: number;
  tasks_total?: number;
  completion_rate?: number;
  total_hours?: number;
  project_count?: number;
  note_count?: number;
  git_commits?: number;
  git_additions?: number;
  git_deletions?: number;
  [key: string]: any;
}

/**
 * 周报接口
 */
export interface WeeklyReport {
  id: string;
  user_id: string;
  template_id: string | null;
  title: string;
  week_start_date: string;
  week_end_date: string;
  content: string;
  content_html: string | null;
  format: 'markdown' | 'html' | 'docx';
  status: ReportStatus;
  metadata: ReportMetadata;
  ai_optimized: boolean;
  ai_suggestions: AISuggestion[];
  export_count: number;
  last_exported_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 创建周报数据接口
 */
export interface CreateWeeklyReportData {
  user_id: string;
  template_id?: string;
  title: string;
  week_start_date: string;
  week_end_date: string;
  content: string;
  content_html?: string;
  format?: 'markdown' | 'html' | 'docx';
  status?: ReportStatus;
  metadata?: ReportMetadata;
  ai_optimized?: boolean;
  ai_suggestions?: AISuggestion[];
}

/**
 * 更新周报数据接口
 */
export interface UpdateWeeklyReportData {
  title?: string;
  content?: string;
  content_html?: string;
  status?: ReportStatus;
  metadata?: ReportMetadata;
  ai_optimized?: boolean;
  ai_suggestions?: AISuggestion[];
}

/**
 * 周报查询过滤器接口
 */
export interface WeeklyReportFilters {
  status?: ReportStatus;
  start_date?: string;
  end_date?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * 周报统计信息接口
 */
export interface ReportStatistics {
  total_reports: number;
  draft_reports: number;
  published_reports: number;
  archived_reports: number;
  total_exports: number;
  ai_optimized_count: number;
  average_completion_rate?: number;
  total_hours?: number;
}

/**
 * 周报数据模型
 */
export class WeeklyReportModel {
  /**
   * 根据用户ID获取周报列表
   * @param userId 用户ID
   * @param filters 查询过滤器
   * @returns 周报列表
   */
  static async findByUserId(userId: string, filters: WeeklyReportFilters = {}): Promise<WeeklyReport[]> {
    try {
      let query = supabase
        .from('weekly_reports')
        .select('*')
        .eq('user_id', userId)
        .order('week_start_date', { ascending: false });

      // 应用过滤器
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.start_date) {
        query = query.gte('week_start_date', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('week_end_date', filters.end_date);
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching weekly reports:', error);
        throw new Error(`Failed to fetch weekly reports: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in findByUserId:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取单个周报
   * @param id 周报ID
   * @param userId 用户ID（用于权限验证）
   * @returns 周报对象或null
   */
  static async findById(id: string, userId: string): Promise<WeeklyReport | null> {
    try {
      const { data, error } = await supabase
        .from('weekly_reports')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // 未找到记录
        }
        console.error('Error fetching weekly report:', error);
        throw new Error(`Failed to fetch weekly report: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in findById:', error);
      throw error;
    }
  }

  /**
   * 检查指定周期的周报是否已存在
   * @param userId 用户ID
   * @param startDate 周开始日期
   * @param endDate 周结束日期
   * @returns 已存在的周报或null
   */
  static async findByWeekRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<WeeklyReport | null> {
    try {
      const { data, error } = await supabase
        .from('weekly_reports')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start_date', startDate)
        .eq('week_end_date', endDate)
        .maybeSingle();

      if (error) {
        console.error('Error checking week range:', error);
        throw new Error(`Failed to check week range: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in findByWeekRange:', error);
      throw error;
    }
  }

  /**
   * 创建新周报
   * @param reportData 周报数据
   * @returns 创建的周报对象
   */
  static async create(reportData: CreateWeeklyReportData): Promise<WeeklyReport> {
    try {
      const { data, error } = await supabase
        .from('weekly_reports')
        .insert({
          user_id: reportData.user_id,
          template_id: reportData.template_id || null,
          title: reportData.title,
          week_start_date: reportData.week_start_date,
          week_end_date: reportData.week_end_date,
          content: reportData.content,
          content_html: reportData.content_html || null,
          format: reportData.format || 'markdown',
          status: reportData.status || 'draft',
          metadata: reportData.metadata || {},
          ai_optimized: reportData.ai_optimized || false,
          ai_suggestions: reportData.ai_suggestions || [],
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating weekly report:', error);
        throw new Error(`Failed to create weekly report: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  /**
   * 更新周报
   * @param id 周报ID
   * @param userId 用户ID（用于权限验证）
   * @param updateData 更新数据
   * @returns 更新后的周报对象或null
   */
  static async update(
    id: string,
    userId: string,
    updateData: UpdateWeeklyReportData
  ): Promise<WeeklyReport | null> {
    try {
      // 首先验证用户是否有权限更新
      const report = await this.findById(id, userId);
      if (!report) {
        return null;
      }

      const { data, error } = await supabase
        .from('weekly_reports')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating weekly report:', error);
        throw new Error(`Failed to update weekly report: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  /**
   * 删除周报
   * @param id 周报ID
   * @param userId 用户ID（用于权限验证）
   * @returns 是否删除成功
   */
  static async delete(id: string, userId: string): Promise<boolean> {
    try {
      // 首先验证用户是否有权限删除
      const report = await this.findById(id, userId);
      if (!report) {
        return false;
      }

      const { error } = await supabase
        .from('weekly_reports')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting weekly report:', error);
        throw new Error(`Failed to delete weekly report: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  /**
   * 更新导出计数
   * @param id 周报ID
   * @param userId 用户ID
   * @returns 是否更新成功
   */
  static async incrementExportCount(id: string, userId: string): Promise<boolean> {
    try {
      const report = await this.findById(id, userId);
      if (!report) {
        return false;
      }

      const { error } = await supabase
        .from('weekly_reports')
        .update({
          export_count: report.export_count + 1,
          last_exported_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error incrementing export count:', error);
        throw new Error(`Failed to increment export count: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error in incrementExportCount:', error);
      throw error;
    }
  }

  /**
   * 发布周报
   * @param id 周报ID
   * @param userId 用户ID
   * @returns 更新后的周报或null
   */
  static async publish(id: string, userId: string): Promise<WeeklyReport | null> {
    return this.update(id, userId, { status: 'published' });
  }

  /**
   * 归档周报
   * @param id 周报ID
   * @param userId 用户ID
   * @returns 更新后的周报或null
   */
  static async archive(id: string, userId: string): Promise<WeeklyReport | null> {
    return this.update(id, userId, { status: 'archived' });
  }

  /**
   * 获取用户周报统计信息
   * @param userId 用户ID
   * @returns 统计信息
   */
  static async getStatistics(userId: string): Promise<ReportStatistics> {
    try {
      const { data, error } = await supabase
        .from('weekly_reports')
        .select('status, export_count, ai_optimized, metadata')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching statistics:', error);
        throw new Error(`Failed to fetch statistics: ${error.message}`);
      }

      const reports = data || [];
      const stats: ReportStatistics = {
        total_reports: reports.length,
        draft_reports: reports.filter((r: any) => r.status === 'draft').length,
        published_reports: reports.filter((r: any) => r.status === 'published').length,
        archived_reports: reports.filter((r: any) => r.status === 'archived').length,
        total_exports: reports.reduce((sum: number, r: any) => sum + (r.export_count || 0), 0),
        ai_optimized_count: reports.filter((r: any) => r.ai_optimized).length,
      };

      // 计算平均完成率和总工时
      const metadataWithStats = reports.filter((r: any) => r.metadata);
      if (metadataWithStats.length > 0) {
        const totalCompletionRate = metadataWithStats.reduce(
          (sum: number, r: any) => sum + (r.metadata.completion_rate || 0),
          0
        );
        stats.average_completion_rate = totalCompletionRate / metadataWithStats.length;

        stats.total_hours = metadataWithStats.reduce(
          (sum: number, r: any) => sum + (r.metadata.total_hours || 0),
          0
        );
      }

      return stats;
    } catch (error) {
      console.error('Error in getStatistics:', error);
      throw error;
    }
  }

  /**
   * 获取最近的周报
   * @param userId 用户ID
   * @param limit 数量限制
   * @returns 周报列表
   */
  static async getRecent(userId: string, limit: number = 5): Promise<WeeklyReport[]> {
    return this.findByUserId(userId, { limit });
  }
}


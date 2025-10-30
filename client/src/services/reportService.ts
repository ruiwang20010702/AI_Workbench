import { apiClient } from './apiClient';

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
  section?: string;
  created_at: string;
}

/**
 * 周报元数据接口
 */
export interface ReportMetadata {
  data_sources_used?: string[];
  tasks_completed?: number;
  tasks_total?: number;
  completion_rate?: number;
  total_hours?: number;
  project_count?: number;
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
 * 模板变量定义接口
 */
export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'date' | 'array' | 'object';
  description: string;
  required?: boolean;
  default?: any;
}

/**
 * 周报模板接口
 */
export interface ReportTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  content: string;
  format: 'markdown' | 'html' | 'docx';
  variables: TemplateVariable[];
  is_default: boolean;
  is_public: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

/**
 * 生成周报请求参数
 */
export interface GenerateReportRequest {
  week_start_date: string;
  week_end_date: string;
  template_id?: string;
  title?: string;
  auto_optimize?: boolean;
}

/**
 * 创建模板请求参数
 */
export interface CreateTemplateRequest {
  name: string;
  description?: string;
  content: string;
  format?: 'markdown' | 'html' | 'docx';
  variables?: TemplateVariable[];
  is_default?: boolean;
  is_public?: boolean;
  tags?: string[];
}

/**
 * 周报统计信息
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
 * 周报服务
 */
class ReportService {
  /**
   * 生成周报
   */
  async generateReport(data: GenerateReportRequest): Promise<WeeklyReport> {
    const response = await apiClient.post('/reports/weekly/generate', data);
    return response.data.data;
  }

  /**
   * 获取周报列表
   */
  async getReports(params?: {
    status?: ReportStatus;
    start_date?: string;
    end_date?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: WeeklyReport[]; pagination: any }> {
    const response = await apiClient.get('/reports/weekly', { params });
    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  }

  /**
   * 获取单个周报
   */
  async getReport(id: string): Promise<WeeklyReport> {
    const response = await apiClient.get(`/reports/weekly/${id}`);
    return response.data.data;
  }

  /**
   * 更新周报
   */
  async updateReport(
    id: string,
    data: {
      title?: string;
      content?: string;
      status?: ReportStatus;
    }
  ): Promise<WeeklyReport> {
    const response = await apiClient.put(`/reports/weekly/${id}`, data);
    return response.data.data;
  }

  /**
   * 删除周报
   */
  async deleteReport(id: string): Promise<void> {
    await apiClient.delete(`/reports/weekly/${id}`);
  }

  /**
   * 发布周报
   */
  async publishReport(id: string): Promise<WeeklyReport> {
    const response = await apiClient.post(`/reports/weekly/${id}/publish`);
    return response.data.data;
  }

  /**
   * 导出周报
   * @param id 周报ID
   * @param format 导出格式
   * @returns Blob对象（用于下载）
   */
  async exportReport(id: string, format: 'docx' | 'markdown' | 'html' = 'docx'): Promise<Blob> {
    const response = await apiClient.get(`/reports/weekly/${id}/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * 下载周报
   * @param id 周报ID
   * @param format 导出格式
   * @param filename 文件名
   */
  async downloadReport(
    id: string,
    format: 'docx' | 'markdown' | 'html' = 'docx',
    filename?: string
  ): Promise<void> {
    const blob = await this.exportReport(id, format);

    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // 设置文件名
    const extension = format === 'markdown' ? 'md' : format;
    link.download = filename || `weekly-report-${id}.${extension}`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 释放URL对象
    window.URL.revokeObjectURL(url);
  }

  /**
   * AI优化周报
   */
  async optimizeReport(id: string): Promise<WeeklyReport> {
    const response = await apiClient.post(`/reports/weekly/${id}/optimize`);
    return response.data.data;
  }

  /**
   * 获取AI建议
   */
  async getSuggestions(id: string): Promise<AISuggestion[]> {
    const response = await apiClient.post(`/reports/weekly/${id}/suggestions`);
    return response.data.data;
  }

  /**
   * 获取周报统计
   */
  async getStatistics(): Promise<ReportStatistics> {
    const response = await apiClient.get('/reports/weekly/stats');
    return response.data.data;
  }

  // ==================== 模板相关方法 ====================

  /**
   * 获取模板列表
   */
  async getTemplates(params?: {
    is_default?: boolean;
    is_public?: boolean;
    format?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: ReportTemplate[]; pagination: any }> {
    const response = await apiClient.get('/reports/templates', { params });
    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  }

  /**
   * 获取单个模板
   */
  async getTemplate(id: string): Promise<ReportTemplate> {
    const response = await apiClient.get(`/reports/templates/${id}`);
    return response.data.data;
  }

  /**
   * 创建模板
   */
  async createTemplate(data: CreateTemplateRequest): Promise<ReportTemplate> {
    const response = await apiClient.post('/reports/templates', data);
    return response.data.data;
  }

  /**
   * 更新模板
   */
  async updateTemplate(id: string, data: Partial<CreateTemplateRequest>): Promise<ReportTemplate> {
    const response = await apiClient.put(`/reports/templates/${id}`, data);
    return response.data.data;
  }

  /**
   * 删除模板
   */
  async deleteTemplate(id: string): Promise<void> {
    await apiClient.delete(`/reports/templates/${id}`);
  }

  /**
   * 设置默认模板
   */
  async setDefaultTemplate(id: string): Promise<void> {
    await apiClient.post(`/reports/templates/${id}/set-default`);
  }

  /**
   * 预览模板
   */
  async previewTemplate(
    id: string,
    data: any
  ): Promise<{ markdown: string; html: string }> {
    const response = await apiClient.post(`/reports/templates/${id}/preview`, { data });
    return response.data.data;
  }

  /**
   * 获取公共模板
   */
  async getPublicTemplates(): Promise<ReportTemplate[]> {
    const response = await apiClient.get('/reports/templates/public');
    return response.data.data;
  }

  // ==================== 工具方法 ====================

  /**
   * 获取当前周的起止日期
   */
  getCurrentWeekRange(): { start: string; end: string } {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0],
    };
  }

  /**
   * 获取上周的起止日期
   */
  getLastWeekRange(): { start: string; end: string } {
    const currentWeek = this.getCurrentWeekRange();
    const lastWeekStart = new Date(currentWeek.start);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const lastWeekEnd = new Date(currentWeek.end);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

    return {
      start: lastWeekStart.toISOString().split('T')[0],
      end: lastWeekEnd.toISOString().split('T')[0],
    };
  }

  /**
   * 格式化日期范围
   */
  formatWeekRange(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
      });
    };

    return `${formatDate(start)} - ${formatDate(end)}`;
  }
}

export default new ReportService();


import { Request, Response } from 'express';
import { WeeklyReportModel, CreateWeeklyReportData } from '../models/WeeklyReport';
import { ReportTemplateModel } from '../models/ReportTemplate';
import { WeeklyReportAggregator } from '../services/WeeklyReportAggregator';
import { TemplateEngine } from '../services/TemplateEngine';
import { DocxGenerator } from '../services/DocxGenerator';
import { AIReportOptimizer } from '../services/AIReportOptimizer';

/**
 * 生成周报
 * POST /api/reports/weekly/generate
 */
export const generateWeeklyReport = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { week_start_date, week_end_date, template_id, title, auto_optimize } = req.body;

    // 验证必需参数
    if (!week_start_date || !week_end_date) {
      return res.status(400).json({ error: 'week_start_date and week_end_date are required' });
    }

    // 检查是否已存在该周期的周报
    const existingReport = await WeeklyReportModel.findByWeekRange(
      userId,
      week_start_date,
      week_end_date
    );

    if (existingReport) {
      return res.status(409).json({
        error: 'Weekly report for this period already exists',
        report_id: existingReport.id,
      });
    }

    console.log(`[WeeklyReport] Generating report for user ${userId}, period: ${week_start_date} to ${week_end_date}`);

    // 1. 聚合周报数据
    const weeklyData = await WeeklyReportAggregator.aggregate(
      userId,
      week_start_date,
      week_end_date
    );

    // 2. 获取模板
    let template;
    if (template_id) {
      template = await ReportTemplateModel.findById(template_id, userId);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
    } else {
      // 使用默认模板
      template = await ReportTemplateModel.getDefaultTemplate(userId);
      if (!template) {
        return res.status(500).json({ error: 'No default template available' });
      }
    }

    // 3. 准备模板数据
    const summary = WeeklyReportAggregator.generateSummary(weeklyData);
    const templateData = {
      ...weeklyData,
      ...summary,
      title: title || summary.title,
      week_start_date,
      week_end_date,
    };

    // 4. 渲染模板
    let content = TemplateEngine.renderMarkdown(template.content, templateData);

    // 5. 生成HTML（用于预览）
    const contentHtml = await TemplateEngine.markdownToHtml(content);

    // 6. AI优化（如果需要）
    let aiOptimized = false;
    let aiSuggestions: any[] = [];

    if (auto_optimize) {
      try {
        content = await AIReportOptimizer.optimizeContent(content);
        aiSuggestions = await AIReportOptimizer.generateSuggestions(content, weeklyData.metadata);
        aiOptimized = true;
      } catch (error) {
        console.error('[WeeklyReport] AI optimization failed:', error);
        // AI优化失败不影响周报生成
      }
    }

    // 7. 创建周报记录
    const reportData: CreateWeeklyReportData = {
      user_id: userId,
      template_id: template.id,
      title: templateData.title,
      week_start_date,
      week_end_date,
      content,
      content_html: contentHtml,
      format: 'markdown',
      status: 'draft',
      metadata: weeklyData.metadata || {},
      ai_optimized: aiOptimized,
      ai_suggestions: aiSuggestions,
    };

    const report = await WeeklyReportModel.create(reportData);

    console.log(`[WeeklyReport] Report generated successfully: ${report.id}`);

    return res.status(201).json({
      success: true,
      data: report,
      message: 'Weekly report generated successfully',
    });
  } catch (error) {
    console.error('[WeeklyReport] Error generating report:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * 获取周报列表
 * GET /api/reports/weekly
 */
export const getWeeklyReports = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { status, start_date, end_date, search, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const reports = await WeeklyReportModel.findByUserId(userId, {
      status: status as any,
      start_date: start_date as string,
      end_date: end_date as string,
      search: search as string,
      limit: limitNum,
      offset,
    });

    return res.json({
      success: true,
      data: reports,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: reports.length,
      },
    });
  } catch (error) {
    console.error('[WeeklyReport] Error fetching reports:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 获取单个周报详情
 * GET /api/reports/weekly/:id
 */
export const getWeeklyReport = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const report = await WeeklyReportModel.findById(id, userId);
    if (!report) {
      return res.status(404).json({ error: 'Weekly report not found' });
    }

    return res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('[WeeklyReport] Error fetching report:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 更新周报
 * PUT /api/reports/weekly/:id
 */
export const updateWeeklyReport = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { title, content, status } = req.body;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (content) {
      updateData.content = content;
      // 重新生成HTML
      updateData.content_html = await TemplateEngine.markdownToHtml(content);
    }
    if (status) updateData.status = status;

    const report = await WeeklyReportModel.update(id, userId, updateData);
    if (!report) {
      return res.status(404).json({ error: 'Weekly report not found' });
    }

    return res.json({
      success: true,
      data: report,
      message: 'Weekly report updated successfully',
    });
  } catch (error) {
    console.error('[WeeklyReport] Error updating report:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 删除周报
 * DELETE /api/reports/weekly/:id
 */
export const deleteWeeklyReport = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const success = await WeeklyReportModel.delete(id, userId);
    if (!success) {
      return res.status(404).json({ error: 'Weekly report not found' });
    }

    return res.json({
      success: true,
      message: 'Weekly report deleted successfully',
    });
  } catch (error) {
    console.error('[WeeklyReport] Error deleting report:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 发布周报
 * POST /api/reports/weekly/:id/publish
 */
export const publishWeeklyReport = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const report = await WeeklyReportModel.publish(id, userId);
    if (!report) {
      return res.status(404).json({ error: 'Weekly report not found' });
    }

    return res.json({
      success: true,
      data: report,
      message: 'Weekly report published successfully',
    });
  } catch (error) {
    console.error('[WeeklyReport] Error publishing report:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 导出周报（Docx格式）
 * GET /api/reports/weekly/:id/export
 */
export const exportWeeklyReport = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { format = 'docx' } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const report = await WeeklyReportModel.findById(id, userId);
    if (!report) {
      return res.status(404).json({ error: 'Weekly report not found' });
    }

    // 更新导出计数
    await WeeklyReportModel.incrementExportCount(id, userId);

    if (format === 'docx') {
      // 生成Docx文档
      const buffer = await DocxGenerator.generateFromMarkdown(report.content, report.title);

      // 设置响应头
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="weekly-report-${id}.docx"`);

      return res.send(buffer);
    } else if (format === 'markdown' || format === 'md') {
      // 导出Markdown
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="weekly-report-${id}.md"`);

      return res.send(report.content);
    } else if (format === 'html') {
      // 导出HTML
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="weekly-report-${id}.html"`);

      return res.send(report.content_html || '');
    } else {
      return res.status(400).json({ error: 'Unsupported export format' });
    }
  } catch (error) {
    console.error('[WeeklyReport] Error exporting report:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * AI优化周报
 * POST /api/reports/weekly/:id/optimize
 */
export const optimizeWeeklyReport = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const report = await WeeklyReportModel.findById(id, userId);
    if (!report) {
      return res.status(404).json({ error: 'Weekly report not found' });
    }

    // AI优化内容
    const optimizedContent = await AIReportOptimizer.optimizeContent(report.content);
    const contentHtml = await TemplateEngine.markdownToHtml(optimizedContent);

    // 更新周报
    const updatedReport = await WeeklyReportModel.update(id, userId, {
      content: optimizedContent,
      content_html: contentHtml,
      ai_optimized: true,
    });

    return res.json({
      success: true,
      data: updatedReport,
      message: 'Weekly report optimized successfully',
    });
  } catch (error) {
    console.error('[WeeklyReport] Error optimizing report:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 获取AI建议
 * POST /api/reports/weekly/:id/suggestions
 */
export const getSuggestions = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const report = await WeeklyReportModel.findById(id, userId);
    if (!report) {
      return res.status(404).json({ error: 'Weekly report not found' });
    }

    // 生成AI建议
    const suggestions = await AIReportOptimizer.generateSuggestions(
      report.content,
      report.metadata
    );

    // 更新周报的建议列表
    await WeeklyReportModel.update(id, userId, {
      ai_suggestions: suggestions,
    });

    return res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error('[WeeklyReport] Error generating suggestions:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 获取周报统计
 * GET /api/reports/weekly/stats
 */
export const getWeeklyReportStats = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const stats = await WeeklyReportModel.getStatistics(userId);

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[WeeklyReport] Error fetching stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


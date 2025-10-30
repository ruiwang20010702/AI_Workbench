import { Request, Response } from 'express';
import { ReportTemplateModel, CreateTemplateData } from '../models/ReportTemplate';
import { TemplateEngine } from '../services/TemplateEngine';

/**
 * 获取模板列表
 * GET /api/reports/templates
 */
export const getTemplates = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { is_default, is_public, format, search, page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const templates = await ReportTemplateModel.findByUserId(userId, {
      is_default: is_default === 'true' ? true : is_default === 'false' ? false : undefined,
      is_public: is_public === 'true' ? true : is_public === 'false' ? false : undefined,
      format: format as string,
      search: search as string,
      limit: limitNum,
      offset,
    });

    return res.json({
      success: true,
      data: templates,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: templates.length,
      },
    });
  } catch (error) {
    console.error('[Template] Error fetching templates:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 获取单个模板
 * GET /api/reports/templates/:id
 */
export const getTemplate = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const template = await ReportTemplateModel.findById(id, userId);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    return res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('[Template] Error fetching template:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 创建模板
 * POST /api/reports/templates
 */
export const createTemplate = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, description, content, format, variables, is_default, is_public, tags } = req.body;

    // 验证必需字段
    if (!name || !content) {
      return res.status(400).json({ error: 'name and content are required' });
    }

    // 验证模板语法
    const validation = TemplateEngine.validateTemplate(content);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid template syntax',
        details: validation.errors,
      });
    }

    const templateData: CreateTemplateData = {
      user_id: userId,
      name,
      description,
      content,
      format: format || 'markdown',
      variables: variables || [],
      is_default: is_default || false,
      is_public: is_public || false,
      tags: tags || [],
    };

    const template = await ReportTemplateModel.create(templateData);

    return res.status(201).json({
      success: true,
      data: template,
      message: 'Template created successfully',
    });
  } catch (error) {
    console.error('[Template] Error creating template:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 更新模板
 * PUT /api/reports/templates/:id
 */
export const updateTemplate = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, description, content, format, variables, is_default, is_public, tags } = req.body;

    // 如果更新了内容，验证模板语法
    if (content) {
      const validation = TemplateEngine.validateTemplate(content);
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Invalid template syntax',
          details: validation.errors,
        });
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (content) updateData.content = content;
    if (format) updateData.format = format;
    if (variables) updateData.variables = variables;
    if (is_default !== undefined) updateData.is_default = is_default;
    if (is_public !== undefined) updateData.is_public = is_public;
    if (tags) updateData.tags = tags;

    const template = await ReportTemplateModel.update(id, userId, updateData);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    return res.json({
      success: true,
      data: template,
      message: 'Template updated successfully',
    });
  } catch (error) {
    console.error('[Template] Error updating template:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 删除模板
 * DELETE /api/reports/templates/:id
 */
export const deleteTemplate = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const success = await ReportTemplateModel.delete(id, userId);
    if (!success) {
      return res.status(404).json({ error: 'Template not found' });
    }

    return res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('[Template] Error deleting template:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 设置默认模板
 * POST /api/reports/templates/:id/set-default
 */
export const setDefaultTemplate = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const success = await ReportTemplateModel.setAsDefault(id, userId);
    if (!success) {
      return res.status(404).json({ error: 'Template not found' });
    }

    return res.json({
      success: true,
      message: 'Default template set successfully',
    });
  } catch (error) {
    console.error('[Template] Error setting default template:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 预览模板
 * POST /api/reports/templates/:id/preview
 */
export const previewTemplate = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { data } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const template = await ReportTemplateModel.findById(id, userId);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // 渲染模板
    const rendered = TemplateEngine.renderMarkdown(template.content, data || {});
    const html = await TemplateEngine.markdownToHtml(rendered);

    return res.json({
      success: true,
      data: {
        markdown: rendered,
        html,
      },
    });
  } catch (error) {
    console.error('[Template] Error previewing template:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 获取公共模板
 * GET /api/reports/templates/public
 */
export const getPublicTemplates = async (req: Request, res: Response): Promise<Response> => {
  try {
    const templates = await ReportTemplateModel.getPublicTemplates();

    return res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('[Template] Error fetching public templates:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


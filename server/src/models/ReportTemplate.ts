 import { supabase } from '../config/supabase';

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
 * 创建模板数据接口
 */
export interface CreateTemplateData {
  user_id: string;
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
 * 更新模板数据接口
 */
export interface UpdateTemplateData {
  name?: string;
  description?: string;
  content?: string;
  format?: 'markdown' | 'html' | 'docx';
  variables?: TemplateVariable[];
  is_default?: boolean;
  is_public?: boolean;
  tags?: string[];
}

/**
 * 模板查询过滤器接口
 */
export interface TemplateFilters {
  is_default?: boolean;
  is_public?: boolean;
  format?: string;
  search?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

/**
 * 周报模板数据模型
 */
export class ReportTemplateModel {
  /**
   * 根据用户ID获取模板列表
   * @param userId 用户ID
   * @param filters 查询过滤器
   * @returns 模板列表
   */
  static async findByUserId(userId: string, filters: TemplateFilters = {}): Promise<ReportTemplate[]> {
    try {
      let query = supabase
        .from('report_templates')
        .select('*')
        .or(`user_id.eq.${userId},is_public.eq.true`)
        .order('created_at', { ascending: false });

      // 应用过滤器
      if (filters.is_default !== undefined) {
        query = query.eq('is_default', filters.is_default);
      }

      if (filters.format) {
        query = query.eq('format', filters.format);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching templates:', error);
        throw new Error(`Failed to fetch templates: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in findByUserId:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取单个模板
   * @param id 模板ID
   * @param userId 用户ID（用于权限验证）
   * @returns 模板对象或null
   */
  static async findById(id: string, userId: string): Promise<ReportTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .eq('id', id)
        .or(`user_id.eq.${userId},is_public.eq.true`)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // 未找到记录
        }
        console.error('Error fetching template:', error);
        throw new Error(`Failed to fetch template: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in findById:', error);
      throw error;
    }
  }

  /**
   * 获取用户的默认模板
   * @param userId 用户ID
   * @returns 默认模板或null
   */
  static async getDefaultTemplate(userId: string): Promise<ReportTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching default template:', error);
        throw new Error(`Failed to fetch default template: ${error.message}`);
      }

      // 如果用户没有默认模板，返回系统公共默认模板
      if (!data) {
        const { data: publicTemplate, error: publicError } = await supabase
          .from('report_templates')
          .select('*')
          .eq('is_default', true)
          .eq('is_public', true)
          .limit(1)
          .maybeSingle();

        if (publicError) {
          console.error('Error fetching public default template:', publicError);
          return null;
        }

        return publicTemplate;
      }

      return data;
    } catch (error) {
      console.error('Error in getDefaultTemplate:', error);
      throw error;
    }
  }

  /**
   * 创建新模板
   * @param templateData 模板数据
   * @returns 创建的模板对象
   */
  static async create(templateData: CreateTemplateData): Promise<ReportTemplate> {
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .insert({
          user_id: templateData.user_id,
          name: templateData.name,
          description: templateData.description || null,
          content: templateData.content,
          format: templateData.format || 'markdown',
          variables: templateData.variables || [],
          is_default: templateData.is_default || false,
          is_public: templateData.is_public || false,
          tags: templateData.tags || [],
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating template:', error);
        throw new Error(`Failed to create template: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  /**
   * 更新模板
   * @param id 模板ID
   * @param userId 用户ID（用于权限验证）
   * @param updateData 更新数据
   * @returns 更新后的模板对象或null
   */
  static async update(
    id: string,
    userId: string,
    updateData: UpdateTemplateData
  ): Promise<ReportTemplate | null> {
    try {
      // 首先验证用户是否有权限更新
      const template = await this.findById(id, userId);
      if (!template || template.user_id !== userId) {
        return null;
      }

      const { data, error } = await supabase
        .from('report_templates')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating template:', error);
        throw new Error(`Failed to update template: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  /**
   * 删除模板
   * @param id 模板ID
   * @param userId 用户ID（用于权限验证）
   * @returns 是否删除成功
   */
  static async delete(id: string, userId: string): Promise<boolean> {
    try {
      // 首先验证用户是否有权限删除
      const template = await this.findById(id, userId);
      if (!template || template.user_id !== userId) {
        return false;
      }

      const { error } = await supabase
        .from('report_templates')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting template:', error);
        throw new Error(`Failed to delete template: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  /**
   * 设置默认模板
   * @param id 模板ID
   * @param userId 用户ID
   * @returns 是否设置成功
   */
  static async setAsDefault(id: string, userId: string): Promise<boolean> {
    try {
      // 首先取消当前的默认模板
      await supabase
        .from('report_templates')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true);

      // 设置新的默认模板
      const { error } = await supabase
        .from('report_templates')
        .update({ is_default: true })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error setting default template:', error);
        throw new Error(`Failed to set default template: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error in setAsDefault:', error);
      throw error;
    }
  }

  /**
   * 获取公共模板列表
   * @param filters 查询过滤器
   * @returns 公共模板列表
   */
  static async getPublicTemplates(filters: TemplateFilters = {}): Promise<ReportTemplate[]> {
    try {
      let query = supabase
        .from('report_templates')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      // 应用过滤器
      if (filters.is_default !== undefined) {
        query = query.eq('is_default', filters.is_default);
      }

      if (filters.format) {
        query = query.eq('format', filters.format);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching public templates:', error);
        throw new Error(`Failed to fetch public templates: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPublicTemplates:', error);
      throw error;
    }
  }
}


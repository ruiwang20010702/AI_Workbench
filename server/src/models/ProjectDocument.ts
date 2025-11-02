/**
 * 项目文档模型
 * 处理项目文档的 CRUD 操作和版本管理
 */

import { supabaseAdmin } from '../config/database';

/**
 * 文档数据接口
 */
export interface DocumentData {
  id: string;
  project_id: string;
  title: string;
  content?: string; // 旧字段，保留兼容
  file_path: string;
  file_size: number;
  mime_type: string;
  version: number;
  parent_document_id: string | null;
  is_latest: boolean;
  type?: string; // 旧字段，保留兼容
  creator_id: string;
  created_at: string;
  updated_at: string;
  // 关联数据
  creator?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
}

/**
 * 创建文档 DTO
 */
export interface CreateDocumentDTO {
  project_id: string;
  title: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  creator_id: string;
  version?: number;
  parent_document_id?: string | null;
  is_latest?: boolean;
}

/**
 * 更新文档 DTO
 */
export interface UpdateDocumentDTO {
  title?: string;
  content?: string;
  type?: string;
}

/**
 * 项目文档模型
 */
export class ProjectDocument {
  /**
   * 创建文档
   */
  static async create(data: CreateDocumentDTO): Promise<DocumentData> {
    const { data: document, error } = await supabaseAdmin
      .from('project_documents')
      .insert({
        project_id: data.project_id,
        title: data.title,
        file_path: data.file_path,
        file_size: data.file_size,
        mime_type: data.mime_type,
        creator_id: data.creator_id,
        version: data.version || 1,
        parent_document_id: data.parent_document_id || null,
        is_latest: data.is_latest !== false
      })
      .select(`
        *,
        creator:users!creator_id(id, display_name, avatar_url)
      `)
      .single();

    if (error) {
      throw new Error(`创建文档失败: ${error.message}`);
    }

    return document;
  }

  /**
   * 获取项目文档列表
   */
  static async findByProjectId(
    projectId: string,
    latestOnly: boolean = true
  ): Promise<DocumentData[]> {
    let query = supabaseAdmin
      .from('project_documents')
      .select(`
        *,
        creator:users!creator_id(id, display_name, avatar_url)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (latestOnly) {
      query = query.eq('is_latest', true);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`获取文档列表失败: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 获取单个文档
   */
  static async findById(id: string): Promise<DocumentData | null> {
    const { data, error } = await supabaseAdmin
      .from('project_documents')
      .select(`
        *,
        creator:users!creator_id(id, display_name, avatar_url)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 未找到记录
        return null;
      }
      throw new Error(`获取文档失败: ${error.message}`);
    }

    return data;
  }

  /**
   * 根据文件名查找文档 (最新版本)
   */
  static async findByFilename(
    projectId: string,
    filename: string
  ): Promise<DocumentData | null> {
    const { data, error } = await supabaseAdmin
      .from('project_documents')
      .select()
      .eq('project_id', projectId)
      .eq('title', filename)
      .eq('is_latest', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`查找文档失败: ${error.message}`);
    }

    return data;
  }

  /**
   * 更新文档
   */
  static async update(id: string, data: UpdateDocumentDTO): Promise<DocumentData> {
    const { data: document, error } = await supabaseAdmin
      .from('project_documents')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        creator:users!creator_id(id, display_name, avatar_url)
      `)
      .single();

    if (error) {
      throw new Error(`更新文档失败: ${error.message}`);
    }

    return document;
  }

  /**
   * 标记文档为非最新版本
   */
  static async markAsNotLatest(documentId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('project_documents')
      .update({
        is_latest: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (error) {
      throw new Error(`更新文档状态失败: ${error.message}`);
    }
  }

  /**
   * 创建新版本
   */
  static async createNewVersion(
    parentId: string,
    data: CreateDocumentDTO
  ): Promise<DocumentData> {
    const parent = await this.findById(parentId);
    if (!parent) {
      throw new Error('父文档不存在');
    }

    return this.create({
      ...data,
      version: parent.version + 1,
      parent_document_id: parentId,
      is_latest: true
    });
  }

  /**
   * 获取文档的所有版本
   */
  static async findVersions(documentId: string): Promise<DocumentData[]> {
    // 获取当前文档
    const current = await this.findById(documentId);
    if (!current) {
      throw new Error('文档不存在');
    }

    // 获取根文档 ID (如果有父文档，使用父文档ID，否则使用当前ID)
    const rootId = current.parent_document_id || current.id;

    // 查询所有相关版本
    const { data, error } = await supabaseAdmin
      .from('project_documents')
      .select(`
        *,
        creator:users!creator_id(id, display_name, avatar_url)
      `)
      .or(`id.eq.${rootId},parent_document_id.eq.${rootId}`)
      .order('version', { ascending: false });

    if (error) {
      throw new Error(`获取版本列表失败: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 恢复版本 (创建新版本)
   */
  static async restoreVersion(
    versionId: string,
    currentLatestId: string,
    userId: string,
    newFilePath: string
  ): Promise<DocumentData> {
    const oldVersion = await this.findById(versionId);
    if (!oldVersion) {
      throw new Error('要恢复的版本不存在');
    }

    const currentLatest = await this.findById(currentLatestId);
    if (!currentLatest) {
      throw new Error('当前文档不存在');
    }

    // 标记当前最新版本为非最新
    await this.markAsNotLatest(currentLatestId);

    // 创建新版本
    return this.create({
      project_id: oldVersion.project_id,
      title: oldVersion.title,
      file_path: newFilePath,
      file_size: oldVersion.file_size,
      mime_type: oldVersion.mime_type,
      creator_id: userId,
      version: currentLatest.version + 1,
      parent_document_id: currentLatest.parent_document_id || currentLatest.id,
      is_latest: true
    });
  }

  /**
   * 删除文档
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('project_documents')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`删除文档失败: ${error.message}`);
    }
  }

  /**
   * 批量删除项目文档
   */
  static async deleteByProjectId(projectId: string): Promise<number> {
    const { data, error } = await supabaseAdmin
      .from('project_documents')
      .delete()
      .eq('project_id', projectId)
      .select();

    if (error) {
      throw new Error(`批量删除文档失败: ${error.message}`);
    }

    return data?.length || 0;
  }

  /**
   * 获取文档统计信息
   */
  static async getStatistics(projectId: string): Promise<{
    total_documents: number;
    total_size: number;
    file_types: Record<string, number>;
  }> {
    const { data, error } = await supabaseAdmin
      .from('project_documents')
      .select('file_size, mime_type')
      .eq('project_id', projectId)
      .eq('is_latest', true);

    if (error) {
      throw new Error(`获取文档统计失败: ${error.message}`);
    }

    const documents = data || [];
    const totalSize = documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0);
    
    const fileTypes: Record<string, number> = {};
    documents.forEach((doc) => {
      const type = doc.mime_type || 'unknown';
      fileTypes[type] = (fileTypes[type] || 0) + 1;
    });

    return {
      total_documents: documents.length,
      total_size: totalSize,
      file_types: fileTypes
    };
  }
}


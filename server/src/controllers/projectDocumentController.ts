/**
 * 项目文档控制器
 * 处理文档的上传、下载、删除、预览和版本管理
 */

import { Request, Response } from 'express';
import { ProjectDocument } from '../models/ProjectDocument';
import { supabaseStorageService } from '../services/SupabaseStorageService';

/**
 * 临时文件存储
 * 生产环境建议使用 Redis
 */
interface TempFileInfo {
  temp_id: string;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  user_id: string;
  created_at: string;
}

// 使用全局变量模拟临时存储 (生产环境应使用 Redis)
declare global {
  var tempFiles: Map<string, TempFileInfo> | undefined;
}

global.tempFiles = global.tempFiles || new Map();

/**
 * 项目文档控制器类
 */
export class ProjectDocumentController {
  /**
   * 上传文档
   * POST /api/projects/:projectId/documents
   */
  async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id;
      const file = req.file;

      if (!file) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: '请选择文件' }
        });
        return;
      }

      // 修复中文文件名乱码问题
      // Multer 在处理 multipart/form-data 时，originalname 可能被错误编码为 latin1
      // 需要将其重新编码为 UTF-8
      const originalFilename = Buffer.from(file.originalname, 'latin1').toString('utf8');
      
      console.log(`[上传] 原始文件名 (latin1): ${file.originalname}`);
      console.log(`[上传] 修正文件名 (utf8): ${originalFilename}`);

      // 保存文件到项目目录 (Supabase Storage)
      const filePath = await supabaseStorageService.saveFile(file, projectId);

      // 检查是否有同名文件 (版本控制)
      const existingDoc = await ProjectDocument.findByFilename(
        projectId,
        originalFilename
      );

      let document;
      if (existingDoc) {
        // 同名文件存在，创建新版本
        await ProjectDocument.markAsNotLatest(existingDoc.id);
        document = await ProjectDocument.createNewVersion(existingDoc.id, {
          project_id: projectId,
          title: originalFilename,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.mimetype,
          creator_id: userId!
        });

        console.log(`文档新版本创建: ${originalFilename} (版本 ${document.version})`);
      } else {
        // 新文档
        document = await ProjectDocument.create({
          project_id: projectId,
          title: originalFilename,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.mimetype,
          creator_id: userId!
        });

        console.log(`文档上传成功: ${originalFilename}`);
      }

      res.status(201).json({
        success: true,
        data: document
      });
    } catch (error) {
      console.error('文档上传失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: error instanceof Error ? error.message : '文件上传失败'
        }
      });
    }
  }

  /**
   * 获取文档列表
   * GET /api/projects/:projectId/documents
   */
  async getDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const latestOnly = req.query.latestOnly !== 'false';

      const documents = await ProjectDocument.findByProjectId(projectId, latestOnly);

      res.json({
        success: true,
        data: documents
      });
    } catch (error) {
      console.error('获取文档列表失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: '获取文档列表失败'
        }
      });
    }
  }

  /**
   * 下载文档
   * GET /api/projects/:projectId/documents/:documentId/download
   */
  async downloadDocument(req: Request, res: Response): Promise<void> {
    try {
      const { projectId, documentId } = req.params;

      const document = await ProjectDocument.findById(documentId);
      if (!document) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: '文档不存在' }
        });
        return;
      }

      if (document.project_id !== projectId) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: '无权访问此文档' }
        });
        return;
      }

      const fileStream = await supabaseStorageService.getFileStream(document.file_path);

      res.setHeader('Content-Type', document.mime_type);
      // RFC 5987 标准格式，支持中文文件名
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(document.title)}"; filename*=UTF-8''${encodeURIComponent(document.title)}`
      );
      // 不设置 Content-Length，让 Express 自动处理
      // res.setHeader('Content-Length', document.file_size);

      fileStream.pipe(res);

      console.log(`文档下载: ${document.title} by ${req.user?.id}`);
    } catch (error) {
      console.error('文档下载失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DOWNLOAD_FAILED',
          message: '文档下载失败'
        }
      });
    }
  }

  /**
   * 预览文档
   * GET /api/projects/:projectId/documents/:documentId/preview
   */
  async previewDocument(req: Request, res: Response): Promise<void> {
    try {
      const { projectId, documentId } = req.params;

      const document = await ProjectDocument.findById(documentId);
      if (!document) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: '文档不存在' }
        });
        return;
      }

      if (document.project_id !== projectId) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: '无权访问此文档' }
        });
        return;
      }

      const fileStream = await supabaseStorageService.getFileStream(document.file_path);

      // 设置响应头 (inline 表示在浏览器中打开)
      res.setHeader('Content-Type', document.mime_type);
      // RFC 5987 标准格式，支持中文文件名
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(document.title)}"; filename*=UTF-8''${encodeURIComponent(document.title)}`
      );
      // 不设置 Content-Length，让 Express 自动处理
      // res.setHeader('Content-Length', document.file_size);
      res.setHeader('Access-Control-Allow-Origin', '*');

      fileStream.pipe(res);

      console.log(`文档预览: ${document.title} by ${req.user?.id}`);
    } catch (error) {
      console.error('文档预览失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PREVIEW_FAILED',
          message: '文档预览失败'
        }
      });
    }
  }

  /**
   * 删除文档
   * DELETE /api/projects/:projectId/documents/:documentId
   */
  async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const { projectId, documentId } = req.params;
      const userId = req.user?.id;

      const document = await ProjectDocument.findById(documentId);
      if (!document) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: '文档不存在' }
        });
        return;
      }

      if (document.project_id !== projectId) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: '无权访问此文档' }
        });
        return;
      }

      // 权限检查在中间件中完成 (checkDocumentOwner)

      // 删除文件 (Supabase Storage)
      await supabaseStorageService.deleteFile(document.file_path);

      // 删除数据库记录
      await ProjectDocument.delete(documentId);

      console.log(`文档删除成功: ${document.title} by ${userId}`);

      res.json({
        success: true,
        message: '文档删除成功'
      });
    } catch (error) {
      console.error('文档删除失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: '文档删除失败'
        }
      });
    }
  }

  /**
   * 获取文档版本列表
   * GET /api/projects/:projectId/documents/:documentId/versions
   */
  async getVersions(req: Request, res: Response): Promise<void> {
    try {
      const { projectId, documentId } = req.params;

      const document = await ProjectDocument.findById(documentId);
      if (!document || document.project_id !== projectId) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: '文档不存在' }
        });
        return;
      }

      const versions = await ProjectDocument.findVersions(documentId);

      res.json({
        success: true,
        data: versions
      });
    } catch (error) {
      console.error('获取版本列表失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_VERSIONS_FAILED',
          message: '获取版本列表失败'
        }
      });
    }
  }

  /**
   * 恢复文档版本
   * POST /api/projects/:projectId/documents/:documentId/restore
   */
  async restoreVersion(req: Request, res: Response): Promise<void> {
    try {
      const { projectId, documentId } = req.params;
      const { versionId } = req.body;
      const userId = req.user?.id;

      if (!versionId) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: '请提供版本ID' }
        });
        return;
      }

      // 验证文档存在
      const document = await ProjectDocument.findById(documentId);
      if (!document || document.project_id !== projectId) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: '文档不存在' }
        });
        return;
      }

      // 获取要恢复的版本
      const oldVersion = await ProjectDocument.findById(versionId);
      if (!oldVersion) {
        res.status(404).json({
          success: false,
          error: { code: 'VERSION_NOT_FOUND', message: '版本不存在' }
        });
        return;
      }

      // 复制旧版本文件 (Supabase Storage)
      const newFilePath = await supabaseStorageService.copyFile(
        oldVersion.file_path,
        projectId
      );

      // 恢复版本 (创建新版本)
      const restoredDoc = await ProjectDocument.restoreVersion(
        versionId,
        documentId,
        userId!,
        newFilePath
      );

      console.log(`版本恢复成功: 从版本 ${oldVersion.version} 恢复到版本 ${restoredDoc.version}`);

      res.json({
        success: true,
        data: restoredDoc,
        message: `已恢复为版本 ${restoredDoc.version}`
      });
    } catch (error) {
      console.error('版本恢复失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'RESTORE_FAILED',
          message: error instanceof Error ? error.message : '版本恢复失败'
        }
      });
    }
  }

  /**
   * 临时上传
   * POST /api/uploads/temp
   */
  async uploadTemp(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const file = req.file;

      if (!file) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: '请选择文件' }
        });
        return;
      }

      // 修复中文文件名乱码问题
      const originalFilename = Buffer.from(file.originalname, 'latin1').toString('utf8');

      // 保存临时文件 (Supabase Storage)
      const { tempId, filePath } = await supabaseStorageService.saveTempFile(file);

      // 记录临时文件信息
      const tempFile: TempFileInfo = {
        temp_id: tempId,
        filename: originalFilename,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.mimetype,
        user_id: userId!,
        created_at: new Date().toISOString()
      };

      global.tempFiles!.set(tempId, tempFile);

      console.log(`临时文件上传: ${originalFilename} (${tempId})`);

      res.status(201).json({
        success: true,
        data: {
          temp_id: tempId,
          filename: originalFilename,
          file_size: file.size,
          mime_type: file.mimetype
        }
      });
    } catch (error) {
      console.error('临时文件上传失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: '文件上传失败'
        }
      });
    }
  }

  /**
   * 关联临时文件到项目
   * POST /api/projects/:projectId/documents/attach
   */
  async attachTempFiles(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const { temp_ids } = req.body;
      const userId = req.user?.id;

      if (!temp_ids || !Array.isArray(temp_ids)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: '请提供临时文件ID列表' }
        });
        return;
      }

      const tempFiles = global.tempFiles!;
      const attachedDocs = [];

      for (const tempId of temp_ids) {
        const tempFile = tempFiles.get(tempId);
        if (!tempFile) {
          console.warn(`临时文件不存在: ${tempId}`);
          continue;
        }

        // 移动文件到项目目录 (Supabase Storage)
        const newFilePath = await supabaseStorageService.moveTempFile(
          tempFile.file_path,
          projectId
        );

        // 创建文档记录
        const document = await ProjectDocument.create({
          project_id: projectId,
          title: tempFile.filename,
          file_path: newFilePath,
          file_size: tempFile.file_size,
          mime_type: tempFile.mime_type,
          creator_id: userId!
        });

        attachedDocs.push(document);

        // 删除临时记录
        tempFiles.delete(tempId);
      }

      console.log(`临时文件关联成功: ${attachedDocs.length} 个文件`);

      res.json({
        success: true,
        data: {
          attached_count: attachedDocs.length,
          documents: attachedDocs
        }
      });
    } catch (error) {
      console.error('临时文件关联失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'ATTACH_FAILED',
          message: '文件关联失败'
        }
      });
    }
  }

  /**
   * 获取文档统计信息
   * GET /api/projects/:projectId/documents/statistics
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;

      const stats = await ProjectDocument.getStatistics(projectId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('获取文档统计失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_STATS_FAILED',
          message: '获取文档统计失败'
        }
      });
    }
  }
}

// 导出控制器实例
export const projectDocumentController = new ProjectDocumentController();


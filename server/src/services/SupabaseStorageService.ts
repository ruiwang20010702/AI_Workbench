/**
 * Supabase Storage 服务
 * 使用 Supabase Storage 进行文件存储管理
 * 与 FileStorageService 提供相同的接口，便于切换
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { Readable } from 'stream';

export class SupabaseStorageService {
  private supabase: SupabaseClient;
  private bucketName: string;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('缺少 Supabase 配置: SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 是必需的');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    this.bucketName = process.env.STORAGE_BUCKET || 'project-documents';
  }

  /**
   * 保存项目文档文件
   * @param file Multer 文件对象
   * @param projectId 项目ID
   * @returns 文件路径 (格式: projectId/documents/filename)
   */
  async saveFile(file: Express.Multer.File, projectId: string): Promise<string> {
    try {
      // 生成唯一文件名
      const ext = path.extname(file.originalname);
      const filename = `${uuidv4()}${ext}`;
      const filePath = `${projectId}/documents/${filename}`;

      // 上传文件到 Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (error) {
        throw new Error(`Supabase 上传失败: ${error.message}`);
      }

      return filePath;
    } catch (error) {
      throw new Error(`文件保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 删除文件
   * @param filePath 文件路径
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        throw new Error(`Supabase 删除失败: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`文件删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取文件流
   * @param filePath 文件路径
   * @returns 文件读取流
   */
  async getFileStream(filePath: string): Promise<Readable> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .download(filePath);

      if (error) {
        throw new Error(`Supabase 下载失败: ${error.message}`);
      }

      if (!data) {
        throw new Error('文件不存在');
      }

      // 将 Blob 转换为 Stream
      const buffer = Buffer.from(await data.arrayBuffer());
      const stream = Readable.from(buffer);
      
      return stream;
    } catch (error) {
      throw new Error(`文件读取失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 保存临时文件
   * @param file Multer 文件对象
   * @returns { tempId, filePath }
   */
  async saveTempFile(file: Express.Multer.File): Promise<{ tempId: string; filePath: string }> {
    try {
      const tempId = uuidv4();
      const ext = path.extname(file.originalname);
      const filename = `${tempId}${ext}`;
      const filePath = `temp/${filename}`;

      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (error) {
        throw new Error(`Supabase 上传失败: ${error.message}`);
      }

      return {
        tempId,
        filePath
      };
    } catch (error) {
      throw new Error(`临时文件保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 移动临时文件到项目目录
   * @param tempPath 临时文件路径 (格式: temp/filename)
   * @param projectId 项目ID
   * @returns 新的文件路径
   */
  async moveTempFile(tempPath: string, projectId: string): Promise<string> {
    try {
      // 下载临时文件
      const { data, error: downloadError } = await this.supabase.storage
        .from(this.bucketName)
        .download(tempPath);

      if (downloadError) {
        throw new Error(`下载临时文件失败: ${downloadError.message}`);
      }

      // 生成新路径
      const filename = path.basename(tempPath);
      const newPath = `${projectId}/documents/${filename}`;

      // 上传到新位置
      const buffer = Buffer.from(await data.arrayBuffer());
      const { error: uploadError } = await this.supabase.storage
        .from(this.bucketName)
        .upload(newPath, buffer, {
          upsert: false
        });

      if (uploadError) {
        throw new Error(`上传到新位置失败: ${uploadError.message}`);
      }

      // 删除临时文件
      await this.deleteFile(tempPath).catch(() => {
        // 忽略删除失败
      });

      return newPath;
    } catch (error) {
      throw new Error(`文件移动失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 清理过期临时文件
   * @param olderThanHours 清理多少小时之前的文件
   * @returns 清理的文件数量
   */
  async cleanTempFiles(olderThanHours: number = 24): Promise<number> {
    try {
      // 列出所有临时文件
      const { data: files, error } = await this.supabase.storage
        .from(this.bucketName)
        .list('temp', {
          sortBy: { column: 'created_at', order: 'asc' }
        });

      if (error) {
        throw new Error(`列出临时文件失败: ${error.message}`);
      }

      if (!files || files.length === 0) {
        return 0;
      }

      const now = Date.now();
      const filesToDelete: string[] = [];

      for (const file of files) {
        const createdAt = new Date(file.created_at).getTime();
        const age = now - createdAt;

        if (age > olderThanHours * 60 * 60 * 1000) {
          filesToDelete.push(`temp/${file.name}`);
        }
      }

      if (filesToDelete.length > 0) {
        const { error: deleteError } = await this.supabase.storage
          .from(this.bucketName)
          .remove(filesToDelete);

        if (deleteError) {
          console.error('批量删除临时文件失败:', deleteError.message);
          // 尝试逐个删除
          let count = 0;
          for (const filePath of filesToDelete) {
            try {
              await this.deleteFile(filePath);
              count++;
            } catch (err) {
              console.error(`删除文件失败: ${filePath}`, err);
            }
          }
          return count;
        }
      }

      return filesToDelete.length;
    } catch (error) {
      throw new Error(`清理临时文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 复制文件 (用于版本恢复)
   * @param srcPath 源文件路径
   * @param projectId 项目ID
   * @returns 新文件路径
   */
  async copyFile(srcPath: string, projectId: string): Promise<string> {
    try {
      // 下载源文件
      const { data, error: downloadError } = await this.supabase.storage
        .from(this.bucketName)
        .download(srcPath);

      if (downloadError) {
        throw new Error(`下载源文件失败: ${downloadError.message}`);
      }

      // 生成新文件名
      const ext = path.extname(srcPath);
      const newFilename = `${uuidv4()}${ext}`;
      const newPath = `${projectId}/documents/${newFilename}`;

      // 上传到新位置
      const buffer = Buffer.from(await data.arrayBuffer());
      const { error: uploadError } = await this.supabase.storage
        .from(this.bucketName)
        .upload(newPath, buffer, {
          upsert: false
        });

      if (uploadError) {
        throw new Error(`上传新文件失败: ${uploadError.message}`);
      }

      return newPath;
    } catch (error) {
      throw new Error(`文件复制失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 检查文件是否存在
   * @param filePath 文件路径
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(path.dirname(filePath), {
          search: path.basename(filePath)
        });

      if (error) {
        return false;
      }

      return data && data.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * 获取文件大小
   * @param filePath 文件路径
   */
  async getFileSize(filePath: string): Promise<number> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(path.dirname(filePath), {
          search: path.basename(filePath)
        });

      if (error) {
        throw new Error(`获取文件信息失败: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error('文件不存在');
      }

      // Supabase Storage API 返回的是元数据
      const fileInfo = data[0];
      return fileInfo.metadata?.size || 0;
    } catch (error) {
      throw new Error(`获取文件大小失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取文件的公开 URL（如果需要）
   * @param filePath 文件路径
   * @returns 公开访问 URL
   */
  getPublicUrl(filePath: string): string {
    const { data } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }

  /**
   * 获取文件的临时签名 URL
   * @param filePath 文件路径
   * @param expiresIn 过期时间（秒），默认 1 小时
   * @returns 签名 URL
   */
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        throw new Error(`生成签名 URL 失败: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      throw new Error(`获取签名 URL 失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}

// 导出单例
export const supabaseStorageService = new SupabaseStorageService();


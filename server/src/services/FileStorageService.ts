/**
 * 文件存储服务
 * 负责文件的保存、删除、读取和临时文件管理
 */

import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ReadStream, createReadStream } from 'fs';

export class FileStorageService {
  private uploadDir: string;

  constructor() {
    // 上传目录相对于项目根目录
    this.uploadDir = path.join(process.cwd(), 'uploads');
  }

  /**
   * 保存项目文档文件
   * @param file Multer 文件对象
   * @param projectId 项目ID
   * @returns 文件相对路径
   */
  async saveFile(file: Express.Multer.File, projectId: string): Promise<string> {
    try {
      // 创建项目文档目录
      const dir = path.join(this.uploadDir, 'projects', projectId, 'documents');
      await fs.mkdir(dir, { recursive: true });

      // 生成唯一文件名
      const ext = path.extname(file.originalname);
      const filename = `${uuidv4()}${ext}`;
      const filePath = path.join(dir, filename);

      // 复制文件到目标位置
      await fs.copyFile(file.path, filePath);

      // 删除临时文件
      await fs.unlink(file.path).catch(() => {
        // 忽略删除失败
      });

      // 返回相对路径
      return path.join('projects', projectId, 'documents', filename);
    } catch (error) {
      throw new Error(`文件保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 删除文件
   * @param filePath 文件相对路径
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = path.join(this.uploadDir, filePath);
      await fs.unlink(fullPath);
    } catch (error) {
      throw new Error(`文件删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取文件流
   * @param filePath 文件相对路径
   * @returns 文件读取流
   */
  async getFileStream(filePath: string): Promise<ReadStream> {
    try {
      const fullPath = path.join(this.uploadDir, filePath);
      
      // 检查文件是否存在
      await fs.access(fullPath);
      
      return createReadStream(fullPath);
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
      const dir = path.join(this.uploadDir, 'temp');
      await fs.mkdir(dir, { recursive: true });

      const ext = path.extname(file.originalname);
      const filename = `${tempId}${ext}`;
      const filePath = path.join(dir, filename);

      await fs.copyFile(file.path, filePath);
      await fs.unlink(file.path).catch(() => {});

      return {
        tempId,
        filePath: path.join('temp', filename)
      };
    } catch (error) {
      throw new Error(`临时文件保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 移动临时文件到项目目录
   * @param tempPath 临时文件相对路径
   * @param projectId 项目ID
   * @returns 新的文件相对路径
   */
  async moveTempFile(tempPath: string, projectId: string): Promise<string> {
    try {
      const srcPath = path.join(this.uploadDir, tempPath);
      const destDir = path.join(this.uploadDir, 'projects', projectId, 'documents');
      await fs.mkdir(destDir, { recursive: true });

      const filename = path.basename(tempPath);
      const destPath = path.join(destDir, filename);

      await fs.rename(srcPath, destPath);

      return path.join('projects', projectId, 'documents', filename);
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
      const tempDir = path.join(this.uploadDir, 'temp');
      
      // 确保目录存在
      try {
        await fs.access(tempDir);
      } catch {
        return 0; // 目录不存在，返回0
      }

      const files = await fs.readdir(tempDir);
      const now = Date.now();
      let count = 0;

      for (const file of files) {
        try {
          const filePath = path.join(tempDir, file);
          const stats = await fs.stat(filePath);
          const age = now - stats.mtimeMs;

          if (age > olderThanHours * 60 * 60 * 1000) {
            await fs.unlink(filePath);
            count++;
          }
        } catch (error) {
          // 忽略单个文件的错误，继续处理其他文件
          console.error(`清理临时文件失败: ${file}`, error);
        }
      }

      return count;
    } catch (error) {
      throw new Error(`清理临时文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 复制文件 (用于版本恢复)
   * @param srcPath 源文件相对路径
   * @param projectId 项目ID
   * @returns 新文件相对路径
   */
  async copyFile(srcPath: string, projectId: string): Promise<string> {
    try {
      const srcFullPath = path.join(this.uploadDir, srcPath);
      const destDir = path.join(this.uploadDir, 'projects', projectId, 'documents');
      await fs.mkdir(destDir, { recursive: true });

      const ext = path.extname(srcPath);
      const newFilename = `${uuidv4()}${ext}`;
      const destPath = path.join(destDir, newFilename);

      await fs.copyFile(srcFullPath, destPath);

      return path.join('projects', projectId, 'documents', newFilename);
    } catch (error) {
      throw new Error(`文件复制失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 检查文件是否存在
   * @param filePath 文件相对路径
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.uploadDir, filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取文件大小
   * @param filePath 文件相对路径
   */
  async getFileSize(filePath: string): Promise<number> {
    try {
      const fullPath = path.join(this.uploadDir, filePath);
      const stats = await fs.stat(fullPath);
      return stats.size;
    } catch (error) {
      throw new Error(`获取文件大小失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}

// 导出单例
export const fileStorageService = new FileStorageService();


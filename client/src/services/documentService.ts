/**
 * 项目文档服务
 * 封装所有文档相关的 API 调用
 */

import { apiClient } from './apiClient';

/**
 * 文档数据接口
 */
export interface Document {
  id: string;
  project_id: string;
  title: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  version: number;
  parent_document_id: string | null;
  is_latest: boolean;
  creator_id: string;
  creator?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  created_at: string;
  updated_at: string;
}

/**
 * 临时文件接口
 */
export interface TempFile {
  temp_id: string;
  filename: string;
  file_size: number;
  mime_type: string;
}

/**
 * 文档版本接口
 */
export interface DocumentVersion {
  id: string;
  version: number;
  file_size: number;
  creator?: {
    id: string;
    display_name: string;
  };
  created_at: string;
  is_latest: boolean;
}

/**
 * 文档统计接口
 */
export interface DocumentStatistics {
  total_documents: number;
  total_size: number;
  file_types: Record<string, number>;
}

/**
 * 文档服务类
 */
class DocumentService {
  /**
   * 上传文档
   * @param projectId 项目ID
   * @param file 文件对象
   * @param onProgress 上传进度回调
   */
  async uploadDocument(
    projectId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(
      `/projects/${projectId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(progress);
          }
        }
      }
    );

    return response.data.data;
  }

  /**
   * 获取项目文档列表
   * @param projectId 项目ID
   * @param latestOnly 只返回最新版本
   */
  async getDocuments(projectId: string, latestOnly: boolean = true): Promise<Document[]> {
    const response = await apiClient.get(`/projects/${projectId}/documents`, {
      params: { latestOnly }
    });
    return response.data.data;
  }

  /**
   * 下载文档
   * @param projectId 项目ID
   * @param documentId 文档ID
   */
  async downloadDocument(projectId: string, documentId: string): Promise<{ blob: Blob; filename: string }> {
    const response = await apiClient.get(
      `/projects/${projectId}/documents/${documentId}/download`,
      {
        responseType: 'blob'
      }
    );
    
    // 从响应头中提取文件名
    let filename = 'download';
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      // 优先使用 filename* (UTF-8)
      const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''(.+?)(?:;|$)/);
      if (filenameStarMatch) {
        filename = decodeURIComponent(filenameStarMatch[1]);
      } else {
        // 回退到 filename
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?(?:;|$)/);
        if (filenameMatch) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }
    }
    
    return { blob: response.data, filename };
  }

  /**
   * 触发浏览器下载
   * @param blob 文件 Blob
   * @param filename 文件名
   */
  triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * 删除文档
   * @param projectId 项目ID
   * @param documentId 文档ID
   */
  async deleteDocument(projectId: string, documentId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/documents/${documentId}`);
  }

  /**
   * 获取文档预览 URL
   * @param projectId 项目ID
   * @param documentId 文档ID
   */
  getPreviewUrl(projectId: string, documentId: string): string {
    const baseUrl = apiClient.defaults.baseURL || '';
    const token = localStorage.getItem('token');
    return `${baseUrl}/projects/${projectId}/documents/${documentId}/preview?token=${token}`;
  }

  /**
   * 获取文档版本列表
   * @param projectId 项目ID
   * @param documentId 文档ID
   */
  async getVersions(projectId: string, documentId: string): Promise<DocumentVersion[]> {
    const response = await apiClient.get(
      `/projects/${projectId}/documents/${documentId}/versions`
    );
    return response.data.data;
  }

  /**
   * 恢复文档版本
   * @param projectId 项目ID
   * @param documentId 文档ID
   * @param versionId 要恢复的版本ID
   */
  async restoreVersion(
    projectId: string,
    documentId: string,
    versionId: string
  ): Promise<Document> {
    const response = await apiClient.post(
      `/projects/${projectId}/documents/${documentId}/restore`,
      { versionId }
    );
    return response.data.data;
  }

  /**
   * 临时上传文件 (用于项目创建)
   * @param file 文件对象
   * @param onProgress 上传进度回调
   */
  async uploadTemp(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<TempFile> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/uploads/temp', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      }
    });

    return response.data.data;
  }

  /**
   * 关联临时文件到项目
   * @param projectId 项目ID
   * @param tempIds 临时文件ID列表
   */
  async attachTempFiles(projectId: string, tempIds: string[]): Promise<void> {
    await apiClient.post(`/projects/${projectId}/documents/attach`, {
      temp_ids: tempIds
    });
  }

  /**
   * 获取文档统计信息
   * @param projectId 项目ID
   */
  async getStatistics(projectId: string): Promise<DocumentStatistics> {
    const response = await apiClient.get(`/projects/${projectId}/documents/statistics`);
    return response.data.data;
  }

  /**
   * 格式化文件大小
   * @param bytes 字节数
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  /**
   * 获取文件图标
   * @param mimeType MIME 类型
   */
  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📑';
    return '📎';
  }

  /**
   * 检查文件是否可预览
   * @param mimeType MIME 类型
   */
  canPreview(mimeType: string): boolean {
    return mimeType.startsWith('image/') || mimeType === 'application/pdf';
  }

  /**
   * 验证文件 (前端验证)
   * @param file 文件对象
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    const MAX_SIZE = 20 * 1024 * 1024; // 20MB
    const ALLOWED_TYPES = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    // 检查文件大小
    if (file.size > MAX_SIZE) {
      return {
        valid: false,
        error: `文件不能超过 ${this.formatFileSize(MAX_SIZE)}`
      };
    }

    // 检查文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: '不支持的文件类型，请上传 PDF、Office 文档或图片'
      };
    }

    return { valid: true };
  }
}

// 导出单例
export const documentService = new DocumentService();
export default documentService;


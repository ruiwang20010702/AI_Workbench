/**
 * 文档版本历史模态框
 * 展示文档版本列表并支持恢复
 */

import React, { useState, useEffect } from 'react';
import { X, Clock, Download, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Document, DocumentVersion, documentService } from '../../services/documentService';

interface DocumentVersionModalProps {
  /**
   * 是否显示
   */
  isOpen: boolean;
  
  /**
   * 项目ID
   */
  projectId: string;
  
  /**
   * 文档信息
   */
  document: Document | null;
  
  /**
   * 关闭回调
   */
  onClose: () => void;
  
  /**
   * 恢复成功回调
   */
  onRestoreSuccess?: (document: Document) => void;
}

export const DocumentVersionModal: React.FC<DocumentVersionModalProps> = ({
  isOpen,
  projectId,
  document,
  onClose,
  onRestoreSuccess
}) => {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // 加载版本列表
  useEffect(() => {
    const loadVersions = async () => {
      if (!isOpen || !document) return;

      setLoading(true);
      setError('');

      try {
        const data = await documentService.getVersions(projectId, document.id);
        setVersions(data);
      } catch (err) {
        console.error('加载版本失败:', err);
        setError('加载版本历史失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    loadVersions();
  }, [isOpen, document, projectId]);

  // ESC键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !restoringId) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose, restoringId]);

  if (!isOpen || !document) return null;

  /**
   * 下载指定版本
   */
  const handleDownload = async (version: DocumentVersion) => {
    try {
      const { blob, filename } = await documentService.downloadDocument(projectId, version.id);
      // 为版本下载添加版本号后缀
      const extIndex = filename.lastIndexOf('.');
      const versionFilename = extIndex > 0 
        ? `${filename.substring(0, extIndex)} (v${version.version})${filename.substring(extIndex)}`
        : `${filename} (v${version.version})`;
      documentService.triggerDownload(blob, versionFilename);
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请稍后重试');
    }
  };

  /**
   * 恢复指定版本
   */
  const handleRestore = async (version: DocumentVersion) => {
    if (version.is_latest) {
      alert('当前已是最新版本');
      return;
    }

    if (!confirm(`确定要将文档恢复到版本 ${version.version} 吗？这将创建一个新的版本。`)) {
      return;
    }

    setRestoringId(version.id);

    try {
      const restoredDoc = await documentService.restoreVersion(
        projectId,
        document.id,
        version.id
      );

      // 刷新版本列表
      const updatedVersions = await documentService.getVersions(projectId, document.id);
      setVersions(updatedVersions);

      // 通知父组件
      onRestoreSuccess?.(restoredDoc);

      alert('版本恢复成功！');
    } catch (error) {
      console.error('恢复版本失败:', error);
      alert('恢复版本失败，请稍后重试');
    } finally {
      setRestoringId(null);
    }
  };

  /**
   * 格式化日期
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * 格式化相对时间
   */
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    
    return formatDate(dateString);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      {/* 模态框内容 */}
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl flex flex-col max-h-[80vh]">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                版本历史
              </h3>
              <p className="text-sm text-gray-500">
                {document.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={!!restoringId}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            // 加载状态
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
            </div>
          ) : error ? (
            // 错误状态
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                关闭
              </button>
            </div>
          ) : versions.length === 0 ? (
            // 空状态
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">暂无版本历史</p>
            </div>
          ) : (
            // 版本列表
            <div className="space-y-3">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className={cn(
                    'relative p-4 rounded-lg border transition-all',
                    version.is_latest
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  )}
                >
                  {/* 版本信息 */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-base font-semibold text-gray-900">
                          版本 {version.version}
                        </h4>
                        {version.is_latest && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-600 text-white">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            当前版本
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">上传者：</span>
                          {version.creator?.display_name || '未知用户'}
                        </p>
                        <p>
                          <span className="font-medium">文件大小：</span>
                          {documentService.formatFileSize(version.file_size)}
                        </p>
                        <p>
                          <span className="font-medium">上传时间：</span>
                          {formatRelativeTime(version.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center space-x-2 ml-4">
                      {/* 下载按钮 */}
                      <button
                        onClick={() => handleDownload(version)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="下载此版本"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {/* 恢复按钮 */}
                      {!version.is_latest && (
                        <button
                          onClick={() => handleRestore(version)}
                          disabled={!!restoringId}
                          className={cn(
                            'p-2 rounded transition-colors',
                            restoringId === version.id
                              ? 'text-blue-600 bg-blue-50 cursor-wait'
                              : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'
                          )}
                          title="恢复此版本"
                        >
                          {restoringId === version.id ? (
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <RotateCcw className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 时间线连接线 */}
                  {index < versions.length - 1 && (
                    <div className="absolute left-8 top-full w-0.5 h-3 bg-gray-200" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部说明 */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-start space-x-2 text-sm text-gray-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              恢复版本会将该版本的文件内容创建为新的版本，不会删除任何历史记录。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentVersionModal;


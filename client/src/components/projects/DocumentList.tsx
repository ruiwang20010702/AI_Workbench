/**
 * 文档列表组件
 * 展示项目文档列表及操作
 */

import React, { useState } from 'react';
import {
  FileText,
  Download,
  Eye,
  Trash2,
  Clock,
  MoreVertical,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Document, documentService } from '../../services/documentService';

interface DocumentListProps {
  /**
   * 项目ID
   */
  projectId: string;
  
  /**
   * 文档列表
   */
  documents: Document[];
  
  /**
   * 是否加载中
   */
  loading?: boolean;
  
  /**
   * 当前用户是否有编辑权限
   */
  canEdit?: boolean;
  
  /**
   * 预览文档回调
   */
  onPreview?: (document: Document) => void;
  
  /**
   * 下载文档回调
   */
  onDownload?: (document: Document) => void;
  
  /**
   * 删除文档回调
   */
  onDelete?: (document: Document) => void;
  
  /**
   * 查看版本历史回调
   */
  onViewVersions?: (document: Document) => void;
  
  /**
   * 自定义类名
   */
  className?: string;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  projectId,
  documents,
  loading = false,
  canEdit = false,
  onPreview,
  onDownload,
  onDelete,
  onViewVersions,
  className
}) => {
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  /**
   * 处理预览
   */
  const handlePreview = (doc: Document) => {
    if (onPreview) {
      onPreview(doc);
    }
  };

  /**
   * 处理下载
   */
  const handleDownload = async (doc: Document) => {
    if (downloadingIds.has(doc.id)) return;

    try {
      setDownloadingIds(prev => new Set(prev).add(doc.id));
      
      if (onDownload) {
        onDownload(doc);
      } else {
        // 默认下载行为
        const { blob, filename } = await documentService.downloadDocument(projectId, doc.id);
        documentService.triggerDownload(blob, filename);
      }
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载文件失败，请稍后重试');
    } finally {
      setDownloadingIds(prev => {
        const next = new Set(prev);
        next.delete(doc.id);
        return next;
      });
    }
  };

  /**
   * 处理删除
   */
  const handleDelete = (doc: Document) => {
    if (!canEdit) return;
    
    if (confirm(`确定要删除文档 "${doc.title}" 吗？此操作不可恢复。`)) {
      onDelete?.(doc);
    }
  };

  /**
   * 处理查看版本
   */
  const handleViewVersions = (doc: Document) => {
    onViewVersions?.(doc);
    setExpandedMenu(null);
  };

  /**
   * 格式化日期
   */
  const formatDate = (dateString: string) => {
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
    
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  /**
   * 渲染空状态
   */
  if (!loading && documents.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-sm">暂无文档</p>
        <p className="text-gray-400 text-xs mt-1">
          上传文档以便团队协作
        </p>
      </div>
    );
  }

  /**
   * 渲染加载状态
   */
  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="animate-pulse flex items-center space-x-3 p-4 bg-gray-50 rounded-lg"
          >
            <div className="w-10 h-10 bg-gray-200 rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {documents.map(doc => {
        const isDownloading = downloadingIds.has(doc.id);
        const canPreview = documentService.canPreview(doc.mime_type);
        const hasVersions = doc.version > 1;

        return (
          <div
            key={doc.id}
            className="group relative flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
          >
            {/* 文件图标 */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-2xl">
                {documentService.getFileIcon(doc.mime_type)}
              </div>
            </div>

            {/* 文件信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {doc.title}
                </h4>
                {!doc.is_latest && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    历史版本
                  </span>
                )}
                {hasVersions && doc.is_latest && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    v{doc.version}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                <span>{documentService.formatFileSize(doc.file_size)}</span>
                <span>•</span>
                <span>{doc.creator?.display_name || '未知用户'}</span>
                <span>•</span>
                <span>{formatDate(doc.created_at)}</span>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* 预览按钮 */}
              {canPreview && (
                <button
                  onClick={() => handlePreview(doc)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="预览"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}

              {/* 下载按钮 */}
              <button
                onClick={() => handleDownload(doc)}
                disabled={isDownloading}
                className={cn(
                  'p-2 rounded transition-colors',
                  isDownloading
                    ? 'text-gray-300 cursor-wait'
                    : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                )}
                title="下载"
              >
                <Download className={cn('w-4 h-4', isDownloading && 'animate-bounce')} />
              </button>

              {/* 版本历史按钮 */}
              {hasVersions && (
                <button
                  onClick={() => handleViewVersions(doc)}
                  className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                  title="版本历史"
                >
                  <Clock className="w-4 h-4" />
                </button>
              )}

              {/* 删除按钮 */}
              {canEdit && (
                <button
                  onClick={() => handleDelete(doc)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              {/* 更多操作菜单 */}
              <div className="relative">
                <button
                  onClick={() => setExpandedMenu(expandedMenu === doc.id ? null : doc.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
                  title="更多操作"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {/* 下拉菜单 */}
                {expandedMenu === doc.id && (
                  <>
                    {/* 遮罩层 */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setExpandedMenu(null)}
                    />
                    
                    {/* 菜单内容 */}
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      {canPreview && (
                        <button
                          onClick={() => {
                            handlePreview(doc);
                            setExpandedMenu(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>预览</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          handleDownload(doc);
                          setExpandedMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>下载</span>
                      </button>

                      {hasVersions && (
                        <button
                          onClick={() => handleViewVersions(doc)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                        >
                          <Clock className="w-4 h-4" />
                          <span>版本历史</span>
                        </button>
                      )}

                      {canEdit && (
                        <>
                          <div className="border-t border-gray-100 my-1" />
                          <button
                            onClick={() => {
                              handleDelete(doc);
                              setExpandedMenu(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>删除</span>
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DocumentList;


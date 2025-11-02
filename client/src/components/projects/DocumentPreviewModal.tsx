/**
 * 文档预览模态框
 * 支持 PDF 和图片预览
 */

import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Document as PDFDocument, Page, pdfjs } from 'react-pdf';
import { cn } from '../../utils/cn';
import { Document, documentService } from '../../services/documentService';

// 配置 PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface DocumentPreviewModalProps {
  /**
   * 是否显示
   */
  isOpen: boolean;
  
  /**
   * 项目ID
   */
  projectId: string;
  
  /**
   * 要预览的文档
   */
  document: Document | null;
  
  /**
   * 关闭回调
   */
  onClose: () => void;
  
  /**
   * 下载回调
   */
  onDownload?: (document: Document) => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  projectId,
  document,
  onClose,
  onDownload
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // 重置状态
  useEffect(() => {
    if (isOpen && document) {
      setPageNumber(1);
      setScale(1.0);
      setRotation(0);
      setError('');
    }
  }, [isOpen, document]);

  // ESC键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && pageNumber > 1) {
        setPageNumber(prev => prev - 1);
      } else if (e.key === 'ArrowRight' && pageNumber < numPages) {
        setPageNumber(prev => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, pageNumber, numPages]);

  if (!isOpen || !document) return null;

  const isPDF = document.mime_type === 'application/pdf';
  const isImage = document.mime_type.startsWith('image/');
  const previewUrl = documentService.getPreviewUrl(projectId, document.id);

  /**
   * PDF 加载成功
   */
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError('');
  };

  /**
   * PDF 加载失败
   */
  const onDocumentLoadError = (error: Error) => {
    console.error('PDF加载失败:', error);
    setError('PDF 加载失败，请稍后重试');
    setLoading(false);
  };

  /**
   * 放大
   */
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  /**
   * 缩小
   */
  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  /**
   * 旋转
   */
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  /**
   * 下载
   */
  const handleDownload = async () => {
    try {
      if (onDownload) {
        onDownload(document);
      } else {
        const { blob, filename } = await documentService.downloadDocument(projectId, document.id);
        documentService.triggerDownload(blob, filename);
      }
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载文件失败，请稍后重试');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      {/* 模态框内容 */}
      <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-lg shadow-2xl flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {document.title}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {documentService.formatFileSize(document.file_size)} • 
              由 {document.creator?.display_name || '未知用户'} 上传
            </p>
          </div>

          <button
            onClick={onClose}
            className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 工具栏 */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            {/* PDF 分页控制 */}
            {isPDF && numPages > 0 && (
              <>
                <button
                  onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                  disabled={pageNumber <= 1}
                  className="p-2 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="上一页"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <span className="text-sm text-gray-600 px-2">
                  {pageNumber} / {numPages}
                </span>
                
                <button
                  onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
                  disabled={pageNumber >= numPages}
                  className="p-2 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="下一页"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-2" />
              </>
            )}

            {/* 缩放控制 */}
            <button
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="缩小"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            
            <span className="text-sm text-gray-600 px-2 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            
            <button
              onClick={handleZoomIn}
              disabled={scale >= 3.0}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="放大"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            {/* 旋转控制 */}
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <button
              onClick={handleRotate}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors"
              title="旋转"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* 下载按钮 */}
          <button
            onClick={handleDownload}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>下载</span>
          </button>
        </div>

        {/* 预览区域 */}
        <div className="flex-1 overflow-auto bg-gray-100 p-6">
          <div className="flex items-center justify-center min-h-full">
            {error ? (
              // 错误状态
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                  <X className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-red-600 font-medium">{error}</p>
                <button
                  onClick={onClose}
                  className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  关闭
                </button>
              </div>
            ) : isPDF ? (
              // PDF 预览
              <div
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease'
                }}
              >
                <PDFDocument
                  file={previewUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={
                    <div className="flex items-center justify-center p-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
                    </div>
                  }
                >
                  <Page
                    pageNumber={pageNumber}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="shadow-lg"
                  />
                </PDFDocument>
              </div>
            ) : isImage ? (
              // 图片预览
              <div
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease'
                }}
              >
                <img
                  src={previewUrl}
                  alt={document.title}
                  className="max-w-full max-h-full object-contain shadow-lg rounded"
                  onError={() => setError('图片加载失败')}
                />
              </div>
            ) : (
              // 不支持的类型
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 mb-4">
                  <X className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">不支持预览此类型文件</p>
                <button
                  onClick={handleDownload}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  下载文件
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;


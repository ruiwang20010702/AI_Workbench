/**
 * 拖拽上传组件
 * 支持拖拽和点击上传文件
 */

import React, { useRef, useState } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { documentService } from '../../services/documentService';

interface DragDropUploadProps {
  /**
   * 是否允许多文件上传
   */
  multiple?: boolean;
  
  /**
   * 是否禁用上传
   */
  disabled?: boolean;
  
  /**
   * 自定义类名
   */
  className?: string;
  
  /**
   * 上传成功回调
   */
  onUploadSuccess?: (files: File[]) => void;
  
  /**
   * 上传失败回调
   */
  onUploadError?: (error: string) => void;
  
  /**
   * 文件选择回调（不自动上传）
   */
  onFilesSelected?: (files: File[]) => void;
  
  /**
   * 上传进度回调
   */
  onProgress?: (progress: number) => void;
  
  /**
   * 是否显示文件预览
   */
  showPreview?: boolean;
  
  /**
   * 提示文本
   */
  hint?: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  error?: string;
}

export const DragDropUpload: React.FC<DragDropUploadProps> = ({
  multiple = true,
  disabled = false,
  className,
  onUploadSuccess,
  onUploadError,
  onFilesSelected,
  onProgress,
  showPreview = true,
  hint = '拖拽文件到此处或点击选择文件'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [validationError, setValidationError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  /**
   * 验证文件列表
   */
  const validateFiles = (files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      const result = documentService.validateFile(file);
      if (result.valid) {
        valid.push(file);
      } else {
        errors.push(`${file.name}: ${result.error}`);
      }
    });

    return { valid, errors };
  };

  /**
   * 处理文件选择
   */
  const handleFiles = (files: FileList | null) => {
    console.log('[DragDropUpload] handleFiles 被调用', { 
      filesCount: files?.length || 0,
      disabled 
    });

    if (!files || files.length === 0) {
      console.warn('[DragDropUpload] 没有文件');
      return;
    }

    const fileArray = Array.from(files);
    console.log('[DragDropUpload] 文件列表:', fileArray.map(f => ({ 
      name: f.name, 
      size: f.size, 
      type: f.type 
    })));

    const { valid, errors } = validateFiles(fileArray);
    console.log('[DragDropUpload] 验证结果:', { 
      validCount: valid.length, 
      errorsCount: errors.length,
      errors 
    });

    if (errors.length > 0) {
      const errorMsg = errors.join('\n');
      setValidationError(errorMsg);
      onUploadError?.(errorMsg);
      console.error('[DragDropUpload] 文件验证失败:', errorMsg);
      return;
    }

    setValidationError('');
    setSelectedFiles(prev => multiple ? [...prev, ...valid] : valid);
    
    // 如果提供了 onFilesSelected 回调，不自动上传
    if (onFilesSelected) {
      console.log('[DragDropUpload] 调用 onFilesSelected 回调');
      onFilesSelected(valid);
    } else {
      console.log('[DragDropUpload] 调用 onUploadSuccess 回调');
      onUploadSuccess?.(valid);
    }
  };

  /**
   * 拖拽进入
   */
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  /**
   * 拖拽离开
   */
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  /**
   * 拖拽悬停
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  /**
   * 拖拽放下
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (disabled) return;

    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  /**
   * 点击选择文件
   */
  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  /**
   * 文件输入变化
   */
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // 清空 input，允许重复选择相同文件
    e.target.value = '';
  };

  /**
   * 移除选中的文件
   */
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * 清空所有文件
   */
  const handleClearAll = () => {
    setSelectedFiles([]);
    setValidationError('');
  };

  return (
    <div className={cn('w-full', className)}>
      {/* 拖拽区域 */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
          'hover:border-blue-400 hover:bg-blue-50/50',
          {
            'border-blue-500 bg-blue-50': isDragging,
            'border-gray-300 bg-gray-50': !isDragging && !disabled,
            'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50': disabled
          }
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp"
        />

        <div className="flex flex-col items-center space-y-3">
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center',
            isDragging ? 'bg-blue-100' : 'bg-gray-100'
          )}>
            <Upload className={cn(
              'w-8 h-8',
              isDragging ? 'text-blue-500' : 'text-gray-400'
            )} />
          </div>

          <div>
            <p className="text-base font-medium text-gray-700">
              {isDragging ? '释放以上传文件' : hint}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              支持 PDF、Office 文档、图片，单个文件最大 20MB
            </p>
            {multiple && (
              <p className="text-xs text-gray-400 mt-1">
                可同时选择多个文件
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 验证错误提示 */}
      {validationError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">文件验证失败</p>
            <p className="text-xs text-red-600 mt-1 whitespace-pre-line">
              {validationError}
            </p>
          </div>
          <button
            onClick={() => setValidationError('')}
            className="text-red-400 hover:text-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 文件预览列表 */}
      {showPreview && selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              已选择 {selectedFiles.length} 个文件
            </p>
            <button
              onClick={handleClearAll}
              className="text-xs text-gray-500 hover:text-red-600 transition-colors"
            >
              清空全部
            </button>
          </div>

          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 text-2xl">
                    {documentService.getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {documentService.formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveFile(index)}
                  className="ml-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="移除文件"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 上传进度列表 */}
      {uploadingFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">
            正在上传...
          </p>
          <div className="space-y-2">
            {uploadingFiles.map((item, index) => (
              <div
                key={`${item.file.name}-${index}`}
                className="p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 text-xl">
                      {documentService.getFileIcon(item.file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {item.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {documentService.formatFileSize(item.file.size)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-blue-600">
                    {item.progress}%
                  </span>
                </div>

                {/* 进度条 */}
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-300',
                      item.error ? 'bg-red-500' : 'bg-blue-500'
                    )}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>

                {/* 错误信息 */}
                {item.error && (
                  <p className="text-xs text-red-600 mt-2">
                    {item.error}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DragDropUpload;


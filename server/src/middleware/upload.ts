/**
 * 文件上传中间件
 * 使用 Multer 处理文件上传
 */

import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { Request } from 'express';

// 允许的 MIME 类型
export const ALLOWED_MIME_TYPES = [
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

// 允许的扩展名
export const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp'
];

// 最大文件大小 (20MB)
export const MAX_FILE_SIZE = 20 * 1024 * 1024;

/**
 * 文件过滤器
 */
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  // 检查 MIME 类型
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error(`不支持的文件类型: ${file.mimetype}`));
  }

  // 检查文件扩展名
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`不支持的文件扩展名: ${ext}`));
  }

  cb(null, true);
};

/**
 * Multer 存储配置
 * 使用内存存储，因为需要将文件上传到 Supabase Storage
 * 文件会保存在 file.buffer 中
 */
const storage = multer.memoryStorage();

/**
 * 创建 Multer 实例
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1 // 一次只允许上传一个文件
  }
});

/**
 * 导出文件验证函数 (供其他模块使用)
 */
export const validateFile = (file: Express.Multer.File): { valid: boolean; error?: string } => {
  // 检查文件大小
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `文件不能超过 ${MAX_FILE_SIZE / (1024 * 1024)} MB`
    };
  }

  // 检查 MIME 类型
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return {
      valid: false,
      error: '不支持的文件类型'
    };
  }

  // 检查扩展名
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: '不支持的文件扩展名'
    };
  }

  return { valid: true };
};


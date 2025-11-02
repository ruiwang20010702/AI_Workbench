/**
 * 项目文档路由
 * 定义所有文档相关的 API 路由
 */

import { Router } from 'express';
import { projectDocumentController } from '../controllers/projectDocumentController';
import { authenticateToken } from '../middleware/auth';
import { checkProjectMember, checkDocumentOwner } from '../middleware/permissions';
import { upload } from '../middleware/upload';

const router = Router();

// ==================== 项目文档路由 ====================

/**
 * 上传文档
 * POST /api/projects/:projectId/documents
 * 需要: 认证 + 项目成员权限
 */
router.post(
  '/projects/:projectId/documents',
  authenticateToken,
  checkProjectMember,
  upload.single('file'),
  (req, res) => projectDocumentController.uploadDocument(req, res)
);

/**
 * 获取文档列表
 * GET /api/projects/:projectId/documents
 * 需要: 认证 + 项目成员权限
 * Query参数:
 *   - latestOnly: boolean (default: true) - 只返回最新版本
 */
router.get(
  '/projects/:projectId/documents',
  authenticateToken,
  checkProjectMember,
  (req, res) => projectDocumentController.getDocuments(req, res)
);

/**
 * 下载文档
 * GET /api/projects/:projectId/documents/:documentId/download
 * 需要: 认证 + 项目成员权限
 */
router.get(
  '/projects/:projectId/documents/:documentId/download',
  authenticateToken,
  checkProjectMember,
  (req, res) => projectDocumentController.downloadDocument(req, res)
);

/**
 * 预览文档
 * GET /api/projects/:projectId/documents/:documentId/preview
 * 需要: 认证 + 项目成员权限
 */
router.get(
  '/projects/:projectId/documents/:documentId/preview',
  authenticateToken,
  checkProjectMember,
  (req, res) => projectDocumentController.previewDocument(req, res)
);

/**
 * 删除文档
 * DELETE /api/projects/:projectId/documents/:documentId
 * 需要: 认证 + 项目成员权限 + 文档所有权
 */
router.delete(
  '/projects/:projectId/documents/:documentId',
  authenticateToken,
  checkProjectMember,
  checkDocumentOwner,
  (req, res) => projectDocumentController.deleteDocument(req, res)
);

// ==================== 版本管理路由 ====================

/**
 * 获取文档版本列表
 * GET /api/projects/:projectId/documents/:documentId/versions
 * 需要: 认证 + 项目成员权限
 */
router.get(
  '/projects/:projectId/documents/:documentId/versions',
  authenticateToken,
  checkProjectMember,
  (req, res) => projectDocumentController.getVersions(req, res)
);

/**
 * 恢复文档版本
 * POST /api/projects/:projectId/documents/:documentId/restore
 * 需要: 认证 + 项目成员权限
 * Body: { versionId: string }
 */
router.post(
  '/projects/:projectId/documents/:documentId/restore',
  authenticateToken,
  checkProjectMember,
  (req, res) => projectDocumentController.restoreVersion(req, res)
);

// ==================== 临时文件路由 ====================

/**
 * 临时文件上传
 * POST /api/uploads/temp
 * 需要: 认证
 * 用于项目创建时上传文件
 */
router.post(
  '/uploads/temp',
  authenticateToken,
  upload.single('file'),
  (req, res) => projectDocumentController.uploadTemp(req, res)
);

/**
 * 关联临时文件到项目
 * POST /api/projects/:projectId/documents/attach
 * 需要: 认证 + 项目成员权限
 * Body: { temp_ids: string[] }
 */
router.post(
  '/projects/:projectId/documents/attach',
  authenticateToken,
  checkProjectMember,
  (req, res) => projectDocumentController.attachTempFiles(req, res)
);

// ==================== 统计路由 ====================

/**
 * 获取文档统计信息
 * GET /api/projects/:projectId/documents/statistics
 * 需要: 认证 + 项目成员权限
 */
router.get(
  '/projects/:projectId/documents/statistics',
  authenticateToken,
  checkProjectMember,
  (req, res) => projectDocumentController.getStatistics(req, res)
);

export default router;


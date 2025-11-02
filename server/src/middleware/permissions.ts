/**
 * 权限检查中间件
 * 用于项目成员和文档所有权验证
 */

import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/database';
import { ProjectDocument } from '../models/ProjectDocument';

/**
 * 扩展 Request 类型，添加项目角色
 */
declare global {
  namespace Express {
    interface Request {
      projectRole?: 'admin' | 'member' | 'observer';
    }
  }
}

/**
 * 检查是否是项目成员
 * 用于需要项目访问权限的接口
 */
export const checkProjectMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: '请先登录' }
      });
      return;
    }

    // 查询项目成员
    const { data: member, error } = await supabaseAdmin
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();

    if (error || !member) {
      // 检查是否是项目所有者
      const { data: project } = await supabaseAdmin
        .from('projects')
        .select('owner_id')
        .eq('id', projectId)
        .single();

      if (project && project.owner_id === userId) {
        // 项目所有者自动是管理员
        req.projectRole = 'admin';
        next();
        return;
      }

      res.status(403).json({
        success: false,
        error: { code: 'NOT_MEMBER', message: '您不是项目成员' }
      });
      return;
    }

    // 设置项目角色到 request 对象
    req.projectRole = member.role as 'admin' | 'member' | 'observer';
    next();
  } catch (error) {
    console.error('权限检查失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'PERMISSION_CHECK_FAILED', message: '权限检查失败' }
    });
  }
};

/**
 * 检查文档所有权 (用于删除权限)
 * 只有文档创建者或项目管理员可以删除文档
 */
export const checkDocumentOwner = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { documentId } = req.params;
    const userId = req.user?.id;
    const projectRole = req.projectRole;

    // 项目管理员可以删除任意文档
    if (projectRole === 'admin') {
      next();
      return;
    }

    // 检查是否是文档创建者
    const document = await ProjectDocument.findById(documentId);
    if (!document) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '文档不存在' }
      });
      return;
    }

    if (document.creator_id !== userId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: '只能删除自己上传的文档' }
      });
      return;
    }

    next();
  } catch (error) {
    console.error('文档所有权检查失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'PERMISSION_CHECK_FAILED', message: '权限检查失败' }
    });
  }
};

/**
 * 检查项目管理员权限
 * 用于需要管理员权限的操作
 */
export const checkProjectAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const projectRole = req.projectRole;

    if (projectRole !== 'admin') {
      res.status(403).json({
        success: false,
        error: { code: 'ADMIN_REQUIRED', message: '需要项目管理员权限' }
      });
      return;
    }

    next();
  } catch (error) {
    console.error('管理员权限检查失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'PERMISSION_CHECK_FAILED', message: '权限检查失败' }
    });
  }
};


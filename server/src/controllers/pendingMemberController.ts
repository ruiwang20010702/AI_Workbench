import { Request, Response } from 'express';
import { PendingMemberModel, CreatePendingMemberData } from '../models/PendingMember';
import { ProjectMemberModel } from '../models/ProjectMember';

/**
 * 验证邮箱格式
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 批量添加待定成员
 * POST /api/projects/:project_id/pending-members/batch
 */
export const batchAddPendingMembers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { project_id } = req.params;
    const { members } = req.body as { members: CreatePendingMemberData[] };

    // 验证用户认证
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 验证项目ID
    if (!project_id) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // 验证请求体
    if (!members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: 'Members array is required' });
    }

    // 验证用户是否是项目成员（有权限添加成员）
    const userMembership = await ProjectMemberModel.findByProjectIdAndUserId(project_id, userId);
    if (!userMembership) {
      return res.status(403).json({ error: 'You are not a member of this project' });
    }

    // 验证邮箱格式
    const invalidEmails = members.filter(m => !isValidEmail(m.email));
    if (invalidEmails.length > 0) {
      return res.status(400).json({ 
        error: 'Invalid email format',
        invalid_emails: invalidEmails.map(m => m.email)
      });
    }

    // 验证角色
    const validRoles = ['admin', 'member', 'observer'];
    const invalidRoles = members.filter(m => !validRoles.includes(m.role));
    if (invalidRoles.length > 0) {
      return res.status(400).json({ 
        error: 'Invalid role',
        invalid_roles: invalidRoles.map(m => ({ email: m.email, role: m.role }))
      });
    }

    // 批量添加待定成员
    const result = await PendingMemberModel.batchAddPendingMembers(
      project_id,
      members,
      userId
    );

    return res.json({
      added_count: result.added_count,
      skipped: result.skipped,
      message: `Successfully added ${result.added_count} pending member(s)`
    });

  } catch (error) {
    console.error('Error in batchAddPendingMembers:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 获取项目的待定成员列表
 * GET /api/projects/:project_id/pending-members
 */
export const getPendingMembers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { project_id } = req.params;

    // 验证用户认证
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 验证项目ID
    if (!project_id) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // 验证用户是否是项目成员
    const userMembership = await ProjectMemberModel.findByProjectIdAndUserId(project_id, userId);
    if (!userMembership) {
      return res.status(403).json({ error: 'You are not a member of this project' });
    }

    // 获取待定成员列表
    const pendingMembers = await PendingMemberModel.getPendingMembers(project_id);

    return res.json({
      pending_members: pendingMembers
    });

  } catch (error) {
    console.error('Error in getPendingMembers:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 删除待定成员
 * DELETE /api/projects/:project_id/pending-members/:id
 */
export const deletePendingMember = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { project_id, id } = req.params;

    // 验证用户认证
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 验证参数
    if (!project_id || !id) {
      return res.status(400).json({ error: 'Project ID and pending member ID are required' });
    }

    // 验证用户是否是项目成员（有权限管理成员）
    const userMembership = await ProjectMemberModel.findByProjectIdAndUserId(project_id, userId);
    if (!userMembership) {
      return res.status(403).json({ error: 'You are not a member of this project' });
    }

    // 只有管理员可以删除待定成员
    if (userMembership.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete pending members' });
    }

    // 删除待定成员
    await PendingMemberModel.deletePendingMember(id);

    return res.json({
      message: 'Pending member deleted successfully'
    });

  } catch (error) {
    console.error('Error in deletePendingMember:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


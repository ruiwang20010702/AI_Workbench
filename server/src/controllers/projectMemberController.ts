import { Request, Response } from 'express';
import { ProjectMemberModel } from '../models/ProjectMember';

// 角色映射（支持中文/英文，统一到服务端英文枚举）
const mapRoleToEnglish = (value?: string): 'admin' | 'member' | 'observer' | undefined => {
  switch (value) {
    case 'admin':
    case 'member':
    case 'observer':
      return value as any;
    case '管理员':
      return 'admin';
    case '成员':
      return 'member';
    case '观察者':
      return 'observer';
    default:
      return undefined;
  }
};

// 获取项目成员列表
export const getProjectMembers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { project_id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!project_id) {
      return res.status(400).json({ error: 'project_id is required' });
    }

    // 检查用户是否有权限访问该项目
    const isMember = await ProjectMemberModel.checkMembership(project_id as string, userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { page = 1, limit = 20, role, search } = req.query;

    const members = await ProjectMemberModel.findByProjectId(project_id as string);

    return res.json(members);
  } catch (error) {
    console.error('Error fetching project members:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// 获取用户参与的项目列表
export const getUserProjects = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { page = 1, limit = 10, role } = req.query;

    const projects = await ProjectMemberModel.findByUserId(userId);

    return res.json(projects);
  } catch (error) {
    console.error('Error fetching user projects:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// 添加项目成员
export const addProjectMember = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { project_id } = req.params;
    const { user_id, role = 'member' } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!project_id) {
      return res.status(400).json({ error: 'project_id is required' });
    }

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // 检查用户是否有权限管理项目成员
    const hasPermission = await ProjectMemberModel.checkPermission(project_id as string, userId, 'manage_members');
    if (!hasPermission) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 检查用户是否已经是项目成员
    const existingMember = await ProjectMemberModel.checkMembership(project_id as string, user_id);
    if (existingMember) {
      return res.status(400).json({ error: 'User is already a project member' });
    }

    const memberData = {
      project_id: project_id as string,
      user_id,
      role: mapRoleToEnglish(role) ?? 'member'
    };

    const member = await ProjectMemberModel.create(memberData);
    return res.status(201).json(member);
  } catch (error) {
    console.error('Error adding project member:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// 更新项目成员角色
export const updateProjectMember = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { project_id, member_id } = req.params;
    const { role } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!role) {
      return res.status(400).json({ error: 'role is required' });
    }

    if (!project_id) {
      return res.status(400).json({ error: 'project_id is required' });
    }

    // 检查用户是否有权限管理项目成员
    const hasPermission = await ProjectMemberModel.checkPermission(project_id as string, userId, 'manage_members');
    if (!hasPermission) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!member_id) {
      return res.status(400).json({ error: 'member_id is required' });
    }

    const mappedRole = mapRoleToEnglish(role);
    if (!mappedRole) {
      return res.status(400).json({ error: 'invalid role' });
    }
    const updateData = { role: mappedRole };
    const member = await ProjectMemberModel.update(member_id as string, updateData);

    if (!member) {
      return res.status(404).json({ error: 'Project member not found' });
    }

    return res.json(member);
  } catch (error) {
    console.error('Error updating project member:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// 移除项目成员
export const removeProjectMember = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { project_id, member_id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!project_id) {
      return res.status(400).json({ error: 'project_id is required' });
    }

    // 检查用户是否有权限管理项目成员
    const hasPermission = await ProjectMemberModel.checkPermission(project_id as string, userId, 'manage_members');
    if (!hasPermission) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!member_id) {
      return res.status(400).json({ error: 'member_id is required' });
    }

    const success = await ProjectMemberModel.remove(project_id as string, member_id as string, userId);
    if (!success) {
      return res.status(404).json({ error: 'Project member not found' });
    }

    return res.json({ message: 'Project member removed successfully' });
  } catch (error) {
    console.error('Error removing project member:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// 批量添加项目成员
export const batchAddProjectMembers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { project_id } = req.params;
    const { members } = req.body; // [{ user_id, role }]

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!members || !Array.isArray(members)) {
      return res.status(400).json({ error: 'members array is required' });
    }

    if (!project_id) {
      return res.status(400).json({ error: 'project_id is required' });
    }

    // 检查用户是否有权限管理项目成员
    const hasPermission = await ProjectMemberModel.checkPermission(project_id as string, userId, 'manage_members');
    if (!hasPermission) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 按角色分组批量添加（模型 batchAdd 仅支持单一角色）
    const roleGroups: Record<'admin' | 'member' | 'observer', string[]> = {
      admin: [],
      member: [],
      observer: []
    };
    for (const m of members) {
      const rEn = mapRoleToEnglish(m.role) ?? 'member';
      roleGroups[rEn].push(m.user_id);
    }

    const addedMembers: any[] = [];
    for (const [roleName, userIds] of Object.entries(roleGroups)) {
      const groupAdded = await ProjectMemberModel.batchAdd(project_id as string, userIds, roleName as any, userId);
      addedMembers.push(...groupAdded);
    }

    return res.status(201).json({ 
      message: 'Members added successfully', 
      added_count: addedMembers.length,
      members: addedMembers 
    });
  } catch (error) {
    console.error('Error batch adding project members:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// 获取项目成员统计信息
export const getProjectMemberStats = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { project_id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!project_id) {
      return res.status(400).json({ error: 'project_id is required' });
    }

    // 检查用户是否有权限访问该项目
    const isMember = await ProjectMemberModel.checkMembership(project_id as string, userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const stats = await ProjectMemberModel.getStatistics(project_id as string);
    return res.json(stats);
  } catch (error) {
    console.error('Error fetching project member stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// 搜索可添加的用户
export const searchAvailableUsers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { project_id } = req.params;
    const { search, limit = 10 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!project_id) {
      return res.status(400).json({ error: 'project_id is required' });
    }

    // 检查用户是否有权限管理项目成员
    const hasPermission = await ProjectMemberModel.checkPermission(project_id as string, userId, 'manage_members');
    if (!hasPermission) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const users = await ProjectMemberModel.searchAvailableUsers(
      project_id as string, 
      search as string, 
      parseInt(limit as string)
    );

    return res.json(users);
  } catch (error) {
    console.error('Error searching available users:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// 获取最近的项目成员
export const getRecentMembers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { project_id } = req.params;
    const { limit = 5 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!project_id) {
      return res.status(400).json({ error: 'project_id is required' });
    }

    // 检查用户是否有权限访问该项目
    const isMember = await ProjectMemberModel.checkMembership(project_id as string, userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const members = await ProjectMemberModel.getRecentMembers(
      project_id as string, 
      parseInt(limit as string)
    );

    return res.json(members);
  } catch (error) {
    console.error('Error fetching recent members:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
import { Request, Response } from 'express';
import { ProjectModel, ProjectFilters, CreateProjectData, UpdateProjectData } from '../models/Project';
import { ProjectMemberModel } from '../models/ProjectMember';
import { TaskModel } from '../models/Task';

// 状态映射（支持中文/英文，统一到服务端英文枚举）
const mapProjectStatus = (value?: string): ProjectFilters['status'] | undefined => {
  switch (value) {
    // 英文枚举与同义词
    case 'planning':
      return 'planning';
    case 'active':
      return 'active';
    case 'paused':
      return 'paused';
    case 'completed':
      return 'completed';
    case 'cancelled':
    case 'canceled':
      return 'cancelled';
    case 'archived':
      // DB不支持archived，归档视为已完成
      return 'completed';

    // 中文枚举与常见同义词
    case '规划中':
      return 'planning';
    case '进行中':
      return 'active';
    case '暂停':
    case '已暂停':
      return 'paused';
    case '完成':
    case '已完成':
      return 'completed';
    case '取消':
    case '已取消':
      return 'cancelled';
    case '归档':
    case '已归档':
      // 归档统一为已完成
      return 'completed';
    default:
      return undefined;
  }
};

// 优先级映射（支持中文/英文，统一到服务端英文枚举）
const mapProjectPriority = (value?: string): ProjectFilters['priority'] | undefined => {
  switch (value) {
    // 英文枚举
    case 'low':
      return 'low';
    case 'medium':
      return 'medium';
    case 'high':
      return 'high';

    // 中文枚举与常见标签
    case '低':
    case '低优先级':
      return 'low';
    case '中':
    case '中优先级':
      return 'medium';
    case '高':
    case '高优先级':
      return 'high';
    default:
      return undefined;
  }
};

// 获取用户的项目列表
export const getProjects = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { 
      page = 1, 
      limit = 10, 
      status, 
      priority, 
      search,
      parent_id 
    } = req.query as Record<string, any>;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const filters: ProjectFilters = {};
    const statusMapped = mapProjectStatus(status as string | undefined);
    if (statusMapped !== undefined) {
      filters.status = statusMapped;
    }
    const priorityMapped = mapProjectPriority(priority as string | undefined);
    if (priorityMapped !== undefined) {
      filters.priority = priorityMapped;
    }
    if (typeof search === 'string' && search.length > 0) {
      filters.search = search as string;
    }
    if (typeof parent_id === 'string') {
      // 保留空字符串用于查询 parent_id IS NULL 的场景
      filters.parent_id = parent_id as string;
    }
    filters.limit = limitNum;
    filters.offset = offset;

    const projects = await ProjectModel.findByUserId(userId, filters);

    return res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// 获取单个项目详情
export const getProject = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!id) {
      return res.status(400).json({ error: 'project id is required' });
    }

    // 检查用户是否有权限访问该项目
    const isMember = await ProjectMemberModel.checkMembership(id as string, userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const project = await ProjectModel.findById(id as string, userId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    return res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// 创建新项目
export const createProject = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, description, parent_id, status, priority, start_date, end_date, tags } = req.body as Record<string, any>;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const projectData: CreateProjectData = {
      name,
      description,
      parent_id,
      owner_id: userId,
      status: mapProjectStatus(status) ?? 'planning',
      priority: mapProjectPriority(priority) ?? 'medium',
      start_date,
      end_date,
      ...(Array.isArray(tags) ? { tags } : {})
    };

    const project = await ProjectModel.create(projectData);

    // 自动将创建者添加为项目管理员（英文角色，与DB约束一致）
    await ProjectMemberModel.create({
      project_id: project.id,
      user_id: userId,
      role: 'admin' as any
    });

    return res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// 更新项目
export const updateProject = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!id) {
      return res.status(400).json({ error: 'project id is required' });
    }

    // 检查用户是否有管理权限
    const hasPermission = await ProjectMemberModel.checkPermission(id as string, userId, 'manage_project');
    if (!hasPermission) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, description, status, priority, start_date, end_date, parent_id, tags } = req.body as Record<string, any>;

    const updateData: UpdateProjectData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    const updateStatus = mapProjectStatus(status as string | undefined);
    if (updateStatus !== undefined) updateData.status = updateStatus;
    const updatePriority = mapProjectPriority(priority as string | undefined);
    if (updatePriority !== undefined) updateData.priority = updatePriority;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags) ? tags : [];
    }

    // 允许更新父项目：空字符串或显式 null 视为取消父级
    if (parent_id !== undefined) {
      const newParent = parent_id === '' ? null : parent_id;
      // 禁止将项目设为其自身的父级
      if (newParent && newParent === id) {
        return res.status(400).json({ error: 'parent_id cannot be the project itself' });
      }
      updateData.parent_id = newParent as any;
    }

    const project = await ProjectModel.update(id as string, userId, updateData);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    return res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// 删除项目
export const deleteProject = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!id) {
      return res.status(400).json({ error: 'project id is required' });
    }

    // 检查用户是否有删除权限
    const hasPermission = await ProjectMemberModel.checkPermission(id as string, userId, 'delete_project');
    if (!hasPermission) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const success = await ProjectModel.delete(id as string, userId);
    if (!success) {
      return res.status(404).json({ error: 'Project not found' });
    }

    return res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// 获取项目统计信息
export const getProjectStats = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!id) {
      return res.status(400).json({ error: 'project id is required' });
    }

    // 检查用户是否有权限访问该项目
    const isMember = await ProjectMemberModel.checkMembership(id as string, userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const stats = await ProjectModel.getStats(userId);
    return res.json(stats);
  } catch (error) {
    console.error('Error fetching project stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// 获取子项目
export const getSubProjects = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!id) {
      return res.status(400).json({ error: 'project id is required' });
    }

    // 检查用户是否有权限访问该项目
    const isMember = await ProjectMemberModel.checkMembership(id as string, userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const subProjects = await ProjectModel.getSubProjects(id as string, userId);
    return res.json(subProjects);
  } catch (error) {
    console.error('Error fetching sub-projects:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
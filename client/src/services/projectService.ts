import { apiClient } from './apiClient';

// 项目相关接口定义
export interface Project {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  owner_id: string;
  status: 'planning' | 'active' | 'paused' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high';
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  // 统计信息
  tasks_total?: number;
  tasks_completed?: number;
  progress?: number;
  team_members?: number;
  sub_projects?: number;
  // 标签
  tags?: string[];
  // 兼容性属性（用于组件中的不同命名）
  subProjects?: number;
  daysRemaining?: number;
  // 层级结构相关
  children?: Project[];
  parentId?: string;
  // 其他可能的属性
  dueDate?: string;
  tasksCompleted?: number;
  tasksTotal?: number;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  parent_id?: string | null;
  status?: 'planning' | 'active' | 'paused' | 'completed' | 'archived';
  priority?: 'low' | 'medium' | 'high';
  start_date?: string;
  end_date?: string;
  tags?: string[];
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: 'planning' | 'active' | 'paused' | 'completed' | 'archived';
  priority?: 'low' | 'medium' | 'high';
  start_date?: string;
  end_date?: string;
  parent_id?: string | null;
  tags?: string[];
}

export interface GetProjectsParams {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  search?: string;
  parent_id?: string;
}

export interface ProjectStats {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  total_team_members: number;
  upcoming_deadlines: number;
}

// 任务相关接口定义
export interface Task {
  id: string;
  title: string;
  description?: string;
  project_id: string;
  assignee_id?: string;
  creator_id: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  start_date?: string;
  due_date?: string;
  tags?: string[];
  estimated_hours?: number;
  actual_hours?: number;
  created_at: string;
  updated_at: string;
  // 关联信息
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
  };
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  project_id: string;
  assignee_id?: string;
  status?: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  start_date?: string;
  due_date?: string;
  tags?: string[];
  estimated_hours?: number;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  assignee_id?: string;
  status?: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  start_date?: string;
  due_date?: string;
  tags?: string[];
  estimated_hours?: number;
  actual_hours?: number;
}

export interface GetTasksParams {
  page?: number;
  limit?: number;
  project_id?: string;
  status?: string;
  priority?: string;
  assignee_id?: string;
  search?: string;
  tags?: string;
  due_date_start?: string;
  due_date_end?: string;
}

export interface TaskStats {
  total: number;
  todo: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  overdue: number;
}

// 项目成员相关接口定义
export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'admin' | 'member' | 'observer';
  joined_at: string;
  // 用户信息
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface AddProjectMemberRequest {
  user_id: string;
  role?: 'admin' | 'member' | 'observer';
}

export interface UpdateProjectMemberRequest {
  role: 'admin' | 'member' | 'observer';
}

export interface GetProjectMembersParams {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
}

export interface ProjectMemberStats {
  total: number;
  admins: number;
  members: number;
  observers: number;
}

// 项目服务类
class ProjectService {
  // 项目相关方法
  async getProjects(params?: GetProjectsParams): Promise<Project[]> {
    const response = await apiClient.get('/projects', { params });
    const list = response.data;
    // 统一字段：member_count -> team_members；task_count -> tasks_total；日期保证为 YYYY-MM-DD
    const toDate = (v?: string) => (typeof v === 'string' ? (v.split('T')[0] || v) : v);
    const toInt = (v: any) => {
      if (v === null || v === undefined) return 0;
      if (typeof v === 'number') return v;
      const n = parseInt(String(v), 10);
      return Number.isNaN(n) ? 0 : n;
    };
    return (Array.isArray(list) ? list : []).map((p: any) => ({
      ...p,
      team_members: toInt(p.team_members ?? p.member_count),
      tasks_total: toInt(p.tasks_total ?? p.task_count),
      tasks_completed: toInt(p.tasks_completed),
      start_date: toDate(p.start_date),
      end_date: toDate(p.end_date),
    }));
  }

  async getProject(id: string): Promise<Project> {
    const response = await apiClient.get(`/projects/${id}`);
    const p = response.data || {};
    const toDate = (v?: string) => (typeof v === 'string' ? (v.split('T')[0] || v) : v);
    const toInt = (v: any) => {
      if (v === null || v === undefined) return 0;
      if (typeof v === 'number') return v;
      const n = parseInt(String(v), 10);
      return Number.isNaN(n) ? 0 : n;
    };
    return {
      ...p,
      team_members: toInt(p.team_members ?? p.member_count),
      tasks_total: toInt(p.tasks_total ?? p.task_count),
      tasks_completed: toInt(p.tasks_completed),
      start_date: toDate(p.start_date),
      end_date: toDate(p.end_date),
    } as Project;
  }

  async createProject(data: CreateProjectRequest): Promise<Project> {
    const response = await apiClient.post('/projects', data);
    return response.data;
  }

  async updateProject(id: string, data: UpdateProjectRequest): Promise<Project> {
    const response = await apiClient.put(`/projects/${id}`, data);
    return response.data;
  }

  async deleteProject(id: string): Promise<void> {
    await apiClient.delete(`/projects/${id}`);
  }

  async getProjectStats(id: string): Promise<ProjectStats> {
    const response = await apiClient.get(`/projects/${id}/stats`);
    return response.data;
  }

  async getSubProjects(id: string): Promise<Project[]> {
    const response = await apiClient.get(`/projects/${id}/sub-projects`);
    return response.data;
  }

  // 任务相关方法
  async getTasks(params?: GetTasksParams): Promise<{ tasks: Task[]; total: number; page: number; limit: number }> {
    const response = await apiClient.get('/projects/tasks', { params });
    return response.data;
  }

  async getProjectTasks(projectId: string, params?: GetTasksParams): Promise<{ tasks: Task[]; total: number; page: number; limit: number }> {
    const response = await apiClient.get(`/projects/${projectId}/tasks`, { params });
    return response.data;
  }

  async getTask(id: string): Promise<Task> {
    const response = await apiClient.get(`/projects/tasks/${id}`);
    return response.data;
  }

  async createTask(projectId: string, data: CreateTaskRequest): Promise<Task> {
    const response = await apiClient.post(`/projects/${projectId}/tasks`, data);
    return response.data;
  }

  async updateTask(id: string, data: UpdateTaskRequest): Promise<Task> {
    const response = await apiClient.put(`/projects/tasks/${id}`, data);
    return response.data;
  }

  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(`/projects/tasks/${id}`);
  }

  async getTaskStats(params?: { project_id?: string }): Promise<TaskStats> {
    const response = await apiClient.get('/projects/tasks/stats', { params });
    return response.data;
  }

  async getTaskTags(params?: { project_id?: string }): Promise<string[]> {
    const response = await apiClient.get('/projects/tasks/tags', { params });
    return response.data;
  }

  async batchUpdateTaskStatus(taskIds: string[], status: string): Promise<{ updated_count: number }> {
    const response = await apiClient.put('/projects/tasks/batch/status', {
      task_ids: taskIds,
      status
    });
    return response.data;
  }

  // 项目成员相关方法
  async getProjectMembers(projectId: string, params?: GetProjectMembersParams): Promise<{ members: ProjectMember[]; total: number; page: number; limit: number }> {
    const response = await apiClient.get(`/projects/${projectId}/members`, { params });
    const data = response.data;
    // 兼容后端直接返回数组的情况
    if (Array.isArray(data)) {
      const members: ProjectMember[] = data.map((m: any) => ({
        id: m.id,
        project_id: m.project_id,
        user_id: m.user_id,
        role: m.role,
        joined_at: m.joined_at,
        user: {
          id: m.user_id,
          name: m.username || m.user?.name || '',
          email: m.email || m.user?.email || '',
          avatar: m.user?.avatar
        }
      }));
      return { members, total: members.length, page: 1, limit: members.length };
    }
    // 如果不是数组，假定为带 members 属性的对象，并进行同样转换
    const rawMembers = Array.isArray(data?.members) ? data.members : [];
    const members: ProjectMember[] = rawMembers.map((m: any) => ({
      id: m.id,
      project_id: m.project_id,
      user_id: m.user_id,
      role: m.role,
      joined_at: m.joined_at,
      user: {
        id: m.user_id,
        name: m.username || m.user?.name || '',
        email: m.email || m.user?.email || '',
        avatar: m.user?.avatar
      }
    }));
    return { members, total: members.length, page: data?.page ?? 1, limit: data?.limit ?? members.length };
  }

  async getUserProjects(params?: { page?: number; limit?: number; role?: string }): Promise<{ projects: Project[]; total: number; page: number; limit: number }> {
    const response = await apiClient.get('/projects/user/projects', { params });
    return response.data;
  }

  async addProjectMember(projectId: string, data: AddProjectMemberRequest): Promise<ProjectMember> {
    const response = await apiClient.post(`/projects/${projectId}/members`, data);
    return response.data;
  }

  async updateProjectMember(projectId: string, memberId: string, data: UpdateProjectMemberRequest): Promise<ProjectMember> {
    const response = await apiClient.put(`/projects/${projectId}/members/${memberId}`, data);
    return response.data;
  }

  async removeProjectMember(projectId: string, memberId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/members/${memberId}`);
  }

  async batchAddProjectMembers(projectId: string, members: AddProjectMemberRequest[]): Promise<{ added_count: number; members: ProjectMember[] }> {
    const response = await apiClient.post(`/projects/${projectId}/members/batch`, { members });
    return response.data;
  }

  async getProjectMemberStats(projectId: string): Promise<ProjectMemberStats> {
    const response = await apiClient.get(`/projects/${projectId}/members/stats`);
    return response.data;
  }

  async searchAvailableUsers(projectId: string, search?: string, limit?: number): Promise<Array<{ id: string; name: string; email: string; avatar?: string }>> {
    const response = await apiClient.get(`/projects/${projectId}/members/search`, {
      params: { search, limit }
    });
    return response.data;
  }

  async getRecentMembers(projectId: string, limit?: number): Promise<ProjectMember[]> {
    const response = await apiClient.get(`/projects/${projectId}/members/recent`, {
      params: { limit }
    });
    return response.data;
  }
}

export const projectService = new ProjectService();
import { apiClient } from './apiClient';

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  avatar?: string;
  role: string;
  department?: string;
  position?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  permissions: string[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  created_at: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  full_name: string;
  password: string;
  role: string;
  department?: string;
  position?: string;
  phone?: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  full_name?: string;
  role?: string;
  department?: string;
  position?: string;
  phone?: string;
  is_active?: boolean;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  permissions: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: string[];
}

export interface UserFilters {
  search?: string;
  role?: string;
  department?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface RoleFilters {
  search?: string;
  is_system?: boolean;
  page?: number;
  limit?: number;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  total_roles: number;
  users_by_role: Record<string, number>;
  users_by_department: Record<string, number>;
  recent_logins: number;
}

class UserService {
  // 用户管理
  async getUsers(filters: UserFilters = {}) {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.role) params.append('role', filters.role);
    if (filters.department) params.append('department', filters.department);
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    return apiClient.get<{
      data: User[];
      total: number;
      page: number;
      limit: number;
    }>(`/users?${params.toString()}`);
  }

  async getUserById(id: string) {
    return apiClient.get<User>(`/users/${id}`);
  }

  async createUser(userData: CreateUserRequest) {
    return apiClient.post<User>('/users', userData);
  }

  async updateUser(id: string, userData: UpdateUserRequest) {
    return apiClient.put<User>(`/users/${id}`, userData);
  }

  async deleteUser(id: string) {
    return apiClient.delete(`/users/${id}`);
  }

  async toggleUserStatus(id: string, is_active: boolean) {
    return apiClient.patch<User>(`/users/${id}/status`, { is_active });
  }

  async resetUserPassword(id: string, new_password: string) {
    return apiClient.patch(`/users/${id}/password`, { new_password });
  }

  async getUserStats() {
    return apiClient.get<UserStats>('/users/stats');
  }

  // 角色管理
  async getRoles(filters: RoleFilters = {}) {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.is_system !== undefined) params.append('is_system', filters.is_system.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    return apiClient.get<{
      data: Role[];
      total: number;
      page: number;
      limit: number;
    }>(`/roles?${params.toString()}`);
  }

  async getRoleById(id: string) {
    return apiClient.get<Role>(`/roles/${id}`);
  }

  async createRole(roleData: CreateRoleRequest) {
    return apiClient.post<Role>('/roles', roleData);
  }

  async updateRole(id: string, roleData: UpdateRoleRequest) {
    return apiClient.put<Role>(`/roles/${id}`, roleData);
  }

  async deleteRole(id: string) {
    return apiClient.delete(`/roles/${id}`);
  }

  // 权限管理
  async getPermissions() {
    return apiClient.get<Permission[]>('/permissions');
  }

  async getPermissionsByResource() {
    return apiClient.get<Record<string, Permission[]>>('/permissions/by-resource');
  }

  // 用户权限检查
  async checkUserPermission(userId: string, permission: string) {
    return apiClient.get<{ has_permission: boolean }>(`/users/${userId}/permissions/${permission}`);
  }

  async getUserPermissions(userId: string) {
    return apiClient.get<string[]>(`/users/${userId}/permissions`);
  }

  // 批量操作
  async bulkUpdateUsers(userIds: string[], updates: Partial<UpdateUserRequest>) {
    return apiClient.patch('/users/bulk', { user_ids: userIds, updates });
  }

  async bulkDeleteUsers(userIds: string[]) {
    return apiClient.delete('/users/bulk', { data: { user_ids: userIds } });
  }

  // 导入导出
  async exportUsers(filters: UserFilters = {}) {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.role) params.append('role', filters.role);
    if (filters.department) params.append('department', filters.department);
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());

    return apiClient.get(`/users/export?${params.toString()}`, {
      responseType: 'blob'
    });
  }

  async importUsers(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiClient.post('/users/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
}

export const userService = new UserService();
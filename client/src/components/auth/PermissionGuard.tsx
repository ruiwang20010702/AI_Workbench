import React, { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  role?: string;
  roles?: string[];
  requireAll?: boolean; // 是否需要满足所有权限/角色
  fallback?: ReactNode; // 无权限时显示的内容
  onUnauthorized?: () => void; // 无权限时的回调
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions = [],
  role,
  roles = [],
  requireAll = false,
  fallback = null,
  onUnauthorized
}) => {
  const auth = useAuth();

  // 聚合单个与多个权限、角色
  const requiredPerms = (permissions && permissions.length > 0)
    ? permissions
    : (permission ? [permission] : []);

  const requiredRoles = (roles && roles.length > 0)
    ? roles
    : (role ? [role] : []);

  // 个人工作台模式：允许，仍计算以避免未使用变量告警
  const bypass = true;
  const hasPerms = requiredPerms.length === 0
    ? true
    : (requireAll
        ? requiredPerms.every((p) => auth.hasPermission(p))
        : requiredPerms.some((p) => auth.hasPermission(p))
      );

  const hasRoles = requiredRoles.length === 0
    ? true
    : (requireAll
        ? requiredRoles.every((r) => auth.hasRole(r))
        : requiredRoles.some((r) => auth.hasRole(r))
      );

  const isAllowed = bypass ? true : (hasPerms && hasRoles);
  if (!isAllowed) {
    onUnauthorized?.();
    return <>{fallback}</>;
  }
  return <>{children}</>;
};

// 权限检查 Hook
export const usePermissions = () => {
  const { user, hasPermission, hasRole } = useAuth();

  const bypass = true;

  const checkPermission = (permission: string): boolean => {
    return bypass ? true : hasPermission(permission);
  };

  const checkPermissions = (permissions: string[], requireAll = false): boolean => {
    if (bypass) return true;
    const list = permissions || [];
    return requireAll ? list.every((p) => hasPermission(p)) : list.some((p) => hasPermission(p));
  };

  const checkRole = (role: string): boolean => {
    return bypass ? true : hasRole(role);
  };

  const checkRoles = (roles: string[], requireAll = false): boolean => {
    if (bypass) return true;
    const list = roles || [];
    return requireAll ? list.every((r) => hasRole(r)) : list.some((r) => hasRole(r));
  };

  const isAdmin = (): boolean => {
    return bypass ? true : hasRole('admin');
  };

  const isSuperAdmin = (): boolean => {
    return bypass ? true : hasRole('super_admin');
  };

  const canManageUsers = (): boolean => {
    return bypass ? true : hasPermission('users.manage');
  };

  const canManageProjects = (): boolean => {
    return bypass ? true : hasPermission('projects.manage');
  };

  const canManageTasks = (): boolean => {
    return bypass ? true : hasPermission('tasks.manage');
  };

  const canViewReports = (): boolean => {
    return bypass ? true : hasPermission('reports.view');
  };

  const canManageSystem = (): boolean => {
    return bypass ? true : hasPermission('system.manage');
  };

  return {
    user,
    checkPermission,
    checkPermissions,
    checkRole,
    checkRoles,
    isAdmin,
    isSuperAdmin,
    canManageUsers,
    canManageProjects,
    canManageTasks,
    canViewReports,
    canManageSystem
  };
};

// 权限常量
export const PERMISSIONS = {
  // 用户管理
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_MANAGE: 'users.manage',

  // 项目管理
  PROJECTS_VIEW: 'projects.view',
  PROJECTS_CREATE: 'projects.create',
  PROJECTS_UPDATE: 'projects.update',
  PROJECTS_DELETE: 'projects.delete',
  PROJECTS_MANAGE: 'projects.manage',

  // 任务管理
  TASKS_VIEW: 'tasks.view',
  TASKS_CREATE: 'tasks.create',
  TASKS_UPDATE: 'tasks.update',
  TASKS_DELETE: 'tasks.delete',
  TASKS_MANAGE: 'tasks.manage',

  // 报告查看
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',

  // 系统管理
  SYSTEM_SETTINGS: 'system.settings',
  SYSTEM_LOGS: 'system.logs',
  SYSTEM_MANAGE: 'system.manage',

  // 角色权限管理
  ROLES_VIEW: 'roles.view',
  ROLES_CREATE: 'roles.create',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',
  ROLES_MANAGE: 'roles.manage'
} as const;

// 角色常量
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  PROJECT_MANAGER: 'project_manager',
  DEVELOPER: 'developer',
  DESIGNER: 'designer',
  TESTER: 'tester',
  VIEWER: 'viewer'
} as const;
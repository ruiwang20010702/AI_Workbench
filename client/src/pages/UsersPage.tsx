import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Download,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  Shield
} from 'lucide-react';
import { userService, User, UserFilters, UserStats } from '../services/userService';
import { PermissionGuard, PERMISSIONS } from '../components/auth/PermissionGuard';

interface UserCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: any) => void;
  editingUser?: User | null;
}

const UserCreateModal: React.FC<UserCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingUser
}) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    role: 'developer',
    department: '',
    position: '',
    phone: ''
  });

  useEffect(() => {
    if (editingUser) {
      setFormData({
        username: editingUser.username,
        email: editingUser.email,
        full_name: editingUser.full_name,
        password: '',
        role: editingUser.role,
        department: editingUser.department || '',
        position: editingUser.position || '',
        phone: editingUser.phone || ''
      });
    } else {
      setFormData({
        username: '',
        email: '',
        full_name: '',
        password: '',
        role: 'developer',
        department: '',
        position: '',
        phone: ''
      });
    }
  }, [editingUser, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">
          {editingUser ? '编辑用户' : '创建用户'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              用户名 *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              邮箱 *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              姓名 *
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {!editingUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                密码 *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required={!editingUser}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              角色 *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="developer">开发者</option>
              <option value="designer">设计师</option>
              <option value="project_manager">项目经理</option>
              <option value="tester">测试员</option>
              <option value="admin">管理员</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              部门
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              职位
            </label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              电话
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              {editingUser ? '更新' : '创建'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total_users: 0,
    active_users: 0,
    inactive_users: 0,
    total_roles: 0,
    users_by_role: {},
    users_by_department: {},
    recent_logins: 0
  });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  // 移除未使用的selectedUsers状态
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: '',
    department: '',
    is_active: undefined,
    page: 1,
    limit: 20
  });

  useEffect(() => {
    loadUsers();
    loadStats();
  }, [filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers(filters);
      setUsers(response.data.data);
    } catch (error) {
      console.error('加载用户失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await userService.getUserStats();
      setStats(response.data);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  const handleCreateUser = async (userData: any) => {
    try {
      if (editingUser) {
        await userService.updateUser(editingUser.id, userData);
      } else {
        await userService.createUser(userData);
      }
      setShowCreateModal(false);
      setEditingUser(null);
      loadUsers();
      loadStats();
    } catch (error) {
      console.error('保存用户失败:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('确定要删除这个用户吗？')) {
      try {
        await userService.deleteUser(userId);
        loadUsers();
        loadStats();
      } catch (error) {
        console.error('删除用户失败:', error);
      }
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await userService.toggleUserStatus(userId, isActive);
      loadUsers();
      loadStats();
    } catch (error) {
      console.error('更新用户状态失败:', error);
    }
  };

  const handleExportUsers = async () => {
    try {
      const response = await userService.exportUsers(filters);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'users.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('导出用户失败:', error);
    }
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      super_admin: '超级管理员',
      admin: '管理员',
      project_manager: '项目经理',
      developer: '开发者',
      designer: '设计师',
      tester: '测试员',
      viewer: '查看者'
    };
    return roleLabels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const roleColors: Record<string, string> = {
      super_admin: 'bg-red-100 text-red-800',
      admin: 'bg-purple-100 text-purple-800',
      project_manager: 'bg-blue-100 text-blue-800',
      developer: 'bg-green-100 text-green-800',
      designer: 'bg-yellow-100 text-yellow-800',
      tester: 'bg-orange-100 text-orange-800',
      viewer: 'bg-gray-100 text-gray-800'
    };
    return roleColors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <PermissionGuard permission={PERMISSIONS.USERS_VIEW}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">用户管理</h1>
                <p className="text-gray-600">管理系统用户和权限</p>
              </div>
              <div className="flex space-x-3">
                <PermissionGuard permission={PERMISSIONS.USERS_CREATE}>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>添加用户</span>
                  </button>
                </PermissionGuard>
                <button
                  onClick={handleExportUsers}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  <Download className="w-4 h-4" />
                  <span>导出</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">总用户数</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_users}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <UserCheck className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">活跃用户</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active_users}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <UserX className="w-8 h-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">停用用户</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.inactive_users}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">角色数量</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_roles}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">搜索</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="搜索用户名、邮箱或姓名"
                    value={filters.search || ''}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                <select
                  value={filters.role || ''}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">所有角色</option>
                  <option value="admin">管理员</option>
                  <option value="project_manager">项目经理</option>
                  <option value="developer">开发者</option>
                  <option value="designer">设计师</option>
                  <option value="tester">测试员</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">部门</label>
                <input
                  type="text"
                  placeholder="部门名称"
                  value={filters.department || ''}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value, page: 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select
                  value={filters.is_active === undefined ? '' : filters.is_active.toString()}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    is_active: e.target.value === '' ? undefined : e.target.value === 'true',
                    page: 1 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">所有状态</option>
                  <option value="true">活跃</option>
                  <option value="false">停用</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      用户
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      角色
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      部门/职位
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      联系方式
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      最后登录
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        没有找到用户
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {user.full_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.full_name}
                              </div>
                              <div className="text-sm text-gray-500">@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{user.department || '-'}</div>
                          <div className="text-gray-500">{user.position || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 text-gray-400 mr-1" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center mt-1">
                              <Phone className="w-4 h-4 text-gray-400 mr-1" />
                              {user.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.is_active ? '活跃' : '停用'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.last_login ? (
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(user.last_login).toLocaleDateString()}
                            </div>
                          ) : (
                            '从未登录'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <PermissionGuard permission={PERMISSIONS.USERS_UPDATE}>
                              <button
                                onClick={() => {
                                  setEditingUser(user);
                                  setShowCreateModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </PermissionGuard>
                            <PermissionGuard permission={PERMISSIONS.USERS_UPDATE}>
                              <button
                                onClick={() => handleToggleUserStatus(user.id, !user.is_active)}
                                className={user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                              >
                                {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </button>
                            </PermissionGuard>
                            <PermissionGuard permission={PERMISSIONS.USERS_DELETE}>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </PermissionGuard>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Create/Edit Modal */}
        <UserCreateModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setEditingUser(null);
          }}
          onSubmit={handleCreateUser}
          editingUser={editingUser}
        />
      </div>
    </PermissionGuard>
  );
};
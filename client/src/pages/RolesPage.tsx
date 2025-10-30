import React, { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Search,
  Edit,
  Trash2,
  Lock,
  Check
} from 'lucide-react';
import { userService, Role, Permission, CreateRoleRequest, UpdateRoleRequest } from '../services/userService';
import { PermissionGuard, PERMISSIONS } from '../components/auth/PermissionGuard';

interface RoleCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (roleData: CreateRoleRequest | UpdateRoleRequest) => void;
  editingRole?: Role | null;
  permissions: Permission[];
}

const RoleCreateModal: React.FC<RoleCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingRole,
  permissions
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  const [permissionsByResource, setPermissionsByResource] = useState<Record<string, Permission[]>>({});

  useEffect(() => {
    if (editingRole) {
      setFormData({
        name: editingRole.name,
        description: editingRole.description,
        permissions: editingRole.permissions
      });
    } else {
      setFormData({
        name: '',
        description: '',
        permissions: []
      });
    }
  }, [editingRole, isOpen]);

  useEffect(() => {
    // 按资源分组权限
    const grouped = permissions.reduce((acc, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = [];
      }
      acc[permission.resource].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
    setPermissionsByResource(grouped);
  }, [permissions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handlePermissionToggle = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const handleResourceToggle = (resource: string) => {
    const resourcePermissions = permissionsByResource[resource] || [];
    const resourcePermissionIds = resourcePermissions.map(p => p.id);
    const allSelected = resourcePermissionIds.every(id => formData.permissions.includes(id));

    if (allSelected) {
      // 取消选择所有该资源的权限
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(id => !resourcePermissionIds.includes(id))
      }));
    } else {
      // 选择所有该资源的权限
      setFormData(prev => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...resourcePermissionIds])]
      }));
    }
  };

  const getResourceLabel = (resource: string) => {
    const resourceLabels: Record<string, string> = {
      users: '用户管理',
      projects: '项目管理',
      tasks: '任务管理',
      reports: '报告查看',
      system: '系统管理',
      roles: '角色管理'
    };
    return resourceLabels[resource] || resource;
  };

  const getActionLabel = (action: string) => {
    const actionLabels: Record<string, string> = {
      view: '查看',
      create: '创建',
      update: '更新',
      delete: '删除',
      manage: '管理',
      export: '导出',
      settings: '设置',
      logs: '日志'
    };
    return actionLabels[action] || action;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">
          {editingRole ? '编辑角色' : '创建角色'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                角色名称 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={editingRole?.is_system}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                描述 *
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              权限设置
            </label>
            <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
              {Object.entries(permissionsByResource).map(([resource, resourcePermissions]) => {
                const resourcePermissionIds = resourcePermissions.map(p => p.id);
                const allSelected = resourcePermissionIds.every(id => formData.permissions.includes(id));
                const someSelected = resourcePermissionIds.some(id => formData.permissions.includes(id));

                return (
                  <div key={resource} className="mb-4">
                    <div className="flex items-center mb-2">
                      <button
                        type="button"
                        onClick={() => handleResourceToggle(resource)}
                        className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium ${
                          allSelected
                            ? 'bg-blue-100 text-blue-800'
                            : someSelected
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {allSelected ? (
                          <Check className="w-4 h-4" />
                        ) : someSelected ? (
                          <div className="w-4 h-4 bg-yellow-600 rounded-sm"></div>
                        ) : (
                          <div className="w-4 h-4 border-2 border-gray-400 rounded-sm"></div>
                        )}
                        <span>{getResourceLabel(resource)}</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 ml-6">
                      {resourcePermissions.map((permission) => (
                        <label
                          key={permission.id}
                          className="flex items-center space-x-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(permission.id)}
                            onChange={() => handlePermissionToggle(permission.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {getActionLabel(permission.action)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              disabled={editingRole?.is_system && editingRole.name !== formData.name}
            >
              {editingRole ? '更新' : '创建'}
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

export const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await userService.getRoles({ search: searchTerm });
      setRoles(response.data.data);
    } catch (error) {
      console.error('加载角色失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      const response = await userService.getPermissions();
      setPermissions(response.data);
    } catch (error) {
      console.error('加载权限失败:', error);
    }
  };

  const handleCreateRole = async (roleData: CreateRoleRequest | UpdateRoleRequest) => {
    try {
      if (editingRole) {
        await userService.updateRole(editingRole.id, roleData as UpdateRoleRequest);
      } else {
        await userService.createRole(roleData as CreateRoleRequest);
      }
      setShowCreateModal(false);
      setEditingRole(null);
      loadRoles();
    } catch (error) {
      console.error('保存角色失败:', error);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (window.confirm('确定要删除这个角色吗？删除后该角色的用户将失去相应权限。')) {
      try {
        await userService.deleteRole(roleId);
        loadRoles();
      } catch (error) {
        console.error('删除角色失败:', error);
      }
    }
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPermissionLabel = (permissionId: string) => {
    const permission = permissions.find(p => p.id === permissionId);
    if (!permission) return permissionId;
    
    const resourceLabels: Record<string, string> = {
      users: '用户',
      projects: '项目',
      tasks: '任务',
      reports: '报告',
      system: '系统',
      roles: '角色'
    };
    
    const actionLabels: Record<string, string> = {
      view: '查看',
      create: '创建',
      update: '更新',
      delete: '删除',
      manage: '管理',
      export: '导出',
      settings: '设置',
      logs: '日志'
    };

    const resource = resourceLabels[permission.resource] || permission.resource;
    const action = actionLabels[permission.action] || permission.action;
    
    return `${resource}.${action}`;
  };

  return (
    <PermissionGuard permission={PERMISSIONS.ROLES_VIEW}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">角色权限管理</h1>
                <p className="text-gray-600">管理系统角色和权限分配</p>
              </div>
              <PermissionGuard permission={PERMISSIONS.ROLES_CREATE}>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>创建角色</span>
                </button>
              </PermissionGuard>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索角色名称或描述"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Roles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到角色</h3>
                <p className="text-gray-600">尝试调整搜索条件或创建新角色</p>
              </div>
            ) : (
              filteredRoles.map((role) => (
                <div key={role.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        role.is_system ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        {role.is_system ? (
                          <Lock className={`w-5 h-5 ${role.is_system ? 'text-red-600' : 'text-blue-600'}`} />
                        ) : (
                          <Shield className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                        <p className="text-sm text-gray-600">{role.description}</p>
                      </div>
                    </div>
                    {!role.is_system && (
                      <div className="flex space-x-2">
                        <PermissionGuard permission={PERMISSIONS.ROLES_UPDATE}>
                          <button
                            onClick={() => {
                              setEditingRole(role);
                              setShowCreateModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </PermissionGuard>
                        <PermissionGuard permission={PERMISSIONS.ROLES_DELETE}>
                          <button
                            onClick={() => handleDeleteRole(role.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </PermissionGuard>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">权限</span>
                      <span className="text-sm text-gray-500">{role.permissions.length} 个</span>
                    </div>
                    <div className="max-h-32 overflow-y-auto">
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 6).map((permissionId) => (
                          <span
                            key={permissionId}
                            className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded"
                          >
                            {getPermissionLabel(permissionId)}
                          </span>
                        ))}
                        {role.permissions.length > 6 && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                            +{role.permissions.length - 6} 更多
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>
                      {role.is_system ? '系统角色' : '自定义角色'}
                    </span>
                    <span>
                      创建于 {new Date(role.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create/Edit Modal */}
        <RoleCreateModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setEditingRole(null);
          }}
          onSubmit={handleCreateRole}
          editingRole={editingRole}
          permissions={permissions}
        />
      </div>
    </PermissionGuard>
  );
};
import React, { useEffect, useState } from 'react';
import { X, Calendar, Users, Flag, FolderTree, Trash2, UserMinus } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Project, CreateProjectRequest, projectService, ProjectMember } from '../../services/projectService';
import { mapProjectPriorityToEnglish, mapProjectStatusToEnglish } from '../../utils/enumMappings';

interface ProjectCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectData: CreateProjectRequest, teamEmails?: string[], defaultRole?: 'admin' | 'member' | 'observer') => void | Promise<void>;
  editProject?: Project | null;
  parentProject?: Project | null;
}

interface ProjectFormData {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  priority: 'low' | 'medium' | 'high';
  status: 'planning' | 'active' | 'paused' | 'completed' | 'archived';
  parent_id?: string | null;
  teamMembers: string[];
  defaultRole: 'admin' | 'member' | 'observer';
  tags: string[];
  attachments: File[];
  tempFileIds: string[];  // 临时文件ID列表
}

// 成员变更跟踪
interface MemberChange {
  memberId: string;
  userId?: string; // 待定成员没有 userId
  email: string;
  displayName: string;
  originalRole: 'admin' | 'member' | 'observer';
  newRole: 'admin' | 'member' | 'observer';
  action: 'keep' | 'update' | 'remove';
  isPending: boolean; // 是否为待定成员
}

export const ProjectCreateModal: React.FC<ProjectCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editProject,
  parentProject
}) => {
  const toDateInput = (val?: string) => {
    if (!val) return '';
    // 兼容 ISO 字符串，确保为 YYYY-MM-DD
    const parts = val.split('T');
    return parts[0] || val;
  };

  const [formData, setFormData] = useState<ProjectFormData>({
    name: editProject?.name || '',
    description: editProject?.description || '',
    start_date: toDateInput(editProject?.start_date) || '',
    end_date: toDateInput(editProject?.end_date) || '',
    priority: editProject?.priority || 'medium',
    status: editProject?.status as any || 'planning',
    parent_id: parentProject?.id || editProject?.parent_id,
    teamMembers: [],
    defaultRole: 'member',
    tags: [],
    attachments: [],
    tempFileIds: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [availableParents, setAvailableParents] = useState<Project[]>([]);
  const [emailInputText, setEmailInputText] = useState<string>(''); // 邮箱输入框的原始文本
  const [isSubmitting, setIsSubmitting] = useState(false); // 防止重复提交
  const [emailStatus, setEmailStatus] = useState<{
    registered: string[];
    unregistered: string[];
    alreadyMember: string[];
  }>({ registered: [], unregistered: [], alreadyMember: [] }); // 邮箱状态分类
  const [checkingEmails, setCheckingEmails] = useState(false); // 是否正在检查邮箱
  
  // 现有成员管理（仅编辑模式）
  const [existingMembers, setExistingMembers] = useState<MemberChange[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // 弹窗打开时初始化表单，并重置为第一步
  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      name: editProject?.name || '',
      description: editProject?.description || '',
      start_date: toDateInput(editProject?.start_date) || '',
      end_date: toDateInput(editProject?.end_date) || '',
      priority: editProject?.priority || 'medium',
      status: (editProject?.status as any) || 'planning',
      parent_id: parentProject?.id || editProject?.parent_id,
      teamMembers: [],
      defaultRole: 'member',
      // 预填项目标签为保存时的值（编辑模式）
      tags: Array.isArray(editProject?.tags) ? editProject!.tags : [],
      attachments: [],
      tempFileIds: []
    });
    setErrors({});
    setCurrentStep(1);
    setEmailInputText(''); // 重置邮箱输入框
    setIsSubmitting(false); // 重置提交状态
  }, [isOpen]);

  // 在编辑或切换父项目时，仅同步相关字段，避免重置步骤导致“下一步”失效
  useEffect(() => {
    if (!isOpen) return;
    setFormData(prev => ({
      ...prev,
      name: editProject?.name ?? prev.name,
      description: editProject?.description ?? prev.description,
      start_date: toDateInput(editProject?.start_date) ?? prev.start_date,
      end_date: toDateInput(editProject?.end_date) ?? prev.end_date,
      priority: editProject?.priority ?? prev.priority,
      status: (editProject?.status as any) ?? prev.status,
      parent_id: parentProject?.id || editProject?.parent_id,
      // 保持标签与当前编辑项目一致
      tags: Array.isArray(editProject?.tags) ? editProject!.tags : prev.tags
    }));
  }, [editProject, parentProject, isOpen]);

  // 编辑模式下加载现有成员（包括已确认成员和待定成员）
  useEffect(() => {
    const loadMembers = async () => {
      if (!isOpen || !editProject?.id) {
        setExistingMembers([]);
        return;
      }
      
      setLoadingMembers(true);
      try {
        // 1. 加载已确认成员
        const res: any = await projectService.getProjectMembers(editProject.id);
        const members: ProjectMember[] = Array.isArray(res) ? res : res?.members || [];
        
        const confirmedMembers: MemberChange[] = members.map(m => ({
          memberId: m.id,
          userId: m.user.id,
          email: m.user.email,
          displayName: m.user.name || m.user.email,
          originalRole: m.role,
          newRole: m.role,
          action: 'keep',
          isPending: false
        }));
        
        // 2. 加载待定成员
        let pendingMembers: MemberChange[] = [];
        try {
          const pendingRes = await projectService.getPendingMembers(editProject.id);
          pendingMembers = pendingRes.map(p => ({
            memberId: p.id,
            userId: undefined, // 待定成员没有 userId
            email: p.email,
            displayName: p.email, // 待定成员只有邮箱
            originalRole: p.role,
            newRole: p.role,
            action: 'keep',
            isPending: true
          }));
        } catch (pendingErr) {
          console.warn('加载待定成员失败:', pendingErr);
          // 不影响已确认成员的加载
        }
        
        // 3. 合并两种成员，待定成员排在后面
        setExistingMembers([...confirmedMembers, ...pendingMembers]);
      } catch (err) {
        console.error('加载项目成员失败:', err);
        setExistingMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    };
    loadMembers();
  }, [isOpen, editProject?.id]);

  // 加载可选的父项目列表（编辑模式下允许调整父级）
  useEffect(() => {
    const loadParents = async () => {
      if (!isOpen) return;
      try {
        const list = await projectService.getProjects();
        // 排除当前项目自身
        const filtered = editProject ? list.filter(p => p.id !== editProject.id) : list;
        setAvailableParents(filtered);
      } catch (err) {
        console.error('加载父项目列表失败:', err);
      }
    };
    loadParents();
  }, [isOpen, editProject]);

  // 成员管理函数
  const handleMemberRoleChange = (memberId: string, newRole: 'admin' | 'member' | 'observer') => {
    setExistingMembers(prev => prev.map(m => {
      if (m.memberId === memberId) {
        return {
          ...m,
          newRole,
          action: newRole === m.originalRole ? 'keep' : 'update'
        };
      }
      return m;
    }));
  };

  const handleMemberRemove = (memberId: string) => {
    setExistingMembers(prev => prev.map(m => {
      if (m.memberId === memberId) {
        return { ...m, action: 'remove' };
      }
      return m;
    }));
  };

  const handleMemberRestore = (memberId: string) => {
    setExistingMembers(prev => prev.map(m => {
      if (m.memberId === memberId) {
        return {
          ...m,
          newRole: m.originalRole,
          action: 'keep'
        };
      }
      return m;
    }));
  };

  // 检查邮箱状态（已注册 vs 未注册 vs 已是成员）
  const checkEmailStatus = async (emails: string[]) => {
    if (emails.length === 0) {
      setEmailStatus({ registered: [], unregistered: [], alreadyMember: [] });
      return;
    }

    setCheckingEmails(true);
    try {
      // 1. 查找已注册用户
      const registeredUsers = await projectService.findUsersByEmails(emails);
      const registeredEmailsSet = new Set(registeredUsers.map(u => u.email.toLowerCase()));
      const unregistered = emails.filter(e => !registeredEmailsSet.has(e.toLowerCase()));

      // 2. 如果是编辑模式，检查哪些用户已经是项目成员（包括待删除的成员）
      let alreadyMember: string[] = [];
      if (editProject?.id) {
        const existingEmailsSet = new Set(
          existingMembers
            .filter(m => m.action !== 'remove')
            .map(m => m.email.toLowerCase())
        );
        alreadyMember = registeredUsers
          .filter(u => existingEmailsSet.has(u.email.toLowerCase()))
          .map(u => u.email);
      }

      const registered = registeredUsers
        .filter(u => !alreadyMember.includes(u.email))
        .map(u => u.email);

      setEmailStatus({ registered, unregistered, alreadyMember });
    } catch (err) {
      console.error('检查邮箱状态失败:', err);
      setEmailStatus({ registered: [], unregistered: emails, alreadyMember: [] });
    } finally {
      setCheckingEmails(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '项目名称不能为空';
    }

    // 日期字段改为可选
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      newErrors.end_date = '结束日期不能早于开始日期';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 防止在第 1/2/3 步意外提交：将提交动作转化为"下一步"
    if (currentStep < MAX_STEP) {
      setCurrentStep(prev => Math.min(prev + 1, MAX_STEP));
      return;
    }
    
    // 防止重复提交
    if (isSubmitting) {
      console.log('正在提交中，请勿重复点击');
      return;
    }
    
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        // 在提交前统一中文/英文枚举到英文（含"归档"→"completed"规约）
        const statusEn = mapProjectStatusToEnglish(formData.status) ?? formData.status;
        const priorityEn = mapProjectPriorityToEnglish(formData.priority) ?? formData.priority;

        const payload: CreateProjectRequest = {
          name: formData.name,
          description: formData.description || undefined,
          parent_id: formData.parent_id,
          status: statusEn,
          priority: priorityEn,
          start_date: formData.start_date || undefined,
          end_date: formData.end_date || undefined,
          tags: formData.tags && formData.tags.length > 0 ? formData.tags : undefined
        };

        // 提交项目基本信息
        await onSubmit(payload, formData.teamMembers, formData.defaultRole);
        
        // 如果是编辑模式，处理现有成员的变更
        if (editProject?.id && existingMembers.length > 0) {
          const memberUpdates = existingMembers.filter(m => m.action === 'update');
          const memberRemovals = existingMembers.filter(m => m.action === 'remove');
          
          // 并行处理所有变更
          const promises: Promise<any>[] = [];
          
          // 更新角色（仅已确认成员，待定成员需要先删除再添加）
          memberUpdates.forEach(m => {
            if (m.isPending) {
              // 待定成员：先删除再添加
              promises.push(
                projectService.deletePendingMember(editProject.id, m.memberId)
                  .then(() => projectService.batchAddPendingMembers(editProject.id, [{ email: m.email, role: m.newRole }]))
                  .catch(err => console.error(`更新待定成员 ${m.email} 角色失败:`, err))
              );
            } else {
              // 已确认成员：直接更新角色
              promises.push(
                projectService.updateProjectMember(editProject.id, m.memberId, { role: m.newRole })
                  .catch(err => console.error(`更新成员 ${m.email} 角色失败:`, err))
              );
            }
          });
          
          // 删除成员
          memberRemovals.forEach(m => {
            if (m.isPending) {
              // 删除待定成员
              promises.push(
                projectService.deletePendingMember(editProject.id, m.memberId)
                  .catch(err => console.error(`删除待定成员 ${m.email} 失败:`, err))
              );
            } else {
              // 删除已确认成员
              promises.push(
                projectService.removeProjectMember(editProject.id, m.memberId)
                  .catch(err => console.error(`删除成员 ${m.email} 失败:`, err))
              );
            }
          });
          
          if (promises.length > 0) {
            await Promise.all(promises);
            console.log(`成功处理 ${promises.length} 个成员变更`);
          }
        }
      } catch (error) {
        console.error('提交失败:', error);
        // 提交失败时重置状态，允许重试
        setIsSubmitting(false);
        throw error; // 重新抛出错误，让父组件处理
      }
      // 注意：成功时不重置 isSubmitting，因为弹窗会关闭并重置所有状态
    } else {
      // 验证失败，滚动到第一个错误字段
      console.error('表单验证失败:', errors);
    }
  };

  const handleInputChange = (field: keyof ProjectFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };


  const steps = [
    { id: 1, title: '基本信息', description: '项目名称、描述和时间' },
    { id: 2, title: '项目设置', description: '优先级、状态和层级' },
    { id: 3, title: '团队协作', description: '成员分配和标签' }
  ];
  const MAX_STEP = 3;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 id="project-modal-title" className="text-2xl font-bold text-gray-900">
              {editProject ? '编辑项目' : parentProject ? '创建子项目' : '创建新项目'}
            </h2>
            {parentProject && (
              <p className="text-sm text-gray-600 mt-1">
                父项目: {parentProject.name}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    currentStep >= step.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  )}>
                    {step.id}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{step.title}</p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-16 h-0.5 mx-4",
                    currentStep > step.id ? "bg-blue-600" : "bg-gray-200"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      项目名称 *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                        errors.name ? "border-red-300" : "border-gray-300"
                      )}
                      placeholder="输入项目名称"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      项目描述
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="描述项目的目标和范围"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      开始日期 *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => handleInputChange('start_date', e.target.value)}
                        className={cn(
                          "w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                          errors.start_date ? "border-red-300" : "border-gray-300"
                        )}
                      />
                    </div>
                    {errors.start_date && (
                      <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      结束日期 *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => handleInputChange('end_date', e.target.value)}
                        className={cn(
                          "w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                          errors.end_date ? "border-red-300" : "border-gray-300"
                        )}
                      />
                    </div>
                    {errors.end_date && (
                      <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Project Settings */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      优先级
                    </label>
                    <div className="relative">
                      <Flag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <select
                        value={formData.priority}
                        onChange={(e) => handleInputChange('priority', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="low">低优先级</option>
                        <option value="medium">中优先级</option>
                        <option value="high">高优先级</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      项目状态
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="planning">规划中</option>
                      <option value="active">进行中</option>
                      <option value="paused">已暂停</option>
                      <option value="completed">已完成</option>
                      <option value="archived">已归档</option>
                    </select>
                  </div>

                  {parentProject && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        项目层级
                      </label>
                      <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <FolderTree className="w-5 h-5 text-blue-600 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">
                            这是 "{parentProject.name}" 的子项目
                          </p>
                          <p className="text-xs text-blue-700">
                            子项目将继承父项目的部分设置和权限
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {editProject && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        父项目（可选）
                      </label>
                      <select
                        value={formData.parent_id ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          // 空字符串表示无父项目
                          handleInputChange('parent_id', val === '' ? null : val);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">无父项目（作为根项目）</option>
                        {availableParents.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        不能将项目设置为其自身的父级；已自动排除。
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Team & Collaboration */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* 现有成员管理（仅编辑模式） */}
                {editProject && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        现有成员管理
                      </label>
                      {existingMembers.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                            {existingMembers.filter(m => !m.isPending && m.action !== 'remove').length} 已确认
                          </span>
                          {existingMembers.filter(m => m.isPending && m.action !== 'remove').length > 0 && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                              {existingMembers.filter(m => m.isPending && m.action !== 'remove').length} 待定
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {loadingMembers ? (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">加载成员中...</p>
                      </div>
                    ) : existingMembers.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto p-3 bg-gray-50 rounded-lg border border-gray-200">
                        {existingMembers.map(member => (
                          <div
                            key={member.memberId}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg border transition-all",
                              member.action === 'remove'
                                ? "bg-red-50 border-red-200 opacity-60"
                                : member.action === 'update'
                                ? "bg-yellow-50 border-yellow-200"
                                : "bg-white border-gray-200"
                            )}
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              {/* 头像 */}
                              <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                                member.action === 'remove' ? "bg-red-100" : "bg-blue-100"
                              )}>
                                <span className={cn(
                                  "text-sm font-medium",
                                  member.action === 'remove' ? "text-red-600" : "text-blue-600"
                                )}>
                                  {member.displayName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              
                              {/* 成员信息 */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <p className={cn(
                                    "text-sm font-medium truncate",
                                    member.action === 'remove' ? "text-gray-400 line-through" : "text-gray-900"
                                  )}>
                                    {member.displayName}
                                  </p>
                                  {member.isPending && (
                                    <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded font-medium flex-shrink-0">
                                      待定
                                    </span>
                                  )}
                                </div>
                                <p className={cn(
                                  "text-xs truncate",
                                  member.action === 'remove' ? "text-gray-400" : "text-gray-500"
                                )}>
                                  {member.email}
                                </p>
                              </div>
                              
                              {/* 角色选择器 */}
                              {member.action !== 'remove' && (
                                <select
                                  value={member.newRole}
                                  onChange={(e) => handleMemberRoleChange(member.memberId, e.target.value as any)}
                                  className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="admin">管理员</option>
                                  <option value="member">成员</option>
                                  <option value="observer">观察者</option>
                                </select>
                              )}
                              
                              {/* 状态标签 */}
                              {member.action === 'update' && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium flex-shrink-0">
                                  角色已修改
                                </span>
                              )}
                              {member.action === 'remove' && (
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium flex-shrink-0">
                                  待删除
                                </span>
                              )}
                            </div>
                            
                            {/* 操作按钮 */}
                            <div className="flex items-center space-x-2 ml-3">
                              {member.action === 'remove' ? (
                                <button
                                  type="button"
                                  onClick={() => handleMemberRestore(member.memberId)}
                                  className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors"
                                  title="恢复成员"
                                >
                                  <X className="w-4 h-4 rotate-45" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleMemberRemove(member.memberId)}
                                  className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                                  title="删除成员"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                        <UserMinus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">暂无成员</p>
                      </div>
                    )}
                    
                    {/* 变更统计 */}
                    {existingMembers.length > 0 && (
                      <div className="flex items-center justify-between text-xs text-gray-600 px-2">
                        <div className="flex items-center space-x-4">
                          {existingMembers.filter(m => m.action === 'update').length > 0 && (
                            <span className="text-yellow-600">
                              {existingMembers.filter(m => m.action === 'update').length} 个角色变更
                            </span>
                          )}
                          {existingMembers.filter(m => m.action === 'remove').length > 0 && (
                            <span className="text-red-600">
                              {existingMembers.filter(m => m.action === 'remove').length} 个待删除
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* 批量导入新成员 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {editProject ? '添加新成员 - 批量导入' : '团队成员 - 批量导入'}
                  </label>
                    {formData.teamMembers.length > 0 && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                        {formData.teamMembers.length} 个成员
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                    <textarea
                      placeholder="批量输入团队成员邮箱，支持逗号、换行或空格分隔&#10;例如：&#10;user1@example.com&#10;user2@example.com, user3@example.com&#10;user4@example.com user5@example.com"
                      rows={5}
                      value={emailInputText}
                      onChange={(e) => {
                        setEmailInputText(e.target.value);
                      }}
                      onBlur={async (e) => {
                        // 失去焦点时解析邮箱
                        const list = e.target.value
                          .split(/[,\n\s]+/)
                          .map(s => s.trim().toLowerCase())
                          .filter(s => s.length > 0 && s.includes('@'));
                        handleInputChange('teamMembers', list);
                        // 检查邮箱状态
                        await checkEmailStatus(list);
                      }}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    />
                  </div>
                  <div className="mt-2 flex items-start space-x-2">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">
                        ✓ 支持逗号、换行或空格分隔
                      </p>
                      <p className="text-xs text-gray-500">
                        ✓ 自动过滤无效邮箱格式
                      </p>
                      {formData.teamMembers.length > 0 && (
                        <p className="text-xs text-green-600 font-medium mt-1">
                          ✓ 已识别 {formData.teamMembers.length} 个有效邮箱
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* 新增：邮箱预览列表 - 按状态分类显示 */}
                  {formData.teamMembers.length > 0 && (
                    <div className="mt-3 space-y-3">
                      {checkingEmails && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-xs text-blue-600">正在检查邮箱状态...</p>
                        </div>
                      )}

                      {!checkingEmails && (
                        <>
                          {/* 已是项目成员 */}
                          {emailStatus.alreadyMember.length > 0 && (
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-300">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-600">
                                  ⚠️ 已是项目成员 ({emailStatus.alreadyMember.length})
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                                {emailStatus.alreadyMember.map((email, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center space-x-1 px-2 py-1 bg-white border border-gray-300 rounded text-xs"
                                  >
                                    <span className="text-gray-600">{email}</span>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        const newList = formData.teamMembers.filter(e => e !== email);
                                        handleInputChange('teamMembers', newList);
                                        setEmailInputText(newList.join('\n'));
                                        await checkEmailStatus(newList);
                                      }}
                                      className="text-gray-400 hover:text-red-600"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-gray-500 mt-2">这些用户已经是项目成员，将被跳过</p>
                            </div>
                          )}

                          {/* 已注册用户 */}
                          {emailStatus.registered.length > 0 && (
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-green-700">
                                  ✓ 已注册用户 ({emailStatus.registered.length})
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                                {emailStatus.registered.map((email, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center space-x-1 px-2 py-1 bg-white border border-green-200 rounded text-xs"
                                  >
                                    <span className="text-green-700">{email}</span>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        const newList = formData.teamMembers.filter(e => e !== email);
                                        handleInputChange('teamMembers', newList);
                                        setEmailInputText(newList.join('\n'));
                                        await checkEmailStatus(newList);
                                      }}
                                      className="text-gray-400 hover:text-red-600"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-green-600 mt-2">这些用户将被添加为正式成员</p>
                            </div>
                          )}

                          {/* 未注册邮箱 */}
                          {emailStatus.unregistered.length > 0 && (
                            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-orange-700">
                                  📧 未注册邮箱 ({emailStatus.unregistered.length})
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                                {emailStatus.unregistered.map((email, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center space-x-1 px-2 py-1 bg-white border border-orange-200 rounded text-xs"
                                  >
                                    <span className="text-orange-700">{email}</span>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        const newList = formData.teamMembers.filter(e => e !== email);
                                        handleInputChange('teamMembers', newList);
                                        setEmailInputText(newList.join('\n'));
                                        await checkEmailStatus(newList);
                                      }}
                                      className="text-gray-400 hover:text-red-600"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-orange-600 mt-2">这些邮箱将被添加为待定成员，用户注册后自动成为项目成员</p>
                            </div>
                          )}
                        </>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">
                          共 {formData.teamMembers.length} 个邮箱
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            handleInputChange('teamMembers', []);
                            setEmailInputText('');
                            setEmailStatus({ registered: [], unregistered: [], alreadyMember: [] });
                          }}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          清空全部
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    默认角色
                  </label>
                  <select
                    value={formData.defaultRole}
                    onChange={(e) => handleInputChange('defaultRole', e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="admin">管理员</option>
                    <option value="member">成员</option>
                    <option value="observer">观察者</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">批量添加邮箱时使用该角色。</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    项目标签
                  </label>
                  <input
                    type="text"
                    placeholder="输入标签，用逗号分隔"
                    value={formData.tags.join(', ')}
                    onChange={(e) => {
                      const tags = e.target.value
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean);
                      handleInputChange('tags', tags);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    例如: 前端, React, 紧急
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 z-10 flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex space-x-3">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => Math.max(prev - 1, 1))}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  上一步
                </button>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              
              {currentStep < MAX_STEP ? (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setCurrentStep(prev => Math.min(prev + 1, MAX_STEP)); }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  下一步
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    "px-4 py-2 rounded-lg transition-colors flex items-center space-x-2",
                    isSubmitting
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  )}
                >
                  {isSubmitting && (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span>
                    {isSubmitting 
                      ? '提交中...' 
                      : (editProject ? '保存更改' : '创建项目')
                    }
                  </span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
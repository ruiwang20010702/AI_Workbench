import React, { useEffect, useState } from 'react';
import { X, Calendar, Users, Flag, FolderTree, Upload, Plus, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Project, CreateProjectRequest, projectService } from '../../services/projectService';
import { mapProjectPriorityToEnglish, mapProjectStatusToEnglish } from '../../utils/enumMappings';
import type { CreateTaskRequest } from '../../services/taskService';

interface ProjectCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectData: CreateProjectRequest, teamEmails?: string[], defaultRole?: 'admin' | 'member' | 'observer', initialTasks?: CreateTaskRequest[]) => void;
  editProject?: Project | null;
  parentProject?: Project | null;
}

interface TaskFormData {
  title: string;
  description: string;
  assignee_id: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: string;
  estimated_hours: number;
  tags: string[];
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
  initialTasks: TaskFormData[];
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
    initialTasks: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [availableParents, setAvailableParents] = useState<Project[]>([]);

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
      initialTasks: []
    });
    setErrors({});
    setCurrentStep(1);
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

  // 编辑模式下预填团队成员邮箱
  useEffect(() => {
    const loadMembers = async () => {
      if (!isOpen || !editProject?.id) return;
      try {
        const res: any = await projectService.getProjectMembers(editProject.id);
        const members = Array.isArray(res) ? res : res?.members;
        const emails = (members || [])
          .map((m: any) => m?.user?.email)
          .filter((e: any) => typeof e === 'string' && e.length > 0);
        setFormData(prev => ({ ...prev, teamMembers: emails }));
      } catch (err) {
        console.error('加载项目成员失败:', err);
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '项目名称不能为空';
    }

    if (!formData.start_date) {
      newErrors.start_date = '开始日期不能为空';
    }

    if (!formData.end_date) {
      newErrors.end_date = '结束日期不能为空';
    }

    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      newErrors.end_date = '结束日期不能早于开始日期';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 防止在第 1/2/3 步意外提交：将提交动作转化为"下一步"
    if (currentStep < MAX_STEP) {
      setCurrentStep(prev => Math.min(prev + 1, MAX_STEP));
      return;
    }
    if (validateForm()) {
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

      // 准备初始任务数据
      const initialTasks: CreateTaskRequest[] = formData.initialTasks.map(task => ({
        title: task.title,
        description: task.description || undefined,
        assignee_id: undefined, // Will be set later if needed
        status: task.status as 'todo' | 'in_progress' | 'completed',
        priority: task.priority,
        due_date: task.due_date || undefined,
        estimated_hours: task.estimated_hours || undefined,
        tags: task.tags.length > 0 ? task.tags : undefined,
        project_id: '' // Will be set by the parent component
      }));

      // 将团队成员邮箱、默认角色和初始任务一并传递
      onSubmit(payload, formData.teamMembers, formData.defaultRole, initialTasks);
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
    { id: 3, title: '团队协作', description: '成员分配和标签' },
    { id: 4, title: '初始任务', description: '预设项目任务（可选）' }
  ];
  const MAX_STEP = 4;

  // 添加任务相关的处理函数
  const addNewTask = () => {
    const newTask: TaskFormData = {
      title: '',
      description: '',
      assignee_id: '',
      status: 'todo',
      priority: 'medium',
      due_date: '',
      estimated_hours: 0,
      tags: []
    };
    setFormData(prev => ({
      ...prev,
      initialTasks: [...prev.initialTasks, newTask]
    }));
  };

  const removeTask = (index: number) => {
    setFormData(prev => ({
      ...prev,
      initialTasks: prev.initialTasks.filter((_, i) => i !== index)
    }));
  };

  const updateTask = (index: number, field: keyof TaskFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      initialTasks: prev.initialTasks.map((task, i) => 
        i === index ? { ...task, [field]: value } : task
      )
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    团队成员
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                    <textarea
                      placeholder="输入团队成员邮箱，用逗号分隔"
                      rows={3}
                      value={formData.teamMembers.join(', ')}
                      onChange={(e) => {
                        const list = e.target.value
                          .split(',')
                          .map(s => s.trim())
                          .filter(Boolean);
                        handleInputChange('teamMembers', list);
                      }}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    例如: user1@example.com, user2@example.com
                  </p>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    项目文档
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      拖拽文件到此处或 <span className="text-blue-600 cursor-pointer">点击上传</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      支持 PDF, DOC, XLS, PPT 等格式，最大 10MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Initial Tasks */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">初始任务设置</h3>
                    <p className="text-sm text-gray-600">为项目预设一些初始任务（可选）</p>
                  </div>
                  <button
                    type="button"
                    onClick={addNewTask}
                    className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    添加任务
                  </button>
                </div>

                {formData.initialTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>暂无任务，点击上方按钮添加初始任务</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.initialTasks.map((task, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-900">任务 {index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => removeTask(index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              任务标题 *
                            </label>
                            <input
                              type="text"
                              value={task.title}
                              onChange={(e) => updateTask(index, 'title', e.target.value)}
                              placeholder="输入任务标题"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              任务描述
                            </label>
                            <textarea
                              value={task.description}
                              onChange={(e) => updateTask(index, 'description', e.target.value)}
                              placeholder="描述任务内容"
                              rows={2}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              状态
                            </label>
                            <select
                              value={task.status}
                              onChange={(e) => updateTask(index, 'status', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="todo">待办</option>
                              <option value="in_progress">进行中</option>
                              <option value="completed">已完成</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              优先级
                            </label>
                            <select
                              value={task.priority}
                              onChange={(e) => updateTask(index, 'priority', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="low">低</option>
                              <option value="medium">中</option>
                              <option value="high">高</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              截止日期
                            </label>
                            <input
                              type="date"
                              value={task.due_date}
                              onChange={(e) => updateTask(index, 'due_date', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              预估工时（小时）
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={task.estimated_hours}
                              onChange={(e) => updateTask(index, 'estimated_hours', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              标签
                            </label>
                            <input
                              type="text"
                              value={task.tags.join(', ')}
                              onChange={(e) => {
                                const tags = e.target.value
                                  .split(',')
                                  .map(s => s.trim())
                                  .filter(Boolean);
                                updateTask(index, 'tags', tags);
                              }}
                              placeholder="输入标签，用逗号分隔"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editProject ? '保存更改' : '创建项目'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
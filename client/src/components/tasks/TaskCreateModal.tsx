import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Task, CreateTaskRequest } from '../../services/taskService.ts';
import { Project, projectService } from '../../services/projectService';

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: CreateTaskRequest) => void;
  editTask?: Task | null;
  initialValues?: Partial<CreateTaskRequest>;
}

interface TaskFormData {
  title: string;
  description: string;
  project_id: string;
  assignee_id: string;
  status: Task['status'];
  priority: 'low' | 'medium' | 'high';
  due_date: string;
  estimated_hours: number;
  tags: string[];
}

export const TaskCreateModal: React.FC<TaskCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editTask,
  initialValues
}) => {
  const toDateInput = (val?: string) => {
    if (!val) return '';
    const parts = val.split('T');
    return parts[0] || val;
  };
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    project_id: '',
    assignee_id: '',
    status: 'pending',
    priority: 'medium',
    due_date: '',
    estimated_hours: 0,
    tags: []
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [newTag, setNewTag] = useState('');

  // 加载项目列表
  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  // 初始化表单数据
  useEffect(() => {
    if (editTask) {
      setFormData({
        title: editTask.title,
        description: editTask.description || '',
        project_id: editTask.project_id,
        assignee_id: editTask.assignee_id || '',
        status: editTask.status,
        priority: editTask.priority,
        due_date: editTask.due_date ? toDateInput(editTask.due_date) : '',
        estimated_hours: editTask.estimated_hours || 0,
        tags: editTask.tags || []
      });
    } else {
      setFormData({
        title: '',
        description: '',
        project_id: initialValues?.project_id || '',
        assignee_id: '',
        status: (initialValues?.status as Task['status']) || 'pending',
        priority: (initialValues?.priority as 'low' | 'medium' | 'high') || 'medium',
        due_date: toDateInput(initialValues?.due_date) || '',
        estimated_hours: 0,
        tags: []
      });
    }
    setErrors({});
  }, [editTask, isOpen, initialValues]);

  const loadProjects = async () => {
    try {
      const response = await projectService.getProjects({});
      setProjects(response);
    } catch (error) {
      console.error('加载项目失败:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '任务标题不能为空';
    }

    if (!formData.project_id) {
      newErrors.project_id = '请选择项目';
    }

    if (formData.estimated_hours < 0) {
      newErrors.estimated_hours = '预估工时不能为负数';
    }

    if (formData.due_date && new Date(formData.due_date) < new Date()) {
      newErrors.due_date = '截止日期不能早于今天';
    }

    // 负责人ID（可选），如填写则必须为有效UUID
    const uuidRegex = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
    if (formData.assignee_id && !uuidRegex.test(formData.assignee_id.trim())) {
      newErrors.assignee_id = '负责人ID必须为有效UUID（可留空）';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const taskData: CreateTaskRequest = {
        ...initialValues,
        ...formData,
        start_date: initialValues?.start_date || undefined,
        due_date: formData.due_date || initialValues?.due_date || undefined,
        estimated_hours: formData.estimated_hours || undefined,
        assignee_id: formData.assignee_id || undefined
      };

      await onSubmit(taskData);
    } catch (error) {
      console.error('提交任务失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof TaskFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const priorityOptions = [
    { value: 'low', label: '低', color: 'text-green-600 bg-green-100' },
    { value: 'medium', label: '中', color: 'text-yellow-600 bg-yellow-100' },
    { value: 'high', label: '高', color: 'text-red-600 bg-red-100' }
  ];

  const statusOptions = [
    { value: 'pending', label: '待处理', color: 'text-gray-600 bg-gray-100' },
    { value: 'in_progress', label: '进行中', color: 'text-blue-600 bg-blue-100' },
    { value: 'completed', label: '已完成', color: 'text-green-600 bg-green-100' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editTask ? '编辑任务' : '创建任务'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 任务标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              任务标题 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={cn(
                "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                errors.title ? "border-red-300" : "border-gray-300"
              )}
              placeholder="输入任务标题"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.title}
              </p>
            )}
          </div>

          {/* 任务描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              任务描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="输入任务描述"
            />
          </div>

          {/* 项目和负责人 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                所属项目 *
              </label>
              <select
                value={formData.project_id}
                onChange={(e) => handleInputChange('project_id', e.target.value)}
                className={cn(
                  "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  errors.project_id ? "border-red-300" : "border-gray-300"
                )}
              >
                <option value="">选择项目</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {errors.project_id && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.project_id}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                负责人
              </label>
              <input
                type="text"
                value={formData.assignee_id}
                onChange={(e) => handleInputChange('assignee_id', e.target.value)}
                className={cn(
                  "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  errors.assignee_id ? "border-red-300" : "border-gray-300"
                )}
                placeholder="输入负责人ID（可不填，必须为UUID）"
              />
              {errors.assignee_id && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.assignee_id}
                </p>
              )}
            </div>
          </div>

          {/* 状态和优先级 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                状态
              </label>
              <div className="space-y-2">
                {statusOptions.map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value={option.value}
                      checked={formData.status === option.value}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="mr-2"
                    />
                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", option.color)}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                优先级
              </label>
              <div className="space-y-2">
                {priorityOptions.map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="priority"
                      value={option.value}
                      checked={formData.priority === option.value}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      className="mr-2"
                    />
                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", option.color)}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 截止日期和预估工时 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                截止日期
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
                className={cn(
                  "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  errors.due_date ? "border-red-300" : "border-gray-300"
                )}
              />
              {errors.due_date && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.due_date}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                预估工时（小时）
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.estimated_hours}
                onChange={(e) => handleInputChange('estimated_hours', parseFloat(e.target.value) || 0)}
                className={cn(
                  "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  errors.estimated_hours ? "border-red-300" : "border-gray-300"
                )}
                placeholder="0"
              />
              {errors.estimated_hours && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.estimated_hours}
                </p>
              )}
            </div>
          </div>

          {/* 标签 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标签
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="输入标签名称"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                添加
              </button>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              <span>{editTask ? '更新任务' : '创建任务'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { Search, Filter, X, User, Tag, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Project, projectService } from '../../services/projectService';

interface TaskFilters {
  search: string;
  status: string[];
  priority: string[];
  assignee: string[];
  project: string[];
  tags: string[];
  dueDate: {
    start: string;
    end: string;
  };
  overdue: boolean;
}

interface TaskFiltersProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  onClearFilters: () => void;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectService.getProjects({});
      setProjects(response);
    } catch (error) {
      console.error('加载项目失败:', error);
    }
  };

  const handleFilterChange = (key: keyof TaskFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleArrayFilterChange = (key: keyof TaskFilters, value: string, checked: boolean) => {
    const currentArray = filters[key] as string[];
    const newArray = checked
      ? [...currentArray, value]
      : currentArray.filter(item => item !== value);
    
    handleFilterChange(key, newArray);
  };

  const statusOptions = [
    { value: 'pending', label: '待处理', color: 'bg-gray-100 text-gray-800' },
    { value: 'in_progress', label: '进行中', color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: '已完成', color: 'bg-green-100 text-green-800' }
  ];

  const priorityOptions = [
    { value: 'low', label: '低优先级', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: '中优先级', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: '高优先级', color: 'bg-red-100 text-red-800' }
  ];

  const hasActiveFilters = 
    filters.search ||
    filters.status.length > 0 ||
    filters.priority.length > 0 ||
    filters.assignee.length > 0 ||
    filters.project.length > 0 ||
    filters.tags.length > 0 ||
    filters.dueDate.start ||
    filters.dueDate.end ||
    filters.overdue;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">筛选器</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <X className="w-4 h-4" />
            <span>清除</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* 搜索 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            搜索任务
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="搜索任务标题或描述"
            />
          </div>
        </div>

        {/* 逾期任务 */}
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.overdue}
              onChange={(e) => handleFilterChange('overdue', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-red-600 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1" />
              仅显示逾期任务
            </span>
          </label>
        </div>

        {/* 状态筛选 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            任务状态
          </label>
          <div className="space-y-2">
            {statusOptions.map((option) => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.status.includes(option.value)}
                  onChange={(e) => handleArrayFilterChange('status', option.value, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className={cn("px-2 py-1 rounded-full text-xs font-medium", option.color)}>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 优先级筛选 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            优先级
          </label>
          <div className="space-y-2">
            {priorityOptions.map((option) => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.priority.includes(option.value)}
                  onChange={(e) => handleArrayFilterChange('priority', option.value, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className={cn("px-2 py-1 rounded-full text-xs font-medium", option.color)}>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 项目筛选 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            所属项目
          </label>
          <div className="max-h-32 overflow-y-auto space-y-2">
            {projects.map((project) => (
              <label key={project.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.project.includes(project.id)}
                  onChange={(e) => handleArrayFilterChange('project', project.id, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 truncate">{project.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 截止日期范围 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            截止日期范围
          </label>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">开始日期</label>
              <input
                type="date"
                value={filters.dueDate.start}
                onChange={(e) => handleFilterChange('dueDate', { ...filters.dueDate, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">结束日期</label>
              <input
                type="date"
                value={filters.dueDate.end}
                onChange={(e) => handleFilterChange('dueDate', { ...filters.dueDate, end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 展开更多筛选 */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-sm text-blue-600 hover:text-blue-800 py-2 border-t border-gray-200"
        >
          {isExpanded ? '收起筛选' : '更多筛选'}
        </button>

        {/* 扩展筛选选项 */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            {/* 负责人筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                负责人
              </label>
              <input
                type="text"
                placeholder="输入负责人ID或名称"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const value = (e.target as HTMLInputElement).value.trim();
                    if (value && !filters.assignee.includes(value)) {
                      handleArrayFilterChange('assignee', value, true);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
              <div className="mt-2 flex flex-wrap gap-1">
                {filters.assignee.map((assignee) => (
                  <span
                    key={assignee}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    <User className="w-3 h-3 mr-1" />
                    {assignee}
                    <button
                      onClick={() => handleArrayFilterChange('assignee', assignee, false)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 标签筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标签
              </label>
              <input
                type="text"
                placeholder="输入标签名称"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const value = (e.target as HTMLInputElement).value.trim();
                    if (value && !filters.tags.includes(value)) {
                      handleArrayFilterChange('tags', value, true);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
              <div className="mt-2 flex flex-wrap gap-1">
                {filters.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                    <button
                      onClick={() => handleArrayFilterChange('tags', tag, false)}
                      className="ml-1 text-purple-600 hover:text-purple-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 活跃筛选器摘要 */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 mb-2">活跃筛选器:</div>
          <div className="flex flex-wrap gap-1">
            {filters.search && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                搜索: {filters.search}
              </span>
            )}
            {filters.status.length > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                状态: {filters.status.length}
              </span>
            )}
            {filters.priority.length > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                优先级: {filters.priority.length}
              </span>
            )}
            {filters.overdue && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                逾期任务
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
import React, { useState } from 'react';
import { Filter, X, Calendar, Users, Flag, FolderTree, Search } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ProjectFiltersProps {
  filters: ProjectFilters;
  onFiltersChange: (filters: ProjectFilters) => void;
  onClearFilters: () => void;
}

interface ProjectFilters {
  search: string;
  status: string[];
  priority: string[];
  dateRange: {
    start: string;
    end: string;
  };
  teamMembers: string[];
  tags: string[];
  hasSubProjects: boolean | null;
  parentId: string | null;
}

const statusOptions = [
  { value: 'planning', label: '规划中', color: 'bg-purple-100 text-purple-800' },
  { value: 'active', label: '进行中', color: 'bg-blue-100 text-blue-800' },
  { value: 'paused', label: '已暂停', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'completed', label: '已完成', color: 'bg-green-100 text-green-800' },
  { value: 'archived', label: '已归档', color: 'bg-gray-100 text-gray-800' }
];

const priorityOptions = [
  { value: 'high', label: '高优先级', color: 'bg-red-100 text-red-800' },
  { value: 'medium', label: '中优先级', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'low', label: '低优先级', color: 'bg-green-100 text-green-800' }
];

export const ProjectFilters: React.FC<ProjectFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    onFiltersChange({ ...filters, search: value });
  };

  const handleStatusToggle = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    onFiltersChange({ ...filters, status: newStatus });
  };

  const handlePriorityToggle = (priority: string) => {
    const newPriority = filters.priority.includes(priority)
      ? filters.priority.filter(p => p !== priority)
      : [...filters.priority, priority];
    onFiltersChange({ ...filters, priority: newPriority });
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    onFiltersChange({
      ...filters,
      dateRange: { ...filters.dateRange, [field]: value }
    });
  };

  const handleSubProjectsFilter = (value: boolean | null) => {
    onFiltersChange({ ...filters, hasSubProjects: value });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status.length > 0) count++;
    if (filters.priority.length > 0) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.hasSubProjects !== null) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="搜索项目名称、描述或标签..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span className="font-medium">筛选条件</span>
          {activeFiltersCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {activeFiltersCount > 0 && (
          <button
            onClick={onClearFilters}
            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-3 h-3" />
            <span>清除筛选</span>
          </button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-6">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              项目状态
            </label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusToggle(option.value)}
                  className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium border transition-all",
                    filters.status.includes(option.value)
                      ? `${option.color} border-current`
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              优先级
            </label>
            <div className="flex flex-wrap gap-2">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handlePriorityToggle(option.value)}
                  className={cn(
                    "flex items-center px-3 py-1 rounded-full text-sm font-medium border transition-all",
                    filters.priority.includes(option.value)
                      ? `${option.color} border-current`
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  )}
                >
                  <Flag className="w-3 h-3 mr-1" />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              时间范围
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">开始日期</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => handleDateRangeChange('start', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">结束日期</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => handleDateRangeChange('end', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Project Structure Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              项目结构
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSubProjectsFilter(null)}
                className={cn(
                  "flex items-center px-3 py-1 rounded-full text-sm font-medium border transition-all",
                  filters.hasSubProjects === null
                    ? "bg-blue-100 text-blue-800 border-blue-200"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                )}
              >
                <FolderTree className="w-3 h-3 mr-1" />
                全部项目
              </button>
              <button
                onClick={() => handleSubProjectsFilter(true)}
                className={cn(
                  "flex items-center px-3 py-1 rounded-full text-sm font-medium border transition-all",
                  filters.hasSubProjects === true
                    ? "bg-blue-100 text-blue-800 border-blue-200"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                )}
              >
                <FolderTree className="w-3 h-3 mr-1" />
                有子项目
              </button>
              <button
                onClick={() => handleSubProjectsFilter(false)}
                className={cn(
                  "flex items-center px-3 py-1 rounded-full text-sm font-medium border transition-all",
                  filters.hasSubProjects === false
                    ? "bg-blue-100 text-blue-800 border-blue-200"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                )}
              >
                <FolderTree className="w-3 h-3 mr-1" />
                叶子项目
              </button>
            </div>
          </div>

          {/* Team Members Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              团队成员
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="输入成员名称或邮箱"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              支持模糊搜索团队成员
            </p>
          </div>

          {/* Tags Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              项目标签
            </label>
            <input
              type="text"
              placeholder="输入标签名称"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              支持多个标签，用逗号分隔
            </p>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              已应用的筛选条件:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
                搜索: {filters.search}
                <button
                  onClick={() => handleSearchChange('')}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.status.map((status) => {
              const option = statusOptions.find(opt => opt.value === status);
              return (
                <span key={status} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
                  {option?.label}
                  <button
                    onClick={() => handleStatusToggle(status)}
                    className="ml-1 hover:text-blue-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
            {filters.priority.map((priority) => {
              const option = priorityOptions.find(opt => opt.value === priority);
              return (
                <span key={priority} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
                  {option?.label}
                  <button
                    onClick={() => handlePriorityToggle(priority)}
                    className="ml-1 hover:text-blue-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
            {(filters.dateRange.start || filters.dateRange.end) && (
              <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
                时间范围
                <button
                  onClick={() => handleDateRangeChange('start', '')}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
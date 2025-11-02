import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Users, CheckCircle, Calendar, FolderTree } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Project } from '../../services/projectService';

interface ProjectCardProps {
  project: Project;
  onView: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onStatusChange?: (projectId: string, status: Project['status']) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onView,
  onEdit,
  onDelete,
  onStatusChange
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // 计算进度百分比
  const progressPercentage = React.useMemo(() => {
    const total = project.tasks_total || project.tasksTotal || 0;
    const completed = project.tasks_completed || project.tasksCompleted || 0;
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }, [project.tasks_total, project.tasks_completed, project.tasksTotal, project.tasksCompleted]);

  // 格式化日期
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  };

  // 状态标签颜色
  const statusColors: Record<Project['status'], string> = {
    planning: 'bg-gray-100 text-gray-700',
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-blue-100 text-blue-700',
    archived: 'bg-purple-100 text-purple-700'
  };

  // 状态中文名
  const statusLabels: Record<Project['status'], string> = {
    planning: '规划中',
    active: '进行中',
    paused: '已暂停',
    completed: '已完成',
    archived: '已归档'
  };

  // 优先级标签颜色
  const priorityColors: Record<Project['priority'], string> = {
    low: 'bg-blue-100 text-blue-700',
    medium: 'bg-orange-100 text-orange-700',
    high: 'bg-red-100 text-red-700'
  };

  // 优先级中文名
  const priorityLabels: Record<Project['priority'], string> = {
    low: '低',
    medium: '中',
    high: '高'
  };

  const handleDropdownClick = (action: 'view' | 'edit' | 'delete') => {
    setShowDropdown(false);
    switch (action) {
      case 'view':
        onView(project);
        break;
      case 'edit':
        onEdit(project);
        break;
      case 'delete':
        onDelete(project.id);
        break;
    }
  };

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200 p-6 flex flex-col"
      data-testid="project-card"
    >
      {/* 头部：名称、标签和更多按钮 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <FolderTree className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {project.name}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className={cn('px-2 py-1 rounded-full text-xs font-medium', priorityColors[project.priority])}>
              {priorityLabels[project.priority]}
            </span>
            <span className={cn('px-2 py-1 rounded-full text-xs font-medium', statusColors[project.status])}>
              {statusLabels[project.status]}
            </span>
          </div>
        </div>

        {/* 更多按钮 */}
        <div className="relative ml-2" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="更多操作"
          >
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>

          {/* 下拉菜单 */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={() => handleDropdownClick('view')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                查看详情
              </button>
              <button
                onClick={() => handleDropdownClick('edit')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                编辑项目
              </button>
              <button
                onClick={() => handleDropdownClick('delete')}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                删除项目
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 描述 */}
      {project.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* 进度条 */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>进度</span>
          <span className="font-medium">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              progressPercentage === 100 ? 'bg-green-500' : 'bg-blue-500'
            )}
            style={{ width: `${progressPercentage}%` }}
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* 底部信息 */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          {/* 团队成员数 */}
          <div className="flex items-center space-x-1" title="团队成员">
            <Users className="w-4 h-4" />
            <span>{project.member_count || project.team_members || 0}</span>
          </div>

          {/* 任务统计 */}
          <div className="flex items-center space-x-1" title="任务完成情况">
            <CheckCircle className="w-4 h-4" />
            <span>
              {project.tasks_completed || project.tasksCompleted || 0}/
              {project.tasks_total || project.tasksTotal || 0}
            </span>
          </div>
        </div>

        {/* 日期范围 */}
        {(project.start_date || project.end_date) && (
          <div className="flex items-center space-x-1 text-xs" title="项目时间">
            <Calendar className="w-4 h-4" />
            <span>
              {formatDate(project.start_date)}
              {project.start_date && project.end_date && ' ~ '}
              {formatDate(project.end_date)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};


import React from 'react';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ProjectProgressData {
  name: string;
  progress: number;
  status: 'active' | 'completed' | 'on_hold';
  dueDate?: string;
  tasksCompleted: number;
  tasksTotal: number;
}

interface ProjectProgressChartProps {
  projects: ProjectProgressData[];
  title?: string;
  showDetails?: boolean;
  className?: string;
}

export const ProjectProgressChart: React.FC<ProjectProgressChartProps> = ({
  projects,
  title = "项目进度概览",
  showDetails = true,
  className
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'active':
        return 'bg-blue-500';
      case 'on_hold':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'active':
        return '进行中';
      case 'on_hold':
        return '暂停';
      default:
        return '未知';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const sortedProjects = [...projects].sort((a, b) => b.progress - a.progress);

  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-4 h-4" />
            <span>按进度排序</span>
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-4">
        {sortedProjects.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-3" />
            <p>暂无项目数据</p>
          </div>
        ) : (
          sortedProjects.map((project, index) => (
            <div key={index} className="space-y-2">
              {/* Project Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h4 className="font-medium text-gray-900 truncate max-w-xs">
                    {project.name}
                  </h4>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    project.status === 'completed' ? 'bg-green-100 text-green-800' :
                    project.status === 'active' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  )}>
                    {getStatusLabel(project.status)}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-500">
                  <span className="font-medium">{project.progress}%</span>
                  {project.dueDate && (
                    <div className={cn(
                      "flex items-center space-x-1",
                      isOverdue(project.dueDate) && project.status !== 'completed' ? 'text-red-600' : 'text-gray-500'
                    )}>
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(project.dueDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all duration-500 ease-out",
                      getStatusColor(project.status)
                    )}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                {/* Progress Indicator */}
                <div
                  className="absolute top-0 h-2 w-1 bg-white rounded-full shadow-sm transition-all duration-500"
                  style={{ left: `${Math.max(0, project.progress - 0.5)}%` }}
                />
              </div>

              {/* Details */}
              {showDetails && (
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    任务进度: {project.tasksCompleted}/{project.tasksTotal}
                  </span>
                  {project.progress === 100 ? (
                    <span className="text-green-600 font-medium">✓ 已完成</span>
                  ) : project.progress >= 75 ? (
                    <span className="text-blue-600 font-medium">即将完成</span>
                  ) : project.progress >= 50 ? (
                    <span className="text-yellow-600 font-medium">进展良好</span>
                  ) : project.progress >= 25 ? (
                    <span className="text-orange-600 font-medium">需要关注</span>
                  ) : (
                    <span className="text-red-600 font-medium">进度缓慢</span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {projects.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">
                {projects.filter(p => p.status === 'completed').length}
              </p>
              <p className="text-xs text-gray-500">已完成</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {projects.filter(p => p.status === 'active').length}
              </p>
              <p className="text-xs text-gray-500">进行中</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-600">
                {Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length)}%
              </p>
              <p className="text-xs text-gray-500">平均进度</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
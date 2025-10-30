import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Folder, FolderOpen, FileText, Flag } from 'lucide-react';
import { cn } from '../../utils/cn';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'on-hold' | 'archived';
  priority: 'low' | 'medium' | 'high';
  startDate: string;
  endDate: string;
  progress: number;
  teamMembers: number;
  tasksTotal?: number;
  tasksCompleted?: number;
  tags: string[];
  parentId?: string;
  children?: Project[];
}

interface ProjectHierarchyProps {
  projects: Project[];
  onProjectSelect?: (project: Project) => void;
  selectedProjectId?: string;
}

interface ProjectNodeProps {
  project: Project;
  level: number;
  onProjectSelect?: (project: Project) => void;
  selectedProjectId?: string;
}

const ProjectNode: React.FC<ProjectNodeProps> = ({
  project,
  level,
  onProjectSelect,
  selectedProjectId
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = project.children && project.children.length > 0;

  const getStatusBadge = (status: Project['status']) => {
    const map: Record<Project['status'], { label: string; className: string }> = {
      planning: { label: '规划中', className: 'bg-blue-100 text-blue-700 border-blue-200' },
      active: { label: '进行中', className: 'bg-green-100 text-green-700 border-green-200' },
      completed: { label: '已完成', className: 'bg-gray-100 text-gray-700 border-gray-200' },
      'on-hold': { label: '暂停中', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      archived: { label: '已归档', className: 'bg-gray-100 text-gray-500 border-gray-200' }
    };
    return map[status];
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityText = (priority: Project['priority']) => {
    const map: Record<Project['priority'], string> = {
      low: '低优先级',
      medium: '中优先级',
      high: '高优先级'
    };
    return map[priority];
  };

  const daysRemaining = (() => {
    if (!project.endDate) return 0;
    const end = new Date(project.endDate).getTime();
    const now = new Date().getTime();
    return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  })();

  return (
    <div className="select-none">
      <div
        className={cn(
          'py-2',
          selectedProjectId === project.id && 'bg-blue-50',
          level > 0 && 'ml-6'
        )}
      >
        <div className="flex items-start">
          {hasChildren ? (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mr-2 p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-6 mr-2" />
          )}

          <div className="mr-3">
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="w-5 h-5 text-blue-500" />
              ) : (
                <Folder className="w-5 h-5 text-blue-500" />
              )
            ) : (
              <FileText className="w-5 h-5 text-gray-500" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* 顶部：名称、优先级、状态徽标 */}
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 truncate">
                    {project.name}
                  </span>
                  <span className={cn(
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
                    getPriorityColor(project.priority)
                  )}>
                    <Flag className="w-3 h-3 mr-1" />
                    {getPriorityText(project.priority)}
                  </span>
                  <span className={cn(
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
                    getStatusBadge(project.status).className
                  )}>
                    {getStatusBadge(project.status).label}
                  </span>
                </div>
                {project.description && (
                  <p className="text-sm text-gray-600 mt-1 truncate">{project.description}</p>
                )}
              </div>

              {/* 右侧指标与进度条 */}
              <div className="flex items-center space-x-6 ml-4">
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-900">
                    {(project.tasksCompleted || 0)}/{(project.tasksTotal || 0)}
                  </div>
                  <div className="text-xs text-gray-500">任务</div>
                </div>

                <div className="text-center">
                  <div className="text-sm font-medium text-gray-900">
                    {project.teamMembers || 0}
                  </div>
                  <div className="text-xs text-gray-500">成员</div>
                </div>

                <div className="text-center">
                  <div className="text-sm font-medium text-gray-900">
                    {daysRemaining}天
                  </div>
                  <div className="text-xs text-gray-500">剩余</div>
                </div>

                <div className="w-24">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>进度</span>
                    <span>{project.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 点击选择项目 */}
            <div className="mt-2" onClick={() => onProjectSelect?.(project)}></div>
          </div>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="ml-4">
          {project.children?.map((child) => (
            <ProjectNode
              key={child.id}
              project={child}
              level={level + 1}
              onProjectSelect={onProjectSelect}
              selectedProjectId={selectedProjectId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const ProjectHierarchy: React.FC<ProjectHierarchyProps> = ({
  projects,
  onProjectSelect,
  selectedProjectId
}) => {
  // 构建层级结构
  const buildHierarchy = (projects: Project[]): Project[] => {
    const projectMap = new Map<string, Project>();
    const rootProjects: Project[] = [];

    // 创建项目映射
    projects.forEach(project => {
      projectMap.set(project.id, { ...project, children: [] });
    });

    // 构建父子关系
    projects.forEach(project => {
      const projectNode = projectMap.get(project.id)!;
      if (project.parentId && projectMap.has(project.parentId)) {
        const parent = projectMap.get(project.parentId)!;
        parent.children = parent.children || [];
        parent.children.push(projectNode);
      } else {
        rootProjects.push(projectNode);
      }
    });

    return rootProjects;
  };

  const hierarchicalProjects = buildHierarchy(projects);

  if (hierarchicalProjects.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Folder className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>暂无项目</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">项目层级结构</h3>
      </div>
      <div className="p-4 space-y-1">
        {hierarchicalProjects.map((project) => (
          <ProjectNode
            key={project.id}
            project={project}
            level={0}
            onProjectSelect={onProjectSelect}
            selectedProjectId={selectedProjectId}
          />
        ))}
      </div>
    </div>
  );
};
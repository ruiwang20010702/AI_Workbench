import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Calendar, BarChart3, PieChart, TreePine } from 'lucide-react';
import { cn } from '../utils/cn';
import { ProjectCreateModal } from '../components/projects/ProjectCreateModal';
import { ProjectFilters } from '../components/projects/ProjectFilters';
import { ProjectDashboard } from '../components/projects/ProjectDashboard';
import { ProjectProgressChart } from '../components/dashboard/ProjectProgressChart';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { TeamPerformance } from '../components/dashboard/TeamPerformance';
import { ProjectHierarchy } from '../components/projects/ProjectHierarchy';
import { 
  Project, 
  CreateProjectRequest, 
  ProjectStats,
  projectService 
} from '../services/projectService';
import taskService, { CreateTaskRequest, type Task, type TaskStats } from '../services/taskService';
import { TaskCreateModal } from '../components/tasks/TaskCreateModal';
import { TaskKanbanBoard } from '../components/tasks/TaskKanbanBoard';
import { ProjectGanttChart } from '../components/projects/ProjectGanttChart.tsx';

type ViewMode = 'dashboard' | 'kanban' | 'gantt' | 'hierarchy';

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



export const ProjectsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  // 当前选中的项目（用于看板/甘特）
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // 选中项目的任务
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  // 全局任务统计（用于仪表盘中的“即将到期”等）
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);

  // 任务弹窗
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskInitialValues, setTaskInitialValues] = useState<Partial<CreateTaskRequest> | undefined>(undefined);


  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [parentProject, setParentProject] = useState<Project | null>(null);
  
  const [filters, setFilters] = useState<ProjectFilters>({
    search: '',
    status: [],
    priority: [],
    dateRange: { start: '', end: '' },
    teamMembers: [],
    tags: [],
    hasSubProjects: null,
    parentId: null
  });

  // 加载项目数据
  useEffect(() => {
    loadProjects();
  }, [filters]);

  // 加载任务统计（全局，不按项目过滤）
  useEffect(() => {
    const loadTaskStats = async () => {
      try {
        const stats = await taskService.getTaskStats();
        setTaskStats(stats);
      } catch (err) {
        console.error('加载任务统计失败:', err);
      }
    };
    void loadTaskStats();
  }, []);

  // 在任务有变更时刷新统计
  const refreshTaskStats = async () => {
    try {
      const stats = await taskService.getTaskStats();
      setTaskStats(stats);
    } catch (err) {
      console.error('刷新任务统计失败:', err);
    }
  };


  const loadProjects = async () => {
    try {
      // 层级视图需要完整数据以保持父子关系正确，不在服务端按状态/优先级筛选
      const response = await projectService.getProjects({
        search: filters.search || undefined,
        // 在非层级视图下才传递服务端筛选参数；层级视图改为前端裁剪
        status: viewMode !== 'hierarchy' && filters.status.length > 0 ? filters.status.join(',') : undefined,
        priority: viewMode !== 'hierarchy' && filters.priority.length > 0 ? filters.priority.join(',') : undefined,
        parent_id: filters.parentId || undefined
      });
      setProjects(response);
    } catch (error) {
      console.error('加载项目失败:', error);
    } finally {

    }
  };



  const viewModeOptions = [
    { mode: 'dashboard' as ViewMode, icon: PieChart, label: '仪表盘' },
    { mode: 'kanban' as ViewMode, icon: BarChart3, label: '看板视图' },
    { mode: 'gantt' as ViewMode, icon: Calendar, label: '甘特图' },
    { mode: 'hierarchy' as ViewMode, icon: TreePine, label: '层级视图' }
  ];

  const handleCreateProject = () => {
    setEditingProject(null);
    setParentProject(null);
    setShowCreateModal(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setParentProject(null);
    setShowCreateModal(true);
  };

  const handleCreateSubProject = (parent: Project) => {
    setEditingProject(null);
    setParentProject(parent);
    setShowCreateModal(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('确定要删除这个项目吗？此操作不可撤销。')) {
      try {
        await projectService.deleteProject(projectId);
        setProjects(prev => prev.filter(p => p.id !== projectId));

      } catch (error) {
        console.error('删除项目失败:', error);
        alert('删除项目失败，请稍后重试');
      }
    }
  };

  const handleStatusChange = async (projectId: string, status: Project['status']) => {
    try {
      await projectService.updateProject(projectId, { status });
      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, status } : p
      ));
  
    } catch (error) {
      console.error('更新项目状态失败:', error);
      alert('更新项目状态失败，请稍后重试');
    }
  };

  // 项目任务操作（看板/甘特）
  const openCreateTask = (preset?: Partial<CreateTaskRequest>) => {
    setEditingTask(null);
    setTaskInitialValues({
      project_id: selectedProjectId,
      status: 'pending',
      priority: 'medium',
      ...preset
    });
    setShowTaskModal(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskInitialValues(undefined);
    setShowTaskModal(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('确定要删除这个任务吗？此操作不可撤销。')) {
      try {
        await taskService.deleteTask(taskId);
        setProjectTasks(prev => prev.filter(t => t.id !== taskId));
        void refreshTaskStats();
      } catch (error) {
        console.error('删除任务失败:', error);
        alert('删除任务失败，请稍后重试');
      }
    }
  };

  const handleTaskStatusChange = async (taskId: string, status: Task['status']) => {
    try {
      await taskService.updateTask(taskId, { status });
      setProjectTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
      void refreshTaskStats();
    } catch (error) {
      console.error('更新任务状态失败:', error);
      alert('更新任务状态失败，请稍后重试');
    }
  };

  const handleTaskSubmit = async (taskData: CreateTaskRequest) => {
    try {
      if (editingTask) {
        const updatedTask = await taskService.updateTask(editingTask.id, taskData);
        setProjectTasks(prev => prev.map(t => t.id === editingTask.id ? updatedTask : t));
      } else {
        const newTask = await taskService.createTask(taskData);
        setProjectTasks(prev => [...prev, newTask]);
      }
      setShowTaskModal(false);
      setEditingTask(null);
      setTaskInitialValues(undefined);
      void refreshTaskStats();
    } catch (error) {
      console.error('保存任务失败:', error);
      const err: any = error;
      const serverMsg = err?.response?.data?.error || err?.response?.data?.detail;
      alert(serverMsg ? `保存任务失败：${serverMsg}` : '保存任务失败，请稍后重试');
    }
  };

  // 按邮箱搜索可用用户并批量添加为成员（支持默认角色）
  const addMembersByEmails = async (projectId: string, emails: string[], role: 'admin' | 'member' | 'observer' = 'member') => {
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const clean = Array.from(new Set((emails || []).map(e => e.trim()).filter(e => emailRegex.test(e))))
        .slice(0, 50); // 保护：最多处理 50 个
      if (clean.length === 0) return { added_count: 0 };

      const requests: Array<{ user_id: string; role: 'admin' | 'member' | 'observer' }> = [];
      for (const email of clean) {
        try {
          const users = await projectService.searchAvailableUsers(projectId, email, 1);
          if (Array.isArray(users) && users.length > 0) {
            // 使用传入的默认角色
            requests.push({ user_id: users[0].id, role });
          }
        } catch (err) {
          console.warn('搜索可用用户失败:', email, err);
        }
      }

      if (requests.length === 0) return { added_count: 0 };
      return await projectService.batchAddProjectMembers(projectId, requests);
    } catch (error) {
      console.error('批量添加成员失败:', error);
      return { added_count: 0 };
    }
  };

  const handleProjectSubmit = async (projectData: CreateProjectRequest, teamEmails?: string[], defaultRole?: 'admin' | 'member' | 'observer', initialTasks?: CreateTaskRequest[]) => {
    try {
      if (editingProject) {
        // Update existing project
        const updatedProject = await projectService.updateProject(editingProject.id, projectData);
        // 批量添加成员（仅添加尚未在项目中的用户）
        const addRes = await addMembersByEmails(editingProject.id, teamEmails || [], defaultRole ?? 'member');
        setProjects(prev => prev.map(p => {
          if (p.id === editingProject.id) {
            const added = addRes?.added_count || 0;
            return { ...updatedProject, team_members: (updatedProject.team_members || 0) + added };
          }
          return p;
        }));

        // 编辑模式也支持创建初始任务（第4步的任务）
        if (initialTasks && initialTasks.length > 0) {
          try {
            for (const taskData of initialTasks) {
              const taskWithProject = { ...taskData, project_id: editingProject.id };
              await taskService.createTask(taskWithProject);
            }
          } catch (taskError) {
            console.error('创建初始任务失败:', taskError);
            // 不阻止项目更新，只记录错误
          }
        }
      } else {
        // Create new project
        const newProject = await projectService.createProject(projectData);
        
        // 批量添加成员（仅添加尚未在项目中的用户）
        const addRes = await addMembersByEmails(newProject.id, teamEmails || [], defaultRole ?? 'member');
        const added = addRes?.added_count || 0;
        
        // 创建初始任务
        if (initialTasks && initialTasks.length > 0) {
          try {
            for (const taskData of initialTasks) {
              // 设置项目ID
              const taskWithProject = { ...taskData, project_id: newProject.id };
              await taskService.createTask(taskWithProject);
            }
          } catch (taskError) {
            console.error('创建初始任务失败:', taskError);
            // 不阻止项目创建，只是记录错误
          }
        }
        
        setProjects(prev => [...prev, { ...newProject, team_members: (newProject.team_members || 0) + added }]);
      }
      
      setShowCreateModal(false);
      setEditingProject(null);
      setParentProject(null);

    } catch (error) {
      console.error('保存项目失败:', error);
      alert('保存项目失败，请稍后重试');
    }
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: [],
      priority: [],
      dateRange: { start: '', end: '' },
      teamMembers: [],
      tags: [],
      hasSubProjects: null,
      parentId: null
    });
  };


  // Filter projects based on current filters
  const filteredProjects = projects.filter(project => {
    // Search filter
    if (filters.search && !project.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !(project.description?.toLowerCase().includes(filters.search.toLowerCase()))) {
      return false;
    }

    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(project.status)) {
      return false;
    }

    // Priority filter
    if (filters.priority.length > 0 && !filters.priority.includes(project.priority)) {
      return false;
    }

    // Date range filter
    if (filters.dateRange.start && (!project.start_date || project.start_date < filters.dateRange.start)) {
      return false;
    }
    if (filters.dateRange.end && (!project.end_date || project.end_date > filters.dateRange.end)) {
      return false;
    }

    // Sub-projects filter
    if (filters.hasSubProjects === true && (!project.subProjects || project.subProjects === 0)) {
      return false;
    }
    if (filters.hasSubProjects === false && project.subProjects && project.subProjects > 0) {
      return false;
    }

    return true;
  });

  // 在看板/甘特视图下默认选择一个项目
  useEffect(() => {
    if ((viewMode === 'kanban' || viewMode === 'gantt') && filteredProjects.length > 0) {
      const exists = filteredProjects.some(p => p.id === selectedProjectId);
      if (!exists) {
        setSelectedProjectId(filteredProjects[0].id);
      }
    }
  }, [viewMode, projects, filters]);

  // 加载选中项目的任务（看板/甘特图）
  useEffect(() => {
    const loadProjectTasks = async () => {
      if (!selectedProjectId || (viewMode !== 'kanban' && viewMode !== 'gantt')) return;
      try {
        setTasksLoading(true);
        const res = await taskService.getProjectTasks(selectedProjectId);
        setProjectTasks(res.tasks || []);
      } catch (err) {
        console.error('加载项目任务失败:', err);
      } finally {
        setTasksLoading(false);
      }
    };
    void loadProjectTasks();
  }, [selectedProjectId, viewMode]);

  // 统计数据（对齐 ProjectStats 接口）
  const projectStats = useMemo((): ProjectStats => {
    const total_projects = filteredProjects.length;
    const active_projects = filteredProjects.filter(p => p.status === 'active').length;
    const completed_projects = filteredProjects.filter(p => p.status === 'completed').length;
    const total_tasks = filteredProjects.reduce((sum, p) => sum + (p.tasks_total || 0), 0);
    const completed_tasks = filteredProjects.reduce((sum, p) => sum + (p.tasks_completed || 0), 0);
    const total_team_members = filteredProjects.reduce((sum, p) => sum + (p.team_members || 0), 0);

    const now = new Date();
    // 逾期任务改为使用服务端任务统计，按未完成且已逾期的任务口径
    const overdue_tasks = taskStats?.overdue_tasks ?? 0;
    // 使用服务端任务统计的“即将到期”数据，避免仅按项目结束日期统计导致为0
    const upcoming_deadlines = taskStats?.upcoming_deadlines ?? 0;

    return {
      total_projects,
      active_projects,
      completed_projects,
      total_tasks,
      completed_tasks,
      overdue_tasks,
      total_team_members,
      upcoming_deadlines
    };
  }, [filteredProjects, taskStats]);

  // 仪表盘扩展所需的派生数据
  const recentProjects = useMemo(() => {
    const mapStatus = (s: Project['status']): 'active' | 'completed' | 'on_hold' => {
      if (s === 'completed') return 'completed';
      if (s === 'paused') return 'on_hold';
      return 'active';
    };
    return filteredProjects.map(p => ({
      name: p.name,
      progress: p.progress || Math.round(((p.tasks_completed || 0) / Math.max(p.tasks_total || 0, 1)) * 100),
      status: mapStatus(p.status),
      dueDate: p.end_date,
      tasksCompleted: p.tasks_completed || 0,
      tasksTotal: p.tasks_total || 0,
    }));
  }, [filteredProjects]);

  const activities = useMemo(() => {
    // 简单根据项目生成最近活动占位数据；真实项目可改为从后端获取
    const now = Date.now();
    return filteredProjects.slice(0, 5).map((p, idx) => ({
      id: `${p.id}-activity-${idx}`,
      type: 'project_updated' as const,
      title: `更新项目：${p.name}`,
      description: `项目状态更新为 ${p.status}`,
      user: '系统',
      timestamp: new Date(now - idx * 60 * 60 * 1000).toISOString(),
      metadata: { projectName: p.name }
    }));
  }, [filteredProjects]);

  const teamMembers = useMemo(() => {
    // 占位的团队绩效数据；后续可改为按项目成员真实统计
    return [
      { id: '1', name: '张三', role: '前端开发', tasksCompleted: 15, tasksTotal: 18, hoursWorked: 160, efficiency: 92, projects: ['项目A', '项目B'] },
      { id: '2', name: '李四', role: '后端开发', tasksCompleted: 12, tasksTotal: 15, hoursWorked: 145, efficiency: 88, projects: ['项目B', '项目C'] },
      { id: '3', name: '王五', role: '产品经理', tasksCompleted: 10, tasksTotal: 12, hoursWorked: 130, efficiency: 85, projects: ['项目A'] },
    ];
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">项目管理</h1>
              <p className="text-sm text-gray-600">管理和跟踪您的所有项目</p>
            </div>
            <button 
              onClick={handleCreateProject}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>创建项目</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <ProjectFilters
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={handleClearFilters}
            />
          </div>

          {/* Projects Content */}
          <div className="lg:col-span-3">
            {/* View Mode Selector */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  显示 {filteredProjects.length} 个项目
                </span>
              </div>

              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                {viewModeOptions.map(({ mode, icon: Icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={cn(
                      "flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors",
                      viewMode === mode
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                    title={label}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dashboard View */}
            {viewMode === 'dashboard' && (
              <>
                {/* 顶部项目统计卡片（保留现有 ProjectDashboard） */}
                <ProjectDashboard stats={projectStats} />

                

                {/* 主内容：项目进度图 + 最近活动 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                  <div className="lg:col-span-2">
                    <ProjectProgressChart
                      projects={recentProjects}
                      title="项目进度概览"
                      showDetails={true}
                      className="h-full"
                    />
                  </div>
                  <div>
                    <RecentActivity
                      activities={activities}
                      title="最近活动"
                      maxItems={2}
                      className="h-full"
                    />
                  </div>
                </div>

                {/* 团队绩效 */}
                <div className="mt-6">
                  <TeamPerformance
                    teamMembers={teamMembers}
                    title="团队绩效概览"
                  />
                </div>
              </>
            )}

            {/* 已移除网格/列表视图 */}

            {viewMode === 'kanban' && (
              <div className="bg-white rounded-lg border border-gray-200">
                {/* 看板视图头部：项目选择与创建任务 */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">项目看板</h3>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600">选择项目:</label>
                      <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                      >
                        {filteredProjects.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => openCreateTask()}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>创建任务</span>
                  </button>
                </div>

                {/* 看板主体 */}
                {(!selectedProjectId || tasksLoading) ? (
                  <div className="p-8 text-center text-gray-600">
                    {!selectedProjectId ? (
                      <p>请选择一个项目以查看该项目的看板任务</p>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                        <p>加载任务中...</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4">
                    <TaskKanbanBoard
                      tasks={projectTasks}
                      onEdit={openEditTask}
                      onDelete={handleDeleteTask}
                      onStatusChange={(id, s) => { void handleTaskStatusChange(id, s as Task['status']); }}
                      onCreateTask={(status) => openCreateTask({ status: status as Task['status'] })}
                    />
                  </div>
                )}
              </div>
            )}

            {viewMode === 'gantt' && (
              <div className="bg-white rounded-lg border border-gray-200">
                {/* 甘特图视图头部：项目选择与创建任务 */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">项目甘特图</h3>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600">选择项目:</label>
                      <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                      >
                        {filteredProjects.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => openCreateTask()}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>创建任务</span>
                  </button>
                </div>

                {/* 甘特图主体 */}
                {(!selectedProjectId || tasksLoading) ? (
                  <div className="p-8 text-center text-gray-600">
                    {!selectedProjectId ? (
                      <p>请选择一个项目以查看该项目的甘特图</p>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                        <p>加载任务中...</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4">
                    <ProjectGanttChart
                      tasks={projectTasks}
                      onEdit={openEditTask}
                      onCreateTask={(startDate: string, dueDate: string) => openCreateTask({ start_date: startDate, due_date: dueDate })}
                    />
                  </div>
                )}
              </div>
            )}

            {viewMode === 'hierarchy' && (
              <ProjectHierarchy 
                projects={getHierarchyFilteredProjects(projects, filters)}
                onProjectSelect={(uiProject) => {
                  const svcProject = projects.find(p => p.id === uiProject.id) || null;
                  setEditingProject(svcProject);
                  setShowCreateModal(true);
                }}
              />
            )}

            {/* Empty State */}
            {filteredProjects.length === 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filters.search || filters.status.length > 0 || filters.priority.length > 0 
                    ? '未找到匹配的项目' 
                    : '还没有项目'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {filters.search || filters.status.length > 0 || filters.priority.length > 0
                    ? '尝试调整筛选条件或清除筛选器' 
                    : '创建您的第一个项目开始管理工作'}
                </p>
                <button 
                  onClick={handleCreateProject}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  创建项目
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <ProjectCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleProjectSubmit}
        editProject={editingProject}
        parentProject={parentProject}
      />

      {/* Create/Edit Task Modal */}
      <TaskCreateModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onSubmit={handleTaskSubmit}
        editTask={editingTask}
        initialValues={taskInitialValues}
      />
    </div>
  );
};

// 层级视图项目类型（与 ProjectHierarchy 组件的结构对齐）
type HierarchyProject = {
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
  children?: HierarchyProject[];
};

// 统一：将服务端项目映射为层级视图需要的UI形态
const toHierarchyStatus = (s: Project['status']): 'planning' | 'active' | 'completed' | 'on-hold' | 'archived' => {
  return s === 'paused' ? 'on-hold' : s;
};

const toHierarchyProject = (p: Project): HierarchyProject => ({
  id: p.id,
  name: p.name,
  description: p.description || '',
  status: toHierarchyStatus(p.status),
  priority: p.priority,
  startDate: p.start_date || '',
  endDate: p.end_date || '',
  progress: p.progress || 0,
  teamMembers: p.team_members || 0,
  tasksTotal: p.tasks_total || p.tasksTotal || 0,
  tasksCompleted: p.tasks_completed || p.tasksCompleted || 0,
  tags: p.tags || [],
  parentId: p.parentId || p.parent_id || undefined,
  children: (p.children || []).map(toHierarchyProject)
});

// 构建完整层级树（从扁平列表）
const buildHierarchyTree = (nodes: HierarchyProject[]): HierarchyProject[] => {
  const map = new Map<string, HierarchyProject>();
  const roots: HierarchyProject[] = [];
  nodes.forEach(n => {
    map.set(n.id, { ...n, children: [] });
  });
  nodes.forEach(n => {
    const cur = map.get(n.id)!;
    if (cur.parentId && map.has(cur.parentId)) {
      const parent = map.get(cur.parentId)!;
      parent.children!.push(cur);
    } else {
      roots.push(cur);
    }
  });
  return roots;
};

// 将筛选映射到层级视图（paused -> on-hold）
const normalizeHierarchyStatus = (s: string) => (s === 'paused' ? 'on-hold' : s);

// 判断层级节点是否匹配当前筛选
const matchesFiltersHierarchy = (node: HierarchyProject, filters: ProjectFilters): boolean => {
  if (filters.search) {
    const q = filters.search.toLowerCase();
    const nameHit = node.name.toLowerCase().includes(q);
    const descHit = (node.description || '').toLowerCase().includes(q);
    if (!nameHit && !descHit) return false;
  }

  if (filters.status.length > 0) {
    const statusSet = new Set(filters.status.map(normalizeHierarchyStatus));
    if (!statusSet.has(node.status)) return false;
  }

  if (filters.priority.length > 0) {
    if (!filters.priority.includes(node.priority)) return false;
  }

  if (filters.dateRange.start && (!node.startDate || node.startDate < filters.dateRange.start)) return false;
  if (filters.dateRange.end && (!node.endDate || node.endDate > filters.dateRange.end)) return false;

  // hasSubProjects 按层级结构的 children 判断
  if (filters.hasSubProjects === true) {
    // 注意：匹配阶段使用原始 children（未裁剪）
    // 该函数在构建树之后再调用
    // 这里的判断将在 prune 前后保持一致
    // 若无子节点则不匹配
    // 实际 children 数量在树构建后才准确
  }

  if (filters.hasSubProjects === false) {
    // 若有子节点则不匹配
  }

  // tags：要求至少包含一个选中的标签
  if (filters.tags.length > 0) {
    const nodeTags = node.tags || [];
    const anyTag = filters.tags.some(t => nodeTags.includes(t));
    if (!anyTag) return false;
  }

  return true;
};

// 裁剪树：保留匹配节点及其所有祖先
const pruneHierarchyTree = (roots: HierarchyProject[], filters: ProjectFilters): HierarchyProject[] => {
  const pruneNode = (node: HierarchyProject): HierarchyProject | null => {
    const originalChildren = node.children || [];
    const prunedChildren: HierarchyProject[] = [];
    for (const ch of originalChildren) {
      const pruned = pruneNode(ch);
      if (pruned) prunedChildren.push(pruned);
    }

    // 在 children 已构建后再评估 hasSubProjects
    const withHasSubFilter = () => {
      if (filters.hasSubProjects === true && (originalChildren.length === 0)) return false;
      if (filters.hasSubProjects === false && (originalChildren.length > 0)) return false;
      return true;
    };

    const selfMatches = matchesFiltersHierarchy(node, filters) && withHasSubFilter();
    if (selfMatches || prunedChildren.length > 0) {
      return { ...node, children: prunedChildren };
    }
    return null;
  };

  const result: HierarchyProject[] = [];
  for (const r of roots) {
    const pruned = pruneNode(r);
    if (pruned) result.push(pruned);
  }
  return result;
};

// 将树扁平化为列表以供 ProjectHierarchy 重建（其内部会重构 children）
const flattenHierarchy = (roots: HierarchyProject[]): HierarchyProject[] => {
  const out: HierarchyProject[] = [];
  const visit = (node: HierarchyProject) => {
    out.push({ ...node, children: [] });
    (node.children || []).forEach(visit);
  };
  roots.forEach(visit);
  return out;
};

// 为层级视图提供经裁剪后的列表，确保父子关系正确
const getHierarchyFilteredProjects = (svcProjects: Project[], filters: ProjectFilters): HierarchyProject[] => {
  const allNodes = svcProjects.map(toHierarchyProject);
  const tree = buildHierarchyTree(allNodes);
  const prunedTree = pruneHierarchyTree(tree, filters);
  return flattenHierarchy(prunedTree);
};
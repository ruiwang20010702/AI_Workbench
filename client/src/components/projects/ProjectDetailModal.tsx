import React, { useEffect, useState } from 'react';
import { X, Edit, Users, CheckCircle, Calendar, TrendingUp, AlertCircle, FileText, Upload as UploadIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Project, projectService, ProjectMember } from '../../services/projectService';
import type { Task } from '../../services/taskService';
import { Document, documentService } from '../../services/documentService';
import { useAuth } from '../../hooks/useAuth';
import { DragDropUpload } from './DragDropUpload';
import { DocumentList } from './DocumentList';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { DocumentVersionModal } from './DocumentVersionModal';

interface ProjectDetailModalProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  onEdit: (project: Project) => void;
}

interface PendingMember {
  id: string;
  email: string;
  role: 'admin' | 'member' | 'observer';
  created_at: string;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  isOpen,
  project,
  onClose,
  onEdit
}) => {
  const { user } = useAuth(); // 使用 AuthContext 获取当前用户
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 文档相关状态
  const [activeTab, setActiveTab] = useState<'overview' | 'documents'>('overview');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [versionDocument, setVersionDocument] = useState<Document | null>(null);
  
  // 用户权限 - 使用 AuthContext 中的用户信息
  const canEdit = React.useMemo(() => {
    if (!user || !user.id) {
      console.log('[ProjectDetailModal] canEdit = false: 没有用户信息', { user });
      return false;
    }
    
    const userMember = members.find(m => m.user.id === user.id);
    const result = userMember?.role === 'admin' || userMember?.role === 'member';
    
    console.log('[ProjectDetailModal] canEdit 计算结果:', {
      userId: user.id,
      userName: user.name,
      membersCount: members.length,
      userMember: userMember ? { id: userMember.user.id, role: userMember.role } : null,
      canEdit: result
    });
    
    return result;
  }, [user, members]);

  // 计算进度百分比 - 必须在条件判断之前调用
  const progressPercentage = React.useMemo(() => {
    if (!project) return 0;
    const total = project.tasks_total || project.tasksTotal || 0;
    const completed = project.tasks_completed || project.tasksCompleted || 0;
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }, [project]);

  // 计算剩余天数 - 必须在条件判断之前调用
  const daysRemaining = React.useMemo(() => {
    if (!project?.end_date) return null;
    const now = new Date();
    const endDate = new Date(project.end_date);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [project?.end_date]);

  // 加载项目成员和任务
  useEffect(() => {
    const loadProjectDetails = async () => {
      if (!isOpen || !project?.id) return;

      setLoading(true);
      try {
        // 加载项目成员
        const membersResponse = await projectService.getProjectMembers(project.id, { limit: 50 });
        const loadedMembers = membersResponse.members || [];
        setMembers(loadedMembers);

        // 加载待定成员并过滤掉已是项目成员的邮箱
        try {
          const pendingMembersData = await projectService.getPendingMembers(project.id);
          // 创建已有成员的邮箱集合（不区分大小写）
          const memberEmailsSet = new Set(
            loadedMembers.map(m => m.user.email.toLowerCase())
          );
          // 过滤掉已经是项目成员的待定成员
          const filteredPendingMembers = (pendingMembersData || []).filter(
            pm => !memberEmailsSet.has(pm.email.toLowerCase())
          );
          setPendingMembers(filteredPendingMembers);
        } catch (err) {
          console.warn('加载待定成员失败:', err);
          setPendingMembers([]);
        }

        // 加载最近任务
        const tasksResponse = await projectService.getProjectTasks(project.id, { limit: 3 });
        setRecentTasks(tasksResponse.tasks || []);
      } catch (error) {
        console.error('加载项目详情失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProjectDetails();
  }, [isOpen, project?.id]);
  
  // 加载项目文档
  useEffect(() => {
    const loadDocuments = async () => {
      if (!isOpen || !project?.id || activeTab !== 'documents') return;

      setDocumentsLoading(true);
      try {
        const docs = await documentService.getDocuments(project.id, true);
        setDocuments(docs);
      } catch (error) {
        console.error('加载文档失败:', error);
      } finally {
        setDocumentsLoading(false);
      }
    };

    loadDocuments();
  }, [isOpen, project?.id, activeTab]);

  // ESC键关闭弹窗
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);
  
  /**
   * 处理文件上传
   */
  const handleFilesSelected = async (files: File[]) => {
    console.log('[ProjectDetailModal] handleFilesSelected 被调用', {
      projectId: project?.id,
      filesCount: files.length,
      files: files.map(f => ({ name: f.name, size: f.size, type: f.type }))
    });

    if (!project?.id) {
      console.error('[ProjectDetailModal] 没有项目 ID！');
      alert('错误：没有项目 ID');
      return;
    }

    if (files.length === 0) {
      console.warn('[ProjectDetailModal] 没有文件');
      return;
    }

    setUploadingFiles(files);

    try {
      // 逐个上传文件
      for (const file of files) {
        console.log(`[ProjectDetailModal] 开始上传: ${file.name}`);
        const result = await documentService.uploadDocument(project.id, file);
        console.log(`[ProjectDetailModal] 上传成功: ${file.name}`, result);
      }

      // 重新加载文档列表
      console.log('[ProjectDetailModal] 重新加载文档列表');
      const docs = await documentService.getDocuments(project.id, true);
      setDocuments(docs);
      console.log('[ProjectDetailModal] 文档列表更新完成', { count: docs.length });
      
      alert(`成功上传 ${files.length} 个文件！`);
    } catch (error) {
      console.error('[ProjectDetailModal] 上传失败:', error);
      alert(`文件上传失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setUploadingFiles([]);
    }
  };

  /**
   * 处理文档删除
   */
  const handleDocumentDelete = async (doc: Document) => {
    if (!project?.id) return;

    try {
      await documentService.deleteDocument(project.id, doc.id);
      
      // 更新列表
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      
      alert('文档删除成功！');
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除文档失败，请稍后重试');
    }
  };

  /**
   * 刷新文档列表
   */
  const refreshDocuments = async () => {
    if (!project?.id) return;

    try {
      const docs = await documentService.getDocuments(project.id, true);
      setDocuments(docs);
    } catch (error) {
      console.error('刷新文档列表失败:', error);
    }
  };

  if (!isOpen || !project) {
    return null;
  }

  // 格式化日期
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
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
    low: '低优先级',
    medium: '中优先级',
    high: '高优先级'
  };

  // 任务状态标签
  const taskStatusLabels: Record<string, string> = {
    todo: '待办',
    pending: '待办',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  };

  const taskStatusColors: Record<string, string> = {
    todo: 'text-gray-600',
    pending: 'text-gray-600',
    in_progress: 'text-blue-600',
    completed: 'text-green-600',
    cancelled: 'text-red-600'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 id="detail-modal-title" className="text-2xl font-bold text-gray-900">
              项目详情
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(project)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>编辑</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="关闭"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* 标签页 */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>项目概览</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('documents')}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'documents'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>项目文档</span>
              {documents.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-600">
                  {documents.length}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'overview' ? (
            <>
              {/* 项目基本信息 */}
              <div>
            <div className="flex items-center space-x-2 mb-3">
              <h3 className="text-xl font-semibold text-gray-900">
                {project.name}
              </h3>
            </div>
            <div className="flex items-center space-x-2 mb-4">
              <span className={cn('px-3 py-1 rounded-full text-sm font-medium', priorityColors[project.priority])}>
                {priorityLabels[project.priority]}
              </span>
              <span className={cn('px-3 py-1 rounded-full text-sm font-medium', statusColors[project.status])}>
                {statusLabels[project.status]}
              </span>
            </div>
            {project.description && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {project.description}
                </p>
              </div>
            )}
          </div>

          {/* 项目统计 */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">项目统计</h4>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {project.tasks_total || project.tasksTotal || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">任务总数</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {project.tasks_completed || project.tasksCompleted || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">已完成</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {progressPercentage}%
                </div>
                <div className="text-sm text-gray-600 mt-1">完成度</div>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {members.length + pendingMembers.length}
                </div>
                <div className="text-sm text-gray-600 mt-1">团队成员</div>
              </div>
            </div>
          </div>

          {/* 时间信息 */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">时间信息</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>开始日期:</span>
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDate(project.start_date)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>结束日期:</span>
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDate(project.end_date)}
                </span>
              </div>
              {daysRemaining !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>剩余天数:</span>
                  </span>
                  <span className={cn(
                    'text-sm font-medium',
                    daysRemaining < 0 ? 'text-red-600' : 
                    daysRemaining < 7 ? 'text-orange-600' : 'text-green-600'
                  )}>
                    {daysRemaining < 0 ? `已逾期 ${Math.abs(daysRemaining)} 天` : `${daysRemaining} 天`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 团队成员 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>团队成员 ({members.length + pendingMembers.length})</span>
              </h4>
            </div>
            {loading ? (
              <div className="text-center py-4 text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm">加载中...</p>
              </div>
            ) : (members.length > 0 || pendingMembers.length > 0) ? (
              <div className="space-y-4">
                {/* 正式成员 */}
                {members.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">正式成员 ({members.length})</h5>
                    <div className="grid grid-cols-5 gap-3">
                      {members.map((member) => (
                        <div 
                          key={member.id} 
                          className="flex flex-col items-center text-center"
                          title={`${member.user.name} (${member.user.email})`}
                        >
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                            <span className="text-blue-600 font-medium text-sm">
                              {member.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-xs text-gray-600 truncate w-full">
                            {member.user.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            {member.role === 'admin' ? '管理员' : member.role === 'member' ? '成员' : '观察者'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 待定成员 */}
                {pendingMembers.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">待定成员 ({pendingMembers.length})</h5>
                    <div className="grid grid-cols-5 gap-3">
                      {pendingMembers.map((member) => (
                        <div 
                          key={member.id} 
                          className="flex flex-col items-center text-center"
                          title={`${member.email} (待注册)`}
                        >
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2 border-2 border-dashed border-gray-300">
                            <span className="text-gray-400 font-medium text-sm">
                              {member.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-xs text-gray-600 truncate w-full">
                            {member.email.split('@')[0]}
                          </span>
                          <span className="text-xs text-orange-500">
                            待注册
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">暂无团队成员</p>
              </div>
            )}
          </div>

          {/* 最近任务 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>最近任务 ({recentTasks.length})</span>
              </h4>
            </div>
            {loading ? (
              <div className="text-center py-4 text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm">加载中...</p>
              </div>
            ) : recentTasks.length > 0 ? (
              <div className="space-y-2">
                {recentTasks.map((task) => (
                  <div 
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {task.title}
                      </p>
                      {task.assignee && (
                        <p className="text-xs text-gray-500">
                          负责人: {task.assignee.name}
                        </p>
                      )}
                    </div>
                    <span className={cn(
                      'text-xs font-medium ml-2',
                      taskStatusColors[task.status] || 'text-gray-600'
                    )}>
                      {taskStatusLabels[task.status] || task.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">暂无任务</p>
              </div>
            )}
          </div>
            </>
          ) : (
            <>
              {/* 文档标签页内容 */}
              <div className="space-y-6">
                {/* 上传区域 */}
                {canEdit && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <UploadIcon className="w-5 h-5" />
                      <span>上传文档</span>
                    </h4>
                    <DragDropUpload
                      onFilesSelected={handleFilesSelected}
                      disabled={uploadingFiles.length > 0}
                      showPreview={false}
                    />
                  </div>
                )}

                {/* 文档列表 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                      <FileText className="w-5 h-5" />
                      <span>文档列表</span>
                      {documents.length > 0 && (
                        <span className="ml-2 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-600">
                          {documents.length} 个文档
                        </span>
                      )}
                    </h4>
                    
                    {documents.length > 0 && (
                      <button
                        onClick={refreshDocuments}
                        className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        刷新
                      </button>
                    )}
                  </div>

                  <DocumentList
                    projectId={project.id}
                    documents={documents}
                    loading={documentsLoading}
                    canEdit={canEdit}
                    onPreview={setPreviewDocument}
                    onDelete={handleDocumentDelete}
                    onViewVersions={setVersionDocument}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* 预览模态框 */}
      <DocumentPreviewModal
        isOpen={!!previewDocument}
        projectId={project.id}
        document={previewDocument}
        onClose={() => setPreviewDocument(null)}
      />
      
      {/* 版本历史模态框 */}
      <DocumentVersionModal
        isOpen={!!versionDocument}
        projectId={project.id}
        document={versionDocument}
        onClose={() => setVersionDocument(null)}
        onRestoreSuccess={refreshDocuments}
      />
    </div>
  );
};


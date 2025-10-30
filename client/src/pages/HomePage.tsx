import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, CheckSquare, Sparkles, BarChart3, 
  TrendingUp, Target, Zap, Star, Clock,
  Calendar, ArrowRight
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { noteService } from '../services/noteService';
import { todoService, Todo } from '../services/todoService';
import { aiService } from '../services/aiService';

interface QuickStats {
  totalNotes: number;
  totalTodos: number;
  completedTodos: number;
  aiUsage: number;
  notesGrowthPercent?: number;
  aiUsageGrowth?: number;
}

interface RecentActivity {
  id: string;
  type: 'note' | 'todo' | 'ai';
  title: string;
  timestamp: string;
  status?: string;
}

// 新增：待办统计结构
interface TodoStats {
  total: number;
  completed: number;
  pending: number;
  in_progress?: number;
  not_started?: number;
  overdue?: number;
}

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<QuickStats>({
    totalNotes: 0,
    totalTodos: 0,
    completedTodos: 0,
    aiUsage: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  // 新增：待办统计状态
  const [todoStats, setTodoStats] = useState<TodoStats>({ total: 0, completed: 0, pending: 0 });
  const [dueTodos, setDueTodos] = useState<Todo[]>([]);

  useEffect(() => {
    // 加载真实的统计数据（笔记 + 待办）
    const loadStats = async () => {
      try {
        const [noteStatsData, todoStatsData, aiStatsData] = await Promise.all([
          noteService.getStats(),
          todoService.getStats(),
          aiService.getUsageStats()
        ]);

        // 计算AI使用增长（较上月）
        let aiGrowth = 0;
        const monthly = aiStatsData.monthlyUsage || [];
        if (monthly.length >= 2) {
          const current = monthly[0].requests || 0;
          const prev = monthly[1].requests || 0;
          aiGrowth = prev > 0 ? Math.round(((current - prev) / prev) * 100) : (current > 0 ? 100 : 0);
        }

        setStats({
          totalNotes: noteStatsData.totalNotes,
          totalTodos: noteStatsData.totalTodos,
          completedTodos: noteStatsData.completedTodos,
          aiUsage: aiStatsData.totalRequests || 0,
          notesGrowthPercent: noteStatsData.notesGrowthPercent,
          aiUsageGrowth: aiGrowth
        });
        setTodoStats({
          total: todoStatsData.total ?? 0,
          completed: todoStatsData.completed ?? 0,
          pending: todoStatsData.pending ?? 0,
          in_progress: todoStatsData.in_progress ?? 0,
          not_started: todoStatsData.not_started ?? 0,
          overdue: todoStatsData.overdue ?? 0,
        });
      } catch (error) {
        console.error('加载统计数据失败:', error);
        // 如果加载失败，使用默认值
        setStats({
          totalNotes: 0,
          totalTodos: 0,
          completedTodos: 0,
          aiUsage: 0
        });
        setTodoStats({ total: 0, completed: 0, pending: 0 });
      }
    };

    loadStats();

    // 加载最近活动（笔记 + 待办 + AI）
    const loadRecent = async () => {
      try {
        const [notesResp, todosResp, aiResp] = await Promise.all([
          noteService.getNotes({ page: 1, limit: 5 }),
          todoService.getTodos({ page: 1, limit: 5, sortBy: 'updatedAt', sortOrder: 'desc' }),
          aiService.getRecentUsage(5)
        ]);

        const noteItems: RecentActivity[] = (notesResp.notes || []).map((n) => ({
          id: `note-${n.id}`,
          type: 'note',
          title: n.title || '无标题笔记',
          timestamp: n.updatedAt || n.createdAt
        }));

        const todoItems: RecentActivity[] = (todosResp.todos || []).map((t) => ({
          id: `todo-${t.id}`,
          type: 'todo',
          title: t.title || '待办事项',
          timestamp: t.updatedAt || t.createdAt,
          status: t.completed ? 'completed' : undefined
        }));

        const aiItems: RecentActivity[] = (aiResp.logs || []).map((ai) => ({
          id: `ai-${ai.id}`,
          type: 'ai',
          title: `AI ${ai.action_type === 'generate' ? '生成' : ai.action_type === 'rewrite' ? '改写' : ai.action_type === 'summarize' ? '摘要' : ai.action_type === 'translate' ? '翻译' : ai.action_type}`,
          timestamp: ai.created_at
        }));

        const combined = [...noteItems, ...todoItems, ...aiItems].sort((a, b) => {
          const ta = new Date(a.timestamp).getTime();
          const tb = new Date(b.timestamp).getTime();
          return tb - ta;
        });

        setRecentActivity(combined.slice(0, 4));
      } catch (err) {
        console.error('加载最近活动失败:', err);
        setRecentActivity([]);
      }
    };

    loadRecent();

    const loadReminders = async () => {
      try {
        const resp = await todoService.getTodos({ page: 1, limit: 50, sortBy: 'dueDate', sortOrder: 'asc' });
        const list = (resp.todos || [])
          .filter(t => !t.completed && t.dueDate)
          .sort((a, b) => new Date(a.dueDate as string).getTime() - new Date(b.dueDate as string).getTime())
          .slice(0, 3);
        setDueTodos(list);
      } catch (err) {
        console.error('加载今日提醒失败:', err);
        setDueTodos([]);
      }
    };

    loadReminders();

    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  const formatTimeAgo = (ts: string) => {
    const t = new Date(ts).getTime();
    const now = currentTime.getTime();
    const diffMs = Math.max(0, now - t);
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}天前`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}周前`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}个月前`;
    const years = Math.floor(days / 365);
    return `${years}年前`;
  };

  const formatDueDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const quickActions = [
    {
      title: '新建笔记',
      description: '记录想法和灵感',
      icon: FileText,
      href: '/notes/new',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      title: '添加待办',
      description: '管理任务和目标',
      icon: CheckSquare,
      href: '/todos/new',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    },
    {
      title: 'AI助手',
      description: '智能文本处理',
      icon: Sparkles,
      href: '/ai',
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600'
    }
  ];

  const features = [
    {
      icon: FileText,
      title: '智能笔记',
      description: '支持富文本编辑、标签分类、全文搜索',
      stats: `${stats.totalNotes} 篇笔记`
    },
    {
      icon: CheckSquare,
      title: '任务管理',
      description: '优先级设置、截止日期、进度跟踪',
      // 使用真实待办统计
      stats: `${todoStats.completed}/${todoStats.total} 已完成`
    },
    {
      icon: Sparkles,
      title: 'AI助手',
      description: '文本生成、改写、翻译、总结等功能',
      stats: `${stats.aiUsage} 次使用`
    },
    {
      icon: BarChart3,
      title: '数据分析',
      description: '工作效率统计、趋势分析、个人洞察',
      stats: '实时更新'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 欢迎区域 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {getGreeting()}，{user?.name || '用户'}！
              </h1>
              <p className="text-gray-600 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {currentTime.toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {currentTime.toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              <div className="text-sm text-gray-500">
                {currentTime.toLocaleDateString('zh-CN', { weekday: 'long' })}
              </div>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总笔记数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalNotes}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">+{stats.notesGrowthPercent || 0}%</span>
              <span className="text-gray-500 ml-1">较上周</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">待办事项</p>
                {/* 显示未完成数量 */}
                <p className="text-2xl font-bold text-gray-900">{todoStats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Target className="w-4 h-4 text-blue-500 mr-1" />
              {/* 完成率：避免除以0 */}
              <span className="text-blue-600">{(todoStats.total > 0 ? Math.round((todoStats.completed / todoStats.total) * 100) : 0)}%</span>
              <span className="text-gray-500 ml-1">完成率</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">AI使用次数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.aiUsage}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Zap className="w-4 h-4 text-yellow-500 mr-1" />
              <span className="text-yellow-600">+{stats.aiUsageGrowth || 0}%</span>
              <span className="text-gray-500 ml-1">较上月</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">工作效率</p>
                <p className="text-2xl font-bold text-gray-900">{(() => {
                  const total = todoStats.total || 0;
                  const completed = todoStats.completed || 0;
                  const overdue = todoStats.overdue || 0;
                  const inProg = todoStats.in_progress || 0;
                  const completion = total > 0 ? Math.round((completed / total) * 100) : 0;
                  const overdueRate = total > 0 ? overdue / total : 0;
                  const inProgRate = total > 0 ? inProg / total : 0;
                  const penalty = Math.round(Math.min(overdueRate * 30, 30));
                  const bonus = Math.round(Math.min(inProgRate * 5, 5));
                  return Math.max(0, Math.min(100, completion - penalty + bonus));
                })()}%</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Star className="w-4 h-4 text-orange-500 mr-1" />
              <span className="text-orange-600">{(() => {
                const total = todoStats.total || 0;
                const completed = todoStats.completed || 0;
                const overdue = todoStats.overdue || 0;
                const inProg = todoStats.in_progress || 0;
                const completion = total > 0 ? Math.round((completed / total) * 100) : 0;
                const overdueRate = total > 0 ? overdue / total : 0;
                const inProgRate = total > 0 ? inProg / total : 0;
                const penalty = Math.round(Math.min(overdueRate * 30, 30));
                const bonus = Math.round(Math.min(inProgRate * 5, 5));
                const efficiency = Math.max(0, Math.min(100, completion - penalty + bonus));
                return efficiency >= 90 ? '优秀' : efficiency >= 70 ? '良好' : efficiency >= 50 ? '一般' : '需提升';
              })()}</span>
              <span className="text-gray-500 ml-1">评级</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 快速操作 */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">快速操作</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.title}
                    to={action.href}
                    className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                  >
                    <div className={`w-12 h-12 ${action.color} ${action.hoverColor} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{action.description}</p>
                    <div className="flex items-center text-blue-600 text-sm font-medium">
                      开始使用
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* 功能特性 */}
            <h2 className="text-xl font-semibold text-gray-900 mb-6">核心功能</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                        <p className="text-gray-600 text-sm mb-3">{feature.description}</p>
                        <div className="text-xs text-blue-600 font-medium">{feature.stats}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            {/* 今日提醒 */}
            <div className="mt-6 mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
              <h3 className="text-lg font-semibold mb-3">今日提醒</h3>
              <div className="space-y-2">
                {dueTodos.length > 0 ? (
                  dueTodos.map((t) => {
                    const overdue = t.dueDate ? new Date(t.dueDate) < new Date() : false;
                    return (
                      <div key={t.id} className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span className="truncate">{t.title}</span>
                        {t.dueDate && (
                          <span className="ml-2 text-xs text-white/80">
                            截止 {formatDueDate(t.dueDate)}{overdue ? '（已逾期）' : ''}
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm">{'所有的待办都已经完成啦！'}</div>
                )}
              </div>
            </div
            >

            {/* 最近活动 */}
            <h2 className="text-xl font-semibold text-gray-900 mb-6">最近活动</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="space-y-4">
                {recentActivity.map((activity: RecentActivity) => {
                  const getIcon = () => {
                    switch (activity.type) {
                      case 'note':
                        return <FileText className="w-4 h-4 text-blue-600" />;
                      case 'todo':
                        return <CheckSquare className="w-4 h-4 text-green-600" />;
                      case 'ai':
                        return <Sparkles className="w-4 h-4 text-purple-600" />;
                      default:
                        return <Clock className="w-4 h-4 text-gray-600" />;
                    }
                  };

                  return (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-shrink-0 mt-1">
                        {getIcon()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </p>
                        <div className="flex items-center mt-1">
                          <Clock className="w-3 h-3 text-gray-400 mr-1" />
                          <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                          {activity.status === 'completed' && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              已完成
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Button as={Link} to="/activity" variant="outline" className="w-full" size="sm">
                  查看全部活动
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
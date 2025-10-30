import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckSquare, Clock, Sparkles } from 'lucide-react';
import { Button, Loading } from '../components/ui';
import { noteService } from '../services/noteService';
import { todoService } from '../services/todoService';
import { aiService } from '../services/aiService';

interface RecentActivity {
  id: string;
  type: 'note' | 'todo' | 'ai';
  title: string;
  timestamp: string;
  status?: 'completed';
}

export const ActivityPage: React.FC = () => {
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError('');
      try {
        const [notesResp, todosResp, aiResp] = await Promise.all([
          noteService.getNotes({ page: 1, limit: 50 }),
          todoService.getTodos({ page: 1, limit: 50, sortBy: 'updatedAt', sortOrder: 'desc' }),
          aiService.getRecentUsage(50)
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

        setActivities(combined);
      } catch (e: any) {
        setError(e?.message || '加载活动失败');
      } finally {
        setLoading(false);
      }
    };

    loadAll();

    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

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

  const renderIcon = (type: 'note' | 'todo' | 'ai') => {
    if (type === 'note') {
      return (
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <FileText className="w-4 h-4 text-blue-600" />
        </div>
      );
    }
    if (type === 'ai') {
      return (
        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-purple-600" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
        <CheckSquare className="w-4 h-4 text-green-600" />
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">全部活动</h1>
        <div className="text-sm text-gray-600">共 {activities.length} 条</div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {loading ? (
          <Loading text="加载中..." />
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  {renderIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
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
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <Button as={Link} to="/" variant="secondary">返回首页</Button>
      </div>
    </div>
  );
};
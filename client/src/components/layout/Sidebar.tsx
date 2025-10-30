import React from 'react';
import { noteService, Note } from '../../services/noteService';
import { Link, useLocation } from 'react-router-dom';
import {
  FileText,
  CheckSquare,
  Plus,
  Sparkles,
  Home,
  FolderKanban,
  Activity
} from 'lucide-react';
import { cn } from '../../utils/cn';

import { LucideIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarItem {
  name: string;
  href: string;
  icon: LucideIcon;
  count?: number;
}



const baseNavigation: SidebarItem[] = [
  { name: '首页', href: '/', icon: Home },
  { name: '所有笔记', href: '/notes', icon: FileText },
  { name: '待办事项', href: '/todos', icon: CheckSquare },
  { name: '项目管理', href: '/projects', icon: FolderKanban },
  { name: 'AI 助手', href: '/ai', icon: Sparkles },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const [recentNotes, setRecentNotes] = React.useState<Note[]>([]);
const { user } = useAuth();
const isTester = user?.email === '123456@123.com';
const navigation: SidebarItem[] = React.useMemo(() => {
  const items = [...baseNavigation];
  if (isTester) {
    items.push({ name: '功能测试', href: '/test', icon: CheckSquare });
  }
  return items;
}, [isTester]);

  React.useEffect(() => {
    const loadRecent = async () => {
      try {
        const resp = await noteService.getNotes({ page: 1, limit: 5, isArchived: false });
        setRecentNotes(resp.notes || []);
      } catch (err) {
        console.error('加载最近笔记失败:', err);
        setRecentNotes([]);
      }
    };
    loadRecent();
  }, []);

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full">
      <div className="p-4">
        {/* Quick Actions */}
        <div className="space-y-2 mb-6">
          <Link
            to="/notes/new"
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} className="mr-2" />
            新建笔记
          </Link>
          <Link
            to="/todos/new"
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Plus size={16} className="mr-2" />
            新建待办
          </Link>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <item.icon
                  size={18}
                  className={cn(
                    'mr-3',
                    isActive ? 'text-blue-700' : 'text-gray-400'
                  )}
                />
                {item.name}
                {item.count && (
                  <span className="ml-auto bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* 最近笔记区块已移动到标签位置 */}

        {/* Recent Notes (moved to former Tags position) */}
        <div className="mt-16">
          <h3 className="px-3 text-xs font-bold text-black uppercase tracking-wider">
            最近笔记
          </h3>
          <div className="mt-2 space-y-1">
            {recentNotes.length > 0 ? (
              recentNotes.map((n) => (
                <Link
                  key={n.id}
                  to={`/notes/${n.id}`}
                  className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title={n.title || '无标题笔记'}
                >
                  {(n.title && n.title.trim()) ? n.title : '无标题笔记'}
                </Link>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">
                暂无最近笔记
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
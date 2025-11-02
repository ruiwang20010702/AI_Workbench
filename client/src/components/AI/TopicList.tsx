/**
 * TopicList - 主题列表组件
 */

import React, { useState } from 'react';
import { MessageSquare, Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { Topic } from '../../services/topicApi';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface TopicListProps {
  topics: Topic[];
  currentTopicId?: string;
  onSelectTopic: (topic: Topic) => void;
  onCreateTopic: () => void;
  onRenameTopic: (topicId: string, newTitle: string) => void;
  onDeleteTopic: (topic: Topic) => void;
  loading?: boolean;
}

export const TopicList: React.FC<TopicListProps> = ({
  topics,
  currentTopicId,
  onSelectTopic,
  onCreateTopic,
  onRenameTopic,
  onDeleteTopic,
  loading = false
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartEdit = (e: React.MouseEvent, topic: Topic) => {
    e.stopPropagation();
    setEditingId(topic.id);
    setEditTitle(topic.title);
  };

  const handleSaveEdit = (topicId: string) => {
    if (editTitle.trim()) {
      onRenameTopic(topicId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleDelete = (e: React.MouseEvent, topic: Topic) => {
    e.stopPropagation();
    if (window.confirm(`确定要删除主题"${topic.title}"吗？这将删除所有相关消息。`)) {
      onDeleteTopic(topic);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: zhCN 
      });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* 创建主题按钮 */}
      <button
        onClick={onCreateTopic}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>新建对话</span>
      </button>

      {/* 主题列表 */}
      <div className="space-y-1">
        {topics.map((topic) => {
          const isActive = topic.id === currentTopicId;
          const isHovered = hoveredId === topic.id;
          const isEditing = editingId === topic.id;

          return (
            <div
              key={topic.id}
              className={`
                group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all
                ${isActive 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }
              `}
              onClick={() => !isEditing && onSelectTopic(topic)}
              onMouseEnter={() => setHoveredId(topic.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* 图标 */}
              <MessageSquare className="w-4 h-4 flex-shrink-0" />

              {/* 主题内容 */}
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(topic.id);
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEdit(topic.id)}
                      className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 rounded"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="font-medium text-sm truncate">{topic.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      {topic.message_count !== undefined && (
                        <span>{topic.message_count} 条消息</span>
                      )}
                      {topic.last_message_at && (
                        <span>· {formatTime(topic.last_message_at)}</span>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* 操作按钮 */}
              {!isEditing && (isActive || isHovered) && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => handleStartEdit(e, topic)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    title="重命名"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, topic)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 空状态 */}
      {topics.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-sm">还没有对话</p>
          <p className="text-xs mt-1">点击上方按钮开始新对话</p>
        </div>
      )}
    </div>
  );
};


/**
 * AssistantList - 助手列表组件
 */

import React, { useState } from 'react';
import { Plus, Settings, Trash2, Star } from 'lucide-react';
import { Assistant } from '../../services/assistantApi';

interface AssistantListProps {
  assistants: Assistant[];
  currentAssistantId?: string;
  onSelectAssistant: (assistant: Assistant) => void;
  onCreateAssistant: () => void;
  onEditAssistant: (assistant: Assistant) => void;
  onDeleteAssistant: (assistant: Assistant) => void;
  loading?: boolean;
}

export const AssistantList: React.FC<AssistantListProps> = ({
  assistants,
  currentAssistantId,
  onSelectAssistant,
  onCreateAssistant,
  onEditAssistant,
  onDeleteAssistant,
  loading = false
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleDelete = (e: React.MouseEvent, assistant: Assistant) => {
    e.stopPropagation();
    if (window.confirm(`确定要删除助手"${assistant.name}"吗？这将删除所有相关的主题和消息。`)) {
      onDeleteAssistant(assistant);
    }
  };

  const handleEdit = (e: React.MouseEvent, assistant: Assistant) => {
    e.stopPropagation();
    onEditAssistant(assistant);
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
      {/* 创建助手按钮 */}
      <button
        onClick={onCreateAssistant}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>创建新助手</span>
      </button>

      {/* 助手列表 */}
      <div className="space-y-1">
        {assistants.map((assistant) => {
          const isActive = assistant.id === currentAssistantId;
          const isHovered = hoveredId === assistant.id;

          return (
            <div
              key={assistant.id}
              className={`
                group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all
                ${isActive 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }
              `}
              onClick={() => onSelectAssistant(assistant)}
              onMouseEnter={() => setHoveredId(assistant.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* 默认标识 */}
              {assistant.is_default && (
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
              )}

              {/* 助手名称 */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{assistant.name}</div>
                {assistant.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {assistant.description}
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              {(isActive || isHovered) && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => handleEdit(e, assistant)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    title="编辑助手"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  {!assistant.is_default && (
                    <button
                      onClick={(e) => handleDelete(e, assistant)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                      title="删除助手"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 空状态 */}
      {assistants.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-sm">还没有助手</p>
          <p className="text-xs mt-1">点击上方按钮创建第一个助手</p>
        </div>
      )}
    </div>
  );
};


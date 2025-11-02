/**
 * MultiAssistantPage - 多助手系统主页面
 * 两栏布局：左侧助手/主题列表，右侧对话区域
 */

import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AssistantList } from '../../components/ai/AssistantList';
import { TopicList } from '../../components/ai/TopicList';
import { ChatArea } from '../../components/ai/ChatArea';
import { AssistantModal } from '../../components/ai/AssistantModal';
import { 
  Assistant,
  getAssistants,
  createAssistant,
  updateAssistant,
  deleteAssistant
} from '../../services/assistantApi';
import { 
  Topic,
  getTopics,
  createTopic,
  updateTopic,
  deleteTopic
} from '../../services/topicApi';

type SidebarTab = 'assistants' | 'topics';

export const MultiAssistantPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 状态管理
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('assistants');
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [currentAssistant, setCurrentAssistant] = useState<Assistant | null>(null);
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 模态框状态
  const [showAssistantModal, setShowAssistantModal] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);

  // 初始化加载
  useEffect(() => {
    loadInitialData();
  }, []);

  // 当选择助手时，加载该助手的主题列表
  useEffect(() => {
    if (currentAssistant) {
      loadTopics(currentAssistant.id);
    }
  }, [currentAssistant]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const assistantsData = await getAssistants();
      setAssistants(assistantsData);
      
      // 选择默认助手或第一个助手
      const defaultAssistant = assistantsData.find(a => a.is_default) || assistantsData[0];
      if (defaultAssistant) {
        setCurrentAssistant(defaultAssistant);
      }
    } catch (error) {
      console.error('Failed to load assistants:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTopics = async (assistantId: string) => {
    try {
      const topicsData = await getTopics(assistantId);
      setTopics(topicsData);
      
      // 如果有主题，选择第一个
      if (topicsData.length > 0 && !currentTopic) {
        setCurrentTopic(topicsData[0]);
      }
    } catch (error) {
      console.error('Failed to load topics:', error);
    }
  };

  // 助手操作
  const handleSelectAssistant = (assistant: Assistant) => {
    setCurrentAssistant(assistant);
    setCurrentTopic(null); // 切换助手时清空当前主题
    setSidebarTab('topics'); // 自动切换到主题标签页
  };

  const handleCreateAssistant = () => {
    setEditingAssistant(null);
    setShowAssistantModal(true);
  };

  const handleEditAssistant = (assistant: Assistant) => {
    setEditingAssistant(assistant);
    setShowAssistantModal(true);
  };

  const handleDeleteAssistant = async (assistant: Assistant) => {
    try {
      await deleteAssistant(assistant.id);
      await loadInitialData();
      
      // 如果删除的是当前助手，清空选择
      if (currentAssistant?.id === assistant.id) {
        setCurrentAssistant(null);
        setCurrentTopic(null);
      }
    } catch (error) {
      console.error('Failed to delete assistant:', error);
      alert('删除助手失败');
    }
  };

  const handleSaveAssistant = async (data: Partial<Assistant>) => {
    try {
      console.log('[MultiAssistantPage] Saving assistant:', data);
      if (editingAssistant) {
        console.log('[MultiAssistantPage] Updating existing assistant:', editingAssistant.id);
        await updateAssistant(editingAssistant.id, data);
      } else {
        console.log('[MultiAssistantPage] Creating new assistant');
        await createAssistant(data);
      }
      console.log('[MultiAssistantPage] Assistant saved successfully');
      await loadInitialData();
      setShowAssistantModal(false);
    } catch (error: any) {
      console.error('[MultiAssistantPage] Failed to save assistant:', error);
      console.error('[MultiAssistantPage] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        data: data
      });
      alert(`保存助手失败: ${error.response?.data?.error || error.message || '未知错误'}`);
    }
  };

  // 主题操作
  const handleSelectTopic = (topic: Topic) => {
    console.log('[MultiAssistantPage] Selecting topic:', topic);
    setCurrentTopic(topic);
  };

  const handleCreateTopic = async () => {
    if (!currentAssistant) {
      alert('请先选择一个助手');
      return;
    }

    try {
      const newTopic = await createTopic(currentAssistant.id, {
        title: '新对话'
      });
      await loadTopics(currentAssistant.id);
      setCurrentTopic(newTopic);
    } catch (error) {
      console.error('Failed to create topic:', error);
      alert('创建主题失败');
    }
  };

  const handleRenameTopic = async (topicId: string, newTitle: string) => {
    try {
      await updateTopic(topicId, { title: newTitle });
      if (currentAssistant) {
        await loadTopics(currentAssistant.id);
      }
    } catch (error) {
      console.error('Failed to rename topic:', error);
      alert('重命名失败');
    }
  };

  const handleDeleteTopic = async (topic: Topic) => {
    try {
      await deleteTopic(topic.id);
      if (currentAssistant) {
        await loadTopics(currentAssistant.id);
      }
      
      // 如果删除的是当前主题，清空选择
      if (currentTopic?.id === topic.id) {
        setCurrentTopic(null);
      }
    } catch (error) {
      console.error('Failed to delete topic:', error);
      alert('删除主题失败');
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* 左侧边栏 */}
      <div className="w-80 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {/* 顶部导航栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">多助手系统</h1>
          <button
            onClick={() => navigate('/')}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="返回首页"
          >
            <Home className="w-5 h-5" />
          </button>
        </div>
        
        {/* 标签页切换 */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSidebarTab('assistants')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              sidebarTab === 'assistants'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Assistants</span>
          </button>
          <button
            onClick={() => setSidebarTab('topics')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              sidebarTab === 'topics'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Topics</span>
          </button>
        </div>

        {/* 当前助手信息 */}
        {currentAssistant && sidebarTab === 'topics' && (
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">当前助手</div>
            <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
              {currentAssistant.name}
            </div>
          </div>
        )}

        {/* 列表内容区域 */}
        <div className="flex-1 overflow-y-auto p-4">
          {sidebarTab === 'assistants' ? (
            <AssistantList
              assistants={assistants}
              currentAssistantId={currentAssistant?.id}
              onSelectAssistant={handleSelectAssistant}
              onCreateAssistant={handleCreateAssistant}
              onEditAssistant={handleEditAssistant}
              onDeleteAssistant={handleDeleteAssistant}
              loading={loading}
            />
          ) : (
            <TopicList
              topics={topics}
              currentTopicId={currentTopic?.id}
              onSelectTopic={handleSelectTopic}
              onCreateTopic={handleCreateTopic}
              onRenameTopic={handleRenameTopic}
              onDeleteTopic={handleDeleteTopic}
              loading={!currentAssistant}
            />
          )}
        </div>
      </div>

      {/* 右侧对话区域 */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <ChatArea
          assistant={currentAssistant}
          topic={currentTopic}
          onTopicUpdate={() => currentAssistant && loadTopics(currentAssistant.id)}
          onCreateTopic={async () => {
            if (!currentAssistant) {
              alert('请先选择一个助手');
              return;
            }
            const newTopic = await createTopic(currentAssistant.id, {
              title: '新对话'
            });
            await loadTopics(currentAssistant.id);
            setCurrentTopic(newTopic);
            return newTopic;
          }}
        />
      </div>

      {/* 助手编辑模态框 */}
      {showAssistantModal && (
        <AssistantModal
          assistant={editingAssistant}
          onClose={() => setShowAssistantModal(false)}
          onSave={handleSaveAssistant}
        />
      )}
    </div>
  );
};

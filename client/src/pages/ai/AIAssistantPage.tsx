import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Sparkles, FileText, Edit3, Languages, 
  BarChart3, Zap, Copy,
  Trash2, RefreshCw, Settings, Lightbulb, TrendingUp,
  Calendar, CheckCircle, AlertCircle, MessageSquare
} from 'lucide-react';
import { Button, Input, Card, CardContent, Loading } from '../../components/ui';
import { aiService, AIResponse } from '../../services/aiService';
import { getAIConfig } from '../../services/aiService';
import { ConversationManager, Conversation, ChatMessage as ConvMessage } from '../../utils/conversationManager';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  aiType?: string;
  loading?: boolean;
}

interface AITool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'generate' | 'rewrite' | 'analyze' | 'translate' | 'chat';
}

export const AIAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedTool, setSelectedTool] = useState<string>('chat');
  const [loading, setLoading] = useState(false);
  const [rewriteStyle, setRewriteStyle] = useState<'formal' | 'casual' | 'professional' | 'creative' | 'concise'>('professional');
  const [generateType, setGenerateType] = useState<'text' | 'note' | 'todo' | 'summary'>('text');
  const [translateFrom, setTranslateFrom] = useState('zh');
  const [translateTo, setTranslateTo] = useState('en');
  const [analysisType, setAnalysisType] = useState<'sentiment' | 'keywords' | 'topics' | 'readability'>('sentiment');
  const [stats, setStats] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [predictions, setPredictions] = useState<any>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 对话管理状态
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [chatInput, setChatInput] = useState('');

  // 保存对话历史到localStorage
  const saveMessagesToStorage = (messages: ChatMessage[]) => {
    try {
      localStorage.setItem('ai_assistant_messages', JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save messages to localStorage:', error);
    }
  };

  // 从localStorage加载对话历史
  const loadMessagesFromStorage = (): ChatMessage[] => {
    try {
      const saved = localStorage.getItem('ai_assistant_messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        // 确保timestamp是Date对象
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load messages from localStorage:', error);
    }
    return [];
  };

  const aiTools: AITool[] = [
    {
      id: 'chat',
      name: '智能问答',
      description: '与AI对话，查询您的笔记、项目和待办事项',
      icon: <MessageSquare className="w-5 h-5" />,
      category: 'chat'
    },
    {
      id: 'generate',
      name: '文本生成',
      description: '根据提示生成各种类型的文本内容',
      icon: <Sparkles className="w-5 h-5" />,
      category: 'generate'
    },
    {
      id: 'rewrite',
      name: '文本改写',
      description: '改写文本的风格和语调',
      icon: <Edit3 className="w-5 h-5" />,
      category: 'rewrite'
    },
    {
      id: 'translate',
      name: '文本翻译',
      description: '在不同语言之间翻译文本',
      icon: <Languages className="w-5 h-5" />,
      category: 'translate'
    },
    {
      id: 'analyze',
      name: '文本分析',
      description: '分析文本的情感、关键词等',
      icon: <BarChart3 className="w-5 h-5" />,
      category: 'analyze'
    },
    {
      id: 'summarize',
      name: '文本摘要',
      description: '生成文本的简洁摘要',
      icon: <FileText className="w-5 h-5" />,
      category: 'generate'
    },
    {
      id: 'recommendations',
      name: '智能推荐',
      description: '基于标签和优先级推荐待办事项',
      icon: <Lightbulb className="w-5 h-5" />,
      category: 'analyze'
    },
    {
      id: 'predictions',
      name: '预测分析',
      description: '预测未来7天的完成趋势',
      icon: <TrendingUp className="w-5 h-5" />,
      category: 'analyze'
    }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadStats();
    // 页面加载时恢复历史对话
    const savedMessages = loadMessagesFromStorage();
    if (savedMessages.length > 0) {
      setMessages(savedMessages);
    }

    // 加载对话列表
    loadConversations();
  }, []);

  // 加载对话列表
  const loadConversations = () => {
    const convs = ConversationManager.getConversations();
    setConversations(convs);

    // 加载当前对话
    const current = ConversationManager.getCurrentConversation();
    if (current) {
      setCurrentConversation(current);
    } else if (convs.length > 0) {
      // 如果没有当前对话但有对话列表，选择第一个
      setCurrentConversation(convs[0]);
      ConversationManager.setCurrentConversationId(convs[0].id);
    }
  };

  // 监听messages变化，自动保存到localStorage
  useEffect(() => {
    if (messages.length > 0) {
      saveMessagesToStorage(messages);
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadStats = async () => {
    try {
      const statsData = await aiService.getUsageStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load AI stats:', error);
    }
  };

  const loadRecommendations = async () => {
    try {
      setLoadingRecommendations(true);
      const data = await aiService.getRecommendations({ limit: 10 });
      setRecommendations(data);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      setRecommendations({ success: false, message: '加载推荐失败' });
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const loadPredictions = async () => {
    try {
      setLoadingPredictions(true);
      const data = await aiService.getPredictiveInsights();
      setPredictions(data);
    } catch (error) {
      console.error('Failed to load predictions:', error);
      setPredictions({ success: false, message: '加载预测失败' });
    } finally {
      setLoadingPredictions(false);
    }
  };

  // 对话管理函数
  const handleCreateNewConversation = () => {
    const newConv = ConversationManager.createConversation();
    setCurrentConversation(newConv);
    loadConversations();
  };

  const handleSwitchConversation = (convId: string) => {
    const conv = ConversationManager.switchConversation(convId);
    if (conv) {
      setCurrentConversation(conv);
    }
  };

  const handleDeleteConversation = (convId: string) => {
    ConversationManager.deleteConversation(convId);
    loadConversations();
  };

  const handleClearAllConversations = () => {
    if (confirm('确定要清空所有对话历史吗？')) {
      ConversationManager.clearAllConversations();
      setConversations([]);
      setCurrentConversation(null);
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || loading) return;

    try {
      setLoading(true);

      // 如果没有当前对话，创建一个
      let conv = currentConversation;
      if (!conv) {
        conv = ConversationManager.createConversation();
        setCurrentConversation(conv);
      }

      // 添加用户消息
      const userMessage = ConversationManager.addMessage(conv.id, {
        role: 'user',
        content: chatInput.trim()
      });

      // 清空输入框
      const question = chatInput.trim();
      setChatInput('');

      // 获取对话上下文
      const context = ConversationManager.getContext(conv.id);

      // 调用AI服务
      const response = await aiService.chat({
        question,
        conversationId: conv.id,
        context
      });

      // 添加AI回复
      ConversationManager.addMessage(conv.id, {
        role: 'assistant',
        content: response.answer,
        metadata: response.metadata
      });

      // 刷新对话列表
      loadConversations();
    } catch (error: any) {
      console.error('发送消息失败:', error);
      alert(error.response?.data?.message || '发送消息失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    alert('已复制到剪贴板');
  };

  const addMessage = (content: string, type: 'user' | 'ai', aiType?: string) => {
    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: new Date(),
      aiType
    };
    setMessages(prev => [...prev, message]);
    return message.id;
  };

  const updateMessage = (id: string, content: string, loading = false) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, content, loading } : msg
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 智能推荐和预测分析不需要输入文本
    if (selectedTool === 'recommendations') {
      await loadRecommendations();
      return;
    }
    
    if (selectedTool === 'predictions') {
      await loadPredictions();
      return;
    }
    
    if (!inputText.trim() || loading) return;

    const userInput = inputText.trim();
    setInputText('');
    
    // 添加用户消息
    addMessage(userInput, 'user');
    
    // 添加AI消息占位符
    const aiMessageId = addMessage('正在处理中...', 'ai', selectedTool);
    
    try {
      setLoading(true);
      let response: AIResponse;

      switch (selectedTool) {
        case 'generate':
          response = await aiService.generateText({
            prompt: userInput,
            type: generateType,
            maxLength: 500,
            source: 'assistant'
          });
          break;

        case 'rewrite':
          response = await aiService.rewriteText({
            text: userInput,
            style: rewriteStyle,
            tone: 'neutral',
            source: 'assistant'
          });
          break;

        case 'translate':
          response = await aiService.translateText({
            text: userInput,
            from: translateFrom,
            to: translateTo,
            source: 'assistant'
          });
          break;

        case 'summarize':
          response = await aiService.summarizeText({
            text: userInput,
            maxLength: 200,
            source: 'assistant'
          });
          break;

        case 'analyze':
          const analysisResponse = await aiService.analyzeText({
            text: userInput,
            analysisType
          });
          response = {
            result: JSON.stringify(analysisResponse.analysis, null, 2),
            timestamp: analysisResponse.timestamp
          };
          break;

        default:
          throw new Error('未知的AI工具类型');
      }

      updateMessage(aiMessageId, response.result);
      loadStats(); // 更新统计信息
    } catch (error: any) {
      console.error('AI request failed:', error);
      
      let errorMessage = '抱歉，处理请求时出现错误。请稍后重试。';
      
      // 提供更具体的错误信息
      if (error.response?.status === 401) {
        errorMessage = 'API密钥无效或已过期，请在设置页面检查您的API密钥配置。';
      } else if (error.response?.status === 403) {
        errorMessage = '用户未登录或认证失败，请先登录后再使用AI功能。';
      } else if (error.response?.status === 429) {
        errorMessage = '请求过于频繁，请稍后再试。';
      } else if (error.response?.status === 400) {
        errorMessage = '请求参数错误，请检查您的输入内容。';
      } else if (error.response?.status === 503) {
        errorMessage = 'AI服务暂时不可用，可能是API密钥配置问题或服务器负载过高，请稍后重试。';
      } else if (error.message?.includes('API密钥未配置')) {
        errorMessage = '请先在设置页面配置相应的API密钥。';
      } else if (error.message?.includes('网络')) {
        errorMessage = '网络连接错误，请检查网络连接后重试。';
      } else if (error.message) {
        errorMessage = `错误：${error.message}`;
      }
      
      updateMessage(aiMessageId, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('确定要清空聊天记录吗？')) {
      setMessages([]);
      // 同时清除localStorage中的历史记录
      localStorage.removeItem('ai_assistant_messages');
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 检查API密钥配置状态
  const checkAPIKeyStatus = () => {
    const config = getAIConfig();
    const hasAnyKey = Object.values(config.apiKeys).some(key => key && key.trim() !== '');
    return hasAnyKey;
  };

  const hasValidAPIKey = checkAPIKeyStatus();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full flex flex-col">
      {/* 顶部工具栏 */}
      <div className="flex-shrink-0 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI 助手</h1>
            <p className="text-gray-600">智能文本处理和生成工具</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.href = '/settings'}
            >
              <Settings className="w-4 h-4 mr-2" />
              设置
            </Button>
            <Button variant="outline" size="sm" onClick={loadStats}>
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新统计
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearChat}>
              <Trash2 className="w-4 h-4 mr-2" />
              清空对话
            </Button>
          </div>
        </div>

        {/* API密钥状态提示 */}
        {!hasValidAPIKey && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <Settings className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  请配置API密钥
                </p>
                <p className="text-sm text-yellow-700">
                  使用AI功能前，请先在
                  <button 
                    onClick={() => window.location.href = '/settings'}
                    className="mx-1 text-yellow-800 underline hover:text-yellow-900"
                  >
                    设置页面
                  </button>
                  配置相应的API密钥。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 统计信息 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">总请求数</p>
                    <p className="text-xl font-bold">{stats.totalRequests}</p>
                  </div>
                  <Zap className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">总Token数</p>
                    <p className="text-xl font-bold">{stats.totalTokens.toLocaleString()}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">本月请求</p>
                    <p className="text-xl font-bold">
                      {stats.monthlyUsage?.[0]?.requests || 0}
                    </p>
                  </div>
                  <Sparkles className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI工具选择 */}
        <div className="flex flex-wrap gap-2">
          {aiTools.map(tool => (
            <button
              key={tool.id}
              onClick={() => setSelectedTool(tool.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                selectedTool === tool.id
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tool.icon}
              <span className="text-sm font-medium">{tool.name}</span>
            </button>
          ))}
        </div>

        {/* 工具特定选项 */}
        <div className="mt-4 flex flex-wrap gap-4">
          {selectedTool === 'rewrite' && (
            <select
              value={rewriteStyle}
              onChange={(e) => setRewriteStyle(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="professional">专业风格</option>
              <option value="casual">随意风格</option>
              <option value="formal">正式风格</option>
              <option value="creative">创意风格</option>
              <option value="concise">简洁风格</option>
            </select>
          )}

          {selectedTool === 'generate' && (
            <select
              value={generateType}
              onChange={(e) => setGenerateType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="text">普通文本</option>
              <option value="note">笔记内容</option>
              <option value="todo">待办事项</option>
              <option value="summary">摘要</option>
            </select>
          )}

          {selectedTool === 'translate' && (
            <>
              <select
                value={translateFrom}
                onChange={(e) => setTranslateFrom(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="zh">中文</option>
                <option value="en">英文</option>
                <option value="ja">日文</option>
                <option value="ko">韩文</option>
              </select>
              <span className="text-gray-500">→</span>
              <select
                value={translateTo}
                onChange={(e) => setTranslateTo(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="en">英文</option>
                <option value="zh">中文</option>
                <option value="ja">日文</option>
                <option value="ko">韩文</option>
              </select>
            </>
          )}

          {selectedTool === 'analyze' && (
            <select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="sentiment">情感分析</option>
              <option value="keywords">关键词提取</option>
              <option value="topics">主题分析</option>
              <option value="readability">可读性分析</option>
            </select>
          )}
        </div>
      </div>

      {/* 聊天区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 智能问答界面（ChatGPT风格） */}
        {selectedTool === 'chat' && (
          <div className="flex h-[calc(100vh-250px)] border rounded-lg overflow-hidden bg-white -m-4">
            {/* 左侧对话列表 */}
            <div className="w-64 border-r flex flex-col bg-gray-50">
              {/* 新建对话按钮 */}
              <div className="p-3 border-b">
                <Button 
                  onClick={handleCreateNewConversation}
                  className="w-full"
                  size="sm"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  新建对话
                </Button>
              </div>

              {/* 对话列表 */}
              <div className="flex-1 overflow-y-auto p-2">
                {conversations.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm py-8">
                    <p>暂无对话</p>
                    <p className="text-xs mt-1">点击上方按钮开始新对话</p>
                  </div>
                ) : (
                  conversations.map(conv => (
                    <div
                      key={conv.id}
                      onClick={() => handleSwitchConversation(conv.id)}
                      className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors group ${
                        currentConversation?.id === conv.id
                          ? 'bg-blue-100 border border-blue-300'
                          : 'bg-white border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {conv.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {conv.messages.length} 条消息
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(conv.updatedAt).toLocaleDateString('zh-CN')}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConversation(conv.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                        >
                          <Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 清空历史按钮 */}
              {conversations.length > 0 && (
                <div className="p-3 border-t">
                  <Button
                    onClick={handleClearAllConversations}
                    variant="outline"
                    size="sm"
                    className="w-full text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    清空历史
                  </Button>
                </div>
              )}
            </div>

            {/* 右侧对话区域 */}
            <div className="flex-1 flex flex-col">
              {currentConversation ? (
                <>
                  {/* 对话标题 */}
                  <div className="p-4 border-b bg-white">
                    <h3 className="font-semibold text-lg">{currentConversation.title}</h3>
                    <p className="text-sm text-gray-500">
                      {currentConversation.messages.length} 条消息
                    </p>
                  </div>

                  {/* 消息列表 */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {currentConversation.messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <MessageSquare className="w-16 h-16 mb-4 text-gray-300" />
                        <p className="text-lg font-medium">开始新对话</p>
                        <p className="text-sm mt-2">您可以问我关于笔记、项目和待办事项的问题</p>
                        <div className="mt-6 space-y-2 text-sm">
                          <p className="text-gray-600">💡 示例问题：</p>
                          <ul className="space-y-1 text-gray-500">
                            <li>• 我最近的项目是什么？</li>
                            <li>• 有哪些高优先级的待办事项？</li>
                            <li>• 关于React的笔记在哪里？</li>
                            <li>• 本周完成了多少任务？</li>
                          </ul>
                        </div>
                      </div>
                    ) : (
                      currentConversation.messages.map(msg => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-4 ${
                              msg.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <div className="whitespace-pre-wrap break-words">
                              {msg.content}
                            </div>
                            <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                              <span>
                                {new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {msg.role === 'assistant' && (
                                <button
                                  onClick={() => handleCopyMessage(msg.content)}
                                  className="ml-2 hover:opacity-100"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            {msg.metadata && msg.role === 'assistant' && (
                              <div className="mt-2 pt-2 border-t border-gray-300 text-xs opacity-70">
                                <p>数据来源: {msg.metadata.dataSource?.join(', ') || '无'}</p>
                                <p>找到 {msg.metadata.itemsFound} 条数据</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* 输入框 */}
                  <div className="p-4 border-t bg-white">
                    <div className="flex gap-2">
                      <textarea
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendChatMessage();
                          }
                        }}
                        placeholder="输入您的问题... (Shift+Enter 换行)"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        disabled={loading}
                      />
                      <Button
                        onClick={handleSendChatMessage}
                        disabled={!chatInput.trim() || loading}
                        className="px-6"
                      >
                        {loading ? (
                          <Loading />
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      💡 提示：按 Enter 发送，Shift+Enter 换行
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <MessageSquare className="w-20 h-20 mb-4 text-gray-300" />
                  <p className="text-lg font-medium">欢迎使用智能问答</p>
                  <p className="text-sm mt-2">请选择一个对话或创建新对话开始</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 智能推荐显示区域 */}
        {selectedTool === 'recommendations' && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-yellow-500" />
                智能推荐
              </h2>
              <Button 
                onClick={loadRecommendations} 
                variant="outline" 
                size="sm"
                disabled={loadingRecommendations}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                刷新
              </Button>
            </div>
            
            {loadingRecommendations ? (
              <div className="flex items-center justify-center py-12">
                <Loading />
                <span className="ml-2">加载推荐中...</span>
              </div>
            ) : recommendations?.success && recommendations?.data?.recommendations ? (
              <div className="space-y-4">
                {/* 推荐依据信息 */}
                {recommendations.data.basis && (
                  <Card>
                    <CardContent className="p-4 bg-blue-50">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-900 mb-1">推荐依据</p>
                          <p className="text-blue-700">
                            高频标签: {recommendations.data.basis.topTags?.join(', ') || '无'} |
                            最近笔记: {recommendations.data.basis.recentNotesCount || 0}条 |
                            待办事项: {recommendations.data.basis.pendingTodosCount || 0}个
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* 推荐列表 */}
                {recommendations.data.recommendations.length > 0 ? (
                  <div className="grid gap-3">
                    {recommendations.data.recommendations.map((item: any, index: number) => (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {item.type === 'todo' ? (
                              <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                            ) : (
                              <FileText className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-medium text-gray-900 truncate">{item.title}</h3>
                                <span className="text-xs px-2 py-1 bg-gray-100 rounded whitespace-nowrap">
                                  {item.type === 'todo' ? '待办' : '笔记'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{item.reason}</p>
                              {item.priority && (
                                <div className="flex items-center gap-2 mt-2">
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    item.priority === 'high' || item.priority === '高' 
                                      ? 'bg-red-100 text-red-700'
                                      : item.priority === 'medium' || item.priority === '中'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-green-100 text-green-700'
                                  }`}>
                                    优先级: {item.priority}
                                  </span>
                                  {item.due_date && (
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(item.due_date).toLocaleDateString('zh-CN')}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                      <Lightbulb className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>暂无推荐内容</p>
                      <p className="text-sm mt-1">请先创建一些笔记或待办事项</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-red-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                  <p>{recommendations?.message || '加载推荐失败，请重试'}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* 预测分析显示区域 */}
        {selectedTool === 'predictions' && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-purple-500" />
                预测分析
              </h2>
              <Button 
                onClick={loadPredictions} 
                variant="outline" 
                size="sm"
                disabled={loadingPredictions}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                刷新
              </Button>
            </div>
            
            {loadingPredictions ? (
              <div className="flex items-center justify-center py-12">
                <Loading />
                <span className="ml-2">加载预测中...</span>
              </div>
            ) : predictions?.success && predictions?.data ? (
              <div className="space-y-4">
                {/* 数据不足提示 */}
                {predictions.data.insufficient_data && (
                  <Card>
                    <CardContent className="p-4 bg-yellow-50">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-yellow-900">数据不足</p>
                          <p className="text-yellow-700">近30天完成数据较少，预测结果仅供参考</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* 统计卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">近30天完成率</p>
                          <p className="text-2xl font-bold text-green-600">
                            {predictions.data.completion_rate_30d?.toFixed(1) || 0}%
                          </p>
                        </div>
                        <CheckCircle className="w-10 h-10 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">未来7天到期</p>
                          <p className="text-2xl font-bold text-orange-600">
                            {predictions.data.due_soon_count || 0}
                          </p>
                        </div>
                        <Calendar className="w-10 h-10 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* 未来7天预测 */}
                {predictions.data.forecast_7d && predictions.data.forecast_7d.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-3 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-purple-500" />
                        未来7天预测完成量
                      </h3>
                      <div className="space-y-2">
                        {predictions.data.forecast_7d.map((day: any, index: number) => (
                          <div key={index} className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 w-24">
                              {new Date(day.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                            </span>
                            <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full flex items-center justify-end pr-2"
                                style={{ width: `${Math.min(100, (day.expected_completed / 10) * 100)}%` }}
                              >
                                <span className="text-xs text-white font-medium">
                                  {day.expected_completed.toFixed(1)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-3">
                        * 预测基于近7天移动平均值
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-red-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                  <p>{predictions?.message || '加载预测失败，请重试'}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* 普通聊天消息 */}
        {selectedTool !== 'recommendations' && selectedTool !== 'predictions' && messages.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              欢迎使用 AI 助手
            </h3>
            <p className="text-gray-600 mb-4">
              选择一个AI工具，然后输入您的文本开始处理
            </p>
          </div>
        ) : selectedTool !== 'recommendations' && selectedTool !== 'predictions' ? (
          messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-3xl ${message.type === 'user' ? 'ml-12' : 'mr-12'}`}>
                <div
                  className={`p-4 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.loading ? (
                    <div className="flex items-center gap-2">
                      <Loading size="sm" />
                      <span>处理中...</span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                </div>
                
                <div className={`flex items-center gap-2 mt-2 text-xs text-gray-500 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}>
                  <span>{formatTimestamp(message.timestamp)}</span>
                  {message.aiType && (
                    <span className="px-2 py-1 bg-gray-200 rounded">
                      {aiTools.find(t => t.id === message.aiType)?.name}
                    </span>
                  )}
                  {message.type === 'ai' && !message.loading && (
                    <button
                      onClick={() => handleCopyMessage(message.content)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          {selectedTool === 'recommendations' || selectedTool === 'predictions' ? (
            <Button
              type="submit"
              className="w-full"
              disabled={loadingRecommendations || loadingPredictions}
              loading={loadingRecommendations || loadingPredictions}
            >
              {selectedTool === 'recommendations' ? (
                <>
                  <Lightbulb className="w-4 h-4 mr-2" />
                  获取智能推荐
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  获取预测分析
                </>
              )}
            </Button>
          ) : (
            <>
          <Input
            type="text"
            placeholder={`输入要${aiTools.find(t => t.id === selectedTool)?.name}的文本...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!inputText.trim() || loading}
            loading={loading}
          >
            <Send className="w-4 h-4" />
          </Button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
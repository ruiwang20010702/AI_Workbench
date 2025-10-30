import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Sparkles, FileText, Edit3, Languages, 
  BarChart3, Zap, Copy,
  Trash2, RefreshCw, Settings
} from 'lucide-react';
import { Button, Input, Card, CardContent, Loading } from '../../components/ui';
import { aiService, AIResponse } from '../../services/aiService';
import { getAIConfig } from '../../services/aiService';

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
  category: 'generate' | 'rewrite' | 'analyze' | 'translate';
}

export const AIAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedTool, setSelectedTool] = useState<string>('generate');
  const [loading, setLoading] = useState(false);
  const [rewriteStyle, setRewriteStyle] = useState<'formal' | 'casual' | 'professional' | 'creative' | 'concise'>('professional');
  const [generateType, setGenerateType] = useState<'text' | 'note' | 'todo' | 'summary'>('text');
  const [translateFrom, setTranslateFrom] = useState('zh');
  const [translateTo, setTranslateTo] = useState('en');
  const [analysisType, setAnalysisType] = useState<'sentiment' | 'keywords' | 'topics' | 'readability'>('sentiment');
  const [stats, setStats] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  }, []);

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

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
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
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              欢迎使用 AI 助手
            </h3>
            <p className="text-gray-600 mb-4">
              选择一个AI工具，然后输入您的文本开始处理
            </p>
          </div>
        ) : (
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
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
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
        </form>
      </div>
    </div>
  );
};
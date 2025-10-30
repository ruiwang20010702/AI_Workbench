import React, { useState, useEffect } from 'react';
import { 
  User, Bell, Shield, Palette, Globe, 
  Save, RefreshCw, Download, Upload,
  Trash2, Key, Eye, EyeOff, Bot, Check
} from 'lucide-react';
import { Button, Input, Card, CardContent } from '../components/ui';
import { useAuth } from '../hooks/useAuth';

interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  maxTokens: number;
}

interface UserSettings {
  profile: {
    name: string;
    email: string;
    avatar?: string;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: 'zh' | 'en';
    timezone: string;
    dateFormat: string;
  };
  notifications: {
    email: boolean;
    push: boolean;
    reminders: boolean;
    updates: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    dataSharing: boolean;
    analytics: boolean;
  };
  ai: {
    apiKeys: {
      openai: string;
      siliconflow: string;
      anthropic: string;
      gemini: string;
    };
    selectedModel: string;
    models: AIModel[];
  };
}

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState({
    openai: false,
    siliconflow: false,
    anthropic: false,
    gemini: false
  });

  // 可用的AI模型列表
  const availableModels: AIModel[] = [
    {
      id: 'moonshotai/Kimi-K2-Instruct-0905',
      name: 'Kimi K2 Instruct',
      provider: 'SiliconFlow',
      description: 'Moonshot AI的Kimi模型，支持长文本处理',
      maxTokens: 200000
    },
    {
      id: 'deepseek-ai/DeepSeek-R1',
      name: 'DeepSeek R1',
      provider: 'SiliconFlow',
      description: 'DeepSeek最新推理模型，逻辑推理能力强',
      maxTokens: 65536
    },
    {
      id: 'deepseek-ai/DeepSeek-V3.1-Terminus',
      name: 'DeepSeek V3.1 Terminus',
      provider: 'SiliconFlow',
      description: 'DeepSeek V3.1终端版本，综合能力优秀',
      maxTokens: 65536
    }
  ];

  const [settings, setSettings] = useState<UserSettings>({
    profile: {
      name: user?.name || '',
      email: user?.email || '',
      avatar: user?.avatar
    },
    preferences: {
      theme: 'system',
      language: 'zh',
      timezone: 'Asia/Shanghai',
      dateFormat: 'YYYY-MM-DD'
    },
    notifications: {
      email: true,
      push: true,
      reminders: true,
      updates: false
    },
    privacy: {
      profileVisibility: 'private',
      dataSharing: false,
      analytics: true
    },
    ai: {
      apiKeys: {
        openai: localStorage.getItem('openai_api_key') || '',
        siliconflow: localStorage.getItem('siliconflow_api_key') || '',
        anthropic: localStorage.getItem('anthropic_api_key') || '',
        gemini: localStorage.getItem('gemini_api_key') || ''
      },
      selectedModel: localStorage.getItem('selected_ai_model') || 'moonshotai/Kimi-K2-Instruct-0905',
      models: availableModels
    }
  });

  // 从localStorage加载设置
  useEffect(() => {
    const savedSettings = localStorage.getItem('user_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // 验证必要的设置
      if (!settings.profile.name.trim()) {
        alert('请输入姓名');
        return;
      }
      
      if (!settings.profile.email.trim()) {
        alert('请输入邮箱');
        return;
      }
      
      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(settings.profile.email)) {
        alert('请输入有效的邮箱地址');
        return;
      }
      
      // 保存到localStorage
      localStorage.setItem('user_settings', JSON.stringify(settings));
      
      // 保存API密钥
      Object.entries(settings.ai.apiKeys).forEach(([provider, key]) => {
        if (key) {
          localStorage.setItem(`${provider}_api_key`, key);
        } else {
          localStorage.removeItem(`${provider}_api_key`);
        }
      });
      
      // 保存选中的模型
      localStorage.setItem('selected_ai_model', settings.ai.selectedModel);
      
      // 这里应该调用API保存设置到服务器
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟API调用
      console.log('Settings saved:', settings);
      alert('设置保存成功！');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('保存设置失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const toggleApiKeyVisibility = (provider: keyof typeof showApiKeys) => {
    setShowApiKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const handleApiKeyChange = (provider: keyof UserSettings['ai']['apiKeys'], value: string) => {
    setSettings(prev => ({
      ...prev,
      ai: {
        ...prev.ai,
        apiKeys: {
          ...prev.ai.apiKeys,
          [provider]: value
        }
      }
    }));
  };

  const handleModelSelect = (modelId: string) => {
    setSettings(prev => ({
      ...prev,
      ai: {
        ...prev.ai,
        selectedModel: modelId
      }
    }));
  };

  const maskApiKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '*'.repeat(key.length);
    return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'user-settings.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          // 验证导入的数据结构
          if (importedSettings && typeof importedSettings === 'object' && 
              importedSettings.profile && importedSettings.preferences && 
              importedSettings.notifications && importedSettings.privacy && 
              importedSettings.ai) {
            setSettings(importedSettings);
            alert('设置导入成功！');
          } else {
            alert('导入失败：文件格式不正确');
          }
        } catch (error) {
          console.error('Failed to import settings:', error);
          alert('导入失败：文件格式错误或损坏');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">设置</h1>
        <p className="text-gray-600">管理您的账户设置和偏好</p>
      </div>

      <div className="space-y-6">
        {/* 个人资料 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5" />
              <h2 className="text-xl font-semibold">个人资料</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  姓名
                </label>
                <Input
                  type="text"
                  value={settings.profile.name}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    profile: { ...prev.profile, name: e.target.value }
                  }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  邮箱
                </label>
                <Input
                  type="email"
                  value={settings.profile.email}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    profile: { ...prev.profile, email: e.target.value }
                  }))}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                头像URL
              </label>
              <Input
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value={settings.profile.avatar || ''}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  profile: { ...prev.profile, avatar: e.target.value }
                }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* 偏好设置 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5" />
              <h2 className="text-xl font-semibold">偏好设置</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  主题
                </label>
                <select
                  value={settings.preferences.theme}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, theme: e.target.value as any }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="light">浅色</option>
                  <option value="dark">深色</option>
                  <option value="system">跟随系统</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  语言
                </label>
                <select
                  value={settings.preferences.language}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, language: e.target.value as any }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="zh">中文</option>
                  <option value="en">English</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  时区
                </label>
                <select
                  value={settings.preferences.timezone}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, timezone: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Asia/Shanghai">北京时间 (UTC+8)</option>
                  <option value="America/New_York">纽约时间 (UTC-5)</option>
                  <option value="Europe/London">伦敦时间 (UTC+0)</option>
                  <option value="Asia/Tokyo">东京时间 (UTC+9)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  日期格式
                </label>
                <select
                  value={settings.preferences.dateFormat}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, dateFormat: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="YYYY-MM-DD">2024-01-01</option>
                  <option value="MM/DD/YYYY">01/01/2024</option>
                  <option value="DD/MM/YYYY">01/01/2024</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 通知设置 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5" />
              <h2 className="text-xl font-semibold">通知设置</h2>
            </div>
            
            <div className="space-y-4">
              {Object.entries(settings.notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {key === 'email' && '邮件通知'}
                      {key === 'push' && '推送通知'}
                      {key === 'reminders' && '提醒通知'}
                      {key === 'updates' && '更新通知'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {key === 'email' && '接收重要邮件通知'}
                      {key === 'push' && '接收浏览器推送通知'}
                      {key === 'reminders' && '接收待办事项提醒'}
                      {key === 'updates' && '接收产品更新通知'}
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, [key]: e.target.checked }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 隐私设置 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5" />
              <h2 className="text-xl font-semibold">隐私设置</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">个人资料可见性</div>
                  <div className="text-sm text-gray-600">控制其他用户是否可以查看您的个人资料</div>
                </div>
                <select
                  value={settings.privacy.profileVisibility}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    privacy: { ...prev.privacy, profileVisibility: e.target.value as any }
                  }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="public">公开</option>
                  <option value="private">私密</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">数据共享</div>
                  <div className="text-sm text-gray-600">允许与第三方服务共享匿名数据</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.privacy.dataSharing}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, dataSharing: e.target.checked }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">使用分析</div>
                  <div className="text-sm text-gray-600">帮助我们改进产品体验</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.privacy.analytics}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, analytics: e.target.checked }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI设置 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="w-5 h-5" />
              <h2 className="text-xl font-semibold">AI设置</h2>
            </div>
            
            {/* API密钥管理 */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Key className="w-4 h-4" />
                <h3 className="text-lg font-medium">API密钥管理</h3>
              </div>
              <div className="space-y-4">
                {Object.entries(settings.ai.apiKeys).map(([provider, key]) => (
                  <div key={provider} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {provider === 'openai' && 'OpenAI API Key'}
                      {provider === 'siliconflow' && 'SiliconFlow API Key'}
                      {provider === 'anthropic' && 'Anthropic API Key'}
                      {provider === 'gemini' && 'Google Gemini API Key'}
                    </label>
                    <div className="relative">
                      <Input
                        type={showApiKeys[provider as keyof typeof showApiKeys] ? 'text' : 'password'}
                        value={showApiKeys[provider as keyof typeof showApiKeys] ? key : maskApiKey(key)}
                        onChange={(e) => handleApiKeyChange(provider as keyof UserSettings['ai']['apiKeys'], e.target.value)}
                        placeholder={`请输入${provider.toUpperCase()} API密钥`}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => toggleApiKeyVisibility(provider as keyof typeof showApiKeys)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showApiKeys[provider as keyof typeof showApiKeys] ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      {provider === 'openai' && '用于访问GPT系列模型'}
                      {provider === 'siliconflow' && '用于访问国产AI模型'}
                      {provider === 'anthropic' && '用于访问Claude系列模型'}
                      {provider === 'gemini' && '用于访问Google AI模型'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI模型选择 */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-4 h-4" />
                <h3 className="text-lg font-medium">AI模型选择</h3>
              </div>
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">
                  当前选择: <span className="font-medium text-gray-900">
                    {availableModels.find(m => m.id === settings.ai.selectedModel)?.name || '未选择'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableModels.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => handleModelSelect(model.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      settings.ai.selectedModel === model.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{model.name}</h4>
                          {settings.ai.selectedModel === model.id && (
                            <Check className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mb-1">{model.provider}</div>
                        <div className="text-xs text-gray-600 mb-2">{model.description}</div>
                        <div className="text-xs text-gray-500">
                          最大令牌: {model.maxTokens.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-sm text-yellow-800">
                  <strong>注意:</strong> 使用不同的AI模型需要相应的API密钥。请确保已配置所选模型对应的API密钥。
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 数据管理 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5" />
              <h2 className="text-xl font-semibold">数据管理</h2>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" onClick={handleExportData}>
                <Download className="w-4 h-4 mr-2" />
                导出数据
              </Button>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  导入数据
                </Button>
              </div>
              
              <Button variant="outline" className="text-red-600 hover:text-red-700">
                <Trash2 className="w-4 h-4 mr-2" />
                删除所有数据
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 保存按钮 */}
        <div className="flex justify-end gap-4">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            重置
          </Button>
          <Button onClick={handleSaveSettings} loading={loading}>
            <Save className="w-4 h-4 mr-2" />
            保存设置
          </Button>
        </div>
      </div>
    </div>
  );
};
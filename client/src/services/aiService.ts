import { apiClient } from './apiClient';

// AI配置管理
export interface AIConfig {
  selectedModel: string;
  apiKeys: {
    openai: string;
    siliconflow: string;
    anthropic: string;
    gemini: string;
  };
}

// 获取AI配置
export const getAIConfig = (): AIConfig => {
  return {
    selectedModel: localStorage.getItem('selected_ai_model') || 'moonshotai/Kimi-K2-Instruct-0905',
    apiKeys: {
      openai: localStorage.getItem('openai_api_key') || '',
      siliconflow: localStorage.getItem('siliconflow_api_key') || '',
      anthropic: localStorage.getItem('anthropic_api_key') || '',
      gemini: localStorage.getItem('gemini_api_key') || ''
    }
  };
};

// 保存AI配置
export const saveAIConfig = (config: AIConfig): void => {
  localStorage.setItem('selected_ai_model', config.selectedModel);
  Object.entries(config.apiKeys).forEach(([provider, key]) => {
    if (key) {
      localStorage.setItem(`${provider}_api_key`, key);
    } else {
      localStorage.removeItem(`${provider}_api_key`);
    }
  });
};

// 根据模型获取对应的API密钥
export const getApiKeyForModel = (modelId: string): string => {
  const config = getAIConfig();
  
  if (modelId.startsWith('gpt-') || modelId.includes('openai')) {
    return config.apiKeys.openai;
  } else if (modelId.includes('claude')) {
    return config.apiKeys.anthropic;
  } else if (modelId.includes('gemini')) {
    return config.apiKeys.gemini;
  } else if (modelId.includes('qwen') || modelId.includes('deepseek') || modelId.includes('moonshotai')) {
    return config.apiKeys.siliconflow;
  }
  
  return config.apiKeys.siliconflow; // 默认使用SiliconFlow
};

export interface AIGenerateRequest {
  prompt: string;
  type: 'text' | 'note' | 'todo' | 'summary';
  context?: string;
  maxLength?: number;
  temperature?: number;
  model?: string; // 添加模型参数
  source?: 'assistant' | 'editor' | 'notes' | 'todos' | 'other';
}

export interface AIRewriteRequest {
  text: string;
  style: 'formal' | 'casual' | 'professional' | 'creative' | 'concise';
  tone?: 'friendly' | 'neutral' | 'serious' | 'enthusiastic';
  language?: 'zh' | 'en';
  model?: string; // 添加模型参数
  source?: 'assistant' | 'editor' | 'notes' | 'todos' | 'other';
}

export interface AISummarizeRequest {
  text: string;
  maxLength?: number;
  language?: 'zh' | 'en';
  model?: string; // 添加模型参数
  source?: 'assistant' | 'editor' | 'notes' | 'todos' | 'other';
}

export interface AITranslateRequest {
  text: string;
  from: string;
  to: string;
  model?: string; // 添加模型参数
  source?: 'assistant' | 'editor' | 'notes' | 'todos' | 'other';
}

export interface AIResponse {
  result: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
  timestamp: string;
}

export interface AIAnalyzeRequest {
  text: string;
  analysisType: 'sentiment' | 'keywords' | 'topics' | 'readability';
  model?: string; // 添加模型参数
}

export interface AIAnalyzeResponse {
  analysis: {
    sentiment?: {
      score: number;
      label: 'positive' | 'negative' | 'neutral';
      confidence: number;
    };
    keywords?: string[];
    topics?: string[];
    readability?: {
      score: number;
      level: string;
      suggestions: string[];
    };
  };
  timestamp: string;
}



export interface AIOptimizeRequest {
  text: string;
  optimizationType: 'grammar' | 'clarity' | 'conciseness' | 'engagement';
  targetAudience?: string;
  model?: string; // 添加模型参数
}

export const aiService = {
  // 文本生成
  async generateText(request: AIGenerateRequest): Promise<AIResponse> {
    const config = getAIConfig();
    const model = request.model || config.selectedModel;
    const apiKey = getApiKeyForModel(model);
    
    const requestWithConfig = {
      ...request,
      model,
      apiKey
    };
    
    const response = await apiClient.post('/ai/generate', requestWithConfig);
    const backendData = response.data;
    
    return {
      result: backendData.data?.generated_text || backendData.data?.summary || backendData.data?.rewritten_text || backendData.data?.translated_text || '',
      usage: backendData.data?.usage ? {
        promptTokens: backendData.data.usage.prompt_tokens,
        completionTokens: backendData.data.usage.completion_tokens,
        totalTokens: backendData.data.usage.total_tokens
      } : undefined,
      model: backendData.data?.model || model,
      timestamp: new Date().toISOString()
    };
  },

  /**
   * 获取智能推荐
   *
   * 调用后端 `/ai/recommendations` 接口，返回基于标签频次、Todo优先级与到期时间的启发式推荐列表。
   * @param params 可选查询参数，例如 `limit` 返回条数（默认10，最大50）
   * @returns 推荐数据，包含推荐项与依据信息
   */
  async getRecommendations(params?: { limit?: number }): Promise<{
    success: boolean;
    message: string;
    data: {
      recommendations: Array<{
        type: 'todo' | 'note';
        id: string;
        title: string;
        reason: string;
        score: number;
        priority?: string;
        due_date?: string | null;
      }>;
      basis: {
        topTags: string[];
        recentNotesCount: number;
        pendingTodosCount: number;
      };
    };
  }> {
    const response = await apiClient.get('/ai/recommendations', { params });
    return response.data;
  },

  /**
   * 获取轻量预测分析
   *
   * 调用后端 `/ai/predict` 接口，返回近30天的完成率、未来7天的完成量预测以及未来7天到期未完成的数量。
   * @returns 预测分析结构化数据
   */
  async getPredictiveInsights(): Promise<{
    success: boolean;
    message: string;
    data: {
      completion_rate_30d: number;
      due_soon_count: number;
      forecast_7d: Array<{ date: string; expected_completed: number }>;
      insufficient_data?: boolean;
    };
  }> {
    const response = await apiClient.get('/ai/predict');
    return response.data;
  },

  // 文本改写
  async rewriteText(request: AIRewriteRequest): Promise<AIResponse> {
    const config = getAIConfig();
    const model = request.model || config.selectedModel;
    const apiKey = getApiKeyForModel(model);
    
    const requestWithConfig = {
      ...request,
      model,
      apiKey
    };
    
    const response = await apiClient.post('/ai/rewrite', requestWithConfig);
    const backendData = response.data;
    
    return {
      result: backendData.data?.rewritten_text || '',
      usage: backendData.data?.usage ? {
        promptTokens: backendData.data.usage.prompt_tokens,
        completionTokens: backendData.data.usage.completion_tokens,
        totalTokens: backendData.data.usage.total_tokens
      } : undefined,
      model: backendData.data?.model || model,
      timestamp: new Date().toISOString()
    };
  },

  // 文本摘要
  async summarizeText(request: AISummarizeRequest): Promise<AIResponse> {
    const config = getAIConfig();
    const model = request.model || config.selectedModel;
    const apiKey = getApiKeyForModel(model);
    
    const requestWithConfig = {
      ...request,
      model,
      apiKey
    };
    
    const response = await apiClient.post('/ai/summarize', requestWithConfig);
    const backendData = response.data;
    
    return {
      result: backendData.data?.summary || '',
      usage: backendData.data?.usage ? {
        promptTokens: backendData.data.usage.prompt_tokens,
        completionTokens: backendData.data.usage.completion_tokens,
        totalTokens: backendData.data.usage.total_tokens
      } : undefined,
      model: backendData.data?.model || model,
      timestamp: new Date().toISOString()
    };
  },

  // 文本翻译
  async translateText(request: AITranslateRequest): Promise<AIResponse> {
    const config = getAIConfig();
    const model = request.model || config.selectedModel;
    const apiKey = getApiKeyForModel(model);
    
    const requestWithConfig = {
      ...request,
      model,
      apiKey
    };
    
    const response = await apiClient.post('/ai/translate', requestWithConfig);
    const backendData = response.data;
    
    return {
      result: backendData.data?.translated_text || '',
      usage: backendData.data?.usage ? {
        promptTokens: backendData.data.usage.prompt_tokens,
        completionTokens: backendData.data.usage.completion_tokens,
        totalTokens: backendData.data.usage.total_tokens
      } : undefined,
      model: backendData.data?.model || model,
      timestamp: new Date().toISOString()
    };
  },

  // 文本分析
  async analyzeText(request: AIAnalyzeRequest): Promise<AIAnalyzeResponse> {
    const config = getAIConfig();
    const model = request.model || config.selectedModel;
    const apiKey = getApiKeyForModel(model);
    
    const requestWithConfig = {
      ...request,
      model,
      apiKey
    };
    
    const response = await apiClient.post('/ai/analyze', requestWithConfig);
    const backendData = response.data;
    
    return {
      analysis: backendData.data?.analysis || {},
      timestamp: new Date().toISOString()
    };
  },



  // 文本优化
  async optimizeText(request: AIOptimizeRequest): Promise<AIResponse> {
    const config = getAIConfig();
    const model = request.model || config.selectedModel;
    const apiKey = getApiKeyForModel(model);
    
    const requestWithConfig = {
      ...request,
      model,
      apiKey
    };
    
    const response = await apiClient.post('/ai/optimize', requestWithConfig);
    const backendData = response.data;
    
    return {
      result: backendData.data?.optimized_text || '',
      usage: backendData.data?.usage ? {
        promptTokens: backendData.data.usage.prompt_tokens,
        completionTokens: backendData.data.usage.completion_tokens,
        totalTokens: backendData.data.usage.total_tokens
      } : undefined,
      model: backendData.data?.model || model,
      timestamp: new Date().toISOString()
    };
  },

  // 智能建议
  async getSuggestions(text: string, context?: string): Promise<{
    suggestions: string[];
    improvements: string[];
    relatedTopics: string[];
  }> {
    const config = getAIConfig();
    const model = config.selectedModel;
    const apiKey = getApiKeyForModel(model);
    
    const requestWithConfig = {
      text,
      context,
      model,
      apiKey
    };
    
    const response = await apiClient.post('/ai/suggestions', requestWithConfig);
    return response.data;
  },

  // 批量处理
  async batchProcess(requests: Array<{
    id: string;
    type: 'generate' | 'rewrite' | 'summarize' | 'translate';
    data: any;
  }>): Promise<Array<{
    id: string;
    result: AIResponse;
    error?: string;
  }>> {
    const config = getAIConfig();
    const model = config.selectedModel;
    const apiKey = getApiKeyForModel(model);
    
    const requestWithConfig = {
      requests,
      model,
      apiKey
    };
    
    const response = await apiClient.post('/ai/batch', requestWithConfig);
    return response.data;
  },

  // 获取AI使用统计
  async getUsageStats(): Promise<{
    totalRequests: number;
    totalTokens: number;
    requestsByType: Record<string, number>;
    monthlyUsage: Array<{
      month: string;
      requests: number;
      tokens: number;
    }>;
  }> {
    const response = await apiClient.get('/ai/stats');
    return response.data;
  },

  // 获取支持的语言列表
  async getSupportedLanguages(): Promise<Array<{
    code: string;
    name: string;
    nativeName: string;
  }>> {
    const response = await apiClient.get('/ai/languages');
    return response.data;
  },

  // 获取可用的AI模型
  async getAvailableModels(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    capabilities: string[];
    maxTokens: number;
  }>> {
    const response = await apiClient.get('/ai/models');
    return response.data;
  },

  // 获取AI使用历史记录
  async getUsageHistory(params?: {
    limit?: number;
    offset?: number;
    action_type?: string;
  }): Promise<{
    logs: Array<{
      id: string;
      user_id: string;
      action_type: string;
      model_name: string;
      input_tokens: number;
      output_tokens: number;
      cost_cents: number;
      created_at: string;
    }>;
  }> {
    const response = await apiClient.get('/ai/usage/history', { params });
    return response.data.data;
  },

  // 获取最近的AI使用记录
  async getRecentUsage(limit: number = 10): Promise<{
    logs: Array<{
      id: string;
      user_id: string;
      action_type: string;
      model_name: string;
      input_tokens: number;
      output_tokens: number;
      cost_cents: number;
      created_at: string;
    }>;
  }> {
    const response = await apiClient.get('/ai/usage/recent', { 
      params: { limit } 
    });
    return response.data.data;
  }
};
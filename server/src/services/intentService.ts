import { AIService } from './aiService';

/**
 * 意图识别结果
 */
export interface IntentResult {
  type: 'query_notes' | 'query_projects' | 'query_todos' | 'statistics' | 'general';
  filters: {
    timeRange?: 'recent' | 'today' | 'week' | 'month';
    priority?: 'low' | 'medium' | 'high';
    status?: string;
    tags?: string[];
    keyword?: string;
  };
  confidence?: number;
}

interface AIConfig {
  model?: string;
  apiKey?: string;
}

/**
 * 意图识别服务
 * 使用AI模型识别用户问题的意图和过滤条件
 */
export class IntentService {
  /**
   * 识别用户问题的意图
   * @param question 用户问题
   * @param config AI配置（可选）
   * @returns 意图识别结果
   */
  static async recognizeIntent(
    question: string,
    config?: AIConfig
  ): Promise<IntentResult> {
    try {
      // 构建意图识别的prompt
      const prompt = this.buildIntentPrompt(question);

      // 调用AI服务
      const response = await AIService.generateText({
        prompt,
        type: 'generate',
        maxLength: 500,
        ...config
      });

      // 解析AI返回的JSON结果
      const result = this.parseIntentResponse(response.data.generated_text);

      return result;
    } catch (error: any) {
      console.error('意图识别错误:', error);
      
      // 如果识别失败，返回general类型
      return {
        type: 'general',
        filters: {}
      };
    }
  }

  /**
   * 构建意图识别的prompt
   */
  private static buildIntentPrompt(question: string): string {
    return `你是一个意图识别助手。分析用户问题，识别意图类型和过滤条件。

意图类型：
- query_notes: 查询笔记（例如："关于React的笔记"、"我的学习笔记"、"最近的笔记"）
- query_projects: 查询项目（例如："我最近的项目"、"进行中的项目"、"高优先级项目"）
- query_todos: 查询待办（例如："高优先级的任务"、"未完成的待办"、"本周的任务"）
- statistics: 统计分析（例如："本周完成了多少任务"、"项目完成率"、"待办统计"）
- general: 一般对话（例如："你好"、"谢谢"、"你能做什么"）

时间范围：
- recent: 最近的（默认7天）
- today: 今天
- week: 本周
- month: 本月

优先级：
- low: 低优先级
- medium: 中优先级
- high: 高优先级

状态（待办）：
- 未开始
- 进行中
- 已完成

状态（项目）：
- planning: 计划中
- active: 进行中
- completed: 已完成
- paused: 已暂停
- cancelled: 已取消

请严格按照以下JSON格式返回，不要包含任何其他文字：
{
  "type": "意图类型",
  "filters": {
    "timeRange": "时间范围（可选）",
    "priority": "优先级（可选）",
    "status": "状态（可选）",
    "tags": ["标签1", "标签2"]（可选）,
    "keyword": "关键词（可选）"
  }
}

用户问题：${question}

请返回JSON：`;
  }

  /**
   * 解析AI返回的意图识别结果
   */
  private static parseIntentResponse(response: string): IntentResult {
    try {
      // 尝试提取JSON部分
      let jsonStr = response.trim();
      
      // 如果响应包含markdown代码块，提取其中的JSON
      const jsonMatch = jsonStr.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      
      // 如果没有代码块，尝试直接查找JSON对象
      if (!jsonMatch) {
        const directJsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (directJsonMatch) {
          jsonStr = directJsonMatch[0];
        }
      }

      const parsed = JSON.parse(jsonStr);

      // 验证和规范化结果
      const result: IntentResult = {
        type: this.validateIntentType(parsed.type),
        filters: this.normalizeFilters(parsed.filters || {})
      };

      return result;
    } catch (error) {
      console.error('解析意图识别结果失败:', error);
      console.error('原始响应:', response);
      
      // 如果解析失败，尝试基于关键词的简单识别
      return this.fallbackIntentRecognition(response);
    }
  }

  /**
   * 验证意图类型
   */
  private static validateIntentType(type: string): IntentResult['type'] {
    const validTypes: IntentResult['type'][] = [
      'query_notes',
      'query_projects',
      'query_todos',
      'statistics',
      'general'
    ];

    if (validTypes.includes(type as any)) {
      return type as IntentResult['type'];
    }

    return 'general';
  }

  /**
   * 规范化过滤条件
   */
  private static normalizeFilters(filters: any): IntentResult['filters'] {
    const normalized: IntentResult['filters'] = {};

    // 时间范围
    if (filters.timeRange) {
      const validTimeRanges = ['recent', 'today', 'week', 'month'];
      if (validTimeRanges.includes(filters.timeRange)) {
        normalized.timeRange = filters.timeRange;
      }
    }

    // 优先级
    if (filters.priority) {
      const validPriorities = ['low', 'medium', 'high'];
      if (validPriorities.includes(filters.priority)) {
        normalized.priority = filters.priority;
      }
    }

    // 状态
    if (filters.status && typeof filters.status === 'string') {
      normalized.status = filters.status;
    }

    // 标签
    if (Array.isArray(filters.tags) && filters.tags.length > 0) {
      normalized.tags = filters.tags.filter((tag: any) => typeof tag === 'string');
    }

    // 关键词
    if (filters.keyword && typeof filters.keyword === 'string') {
      normalized.keyword = filters.keyword.trim();
    }

    return normalized;
  }

  /**
   * 备用意图识别（基于关键词）
   * 当AI解析失败时使用
   */
  private static fallbackIntentRecognition(question: string): IntentResult {
    const lowerQuestion = question.toLowerCase();

    // 识别意图类型
    let type: IntentResult['type'] = 'general';
    const filters: IntentResult['filters'] = {};

    // 笔记相关关键词
    if (
      lowerQuestion.includes('笔记') ||
      lowerQuestion.includes('note') ||
      lowerQuestion.includes('记录')
    ) {
      type = 'query_notes';
    }
    // 项目相关关键词
    else if (
      lowerQuestion.includes('项目') ||
      lowerQuestion.includes('project')
    ) {
      type = 'query_projects';
    }
    // 待办相关关键词
    else if (
      lowerQuestion.includes('待办') ||
      lowerQuestion.includes('任务') ||
      lowerQuestion.includes('todo') ||
      lowerQuestion.includes('task')
    ) {
      type = 'query_todos';
    }
    // 统计相关关键词
    else if (
      lowerQuestion.includes('多少') ||
      lowerQuestion.includes('统计') ||
      lowerQuestion.includes('完成率') ||
      lowerQuestion.includes('数量')
    ) {
      type = 'statistics';
    }

    // 识别时间范围
    if (lowerQuestion.includes('今天') || lowerQuestion.includes('today')) {
      filters.timeRange = 'today';
    } else if (
      lowerQuestion.includes('本周') ||
      lowerQuestion.includes('这周') ||
      lowerQuestion.includes('week')
    ) {
      filters.timeRange = 'week';
    } else if (
      lowerQuestion.includes('本月') ||
      lowerQuestion.includes('这个月') ||
      lowerQuestion.includes('month')
    ) {
      filters.timeRange = 'month';
    } else if (
      lowerQuestion.includes('最近') ||
      lowerQuestion.includes('recent')
    ) {
      filters.timeRange = 'recent';
    }

    // 识别优先级
    if (
      lowerQuestion.includes('高优先级') ||
      lowerQuestion.includes('重要') ||
      lowerQuestion.includes('high')
    ) {
      filters.priority = 'high';
    } else if (
      lowerQuestion.includes('中优先级') ||
      lowerQuestion.includes('medium')
    ) {
      filters.priority = 'medium';
    } else if (
      lowerQuestion.includes('低优先级') ||
      lowerQuestion.includes('low')
    ) {
      filters.priority = 'low';
    }

    // 识别状态
    if (
      lowerQuestion.includes('未完成') ||
      lowerQuestion.includes('进行中') ||
      lowerQuestion.includes('active')
    ) {
      filters.status = '进行中';
    } else if (
      lowerQuestion.includes('已完成') ||
      lowerQuestion.includes('completed')
    ) {
      filters.status = '已完成';
    }

    // 提取关键词（移除常见词汇）
    const commonWords = [
      '我的', '我', '有', '哪些', '什么', '吗', '呢', '啊', '吧',
      '的', '了', '是', '在', '和', '与', '或', '及',
      '关于', '查询', '查看', '显示', '列出',
      'my', 'what', 'show', 'list', 'display'
    ];
    
    const words = question.split(/\s+/);
    const keywords = words.filter(
      word => word.length > 1 && !commonWords.includes(word.toLowerCase())
    );
    
    if (keywords.length > 0 && type !== 'general') {
      filters.keyword = keywords.join(' ');
    }

    return { type, filters };
  }
}


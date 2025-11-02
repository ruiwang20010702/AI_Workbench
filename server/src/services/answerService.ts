import { AIService } from './aiService';

interface ConversationContext {
  role: 'user' | 'assistant';
  content: string;
}

interface AIConfig {
  model?: string;
  apiKey?: string;
}

/**
 * 回答生成服务
 * 基于用户问题和检索到的数据生成自然语言回答
 */
export class AnswerService {
  /**
   * 生成自然语言回答
   * @param question 用户问题
   * @param dataContext 检索到的数据上下文
   * @param conversationHistory 对话历史（可选，最近3轮）
   * @param config AI配置（可选）
   * @returns 自然语言回答
   */
  static async generateAnswer(
    question: string,
    dataContext: string,
    conversationHistory?: ConversationContext[],
    config?: AIConfig
  ): Promise<string> {
    try {
      // 构建回答生成的prompt
      const prompt = this.buildAnswerPrompt(
        question,
        dataContext,
        conversationHistory
      );

      // 调用AI服务
      const response = await AIService.generateText({
        prompt,
        type: 'generate',
        maxLength: 2000,
        ...config
      });

      // 返回生成的回答
      return response.data.generated_text.trim();
    } catch (error: any) {
      console.error('回答生成错误:', error);
      throw new Error(`生成回答失败: ${error.message}`);
    }
  }

  /**
   * 构建回答生成的prompt
   */
  private static buildAnswerPrompt(
    question: string,
    dataContext: string,
    conversationHistory?: ConversationContext[]
  ): string {
    let prompt = `你是AI Workbench的智能助手，帮助用户管理笔记、项目和待办事项。

【重要规则】
1. 准确性：严格基于提供的用户数据回答，不要编造或推测不存在的信息
2. 简洁性：突出重点，避免冗长，使用清晰的结构
3. 友好性：使用自然、友好、鼓励的语气
4. 结构化：使用列表、编号等方式组织信息，便于阅读
5. 完整性：如果数据不完整，说明情况；如果没有找到数据，礼貌地告知用户

`;

    // 添加对话历史（如果有）
    if (conversationHistory && conversationHistory.length > 0) {
      prompt += `【对话历史】\n`;
      conversationHistory.forEach((msg, index) => {
        const role = msg.role === 'user' ? '用户' : 'AI';
        prompt += `${role}: ${msg.content}\n`;
      });
      prompt += `\n`;
    }

    // 添加用户数据
    if (dataContext && dataContext.trim()) {
      prompt += `【用户数据】\n${dataContext}\n\n`;
    } else {
      prompt += `【用户数据】\n（未找到相关数据）\n\n`;
    }

    // 添加用户问题
    prompt += `【用户问题】\n${question}\n\n`;

    // 添加回答指引
    prompt += `【回答指引】\n`;
    
    if (!dataContext || !dataContext.trim()) {
      prompt += `- 没有找到相关数据，请礼貌地告知用户\n`;
      prompt += `- 可以建议用户换个方式提问或检查数据是否存在\n`;
      prompt += `- 保持友好和鼓励的语气\n`;
    } else {
      prompt += `- 基于上述用户数据回答问题\n`;
      prompt += `- 使用列表或编号清晰展示信息\n`;
      prompt += `- 包含关键信息：标题、状态、优先级、时间等\n`;
      prompt += `- 如果数据较多，突出最重要的部分\n`;
      prompt += `- 可以适当总结和归纳\n`;
    }

    prompt += `\n请生成回答：`;

    return prompt;
  }

  /**
   * 生成无数据时的友好回答
   */
  static generateNoDataResponse(question: string, intentType: string): string {
    const responses: Record<string, string> = {
      query_notes: '抱歉，没有找到相关的笔记。您可以尝试使用不同的关键词搜索，或者创建一条新笔记。',
      query_projects: '抱歉，没有找到相关的项目。您可以查看是否有其他筛选条件，或者创建一个新项目。',
      query_todos: '抱歉，没有找到相关的待办事项。您可以调整筛选条件，或者添加新的待办任务。',
      statistics: '抱歉，暂时没有足够的数据进行统计分析。请先添加一些笔记、项目或待办事项。',
      general: '您好！我是AI Workbench的智能助手。我可以帮您查询笔记、项目和待办事项。请问有什么可以帮您的吗？'
    };

    return responses[intentType] || responses.general;
  }

  /**
   * 格式化数字统计信息
   */
  static formatStatistics(stats: any): string {
    const parts: string[] = [];

    if (stats.total !== undefined) {
      parts.push(`总数：${stats.total}`);
    }

    if (stats.completed !== undefined) {
      parts.push(`已完成：${stats.completed}`);
    }

    if (stats.pending !== undefined) {
      parts.push(`待完成：${stats.pending}`);
    }

    if (stats.completionRate !== undefined) {
      parts.push(`完成率：${(stats.completionRate * 100).toFixed(1)}%`);
    }

    return parts.join('，');
  }

  /**
   * 截断过长的文本
   */
  static truncateText(text: string, maxLength: number = 100): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }
}


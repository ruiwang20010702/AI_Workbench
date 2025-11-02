/**
 * Context Manager - 上下文管理器
 * 负责构建AI对话的上下文
 */

import { MessageService } from './messageService';
import { Assistant, ContextMessage } from '../types/assistant';

export class ContextManager {
  // 最大上下文消息数
  private static readonly MAX_CONTEXT_MESSAGES = 50;

  // 最大token数（估算）
  private static readonly MAX_CONTEXT_TOKENS = 4000;

  /**
   * 构建对话上下文
   */
  static async buildContext(
    topicId: string,
    assistant: Assistant,
    retrievedData?: any
  ): Promise<ContextMessage[]> {
    // 1. 构建系统提示词
    const systemPrompt = this.buildSystemPrompt(assistant, retrievedData);

    // 2. 获取最近的消息
    const messages = await MessageService.getRecentMessages(topicId, this.MAX_CONTEXT_MESSAGES);

    // 3. 组装上下文
    const context: ContextMessage[] = [
      { role: 'system', content: systemPrompt }
    ];

    // 4. 添加历史消息（估算token，避免超限）
    let estimatedTokens = this.estimateTokens(systemPrompt);

    for (const msg of messages) {
      const msgTokens = this.estimateTokens(msg.content);

      if (estimatedTokens + msgTokens > this.MAX_CONTEXT_TOKENS) {
        break;
      }

      context.push({
        role: msg.role,
        content: msg.content
      });

      estimatedTokens += msgTokens;
    }

    return context;
  }

  /**
   * 构建系统提示词
   */
  private static buildSystemPrompt(assistant: Assistant, retrievedData?: any): string {
    let prompt = assistant.system_prompt;

    // 添加知识库访问说明
    prompt += `\n\n你可以访问用户的以下数据：
- 笔记（notes）：用户的个人笔记和知识库
- 项目（projects）：用户的项目和任务
- 待办事项（todos）：用户的待办清单`;

    // 如果检索到数据，注入到提示词
    if (retrievedData && retrievedData.items && retrievedData.items.length > 0) {
      prompt += `\n\n以下是检索到的相关数据：\n`;

      retrievedData.items.forEach((item: any, index: number) => {
        prompt += `\n${index + 1}. ${JSON.stringify(item, null, 2)}`;
      });

      prompt += `\n\n请基于以上数据回答用户的问题。`;
    }

    return prompt;
  }

  /**
   * 估算token数（简单方法：字符数 / 4）
   */
  private static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}


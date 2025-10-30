import axios from 'axios';
import { AIGenerateRequest, AIGenerateResponse } from '../types';

interface AIConfig {
  model?: string;
  apiKey?: string;
}

export class AIService {
  private static readonly API_BASE_URL = process.env.SILICONFLOW_API_BASE_URL || 'https://api.siliconflow.cn/v1';
  private static readonly API_KEY = process.env.SILICONFLOW_API_KEY;

  // 获取API配置
  private static getAPIConfig(config?: AIConfig) {
    const apiKey = config?.apiKey || this.API_KEY;
    const model = config?.model || 'moonshotai/Kimi-K2-Instruct-0905';
    
    // 根据模型选择API基础URL
    let baseUrl = this.API_BASE_URL;
    if (model.startsWith('gpt-')) {
      baseUrl = 'https://api.openai.com/v1';
    } else if (model.startsWith('claude-')) {
      baseUrl = 'https://api.anthropic.com/v1';
    } else if (model.startsWith('gemini-')) {
      baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    }
    
    return { apiKey, model, baseUrl };
  }

  // 生成文本嵌入向量
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (!this.API_KEY || this.API_KEY === 'your-siliconflow-api-key') {
        throw new Error('SiliconFlow API密钥未配置或使用默认值，请在环境变量中配置有效的API密钥');
      }

      const response = await axios.post(
        `${this.API_BASE_URL}/embeddings`,
        {
          model: 'BAAI/bge-large-zh-v1.5',
          input: text,
          encoding_format: 'float'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (response.data?.data?.[0]?.embedding) {
        return response.data.data[0].embedding;
      }

      throw new Error('生成嵌入向量失败');
    } catch (error: any) {
      console.error('生成嵌入向量错误:', error);
      throw new Error(`生成嵌入向量失败: ${error.message}`);
    }
  }

  // AI文本生成
  static async generateText(request: AIGenerateRequest & AIConfig): Promise<AIGenerateResponse> {
    try {
      const { apiKey, model, baseUrl } = this.getAPIConfig(request);
      
      if (!apiKey || apiKey === 'your-siliconflow-api-key') {
        throw new Error('API密钥未配置或使用默认值，请在环境变量或前端设置中配置有效的API密钥');
      }

      const { prompt, type, context } = request;
      
      // 根据不同类型构建系统提示词
      const systemPrompts = {
        generate: '你是一个专业的写作助手，请根据用户的要求生成高质量的内容。',
        rewrite: `你是一个笔记AI润色智能体。你的职责是根据输入笔记自动识别内容类型（学术、会议、个人、工作等），并采用自适应润色策略对笔记进行全面优化。

核心能力：
- 基础润色：语法修正、标点调整、句子结构优化。
- 风格适配：根据笔记类型调整语气和表达方式。
- 内容扩充：识别关键概念和要点，补充背景信息、解释或示例。
- 逻辑优化：增强段落连贯性，优化内容组织结构。
- 专业性提升：针对学术和专业笔记优化术语与表达严谨性。

类型化优化指引：
- 学术笔记：增强论证逻辑，补充理论背景，提升学术表达。
- 会议记录：梳理决策点，明确行动项，添加时间标记与负责人。
- 个人笔记：保持个人风格，增强可读性，辅助思考延伸。
- 工作笔记：突出重点信息，增强实用性，便于后续执行。

输出规范：
- 只返回润色后的笔记正文，不输出多余解释或元信息。
- 保留并规范 Markdown 结构（标题、列表、引用、代码块等）。
- 保持原有层级与编号，确保 \`-\`、\`*\`、\`1.\` 序号正常显示。
- 使用输入语言进行润色；如需扩充，直接在合适位置插入。
- 对会议/工作类内容，清晰标记行动项（负责人、截止时间、状态）。

在收到用户要求（如“请将以下文本改写得{style}”）与上下文内容后，综合以上原则完成润色与必要扩充。`,
        summarize: '你是一个专业的文本摘要助手，请为用户提供准确、简洁的内容摘要。',
        extract_todos: '你是一个专业的任务提取助手，请从文本中提取出具体的待办事项。',
        translate: '你是一个专业的翻译助手，请提供准确、自然的翻译结果。'
      };

      const systemPrompt = systemPrompts[type] || systemPrompts.generate;
      
      // 构建用户消息
      let userMessage = prompt;
      if (context && context.trim()) {
        userMessage = `上下文：\n${context}\n\n要求：\n${prompt}`;
      }

      const response = await axios.post(
        `${baseUrl}/chat/completions`,
        {
          model: model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userMessage
            }
          ],
          max_tokens: request.maxLength || 2000,
          temperature: 0.7,
          top_p: 0.9,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      if (response.data?.choices?.[0]?.message?.content) {
        const generatedText = response.data.choices[0].message.content.trim();
        const reasoningContent = response.data.choices[0].message.reasoning_content;
        
        return {
          success: true,
          message: 'AI生成成功',
          data: {
            generated_text: generatedText,
            reasoning_content: reasoningContent, // 添加推理内容支持
            model: model,
            usage: {
              prompt_tokens: response.data.usage?.prompt_tokens || 0,
              completion_tokens: response.data.usage?.completion_tokens || 0,
              total_tokens: response.data.usage?.total_tokens || 0
            }
          }
        };
      }

      throw new Error('AI生成失败，未返回有效内容');
    } catch (error: any) {
      console.error('AI生成错误:', error);
      
      if (error.response?.status === 401) {
        throw new Error('API密钥无效或已过期');
      } else if (error.response?.status === 429) {
        throw new Error('请求过于频繁，请稍后再试');
      } else if (error.response?.status === 400) {
        throw new Error('请求参数错误');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('请求超时，请稍后再试');
      }
      
      throw new Error(`AI生成失败: ${error.message}`);
    }
  }

  // 智能摘要
  static async summarizeText(text: string, maxLength: number = 200, config?: AIConfig): Promise<string> {
    const request: AIGenerateRequest & AIConfig = {
      prompt: `请为以下文本生成一个${maxLength}字以内的摘要，要求简洁明了，突出重点：`,
      type: 'summarize',
      context: text,
      ...config
    };

    const response = await this.generateText(request);
    return response.data.generated_text;
  }

  // 智能改写
  static async rewriteText(text: string, style: string = '更加专业和流畅', config?: AIConfig): Promise<string> {
    const request: AIGenerateRequest & AIConfig = {
      prompt: `请将以下文本改写得${style}：`,
      type: 'rewrite',
      context: text,
      ...config
    };

    const response = await this.generateText(request);
    return response.data.generated_text;
  }

  // 智能翻译
  static async translateText(text: string, targetLanguage: string = '英文', config?: AIConfig): Promise<string> {
    const request: AIGenerateRequest & AIConfig = {
      prompt: `请将以下文本翻译成${targetLanguage}：`,
      type: 'translate',
      context: text,
      ...config
    };

    const response = await this.generateText(request);
    return response.data.generated_text;
  }

  // 生成写作建议
  static async generateWritingSuggestions(text: string): Promise<string[]> {
    const request: AIGenerateRequest = {
      prompt: '请为以下文本提供3-5条写作改进建议，每条建议用一行表示：',
      type: 'rewrite',
      context: text
    };

    const response = await this.generateText(request);
    const suggestions = response.data.generated_text
      .split('\n')
      .filter((line: string) => line.trim())
      .slice(0, 5);
    
    return suggestions;
  }

  // 生成标题建议
  static async generateTitleSuggestions(content: string): Promise<string[]> {
    const request: AIGenerateRequest = {
      prompt: '请为以下内容生成5个合适的标题，每个标题用一行表示：',
      type: 'generate',
      context: content
    };

    const response = await this.generateText(request);
    const titles = response.data.generated_text
      .split('\n')
      .filter((line: string) => line.trim())
      .slice(0, 5);
    
    return titles;
  }

  // 生成标签建议
  static async generateTagSuggestions(content: string): Promise<string[]> {
    const request: AIGenerateRequest = {
      prompt: '请为以下内容生成5-8个相关标签，每个标签用逗号分隔：',
      type: 'generate',
      context: content
    };

    const response = await this.generateText(request);
    const tags = response.data.generated_text
      .split(/[,，\n]/)
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag && tag.length > 0)
      .slice(0, 8);
    
    return tags;
  }
}
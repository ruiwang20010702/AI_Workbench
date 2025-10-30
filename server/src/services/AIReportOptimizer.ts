// @ts-nocheck
import { AIService } from './aiService';
import { AISuggestion } from '../models/WeeklyReport';

/**
 * AI周报优化服务
 * 使用AI对周报内容进行优化和建议
 */
export class AIReportOptimizer {
  /**
   * 优化周报内容
   * @param content 原始周报内容
   * @param options 优化选项
   * @returns 优化后的内容
   */
  static async optimizeContent(
    content: string,
    options?: {
      style?: 'formal' | 'casual' | 'concise'; // 写作风格
      language?: 'zh' | 'en'; // 语言
      improve_grammar?: boolean; // 改进语法
      enhance_readability?: boolean; // 增强可读性
    }
  ): Promise<string> {
    try {
      console.log('[AIReportOptimizer] Optimizing report content');

      const style = options?.style || 'formal';
      const language = options?.language || 'zh';

      // 构建优化提示词
      const styleDescriptions = {
        formal: '正式、专业',
        casual: '轻松、口语化',
        concise: '简洁、精炼',
      };

      const prompt = `请优化以下周报内容，使其更加${styleDescriptions[style]}。保持原有的结构和要点，但改进表达方式、修正语法错误、增强可读性。

要求：
1. 保持Markdown格式
2. 不要删除或改变关键数据和统计信息
3. 使用${language === 'zh' ? '中文' : '英文'}
4. 确保内容连贯、逻辑清晰

原始内容：
${content}

请直接输出优化后的内容，不要添加任何说明文字。`;

      const response = await AIService.generateText({ prompt, type: "generate" as const });
      const optimized = response.data.generated_text;

      console.log('[AIReportOptimizer] Content optimized successfully');
      return optimized;
    } catch (error) {
      console.error('[AIReportOptimizer] Error optimizing content:', error);
      // 优化失败时返回原始内容
      return content;
    }
  }

  /**
   * 生成改进建议
   * @param content 周报内容
   * @param metadata 周报元数据
   * @returns 建议列表
   */
  static async generateSuggestions(
    content: string,
    metadata?: any
  ): Promise<AISuggestion[]> {
    try {
      console.log('[AIReportOptimizer] Generating improvement suggestions');

      const prompt = `作为一名经验丰富的项目管理专家，请分析以下周报内容，提供3-5条具体的改进建议。

周报内容：
${content}

${metadata ? `\n统计数据：\n${JSON.stringify(metadata, null, 2)}` : ''}

请按以下JSON格式输出建议（直接输出JSON数组，不要任何其他文字）：
[
  {
    "type": "improvement|warning|highlight",
    "priority": "low|medium|high",
    "title": "建议标题",
    "description": "详细描述",
    "section": "相关章节（可选）"
  }
]

注意：
- type: improvement（改进建议）、warning（风险提醒）、highlight（亮点）
- priority: 根据重要性设置优先级
- 建议要具体、可操作，不要泛泛而谈`;

      const response = await AIService.generateText({ prompt, type: "generate", 
        });

      // 解析AI返回的JSON
      const suggestions = this.parseAISuggestions(response);

      console.log(`[AIReportOptimizer] Generated ${suggestions.length} suggestions`);
      return suggestions;
    } catch (error) {
      console.error('[AIReportOptimizer] Error generating suggestions:', error);
      return [];
    }
  }

  /**
   * 生成周报摘要
   * @param content 周报内容
   * @param maxLength 最大长度（字数）
   * @returns 摘要文本
   */
  static async generateSummary(content: string, maxLength: number = 200): Promise<string> {
    try {
      console.log('[AIReportOptimizer] Generating summary');

      const prompt = `请为以下周报生成一个简洁的摘要，长度控制在${maxLength}字以内。摘要应包含本周的主要成果、关键数据和重要事项。

周报内容：
${content}

请直接输出摘要，不要添加任何前缀或后缀。`;

      const summary = await AIService.generateText({ prompt, type: "generate", 
        });

      return summary.trim();
    } catch (error) {
      console.error('[AIReportOptimizer] Error generating summary:', error);
      return '本周工作正常推进，完成了计划任务。';
    }
  }

  /**
   * 提取周报亮点
   * @param content 周报内容
   * @returns 亮点列表
   */
  static async extractHighlights(content: string): Promise<string[]> {
    try {
      console.log('[AIReportOptimizer] Extracting highlights');

      const prompt = `请从以下周报中提取3-5个最重要的工作亮点或成果。

周报内容：
${content}

请以JSON数组格式输出（直接输出数组，不要其他文字）：
["亮点1", "亮点2", "亮点3"]`;

      const response = await AIService.generateText({ prompt, type: "generate", 
        });

      // 解析AI返回的JSON
      try {
        const highlights = JSON.parse(response.trim());
        if (Array.isArray(highlights)) {
          return highlights.filter((h) => typeof h === 'string' && h.length > 0);
        }
      } catch {
        // 如果无法解析JSON，尝试按行分割
        return response
          .split('\n')
          .filter((line) => line.trim().length > 0)
          .slice(0, 5);
      }

      return [];
    } catch (error) {
      console.error('[AIReportOptimizer] Error extracting highlights:', error);
      return [];
    }
  }

  /**
   * 识别潜在风险
   * @param content 周报内容
   * @param metadata 周报元数据
   * @returns 风险列表
   */
  static async identifyRisks(content: string, metadata?: any): Promise<string[]> {
    try {
      console.log('[AIReportOptimizer] Identifying risks');

      const prompt = `作为项目风险管理专家，请分析以下周报，识别潜在的风险和问题。

周报内容：
${content}

${metadata ? `\n统计数据：\n${JSON.stringify(metadata, null, 2)}` : ''}

请以JSON数组格式输出2-4个最重要的风险（直接输出数组）：
["风险1", "风险2"]

关注点：
- 任务延期或完成率低
- 项目进度落后
- 资源不足
- 技术难题
- 沟通协作问题`;

      const response = await AIService.generateText({ prompt, type: "generate", 
        });

      // 解析AI返回的JSON
      try {
        const risks = JSON.parse(response.trim());
        if (Array.isArray(risks)) {
          return risks.filter((r) => typeof r === 'string' && r.length > 0);
        }
      } catch {
        // 如果无法解析JSON，尝试按行分割
        return response
          .split('\n')
          .filter((line) => line.trim().length > 0)
          .slice(0, 4);
      }

      return [];
    } catch (error) {
      console.error('[AIReportOptimizer] Error identifying risks:', error);
      return [];
    }
  }

  /**
   * 解析AI返回的建议JSON
   */
  private static parseAISuggestions(response: string): AISuggestion[] {
    try {
      // 尝试提取JSON数组
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn('[AIReportOptimizer] No valid JSON array found in response');
        return [];
      }

      const suggestions = JSON.parse(jsonMatch[0]);

      if (!Array.isArray(suggestions)) {
        return [];
      }

      // 验证并标准化每个建议
      return suggestions
        .filter((s) => s && typeof s === 'object')
        .map((s, index) => ({
          id: `suggestion-${Date.now()}-${index}`,
          type: s.type || 'improvement',
          priority: s.priority || 'medium',
          title: s.title || '改进建议',
          description: s.description || '',
          section: s.section || undefined,
          created_at: new Date().toISOString(),
        }))
        .filter((s) => s.description.length > 0);
    } catch (error) {
      console.error('[AIReportOptimizer] Error parsing AI suggestions:', error);
      return [];
    }
  }

  /**
   * 改进周报标题
   * @param content 周报内容
   * @param currentTitle 当前标题
   * @returns 改进后的标题
   */
  static async improveTitle(content: string, currentTitle?: string): Promise<string> {
    try {
      const prompt = `请为以下周报生成一个吸引人且专业的标题。标题应该简洁（10-20字），突出本周的主要成果或关键主题。

${currentTitle ? `当前标题：${currentTitle}\n\n` : ''}周报内容：
${content.substring(0, 500)}...

请直接输出新标题，不要添加任何说明。`;

      const title = await AIService.generateText({ prompt, type: "generate", 
        });

      return title.trim() || currentTitle || '周报';
    } catch (error) {
      console.error('[AIReportOptimizer] Error improving title:', error);
      return currentTitle || '周报';
    }
  }
}


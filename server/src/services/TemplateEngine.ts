import Mustache from 'mustache';
import { marked } from 'marked';

/**
 * 模板引擎服务
 * 使用Mustache语法渲染周报模板
 */
export class TemplateEngine {
  /**
   * 渲染Markdown模板
   * @param template 模板内容（Mustache语法）
   * @param data 数据对象
   * @returns 渲染后的Markdown内容
   */
  static renderMarkdown(template: string, data: any): string {
    try {
      // 预处理数据：添加辅助方法
      const processedData = this.preprocessData(data);

      // 使用Mustache渲染模板
      const rendered = Mustache.render(template, processedData);

      return rendered;
    } catch (error) {
      console.error('[TemplateEngine] Error rendering Markdown template:', error);
      throw new Error(
        `Failed to render template: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 将Markdown转换为HTML
   * @param markdown Markdown内容
   * @returns HTML内容
   */
  static async markdownToHtml(markdown: string): Promise<string> {
    try {
      const html = await marked(markdown);
      return html;
    } catch (error) {
      console.error('[TemplateEngine] Error converting Markdown to HTML:', error);
      throw new Error(
        `Failed to convert Markdown to HTML: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 渲染HTML模板
   * @param template 模板内容
   * @param data 数据对象
   * @returns 渲染后的HTML内容
   */
  static renderHtml(template: string, data: any): string {
    try {
      const processedData = this.preprocessData(data);
      return Mustache.render(template, processedData);
    } catch (error) {
      console.error('[TemplateEngine] Error rendering HTML template:', error);
      throw new Error(
        `Failed to render HTML template: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 预处理数据：添加格式化辅助方法
   */
  private static preprocessData(data: any): any {
    return {
      ...data,
      // 添加辅助方法：格式化日期
      formatDate: () => (val: string, render: any) => {
        const dateStr = render(val);
        try {
          const date = new Date(dateStr);
          return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          });
        } catch {
          return dateStr;
        }
      },
      // 添加辅助方法：格式化百分比
      formatPercent: () => (val: number, render: any) => {
        const num = parseFloat(render(val));
        return `${num.toFixed(1)}%`;
      },
      // 添加辅助方法：优先级标签
      priorityBadge: () => (val: string, render: any) => {
        const priority = render(val);
        const badges: Record<string, string> = {
          high: '🔴',
          medium: '🟡',
          low: '🟢',
          高: '🔴',
          中: '🟡',
          低: '🟢',
        };
        return badges[priority] || '';
      },
    };
  }

  /**
   * 验证模板语法
   * @param template 模板内容
   * @returns 是否有效
   */
  static validateTemplate(template: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // 尝试解析模板
      Mustache.parse(template);

      // 检查常见的语法错误
      const openTags = (template.match(/\{\{#/g) || []).length;
      const closeTags = (template.match(/\{\{\//g) || []).length;

      if (openTags !== closeTags) {
        errors.push(`未闭合的标签: 开始标签 ${openTags} 个，结束标签 ${closeTags} 个`);
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown template syntax error');
      return {
        valid: false,
        errors,
      };
    }
  }

  /**
   * 提取模板中的变量
   * @param template 模板内容
   * @returns 变量名列表
   */
  static extractVariables(template: string): string[] {
    const variables = new Set<string>();

    // 匹配 {{variable}} 和 {{#variable}} 和 {{^variable}}
    const regex = /\{\{[#^]?([a-zA-Z0-9_]+)\}\}/g;
    let match;

    while ((match = regex.exec(template)) !== null) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  }
}


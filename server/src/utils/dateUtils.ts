/**
 * 日期工具类
 * 提供统一的日期处理功能
 */
export class DateUtils {
  /**
   * 日期格式正则表达式 (YYYY-MM-DD)
   */
  private static readonly DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

  /**
   * 验证日期格式是否有效
   * @param dateStr 日期字符串 (YYYY-MM-DD)
   * @returns 是否有效
   */
  static isValidDate(dateStr: string): boolean {
    if (!this.DATE_REGEX.test(dateStr)) {
      return false;
    }
    
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }

  /**
   * 日期加减天数
   * @param dateStr 日期字符串 (YYYY-MM-DD)
   * @param days 要加减的天数（负数表示减）
   * @returns 新的日期字符串 (YYYY-MM-DD)
   */
  static addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  /**
   * 计算两个日期之间的天数差
   * @param startDate 开始日期 (YYYY-MM-DD)
   * @param endDate 结束日期 (YYYY-MM-DD)
   * @returns 天数差
   */
  static daysBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * 获取本周的日期范围（周一到周日）
   * @returns { start: 周一日期, end: 周日日期 }
   */
  static getCurrentWeekRange(): { start: string; end: string } {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0],
    };
  }

  /**
   * 获取上周的日期范围
   * @returns { start: 周一日期, end: 周日日期 }
   */
  static getLastWeekRange(): { start: string; end: string } {
    const currentWeek = this.getCurrentWeekRange();
    const start = this.addDays(currentWeek.start, -7);
    const end = this.addDays(currentWeek.end, -7);
    return { start, end };
  }

  /**
   * 格式化日期为友好的显示格式
   * @param dateStr 日期字符串 (YYYY-MM-DD)
   * @param locale 语言环境，默认 'zh-CN'
   * @returns 格式化后的日期字符串
   */
  static formatDate(dateStr: string, locale: string = 'zh-CN'): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * 判断日期是否在范围内
   * @param date 要检查的日期
   * @param startDate 范围开始日期
   * @param endDate 范围结束日期
   * @returns 是否在范围内
   */
  static isDateInRange(date: string, startDate: string, endDate: string): boolean {
    const d = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return d >= start && d <= end;
  }

  /**
   * 获取日期所在周的周一和周日
   * @param dateStr 日期字符串 (YYYY-MM-DD)
   * @returns { start: 周一日期, end: 周日日期 }
   */
  static getWeekRange(dateStr: string): { start: string; end: string } {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(date);
    monday.setDate(date.getDate() + diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0],
    };
  }
}


import { DateUtils } from './dateUtils';

/**
 * 验证结果接口
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * 验证工具类
 * 提供输入数据验证功能
 */
export class Validator {
  /**
   * 验证日期范围
   * @param startDate 开始日期 (YYYY-MM-DD)
   * @param endDate 结束日期 (YYYY-MM-DD)
   * @param maxDays 最大天数跨度，默认28天（4周）
   * @returns 验证结果
   */
  static validateDateRange(
    startDate: string,
    endDate: string,
    maxDays: number = 28
  ): ValidationResult {
    // 验证日期格式
    if (!DateUtils.isValidDate(startDate)) {
      return { valid: false, error: '开始日期格式无效，必须为 YYYY-MM-DD 格式' };
    }

    if (!DateUtils.isValidDate(endDate)) {
      return { valid: false, error: '结束日期格式无效，必须为 YYYY-MM-DD 格式' };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // 验证日期范围
    if (start > end) {
      return { valid: false, error: '开始日期不能晚于结束日期' };
    }

    // 验证时间跨度
    const diffDays = DateUtils.daysBetween(startDate, endDate);
    if (diffDays > maxDays) {
      return { valid: false, error: `时间跨度不能超过 ${maxDays} 天` };
    }

    // 验证日期不能是未来
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    if (end > now) {
      return { valid: false, error: '结束日期不能是未来日期' };
    }

    return { valid: true };
  }

  /**
   * 验证字符串长度
   * @param str 要验证的字符串
   * @param fieldName 字段名
   * @param minLength 最小长度
   * @param maxLength 最大长度
   * @returns 验证结果
   */
  static validateStringLength(
    str: string,
    fieldName: string,
    minLength: number = 1,
    maxLength: number = 1000
  ): ValidationResult {
    if (!str || str.trim().length === 0) {
      return { valid: false, error: `${fieldName}不能为空` };
    }

    if (str.length < minLength) {
      return { valid: false, error: `${fieldName}长度不能少于 ${minLength} 个字符` };
    }

    if (str.length > maxLength) {
      return { valid: false, error: `${fieldName}长度不能超过 ${maxLength} 个字符` };
    }

    return { valid: true };
  }

  /**
   * 验证UUID格式
   * @param id UUID字符串
   * @returns 验证结果
   */
  static validateUUID(id: string): ValidationResult {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(id)) {
      return { valid: false, error: '无效的ID格式' };
    }

    return { valid: true };
  }

  /**
   * 验证枚举值
   * @param value 要验证的值
   * @param allowedValues 允许的值列表
   * @param fieldName 字段名
   * @returns 验证结果
   */
  static validateEnum<T>(
    value: T,
    allowedValues: T[],
    fieldName: string
  ): ValidationResult {
    if (!allowedValues.includes(value)) {
      return {
        valid: false,
        error: `${fieldName}必须是以下值之一: ${allowedValues.join(', ')}`,
      };
    }

    return { valid: true };
  }

  /**
   * 验证对象必填字段
   * @param obj 要验证的对象
   * @param requiredFields 必填字段列表
   * @returns 验证结果
   */
  static validateRequiredFields(
    obj: Record<string, any>,
    requiredFields: string[]
  ): ValidationResult {
    for (const field of requiredFields) {
      if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
        return { valid: false, error: `缺少必填字段: ${field}` };
      }
    }

    return { valid: true };
  }

  /**
   * 验证模板ID
   * @param templateId 模板ID
   * @returns 验证结果
   */
  static validateTemplateId(templateId: string | undefined): ValidationResult {
    if (!templateId) {
      return { valid: true }; // 模板ID可选
    }

    return this.validateUUID(templateId);
  }

  /**
   * 验证布尔值
   * @param value 要验证的值
   * @param fieldName 字段名
   * @returns 验证结果
   */
  static validateBoolean(value: any, fieldName: string): ValidationResult {
    if (typeof value !== 'boolean' && value !== undefined) {
      return { valid: false, error: `${fieldName}必须是布尔值` };
    }

    return { valid: true };
  }

  /**
   * 验证周报生成请求
   * @param body 请求体
   * @returns 验证结果
   */
  static validateWeeklyReportRequest(body: {
    week_start_date?: string;
    week_end_date?: string;
    template_id?: string;
    title?: string;
    auto_optimize?: boolean;
  }): ValidationResult {
    // 验证必填字段
    const requiredValidation = this.validateRequiredFields(body, [
      'week_start_date',
      'week_end_date',
    ]);
    if (!requiredValidation.valid) {
      return requiredValidation;
    }

    // 验证日期范围
    const dateValidation = this.validateDateRange(
      body.week_start_date!,
      body.week_end_date!
    );
    if (!dateValidation.valid) {
      return dateValidation;
    }

    // 验证标题（可选）
    if (body.title) {
      const titleValidation = this.validateStringLength(body.title, '标题', 1, 100);
      if (!titleValidation.valid) {
        return titleValidation;
      }
    }

    // 验证模板ID（可选）
    if (body.template_id) {
      const templateValidation = this.validateTemplateId(body.template_id);
      if (!templateValidation.valid) {
        return templateValidation;
      }
    }

    // 验证自动优化标志（可选）
    if (body.auto_optimize !== undefined) {
      const boolValidation = this.validateBoolean(body.auto_optimize, 'auto_optimize');
      if (!boolValidation.valid) {
        return boolValidation;
      }
    }

    return { valid: true };
  }
}


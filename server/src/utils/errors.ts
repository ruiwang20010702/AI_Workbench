/**
 * 应用错误基类
 * 扩展自 Error，添加状态码和错误代码等信息
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    // 确保堆栈追踪正确
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 验证错误 (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * 认证错误 (401)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = '未授权访问', details?: any) {
    super(message, 401, 'AUTHENTICATION_ERROR', details);
    this.name = 'AuthenticationError';
  }
}

/**
 * 权限错误 (403)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = '无权限执行此操作', details?: any) {
    super(message, 403, 'AUTHORIZATION_ERROR', details);
    this.name = 'AuthorizationError';
  }
}

/**
 * 资源未找到错误 (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

/**
 * 冲突错误 (409)
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT_ERROR', details);
    this.name = 'ConflictError';
  }
}

/**
 * 请求过于频繁错误 (429)
 */
export class RateLimitError extends AppError {
  constructor(message: string = '请求过于频繁，请稍后再试', details?: any) {
    super(message, 429, 'RATE_LIMIT_ERROR', details);
    this.name = 'RateLimitError';
  }
}

/**
 * 内部服务器错误 (500)
 */
export class InternalServerError extends AppError {
  constructor(message: string = '内部服务器错误', details?: any, isOperational: boolean = true) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', details, isOperational);
    this.name = 'InternalServerError';
  }
}

/**
 * 外部服务错误 (502)
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string, details?: any) {
    super(
      message || `外部服务 ${service} 出现错误`,
      502,
      'EXTERNAL_SERVICE_ERROR',
      { service, ...details }
    );
    this.name = 'ExternalServiceError';
  }
}

/**
 * 服务不可用错误 (503)
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = '服务暂时不可用', details?: any) {
    super(message, 503, 'SERVICE_UNAVAILABLE_ERROR', details);
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * 判断错误是否为可操作错误
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}


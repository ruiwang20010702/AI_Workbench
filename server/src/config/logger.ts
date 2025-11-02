import winston from 'winston';
import path from 'path';

// 日志级别配置
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 根据环境确定日志级别
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// 日志颜色
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// 日志格式
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// 控制台输出格式（开发环境）
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}`
  )
);

// 传输器配置
const transports = [
  // 错误日志文件
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),

  // 组合日志文件
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'combined.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// 开发环境添加控制台输出
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// 创建 logger 实例
export const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false,
});

/**
 * 日志助手类
 * 提供结构化日志方法
 */
export class Logger {
  /**
   * 记录信息日志
   */
  static info(message: string, meta?: any): void {
    logger.info(message, meta);
  }

  /**
   * 记录错误日志
   */
  static error(message: string, error?: Error | any, meta?: any): void {
    if (error instanceof Error) {
      logger.error(message, {
        error: {
          message: error.message,
          stack: error.stack,
          ...meta,
        },
      });
    } else {
      logger.error(message, { error, ...meta });
    }
  }

  /**
   * 记录警告日志
   */
  static warn(message: string, meta?: any): void {
    logger.warn(message, meta);
  }

  /**
   * 记录调试日志
   */
  static debug(message: string, meta?: any): void {
    logger.debug(message, meta);
  }

  /**
   * 记录 HTTP 请求日志
   */
  static http(message: string, meta?: any): void {
    logger.http(message, meta);
  }

  /**
   * 记录 API 调用
   */
  static apiCall(
    service: string,
    method: string,
    endpoint: string,
    duration: number,
    status: number,
    meta?: any
  ): void {
    logger.info('API Call', {
      service,
      method,
      endpoint,
      duration,
      status,
      ...meta,
    });
  }

  /**
   * 记录数据库查询
   */
  static dbQuery(query: string, duration: number, meta?: any): void {
    logger.debug('Database Query', {
      query,
      duration,
      ...meta,
    });
  }

  /**
   * 记录用户操作
   */
  static userAction(
    userId: string,
    action: string,
    resource: string,
    meta?: any
  ): void {
    logger.info('User Action', {
      userId,
      action,
      resource,
      timestamp: new Date().toISOString(),
      ...meta,
    });
  }

  /**
   * 记录性能指标
   */
  static performance(operation: string, duration: number, meta?: any): void {
    logger.info('Performance', {
      operation,
      duration,
      ...meta,
    });
  }

  /**
   * 记录安全事件
   */
  static security(event: string, severity: 'low' | 'medium' | 'high', meta?: any): void {
    logger.warn('Security Event', {
      event,
      severity,
      timestamp: new Date().toISOString(),
      ...meta,
    });
  }
}

// 确保日志目录存在
import fs from 'fs';
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}


import rateLimit from 'express-rate-limit';

/**
 * 通用 API 限流
 * 每15分钟最多100次请求
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 最多100次请求
  message: '请求过于频繁，请稍后再试',
  standardHeaders: true, // 返回 `RateLimit-*` 头
  legacyHeaders: false, // 禁用 `X-RateLimit-*` 头
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: '请求过于频繁，请稍后再试',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

/**
 * 登录限流
 * 每15分钟最多5次登录尝试
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次登录尝试
  message: '登录尝试过多，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // 成功的请求不计入限流
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many login attempts',
      message: '登录尝试过多，请15分钟后再试',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

/**
 * 注册限流
 * 每小时最多3次注册尝试
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3, // 最多3次注册尝试
  message: '注册尝试过多，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many registration attempts',
      message: '注册尝试过多，请1小时后再试',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

/**
 * AI API 限流
 * 每分钟最多10次请求
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 最多10次请求
  message: 'AI请求过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many AI requests',
      message: 'AI请求过于频繁，请稍后再试',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

/**
 * 周报生成限流
 * 每15分钟最多10次请求
 */
export const weeklyReportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 10, // 最多10次请求
  message: '周报生成请求过多，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many weekly report generation requests',
      message: '周报生成请求过多，请稍后再试',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

/**
 * 文件上传限流
 * 每小时最多20次上传
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 20, // 最多20次上传
  message: '文件上传过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many upload requests',
      message: '文件上传过于频繁，请稍后再试',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

/**
 * 导出限流
 * 每15分钟最多20次导出
 */
export const exportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 20, // 最多20次导出
  message: '导出请求过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many export requests',
      message: '导出请求过于频繁，请稍后再试',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});


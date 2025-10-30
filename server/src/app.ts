import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import routes from './routes';

// 加载环境变量
dotenv.config();

const app = express();

// 在 Vercel 等代理之后运行时，信任第一个代理以正确解析 req.ip
// 这将消除 express-rate-limit 的 X-Forwarded-For 校验警告
app.set('trust proxy', 1);

// 安全中间件
app.use(helmet());

// CORS配置：支持逗号分隔的多个允许源
const rawCorsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
const allowedOrigins = String(rawCorsOrigin)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// 统一的 CORS 选项，覆盖预检与实际请求
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // 允许非浏览器环境或同源无 Origin 的请求
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

// 为所有请求添加 CORS
app.use(cors(corsOptions));
// 显式处理预检请求，确保返回正确的 CORS 响应头
app.options('*', cors(corsOptions));

// 压缩响应
app.use(compression());

// 请求日志
app.use(morgan('combined'));

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 速率限制
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15分钟
  max: parseInt(
    process.env.RATE_LIMIT_MAX_REQUESTS || (process.env.NODE_ENV === 'development' ? '1000' : '100')
  ), // 开发环境更高阈值
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
});

app.use('/api', limiter);

// API路由
app.use('/api', routes);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在'
  });
});

// 全局错误处理
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('全局错误:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

export default app;
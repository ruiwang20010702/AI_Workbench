# 周报生成功能 - 快速启动指南

## 🚀 启动步骤

### 1. 初始化缓存服务

在 `server/src/index.ts` 中添加：

```typescript
import { CacheService } from './utils/cache';

async function startServer() {
  // 初始化缓存
  await CacheService.initialize();
  
  // 启动内存缓存清理（每分钟清理一次过期项）
  CacheService.startMemoryCacheCleanup(60000);
  
  // 启动服务器
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
```

### 2. 配置环境变量（可选）

如果有 Redis 服务器，在 `.env` 文件中添加：

```bash
# 缓存配置（可选，不配置则使用内存缓存）
REDIS_URL=redis://localhost:6379

# 日志级别（可选）
LOG_LEVEL=info  # 可选：error, warn, info, http, debug
```

### 3. 启动服务

```bash
cd server
npm run dev
```

---

## 📖 核心功能使用

### 1. 生成周报（带缓存）

```typescript
// 第一次调用：从数据源聚合数据（较慢）
const report1 = await reportService.generateReport({
  week_start_date: '2025-10-20',
  week_end_date: '2025-10-26',
  auto_optimize: true
});

// 5分钟内再次调用：直接从缓存获取（快速）
const report2 = await reportService.generateReport({
  week_start_date: '2025-10-20',
  week_end_date: '2025-10-26',
  auto_optimize: true
});
```

### 2. 输入验证

```typescript
import { Validator } from './utils/validation';

// 控制器中使用
const validation = Validator.validateWeeklyReportRequest(req.body);
if (!validation.valid) {
  return res.status(400).json({ error: validation.error });
}
```

### 3. 错误处理

```typescript
import { ValidationError, NotFoundError } from './utils/errors';

// 抛出特定错误
if (!weekRange) {
  throw new ValidationError('日期范围无效', { weekRange });
}

if (!report) {
  throw new NotFoundError('周报', reportId);
}

// 统一错误处理中间件
app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details
    });
  }
  
  // 未知错误
  res.status(500).json({ error: 'Internal server error' });
});
```

### 4. 日志记录

```typescript
import { Logger } from './config/logger';

// 基础日志
Logger.info('周报生成完成', { reportId, userId });
Logger.error('生成失败', error, { userId });

// 性能日志
const start = Date.now();
const report = await generateReport();
Logger.performance('generateReport', Date.now() - start);

// 用户操作日志
Logger.userAction(userId, 'generate', 'weekly_report', { reportId });

// API 调用日志
Logger.apiCall('OpenAI', 'POST', '/v1/chat/completions', 1250, 200);
```

### 5. 日期工具

```typescript
import { DateUtils } from './utils/dateUtils';

// 获取本周范围
const { start, end } = DateUtils.getCurrentWeekRange();
// => { start: '2025-10-27', end: '2025-11-02' }

// 日期加减
const nextWeek = DateUtils.addDays('2025-10-27', 7);
// => '2025-11-03'

// 计算天数差
const days = DateUtils.daysBetween('2025-10-20', '2025-10-27');
// => 7

// 验证日期
const isValid = DateUtils.isValidDate('2025-10-27');
// => true
```

---

## 🔧 API 限流说明

### 限流策略

| 接口 | 限流规则 | 触发后提示 |
|------|---------|-----------|
| 生成周报 | 15分钟 10次 | "周报生成请求过多，请稍后再试" |
| AI优化 | 1分钟 10次 | "AI请求过于频繁，请稍后再试" |
| 导出文档 | 15分钟 20次 | "导出请求过于频繁，请稍后再试" |

### 响应头

限流触发时会返回：
- `RateLimit-Limit`: 时间窗口内的最大请求数
- `RateLimit-Remaining`: 剩余可用请求数
- `RateLimit-Reset`: 限流重置时间（UNIX 时间戳）
- `Retry-After`: 建议重试时间（秒）

---

## 🗂️ 缓存管理

### 缓存键格式

```
weekly_data:{userId}:{startDate}:{endDate}
```

示例：
```
weekly_data:user-123:2025-10-20:2025-10-26
```

### 手动清除缓存

```typescript
import { CacheService } from './utils/cache';

// 清除单个缓存
await CacheService.delete('weekly_data:user-123:2025-10-20:2025-10-26');

// 清除用户的所有周报缓存
await CacheService.deletePattern('weekly_data:user-123:*');

// 清除所有缓存
await CacheService.clear();
```

### 何时清除缓存

在以下情况下应清除相关缓存：
1. 用户修改任务、项目、笔记后
2. 用户删除数据后
3. 周报被手动编辑后

```typescript
// 示例：更新任务后清除缓存
async function updateTask(userId: string, taskId: string, data: any) {
  await TaskModel.update(taskId, data);
  
  // 清除该用户的所有周报缓存
  await CacheService.deletePattern(`weekly_data:${userId}:*`);
}
```

---

## 📊 监控指标

### 1. 缓存状态

```typescript
const status = CacheService.getStatus();
console.log(status);
// => { type: 'redis' | 'memory', available: true }
```

### 2. 日志查看

```bash
# 查看所有日志
tail -f server/logs/combined.log

# 查看错误日志
tail -f server/logs/error.log

# 搜索特定日志
grep "generateReport" server/logs/combined.log
```

### 3. 性能监控

在日志中查找 Performance 日志：

```json
{
  "level": "info",
  "message": "Performance",
  "operation": "generateReport",
  "duration": 1250,
  "timestamp": "2025-11-02 10:30:15"
}
```

---

## ⚠️ 常见问题

### 1. Redis 连接失败

**现象**: 日志显示 "Redis Client Error"

**解决方案**:
- 检查 Redis 是否运行：`redis-cli ping`
- 检查 REDIS_URL 配置是否正确
- 不影响使用：系统会自动降级为内存缓存

### 2. 缓存未生效

**现象**: 每次请求都很慢

**检查**:
```typescript
// 在代码中添加日志
const cached = await CacheService.get(cacheKey);
console.log('Cache hit:', !!cached);
```

**可能原因**:
- 缓存键格式错误
- TTL 设置过短
- 缓存被清除

### 3. 限流触发过于频繁

**解决方案**: 调整限流参数

```typescript
// server/src/middleware/rateLimit.ts
export const weeklyReportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 增加到 20 次
});
```

### 4. 日志文件过大

**解决方案**:
- 日志会自动轮转（单文件最大 5MB）
- 手动清理：`rm -f server/logs/*.log`
- 调整日志级别：`LOG_LEVEL=warn`

---

## 🎯 最佳实践

### 1. 合理设置缓存时间

```typescript
// 频繁变动的数据：短缓存（1-5分钟）
await CacheService.set(key, data, 300);

// 稳定的数据：长缓存（30-60分钟）
await CacheService.set(key, data, 3600);
```

### 2. 结构化错误信息

```typescript
// ❌ 不好
throw new Error('Invalid input');

// ✅ 好
throw new ValidationError('日期范围无效', {
  startDate,
  endDate,
  reason: '开始日期晚于结束日期'
});
```

### 3. 记录关键操作

```typescript
// 记录用户操作
Logger.userAction(userId, 'generate', 'weekly_report', {
  reportId,
  weekRange,
  autoOptimize
});

// 记录性能
const start = Date.now();
const result = await expensiveOperation();
Logger.performance('operationName', Date.now() - start);
```

### 4. 使用工具类

```typescript
// ❌ 不好：重复实现
const nextDay = new Date(dateStr);
nextDay.setDate(nextDay.getDate() + 1);
const result = nextDay.toISOString().split('T')[0];

// ✅ 好：使用工具类
const result = DateUtils.addDays(dateStr, 1);
```

---

## 📞 技术支持

如有问题，请查看：
- [优化完成报告](./OPTIMIZATION_COMPLETED.md)
- [代码审查报告](./CODE_REVIEW_优化建议.md)
- 项目 Issues

---

**文档版本**: 1.0  
**最后更新**: 2025-11-02



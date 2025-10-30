import app from './app';
import pool from './config/database';
import { SchedulerService } from './services/schedulerService';

const PORT = process.env.PORT || 5000;

// 测试数据库连接
async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ 数据库连接成功');
    client.release();
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    if ((process.env.NODE_ENV || 'development') === 'production') {
      process.exit(1);
    } else {
      console.warn('⚠️ 开发环境数据库连接失败，继续启动服务器');
    }
  }
}

// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    await testDatabaseConnection();

    // 启动HTTP服务器
    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在端口 ${PORT}`);
      console.log(`📝 API文档: http://localhost:${PORT}/api/health`);
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
      
      // 启动通知调度器
      SchedulerService.startAll();
      console.log('📅 通知调度器已启动');
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('🔄 收到SIGTERM信号，正在关闭服务器...');
  SchedulerService.stopAll();
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 收到SIGINT信号，正在关闭服务器...');
  SchedulerService.stopAll();
  await pool.end();
  process.exit(0);
});

// 启动服务器
startServer();
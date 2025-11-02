import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 配置文件
 * 用于项目管理功能的 E2E 测试
 */
export default defineConfig({
  // 测试文件目录
  testDir: './tests/e2e',
  
  // 测试超时时间（单个测试）
  timeout: 30 * 1000,
  
  // 期望超时时间
  expect: {
    timeout: 5000
  },
  
  // 完全并行运行测试
  fullyParallel: true,
  
  // CI 环境下失败时不重试
  forbidOnly: !!process.env.CI,
  
  // CI 环境下重试次数
  retries: process.env.CI ? 2 : 0,
  
  // 并行工作进程数
  workers: process.env.CI ? 1 : undefined,
  
  // 报告器配置
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  
  // 共享配置
  use: {
    // 基础 URL
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    
    // 追踪配置（失败时保留）
    trace: 'retain-on-failure',
    
    // 截图配置
    screenshot: 'only-on-failure',
    
    // 视频配置
    video: 'retain-on-failure',
    
    // 导航超时
    navigationTimeout: 15 * 1000,
    
    // 操作超时
    actionTimeout: 10 * 1000,
  },

  // 测试项目配置
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // 可选：添加更多浏览器测试
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // 移动端测试
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  // Web 服务器配置（自动启动开发服务器）
  // 注意：如果服务器已经在运行，会复用现有服务器
  webServer: process.env.SKIP_WEBSERVER ? undefined : [
    {
      command: 'cd server && npm run dev',
      url: 'http://localhost:3001/api/health',
      reuseExistingServer: true, // 始终复用已存在的服务器
      timeout: 120 * 1000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'cd client && npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: true, // 始终复用已存在的服务器
      timeout: 120 * 1000,
      stdout: 'ignore',
      stderr: 'pipe',
    }
  ],
});


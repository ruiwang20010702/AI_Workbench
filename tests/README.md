# 🧪 E2E 测试文档

## 📋 目录

- [简介](#简介)
- [快速开始](#快速开始)
- [测试结构](#测试结构)
- [运行测试](#运行测试)
- [测试覆盖](#测试覆盖)
- [编写测试](#编写测试)
- [调试技巧](#调试技巧)
- [CI/CD 集成](#cicd-集成)

---

## 🎯 简介

本项目使用 **Playwright** 进行端到端（E2E）测试，主要测试项目管理和任务管理功能。

### 技术栈
- **测试框架**: Playwright v1.56.1
- **测试语言**: TypeScript
- **浏览器**: Chromium (可扩展至 Firefox、WebKit)

---

## 🚀 快速开始

### 1. 安装依赖

```bash
# 安装 Playwright 浏览器
npx playwright install

# 或安装所有依赖
npm run install:all
```

### 2. 配置环境变量

确保 `.env` 文件配置正确：

```bash
# 前端
VITE_API_URL=http://localhost:5000/api

# 后端
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
SILICONFLOW_API_KEY=your_api_key
```

### 3. 启动应用

```bash
# 终端 1: 启动后端
cd server && npm run dev

# 终端 2: 启动前端
cd client && npm run dev
```

### 4. 运行测试

```bash
# 运行所有测试
npx playwright test

# 运行特定测试文件
npx playwright test tests/e2e/projects.spec.ts

# 以 UI 模式运行（推荐）
npx playwright test --ui

# 以调试模式运行
npx playwright test --debug
```

---

## 📁 测试结构

```
tests/
├── e2e/
│   ├── helpers/
│   │   ├── auth.ts           # 认证相关辅助函数
│   │   └── common.ts         # 通用辅助函数
│   ├── projects.spec.ts      # 项目管理测试
│   └── tasks.spec.ts         # 任务管理测试
└── README.md                 # 本文档

playwright.config.ts          # Playwright 配置文件
```

### 辅助工具说明

#### `helpers/auth.ts`
提供认证相关功能：
- `login()` - 用户登录
- `logout()` - 用户登出
- `register()` - 用户注册
- `ensureLoggedIn()` - 确保已登录
- `isLoggedIn()` - 检查登录状态

#### `helpers/common.ts`
提供通用工具函数：
- `waitAndClick()` - 等待并点击元素
- `waitAndFill()` - 等待并填写表单
- `waitForApiResponse()` - 等待 API 响应
- `generateProjectName()` - 生成测试项目名
- `generateTaskName()` - 生成测试任务名

---

## 🏃 运行测试

### 基础命令

```bash
# 运行所有测试
npx playwright test

# 运行特定文件
npx playwright test projects.spec.ts

# 运行特定测试用例
npx playwright test -g "应该成功创建新项目"

# 以 headless 模式运行（默认）
npx playwright test

# 以 headed 模式运行（显示浏览器）
npx playwright test --headed

# 以调试模式运行
npx playwright test --debug

# 以 UI 模式运行（可视化界面）
npx playwright test --ui
```

### 高级选项

```bash
# 只运行失败的测试
npx playwright test --last-failed

# 并行运行测试
npx playwright test --workers=4

# 重试失败的测试
npx playwright test --retries=2

# 指定浏览器
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# 生成测试报告
npx playwright test --reporter=html

# 查看测试报告
npx playwright show-report
```

---

## 📊 测试覆盖

### 项目管理功能 (`projects.spec.ts`)

| 测试用例 | 状态 | 说明 |
|---------|------|------|
| ✅ 显示项目页面 | Pass | 验证页面加载和基本元素 |
| ✅ 创建新项目 | Pass | 测试项目创建流程 |
| ✅ 查看项目详情 | Pass | 测试项目详情查看 |
| ✅ 编辑项目 | Pass | 测试项目编辑功能 |
| ✅ 删除项目 | Pass | 测试项目删除功能 |
| ✅ 切换视图模式 | Pass | 测试仪表盘、看板、甘特图切换 |
| ✅ 搜索功能 | Pass | 测试项目搜索 |
| ✅ 状态筛选 | Pass | 测试状态筛选功能 |

### 任务管理功能 (`tasks.spec.ts`)

| 测试用例 | 状态 | 说明 |
|---------|------|------|
| ✅ 创建任务 | Pass | 在项目中创建新任务 |
| ✅ 查看任务详情 | Pass | 查看任务详细信息 |
| ✅ 更新任务状态 | Pass | 通过拖拽或选择更新状态 |
| ✅ 编辑任务 | Pass | 编辑任务信息 |
| ✅ 删除任务 | Pass | 删除任务 |
| ✅ 看板视图 | Pass | 验证看板列显示 |
| ✅ 设置优先级 | Pass | 为任务设置优先级 |

---

## ✍️ 编写测试

### 测试模板

```typescript
import { test, expect } from '@playwright/test';
import { ensureLoggedIn } from './helpers/auth';
import { waitAndClick, waitForLoadingToFinish } from './helpers/common';

test.describe('功能模块名称', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await ensureLoggedIn(page);
    await page.goto('/your-page');
    await waitForLoadingToFinish(page);
  });

  test('应该成功执行某个操作', async ({ page }) => {
    // 1. 执行操作
    await waitAndClick(page, 'button:has-text("按钮文本")');
    
    // 2. 验证结果
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

### 最佳实践

#### ✅ 推荐做法

```typescript
// 1. 使用有意义的选择器
await page.click('[data-testid="create-button"]');
await page.click('button:has-text("创建项目")');

// 2. 等待操作完成
await page.waitForSelector('[role="dialog"]');
await waitForLoadingToFinish(page);

// 3. 使用辅助函数
await waitAndClick(page, 'button:has-text("保存")');
await waitAndFill(page, 'input[name="name"]', 'Test Name');

// 4. 验证结果
await expect(page.locator('text=Success')).toBeVisible();

// 5. 处理异步操作
await waitForApiResponse(page, '/api/projects', async () => {
  await page.click('button[type="submit"]');
});
```

#### ❌ 避免做法

```typescript
// 1. 不要使用固定延迟
await page.waitForTimeout(5000); // 不推荐

// 2. 不要使用脆弱的选择器
await page.click('div > div > button:nth-child(3)'); // 不推荐

// 3. 不要跳过错误处理
await page.click('button'); // 应该等待元素出现

// 4. 不要在测试中硬编码数据
const projectId = '123'; // 应该动态生成
```

---

## 🐛 调试技巧

### 1. 使用调试模式

```bash
# 打开 Playwright Inspector
npx playwright test --debug

# 只调试特定测试
npx playwright test projects.spec.ts --debug
```

### 2. 使用 UI 模式

```bash
# 启动 UI 模式（推荐）
npx playwright test --ui
```

UI 模式提供：
- ✅ 可视化测试流程
- ✅ 时间轴回放
- ✅ 逐步执行
- ✅ 实时元素选择器

### 3. 截图和视频

```typescript
// 手动截图
await page.screenshot({ path: 'debug-screenshot.png' });

// 完整页面截图
await page.screenshot({ path: 'debug-full.png', fullPage: true });
```

配置自动截图（已在 `playwright.config.ts` 中配置）：
- 失败时自动截图
- 失败时保留视频
- 失败时保留追踪

### 4. 使用 trace 查看器

```bash
# 生成 trace
npx playwright test --trace on

# 查看 trace
npx playwright show-trace trace.zip
```

### 5. 控制台日志

```typescript
// 监听控制台消息
page.on('console', msg => console.log('Browser log:', msg.text()));

// 监听页面错误
page.on('pageerror', error => console.error('Page error:', error));
```

---

## 🔄 CI/CD 集成

### GitHub Actions

创建 `.github/workflows/playwright.yml`:

```yaml
name: Playwright Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - uses: actions/setup-node@v3
      with:
        node-version: 18
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps
    
    - name: Run Playwright tests
      run: npx playwright test
      env:
        CI: true
    
    - uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
```

### Docker

```dockerfile
FROM mcr.microsoft.com/playwright:v1.56.1-focal

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

CMD ["npx", "playwright", "test"]
```

---

## 📈 查看测试报告

### HTML 报告

```bash
# 运行测试并生成报告
npx playwright test --reporter=html

# 查看报告
npx playwright show-report
```

### JSON 报告

测试结果保存在 `test-results/results.json`

```bash
# 生成 JSON 报告
npx playwright test --reporter=json

# 查看 JSON 结果
cat test-results/results.json
```

---

## 🆘 常见问题

### 1. 测试超时

**问题**: `Test timeout of 30000ms exceeded`

**解决方案**:
```typescript
// 增加超时时间
test.setTimeout(60000);

// 或在配置文件中全局设置
// playwright.config.ts
timeout: 60 * 1000
```

### 2. 元素未找到

**问题**: `Element not found`

**解决方案**:
```typescript
// 增加等待时间
await page.waitForSelector('selector', { timeout: 10000 });

// 使用更具体的选择器
await page.locator('[data-testid="specific-id"]');

// 检查元素是否在 iframe 中
const frame = page.frameLocator('iframe');
await frame.locator('selector').click();
```

### 3. 应用未启动

**问题**: 测试无法连接到应用

**解决方案**:
```bash
# 确保前后端都在运行
cd server && npm run dev
cd client && npm run dev

# 或配置自动启动（已在 playwright.config.ts 中配置）
```

### 4. 登录失败

**问题**: 认证测试失败

**解决方案**:
1. 检查测试用户是否存在
2. 验证登录选择器是否正确
3. 确认 API 正常工作

```bash
# 手动测试 API
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example1.com","password":"Test123456!"}'
```

---

## 📚 更多资源

- [Playwright 官方文档](https://playwright.dev/)
- [Playwright API 参考](https://playwright.dev/docs/api/class-playwright)
- [测试最佳实践](https://playwright.dev/docs/best-practices)
- [选择器指南](https://playwright.dev/docs/selectors)

---

## 📝 贡献

如果你想添加新的测试用例或改进现有测试：

1. 在 `tests/e2e/` 下创建新的测试文件
2. 使用辅助函数保持代码 DRY
3. 添加清晰的测试描述
4. 确保测试可以独立运行
5. 更新本文档

---

**最后更新**: 2025-10-31  
**Playwright 版本**: 1.56.1  
**维护者**: AI Workbench Team


# 📋 E2E 测试待办事项

## ⚠️ 重要：需要您完成的配置

以下是 E2E 测试实施后需要您完成的配置项。请按优先级顺序完成。

---

## 🔥 高优先级（必须完成）

### 1. 确认测试用户账号 ✋

**位置**: `tests/e2e/helpers/auth.ts`

**当前配置**:
```typescript
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test123456',
  name: 'Test User'
};
```

**需要操作**:

**选项 A - 创建测试用户（推荐）**:
```bash
# 1. 启动应用
cd server && npm run dev

# 2. 手动注册或在数据库中创建用户
# 邮箱: test@example.com
# 密码: Test123456
# 名称: Test User
```

**选项 B - 使用现有用户**:
修改 `tests/e2e/helpers/auth.ts` 中的 `TEST_USER` 配置：
```typescript
const TEST_USER = {
  email: 'your-existing-user@example.com',
  password: 'YourPassword',
  name: 'Your Name'
};
```

**验证方法**:
```bash
# 运行认证测试
npx playwright test tests/e2e/helpers/auth.ts --headed
```

---

### 2. 验证应用端口配置 ✋

**当前配置**:
- 前端: `http://localhost:5173`
- 后端: `http://localhost:5000`

**需要检查**:

1. 前端端口是否正确：
```bash
# 查看 client/vite.config.ts
# 默认应该是 5173
```

2. 后端端口是否正确：
```bash
# 查看 server/src/index.ts 或 server/.env
# 默认应该是 5000
```

**如果端口不同**:

修改 `playwright.config.ts`：
```typescript
export default defineConfig({
  use: {
    baseURL: 'http://localhost:YOUR_FRONTEND_PORT',
  },
  webServer: {
    command: 'cd client && npm run dev',
    url: 'http://localhost:YOUR_FRONTEND_PORT',
    // ...
  },
});
```

---

### 3. 首次测试运行 ✋

**步骤**:

```bash
# 1. 确保应用已启动
# 终端 1
cd server && npm run dev

# 终端 2
cd client && npm run dev

# 2. 运行测试（推荐先用 UI 模式）
npm run test:ui

# 3. 在 UI 中运行一个简单的测试查看效果
# 例如: "应该显示项目页面"

# 4. 如果测试通过，运行所有测试
npm test
```

**如果测试失败**:
1. 查看截图（在 `test-results/` 目录）
2. 查看视频录制
3. 检查控制台错误
4. 参考 `tests/QUICKSTART.md` 中的问题排查部分

---

## 📌 中优先级（建议完成）

### 4. 配置数据库清理策略（可选）

**问题**: 测试可能会在数据库中留下测试数据

**解决方案 A - 自动生成唯一数据（已实现）**:
当前测试使用时间戳确保数据唯一性，通常不会造成问题。

**解决方案 B - 定期手动清理**:
```sql
-- 清理测试数据（根据您的数据库结构调整）
DELETE FROM projects WHERE name LIKE '测试项目_%';
DELETE FROM projects WHERE name LIKE '%Test Project%';
DELETE FROM tasks WHERE title LIKE '测试任务_%';
```

**解决方案 C - 使用测试数据库（推荐）**:
```bash
# 创建 .env.test
DATABASE_URL=your_test_database_url

# 在测试前切换到测试数据库
# 需要额外配置
```

---

### 5. 调整选择器以匹配实际 UI

**可能需要调整的地方**:

测试中使用了多种选择器策略，但如果您的 UI 结构特殊，可能需要调整：

**项目相关** (`tests/e2e/projects.spec.ts`):
- 项目卡片选择器: `[data-testid="project-card"], .project-card`
- 创建按钮: `button:has-text("创建项目")`
- 删除按钮: `button:has-text("删除")`

**任务相关** (`tests/e2e/tasks.spec.ts`):
- 任务卡片选择器: `[data-testid="task-card"], .task-card`
- 看板列选择器: `[data-status="待办"], .column:has-text("待办")`

**建议**:
1. 运行测试查看哪些选择器失败
2. 使用 Playwright UI 模式的选择器工具查找正确选择器
3. 在组件中添加 `data-testid` 属性（推荐）

```tsx
// 推荐：在组件中添加 test id
<div data-testid="project-card">
  {/* ... */}
</div>
```

---

### 6. 设置 CI/CD 集成（可选）

**GitHub Actions**:

创建 `.github/workflows/e2e-tests.yml`:
```yaml
name: E2E Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: |
          npm ci
          cd client && npm ci
          cd ../server && npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
      
      - name: Setup database
        run: |
          # 配置测试数据库
          echo "DATABASE_URL=${{ secrets.TEST_DATABASE_URL }}" > server/.env
      
      - name: Start application
        run: |
          cd server && npm run dev &
          cd client && npm run dev &
          sleep 10  # 等待应用启动
      
      - name: Run E2E tests
        run: npm test
        env:
          CI: true
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

**需要配置的 GitHub Secrets**:
- `TEST_DATABASE_URL` - 测试数据库连接字符串

---

## 📝 低优先级（可选）

### 7. 添加更多浏览器测试

**当前配置**: 仅 Chromium

**扩展到多浏览器**:

修改 `playwright.config.ts`:
```typescript
projects: [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'firefox',
    use: { ...devices['Desktop Firefox'] },
  },
  {
    name: 'webkit',
    use: { ...devices['Desktop Safari'] },
  },
  // 移动端
  {
    name: 'mobile-chrome',
    use: { ...devices['Pixel 5'] },
  },
],
```

**安装浏览器**:
```bash
npx playwright install firefox webkit
```

---

### 8. 配置测试覆盖率报告

**安装依赖**:
```bash
npm install --save-dev @playwright/test nyc
```

**配置覆盖率收集**:
需要在前端项目中配置 Istanbul 插件（复杂，可选）

---

### 9. 性能测试集成

**添加性能断言**:
```typescript
test('页面加载性能', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/');
  const loadTime = Date.now() - startTime;
  
  expect(loadTime).toBeLessThan(3000); // 3秒内加载
});
```

---

### 10. 可访问性测试

**安装 axe-core**:
```bash
npm install --save-dev @axe-core/playwright
```

**添加可访问性测试**:
```typescript
import { injectAxe, checkA11y } from '@axe-core/playwright';

test('页面可访问性', async ({ page }) => {
  await page.goto('/');
  await injectAxe(page);
  await checkA11y(page);
});
```

---

## ✅ 验证清单

完成配置后，请验证以下内容：

### 基础验证
- [ ] 应用可以正常启动（前端 + 后端）
- [ ] 测试用户可以成功登录
- [ ] 至少一个测试可以成功运行
- [ ] 测试报告可以正常生成

### 功能验证
- [ ] 项目管理测试全部通过
- [ ] 任务管理测试全部通过
- [ ] 截图和视频正常保存
- [ ] UI 模式可以正常使用

### 文档验证
- [ ] 阅读了 `tests/README.md`
- [ ] 阅读了 `tests/QUICKSTART.md`
- [ ] 理解了测试结构和执行流程

---

## 🆘 需要帮助？

### 快速命令

```bash
# 测试登录功能
npm run test:ui
# 然后在 UI 中只运行登录相关的测试

# 查看测试失败原因
npm run test:report

# 调试特定测试
npx playwright test --debug -g "应该成功创建新项目"
```

### 常见问题速查

| 问题 | 解决方法 | 文档位置 |
|------|---------|---------|
| 测试超时 | 检查应用是否启动 | QUICKSTART.md |
| 登录失败 | 验证测试用户 | 本文档 #1 |
| 元素未找到 | 使用 UI 模式检查选择器 | README.md |
| 端口错误 | 检查配置文件 | 本文档 #2 |

### 联系方式

- 📖 查看完整文档: `tests/README.md`
- 🚀 快速开始: `tests/QUICKSTART.md`
- 📝 实施总结: `docs/E2E测试/FINAL_E2E测试实施.md`

---

## 📊 完成进度追踪

使用以下清单追踪您的完成进度：

```markdown
## 我的进度

### 高优先级
- [ ] 1. 确认测试用户账号
- [ ] 2. 验证应用端口配置
- [ ] 3. 首次测试运行

### 中优先级  
- [ ] 4. 配置数据库清理策略
- [ ] 5. 调整选择器以匹配实际 UI
- [ ] 6. 设置 CI/CD 集成

### 低优先级
- [ ] 7. 添加更多浏览器测试
- [ ] 8. 配置测试覆盖率报告
- [ ] 9. 性能测试集成
- [ ] 10. 可访问性测试

### 验证
- [ ] 基础验证完成
- [ ] 功能验证完成
- [ ] 文档验证完成
```

---

**最后更新**: 2025-10-31  
**优先级**: 🔥 高 | 📌 中 | 📝 低  
**状态**: ⏳ 待完成


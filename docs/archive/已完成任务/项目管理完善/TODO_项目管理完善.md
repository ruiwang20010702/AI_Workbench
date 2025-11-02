# 项目管理功能完善 - 待办事项

## 剩余工作

### 1. 修复 E2E 测试 (高优先级) 🔴

#### 1.1 创建测试辅助函数
**文件**: `tests/e2e/helpers/projects.ts` (新建)

**需要创建的辅助函数**:
```typescript
/**
 * 创建测试项目（使用4步向导）
 */
export async function createTestProject(
  page: Page,
  projectData: {
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<void> {
  // 1. 点击创建项目按钮
  // 2. 填写第1步：基本信息
  // 3. 点击"下一步"3次
  // 4. 点击"创建项目"
  // 5. 等待项目创建成功
}
```

**预计时间**: 1小时

#### 1.2 修复"查看项目详情"测试
**文件**: `tests/e2e/projects.spec.ts:112`

**问题**: 使用旧的单步创建流程

**修复方案**:
```typescript
test('应该成功查看项目详情', async ({ page }) => {
  // 使用新的辅助函数创建测试项目
  await createTestProject(page, {
    name: generateProjectName('详情测试项目')
  });
  
  // 查找项目卡片
  const projectCard = page.locator('[data-testid="project-card"]').first();
  
  // 点击"更多"按钮
  await projectCard.locator('button[aria-label="更多操作"]').click();
  
  // 点击"查看详情"
  await page.click('text=查看详情');
  
  // 验证详情弹窗打开
  await page.waitForSelector('[role="dialog"]');
  
  // 验证详情内容（项目名称、统计数据等）
  // ...
});
```

**预计时间**: 30分钟

#### 1.3 修复"删除项目"测试
**文件**: `tests/e2e/projects.spec.ts:201`

**问题**: 使用旧的单步创建流程

**修复方案**:
```typescript
test('应该成功删除项目', async ({ page }) => {
  const projectToDelete = generateProjectName('待删除项目');
  
  // 使用新的辅助函数创建测试项目
  await createTestProject(page, { name: projectToDelete });
  
  // 查找项目卡片
  const projectCard = page.locator(`text=${projectToDelete}`).locator('..').locator('..');
  
  // 点击"更多"按钮
  await projectCard.locator('button[aria-label="更多操作"]').click();
  
  // 点击"删除"
  await page.click('text=删除项目');
  
  // 确认删除（浏览器的 confirm 对话框）
  page.once('dialog', dialog => dialog.accept());
  
  // 验证项目已从列表中移除
  await page.waitForSelector(`text=${projectToDelete}`, { state: 'hidden', timeout: 5000 });
});
```

**预计时间**: 30分钟

#### 1.4 修复"编辑项目"测试
**文件**: `tests/e2e/projects.spec.ts:149`

**问题**: 当前被跳过

**修复方案**:
```typescript
test('应该成功编辑项目', async ({ page }) => {
  const originalName = generateProjectName('原始项目');
  const updatedName = generateProjectName('更新后的项目');
  
  // 创建测试项目
  await createTestProject(page, { name: originalName });
  
  // 查找并点击编辑
  const projectCard = page.locator(`text=${originalName}`).locator('..').locator('..');
  await projectCard.locator('button[aria-label="更多操作"]').click();
  await page.click('text=编辑项目');
  
  // 等待编辑弹窗打开
  await page.waitForSelector('[role="dialog"]');
  
  // 修改项目名称（第1步）
  await page.fill('input[placeholder*="项目名称"]', updatedName);
  
  // 导航到最后一步
  for (let i = 0; i < 3; i++) {
    await page.click('button:has-text("下一步")');
  }
  
  // 提交更改
  await page.click('button[type="submit"]:has-text("保存更改")');
  
  // 等待弹窗关闭
  await page.waitForTimeout(2000);
  
  // 验证更新后的名称出现
  await page.waitForSelector(`text=${updatedName}`);
});
```

**预计时间**: 30分钟

#### 1.5 修复"切换视图模式"测试
**文件**: `tests/e2e/projects.spec.ts:244`

**问题**: 类名验证逻辑不正确

**当前问题**:
- 期望类名包含 `active|selected|bg-blue`
- 实际激活状态使用 `bg-white text-gray-900 shadow-sm`

**修复方案**:
```typescript
test('应该能够切换视图模式', async ({ page }) => {
  const viewModes = ['看板视图', '甘特图', '层级视图', '仪表盘'];
  
  for (const mode of viewModes) {
    const button = page.locator(`button:has-text("${mode}")`).first();
    await button.click();
    
    // 等待视图切换
    await page.waitForTimeout(500);
    
    // 验证按钮状态（检查 bg-white 和 shadow-sm 类）
    await expect(button).toHaveClass(/bg-white.*shadow-sm/);
  }
});
```

**预计时间**: 15分钟

#### 1.6 修复"状态筛选"测试
**文件**: `tests/e2e/projects.spec.ts:291`

**问题**: 未执行到

**修复方案**:
1. 先运行其他测试确保通过
2. 检查是否需要额外的修复

**预计时间**: 30分钟

**总预计时间**: 约 **3.5 小时**

---

### 2. 配置和环境 (中优先级) 🟡

#### 2.1 确保应用自动启动
**问题**: E2E测试运行前需要手动启动 `npm run dev`

**解决方案**:
- 选项A: 在 `playwright.config.ts` 中配置 `webServer`
- 选项B: 创建 `npm run test:e2e` 脚本自动启动

**建议配置** (`playwright.config.ts`):
```typescript
export default defineConfig({
  // ...
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

**预计时间**: 30分钟

#### 2.2 CI/CD 集成
**文件**: `.github/workflows/e2e-tests.yml` (如果使用 GitHub Actions)

**建议配置**:
```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

**预计时间**: 1小时

---

### 3. 代码优化 (低优先级) 🟢

#### 3.1 添加单元测试
**建议测试的组件**:
- `ProjectCard.tsx` - 测试渲染、事件处理
- `ProjectDetailModal.tsx` - 测试数据加载、显示

**工具**: Jest + React Testing Library

**预计时间**: 2-3小时

#### 3.2 性能优化
**建议**:
- 使用 `React.memo` 包装 `ProjectCard` 避免不必要的重渲染
- 考虑虚拟滚动（如果项目数量很多）

**预计时间**: 1-2小时

#### 3.3 错误处理增强
**建议**:
- 统一的错误提示组件（Toast/Notification）
- 网络错误重试机制
- 加载状态的骨架屏

**预计时间**: 2-3小时

---

## 快速开始指南

### 立即修复 E2E 测试

1. **创建辅助函数**:
```bash
# 创建新文件
touch tests/e2e/helpers/projects.ts
```

2. **实现 createTestProject 函数**:
   - 参考 `tests/e2e/projects.spec.ts:45` 中的创建流程
   - 提取为可复用的函数

3. **逐个修复测试**:
```bash
# 测试单个用例
npx playwright test tests/e2e/projects.spec.ts --grep "查看项目详情"

# 测试所有项目用例
npx playwright test tests/e2e/projects.spec.ts
```

4. **验证所有测试通过**:
```bash
npx playwright test
```

---

## 操作指引

### 运行 E2E 测试

**前提条件**:
- 应用已启动 (`npm run dev`)
- 数据库已运行
- 测试用户已创建 (`test@example1.com` / `Test123456!`)

**命令**:
```bash
# 运行所有项目测试
npx playwright test tests/e2e/projects.spec.ts

# 运行特定测试
npx playwright test tests/e2e/projects.spec.ts --grep "创建新项目"

# 带界面运行（调试）
npx playwright test tests/e2e/projects.spec.ts --headed

# 生成测试报告
npx playwright test --reporter=html
npx playwright show-report
```

### 查看测试视频和截图
```bash
# 测试失败后会生成 test-results 目录
ls test-results/

# 查看追踪日志
npx playwright show-trace test-results/[测试名称]/trace.zip
```

### 调试测试
```bash
# 使用 Playwright Inspector
PWDEBUG=1 npx playwright test tests/e2e/projects.spec.ts --grep "创建新项目"
```

---

## 需要的配置

### 环境变量
确保以下环境变量已配置（在 `.env` 文件中）:

```env
# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/ai_workbench

# JWT
JWT_SECRET=your-secret-key

# 应用端口
VITE_API_BASE_URL=http://localhost:3001
PORT=3001
```

### 测试数据
确保测试用户已创建：
- **邮箱**: `test@example1.com`
- **密码**: `Test123456!`

**创建测试用户**:
```bash
# 方式1：通过注册页面手动创建
# 访问 http://localhost:5173/register

# 方式2：通过API创建（如果有脚本）
npm run create-test-user
```

---

## 优先级排序

### 本周完成 🔴
1. ✅ 创建测试辅助函数 (1小时)
2. ✅ 修复"查看项目详情"测试 (30分钟)
3. ✅ 修复"删除项目"测试 (30分钟)
4. ✅ 修复"编辑项目"测试 (30分钟)
5. ✅ 修复"切换视图模式"测试 (15分钟)

**总计**: ~2.5小时

### 下周完成 🟡
6. 配置自动启动应用 (30分钟)
7. 修复"状态筛选"测试 (30分钟)
8. CI/CD 集成 (1小时)

**总计**: ~2小时

### 后续完成 🟢
9. 添加单元测试 (2-3小时)
10. 性能优化 (1-2小时)
11. 错误处理增强 (2-3小时)

**总计**: ~5-8小时

---

## 联系支持

如果遇到以下问题，请联系开发团队：
- E2E 测试持续失败
- 无法启动应用
- 数据库连接问题
- 测试用户无法登录

**调试清单**:
1. ✅ 应用是否在运行？(`curl http://localhost:5173`)
2. ✅ 后端API是否响应？(`curl http://localhost:3001/health`)
3. ✅ 数据库是否连接？(检查日志)
4. ✅ 测试用户是否存在？(尝试手动登录)
5. ✅ 浏览器驱动是否安装？(`npx playwright install`)

---

## 完成标准

所有待办事项完成后，应该达到：
- ✅ 所有 E2E 测试通过 (8/8)
- ✅ CI/CD 集成配置完成
- ✅ 测试运行自动化
- ✅ 代码覆盖率 > 80% (如果添加单元测试)
- ✅ 性能指标达标
- ✅ 错误处理完善


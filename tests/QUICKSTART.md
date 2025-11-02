# 🚀 E2E 测试快速入门

## 前置准备

### 1. 确保应用正在运行

**终端 1 - 启动后端**:
```bash
cd /Users/ruiwang/Desktop/AI_Workbench/server
npm run dev
```

**终端 2 - 启动前端**:
```bash
cd /Users/ruiwang/Desktop/AI_Workbench/client
npm run dev
```

应用应该在以下地址运行：
- 前端: http://localhost:5173
- 后端: http://localhost:5000

---

## 运行测试

### 方式 1: 标准测试运行（推荐新手）

```bash
# 在项目根目录运行
npm test
```

这会在无头模式下运行所有测试，适合快速验证。

### 方式 2: UI 模式（推荐开发时使用）⭐

```bash
npm run test:ui
```

**优势**：
- ✅ 可视化测试界面
- ✅ 逐步调试
- ✅ 时间轴回放
- ✅ 实时查看元素选择器

### 方式 3: 显示浏览器运行

```bash
npm run test:headed
```

在真实浏览器中查看测试执行过程。

### 方式 4: 调试模式

```bash
npm run test:debug
```

打开 Playwright Inspector 进行详细调试。

---

## 运行特定测试

### 只测试项目管理功能

```bash
npm run test:projects
```

### 只测试任务管理功能

```bash
npm run test:tasks
```

### 运行特定测试用例

```bash
npx playwright test -g "应该成功创建新项目"
```

---

## 查看测试结果

### 查看 HTML 报告

```bash
npm run test:report
```

报告包含：
- 测试通过/失败统计
- 执行时间
- 失败截图
- 追踪记录

---

## 常见场景

### 场景 1: 第一次运行测试

```bash
# 1. 确保应用已启动（前端 + 后端）
# 2. 运行测试
npm test

# 3. 查看报告
npm run test:report
```

### 场景 2: 调试失败的测试

```bash
# 1. 以 UI 模式运行
npm run test:ui

# 2. 选择失败的测试
# 3. 点击"逐步执行"
# 4. 查看失败原因
```

### 场景 3: 开发新功能时

```bash
# 1. 以 headed 模式运行相关测试
npm run test:headed

# 2. 观察浏览器中的行为
# 3. 根据需要调整测试或代码
```

### 场景 4: CI/CD 集成

```bash
# 在 CI 环境中运行（无头模式）
npm test -- --reporter=json
```

---

## 测试结果说明

### ✅ 成功测试

```
✓ tests/e2e/projects.spec.ts:15:5 › 应该成功创建新项目 (5s)
```

测试通过，耗时 5 秒。

### ❌ 失败测试

```
✗ tests/e2e/projects.spec.ts:25:5 › 应该成功编辑项目 (3s)

  Error: element not found: button[text="保存"]
  
  - 截图: test-results/projects-edit/test-failed-1.png
  - 视频: test-results/projects-edit/video.webm
```

测试失败，并保存了截图和视频。

### ⊘ 跳过测试

```
⊘ tests/e2e/tasks.spec.ts:45:5 › 应该能够拖拽任务
```

测试被跳过（通常因为前置条件不满足）。

---

## 快速排查指南

### 问题 1: 测试超时

```
TimeoutError: page.goto: Timeout 30000ms exceeded
```

**原因**: 应用未启动或网络慢

**解决**:
1. 检查前后端是否正在运行
2. 访问 http://localhost:5173 确认应用可访问
3. 检查网络连接

### 问题 2: 元素未找到

```
Error: Element not found: button[text="创建项目"]
```

**原因**: UI 已更改或加载慢

**解决**:
1. 以 UI 模式运行查看实际页面
2. 使用 Playwright Inspector 选择器工具
3. 检查页面是否完全加载

### 问题 3: 登录失败

```
Error: Login failed
```

**原因**: 测试用户不存在或凭据错误

**解决**:
1. 确认数据库中有测试用户
2. 检查 `helpers/auth.ts` 中的凭据
3. 手动测试登录功能

### 问题 4: 数据库状态问题

```
Error: Project already exists
```

**原因**: 之前测试留下的数据

**解决**:
1. 清理测试数据
2. 使用唯一的测试数据（已在代码中实现）
3. 重置测试数据库

---

## 测试文件结构

```
tests/
├── e2e/
│   ├── helpers/           # 辅助函数
│   │   ├── auth.ts       # 登录/注册
│   │   └── common.ts     # 通用工具
│   ├── projects.spec.ts  # 项目测试 (8 个测试)
│   └── tasks.spec.ts     # 任务测试 (7 个测试)
├── README.md             # 完整文档
└── QUICKSTART.md         # 本文件
```

---

## 实用命令速查

| 命令 | 说明 | 使用场景 |
|------|------|---------|
| `npm test` | 运行所有测试 | 快速验证 |
| `npm run test:ui` | UI 模式 | 开发调试 |
| `npm run test:headed` | 显示浏览器 | 观察行为 |
| `npm run test:debug` | 调试模式 | 深度调试 |
| `npm run test:projects` | 测试项目功能 | 项目相关开发 |
| `npm run test:tasks` | 测试任务功能 | 任务相关开发 |
| `npm run test:report` | 查看报告 | 查看结果 |
| `npx playwright test --last-failed` | 重跑失败测试 | 快速修复 |

---

## 下一步

1. **阅读完整文档**: [README.md](./README.md)
2. **了解 Playwright**: [官方文档](https://playwright.dev/)
3. **编写新测试**: 参考现有测试文件
4. **配置 CI**: 添加 GitHub Actions

---

## 需要帮助？

- 📖 查看 [README.md](./README.md) 获取详细文档
- 🐛 查看测试报告中的截图和视频
- 🔍 使用 UI 模式逐步调试
- 💬 检查控制台输出

---

**祝测试愉快！** 🎉


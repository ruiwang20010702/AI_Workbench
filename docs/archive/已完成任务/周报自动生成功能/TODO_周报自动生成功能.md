# TODO：周报自动生成功能 - 待办事项清单

**创建日期**: 2025-10-30  
**优先级**: 🔴 高优先级 | 🟡 中优先级 | 🟢 低优先级

---

## 🔴 **立即需要完成的配置**

### 0. 配置Supabase MCP（强烈推荐）

**任务**: 配置MCP让AI直接操作数据库，自动执行迁移脚本

**为什么需要**:
- ✅ AI可以直接执行数据库迁移
- ✅ 自动验证表结构和数据
- ✅ 快速调试数据问题
- ✅ 无需手动执行SQL

**操作步骤**:
```bash
# 1. 查看快速开始指南
cat docs/QUICK_START_MCP.md

# 2. 在Cursor设置中配置MCP（需要Supabase凭证）
# 3. 重启Cursor
# 4. 让AI执行: "请查询数据库中有哪些表"
```

**详细文档**: `docs/SUPABASE_MCP_SETUP.md`  
**快速开始**: `docs/QUICK_START_MCP.md`

**完成后的好处**:
- 🎉 后续步骤可以让AI自动完成
- 🎉 无需手动执行SQL脚本
- 🎉 实时验证配置结果

---

### 1. 数据库初始化

**任务**: 执行数据库迁移脚本，创建周报相关表

**操作步骤**:
```bash
# 进入服务器目录
cd server

# 运行SQL脚本
psql -h <your-database-host> -U <your-user> -d <your-database> -f database/create-weekly-reports-tables.sql

# 或使用Supabase Dashboard直接执行SQL
```

**SQL文件位置**: `/server/database/create-weekly-reports-tables.sql`

**验证方法**:
```sql
-- 检查表是否创建成功
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('weekly_reports', 'report_templates');

-- 检查默认模板是否插入
SELECT * FROM report_templates WHERE is_default = true;
```

**预期结果**:
- ✅ `weekly_reports` 表已创建
- ✅ `report_templates` 表已创建
- ✅ 至少有一个默认模板

**潜在问题**:
- ❗ 如果用户表为空，默认模板插入会失败
  - **解决方案**: 先确保至少有一个用户，或修改SQL脚本去掉默认模板插入

---

### 2. 安装新的依赖包

**任务**: 安装周报功能所需的npm包

**服务端依赖** (`server/`):
```bash
cd server
npm install mustache marked docx
npm install --save-dev @types/mustache @types/marked
```

**客户端依赖** (`client/`):
```bash
cd client
npm install
# 无需额外安装，已有的依赖足够
```

**验证方法**:
```bash
# 检查package.json中是否已添加依赖
grep -E "(mustache|marked|docx)" server/package.json
```

**预期结果**:
- ✅ `mustache@^4.2.0`
- ✅ `marked@^11.1.1`
- ✅ `docx@^8.5.0`
- ✅ `@types/mustache@^4.2.5`
- ✅ `@types/marked@^6.0.0`

---

### 3. 重新构建项目

**任务**: 编译TypeScript并启动服务

**操作步骤**:
```bash
# 服务端编译
cd server
npm run build

# 客户端编译（如果生产环境）
cd ../client
npm run build

# 开发环境启动
cd ..
npm run dev
```

**验证方法**:
```bash
# 检查编译是否成功
ls server/dist/services/WeeklyReportAggregator.js
ls server/dist/controllers/weeklyReportController.js
ls server/dist/routes/weeklyReports.js
```

**预期结果**:
- ✅ 编译无错误
- ✅ 服务正常启动
- ✅ 前端页面可访问

---

## 🟡 **推荐尽快完成的配置**

### 4. 配置Git数据源（可选但推荐）

**任务**: 配置GitHub访问以启用Git统计功能

**配置方式**: 在`.env`文件中添加

**服务端环境变量** (`.env`):
```bash
# Git数据源配置
GIT_DATASOURCE_ENABLED=true
GIT_PROVIDER=github  # github | gitlab | gitee
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxx
GITHUB_USERNAME=your-github-username
GITHUB_REPOSITORIES=user/repo1,user/repo2  # 可选，留空则查询所有仓库
```

**获取GitHub Token步骤**:
1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 选择权限: `repo` (Full control of private repositories)
4. 生成并复制token
5. 添加到`.env`文件

**验证方法**:
```bash
# 测试Git数据源连接（需要实现测试接口）
curl -X POST http://localhost:3000/api/reports/weekly/generate \
  -H "Authorization: Bearer $YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "week_start_date": "2025-10-23",
    "week_end_date": "2025-10-29"
  }'
  
# 检查返回的metadata中是否包含git数据
```

**注意事项**:
- ⚠️ Token应妥善保管，不要泄露
- ⚠️ Token有访问速率限制（GitHub: 5000次/小时）
- ⚠️ 如果不配置，Git数据源会自动禁用，不影响其他功能

---

### 5. 检查AI Service配置

**任务**: 确认AI服务可用，用于周报优化和建议

**验证方法**:
```bash
# 检查环境变量
echo $SILICONFLOW_API_KEY
echo $OPENAI_API_KEY

# 测试AI服务
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Authorization: Bearer $YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "测试", "maxTokens": 50}'
```

**预期结果**:
- ✅ AI API Key已配置
- ✅ AI服务响应正常

**如果AI服务不可用**:
- 周报依然可以生成，但以下功能会被禁用：
  - ❌ AI自动优化
  - ❌ 改进建议生成
  - ❌ 摘要生成
  - ❌ 风险识别

---

## 🟢 **建议后续完成的优化**

### 6. 添加导航入口

**任务**: 在主导航菜单中添加"周报"入口

**需要修改的文件**: `client/src/components/layout/Sidebar.tsx`

**参考代码**:
```tsx
{
  path: '/reports/weekly',
  name: '周报管理',
  icon: <FileText className="w-5 h-5" />,
}
```

**建议位置**: 在"AI助手"和"项目管理"之间

---

### 7. 编写单元测试

**任务**: 为核心服务添加单元测试

**需要测试的模块**:
- `WeeklyReportAggregator.ts`
- `TemplateEngine.ts`
- `DocxGenerator.ts`
- `AIReportOptimizer.ts`

**测试框架**: Jest（已安装）

**参考命令**:
```bash
cd server
npm test
```

---

### 8. 优化Docx导出样式

**任务**: 改进Word文档的格式和样式

**建议改进**:
- 添加页眉页脚
- 优化标题样式（字体、颜色）
- 添加目录
- 改进表格样式
- 添加图表支持

**参考文件**: `server/src/services/DocxGenerator.ts`

---

### 9. 实现日历数据源

**任务**: 添加日历事件统计功能

**需要实现**:
- 创建 `CalendarDataSource.ts`
- 实现 `IDataSource` 接口
- 统计会议、事件时长
- 注册到 `DataSourceFactory`

**数据格式**:
```typescript
calendar: {
  events: [
    { title: '项目会议', start: '...', end: '...', type: 'meeting' }
  ],
  meetings_count: 10,
  total_hours: 8.5
}
```

---

### 10. 添加周报定时生成

**任务**: 实现周报自动生成和提醒功能

**功能描述**:
- 每周一自动生成上周周报草稿
- 发送邮件或站内通知提醒用户
- 支持自定义生成时间

**技术方案**:
- 使用 `node-cron` 实现定时任务
- 集成通知系统
- 添加用户配置界面

---

## 🧪 **测试清单**

### 功能测试

- [ ] **周报生成**
  - [ ] 选择本周时间范围
  - [ ] 选择默认模板
  - [ ] 点击生成
  - [ ] 确认预览正常显示

- [ ] **模板切换**
  - [ ] 创建新模板
  - [ ] 使用新模板生成周报
  - [ ] 确认内容符合模板

- [ ] **导出功能**
  - [ ] 导出Docx格式
  - [ ] 导出Markdown格式
  - [ ] 导出HTML格式
  - [ ] 打开文件确认格式正确

- [ ] **AI优化**
  - [ ] 生成周报后点击"AI优化"
  - [ ] 确认内容有改进
  - [ ] 点击"获取建议"
  - [ ] 确认建议合理

- [ ] **历史管理**
  - [ ] 查看历史周报列表
  - [ ] 点击查看详情
  - [ ] 发布草稿
  - [ ] 删除周报

### 边界测试

- [ ] **空数据场景**
  - [ ] 新用户（无任务/项目/笔记）生成周报
  - [ ] 确认不报错，显示空状态提示

- [ ] **大数据场景**
  - [ ] 大量任务（100+）的周报生成
  - [ ] 确认性能可接受

- [ ] **错误处理**
  - [ ] 网络断开情况
  - [ ] AI服务不可用
  - [ ] 模板语法错误

---

## 📋 **用户验收检查表**

### 基本功能
- [ ] 可以选择时间范围生成周报
- [ ] 可以查看周报预览
- [ ] 可以下载Word文档
- [ ] 可以查看历史周报
- [ ] 可以发布和删除周报

### 进阶功能
- [ ] AI优化功能正常工作
- [ ] 可以创建自定义模板
- [ ] Git统计数据正确显示（如果配置）
- [ ] 统计数据准确（任务、项目、工时）

### 用户体验
- [ ] 界面直观易用
- [ ] 操作流程顺畅
- [ ] 错误提示清晰
- [ ] 响应速度可接受

---

## 🔧 **常见问题排查**

### 问题1: 数据库表创建失败

**现象**: SQL脚本执行报错

**可能原因**:
- 用户表为空，默认模板插入失败
- 数据库权限不足
- 表已存在

**解决方案**:
```sql
-- 方案1: 先创建测试用户
INSERT INTO users (id, email, username, password) 
VALUES (gen_random_uuid(), 'test@example.com', 'testuser', 'hashedpassword');

-- 方案2: 修改SQL脚本，去掉默认模板插入部分
-- 然后手动通过API创建模板

-- 方案3: 删除已存在的表（谨慎操作！）
DROP TABLE IF EXISTS weekly_reports CASCADE;
DROP TABLE IF NOT EXISTS report_templates CASCADE;
```

---

### 问题2: 编译错误

**现象**: `npm run build` 报TypeScript错误

**可能原因**:
- 缺少类型定义
- 导入路径错误
- 依赖未安装

**解决方案**:
```bash
# 删除node_modules重新安装
rm -rf node_modules package-lock.json
npm install

# 检查TypeScript版本
npm list typescript

# 重新编译
npm run build
```

---

### 问题3: API 404错误

**现象**: 调用 `/api/reports/weekly/*` 返回404

**可能原因**:
- 路由未正确注册
- 服务未重启
- 路径拼写错误

**解决方案**:
```bash
# 检查路由注册
grep -r "weeklyReportsRoutes" server/src/routes/index.ts

# 重启服务
npm run dev

# 查看服务日志
```

---

### 问题4: 周报内容为空

**现象**: 生成的周报没有数据

**可能原因**:
- 选择的时间范围内没有任务/项目/笔记
- 数据源查询失败
- 模板渲染问题

**解决方案**:
```bash
# 检查后端日志
# 查找 [WeeklyReportAggregator] 和 [InternalDataSource] 的日志

# 手动测试数据查询
curl -X GET http://localhost:3000/api/tasks \
  -H "Authorization: Bearer $YOUR_JWT_TOKEN"

# 检查时间范围是否正确
# 确保 week_start_date 和 week_end_date 格式为 YYYY-MM-DD
```

---

## 📞 **支持与反馈**

如果在配置过程中遇到问题：

1. **查看日志**: 
   - 服务端: 查看console输出或日志文件
   - 浏览器: 打开开发者工具查看Network和Console

2. **验证环境**: 
   - 检查Node.js版本（推荐v18+）
   - 检查PostgreSQL版本
   - 检查环境变量配置

3. **参考文档**:
   - `DESIGN_周报自动生成功能.md` - 架构设计
   - `FINAL_周报自动生成功能.md` - 项目总结
   - 代码注释

---

**更新日期**: 2025-10-30  
**文档状态**: ✅ 完整

*祝配置顺利！🎉*
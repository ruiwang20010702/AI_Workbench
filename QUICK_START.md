# 🚀 AI Workbench 快速启动指南

> **配置日期**: 2025-10-31  
> **预计完成时间**: 30-45 分钟  
> **难度**: ⭐⭐☆☆☆ 简单

---

## 📋 前置准备

在开始之前，请确保你有：

- ✅ Node.js 18+ 已安装
- ✅ npm 或 yarn 已安装
- ✅ Git 已安装
- ✅ 一个文本编辑器
- ✅ 互联网连接

---

## ⚡ 快速启动（3 步）

### 步骤 1：配置环境变量（15 分钟）

#### 1.1 创建环境变量文件

```bash
# 进入项目目录
cd /Users/ruiwang/Desktop/AI_Workbench

# 创建服务端 .env
cat server_env_template.txt > server/.env

# 创建前端 .env
cat client_env_template.txt > client/.env
```

#### 1.2 获取 Supabase 配置（5 分钟）

1. 访问 https://supabase.com 并登录
2. 创建新项目或选择现有项目
   - 项目名称：ai-workbench
   - 数据库密码：**请保存好！**
   - 区域：Tokyo（推荐中国用户）
3. 等待项目创建完成（约 1-2 分钟）
4. 进入 Settings → API
5. 复制以下配置到 `server/.env`：
   - `SUPABASE_URL` ← Project URL
   - `SUPABASE_ANON_KEY` ← anon public
   - `SUPABASE_SERVICE_ROLE_KEY` ← service_role secret

#### 1.3 获取 SiliconFlow API Key（5 分钟）

1. 访问 https://siliconflow.cn 并注册
2. 完成登录和实名认证
3. 进入控制台 → API 密钥
4. 点击"创建新密钥"
5. 复制密钥到 `server/.env` 的 `SILICONFLOW_API_KEY`

#### 1.4 生成 JWT Secret（1 分钟）

```bash
# 生成随机密钥
openssl rand -hex 64

# 复制输出的密钥到 server/.env 的 JWT_SECRET
```

**完成后的 server/.env 应该类似**：
```bash
SUPABASE_URL=https://abcdefg.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
JWT_SECRET=9a8b7c6d5e4f3a2b1c...
SILICONFLOW_API_KEY=sk-xxxxxxxxxx
```

---

### 步骤 2：初始化数据库（10 分钟）

#### 2.1 打开 Supabase SQL Editor

1. 进入你的 Supabase 项目
2. 点击左侧菜单的 "SQL Editor"
3. 点击 "+ New query"

#### 2.2 执行数据库脚本

**依次执行以下 3 个脚本**（顺序很重要）：

##### 脚本 1：基础表结构
```bash
# 复制 server/src/config/init-database.sql 的内容
# 粘贴到 SQL Editor
# 点击 "Run" 执行
```
创建：`users`, `notes`, `todos`, `notifications`, `ai_usage_log`

##### 脚本 2：项目管理表
```bash
# 复制 server/database/create-project-tables.sql 的内容
# 粘贴到 SQL Editor
# 点击 "Run" 执行
```
创建：`projects`, `project_members`, `tasks`

##### 脚本 3：周报功能表
```bash
# 复制 server/database/create-weekly-reports-tables.sql 的内容
# 粘贴到 SQL Editor
# 点击 "Run" 执行
```
创建：`weekly_reports`, `report_templates`

#### 2.3 验证数据库（可选但推荐）

在 SQL Editor 中执行：
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**应该看到 10 个表**：
- ai_usage_log
- notes
- notifications
- project_members
- projects
- report_templates
- tasks
- todos
- users
- weekly_reports

---

### 步骤 3：启动应用（5 分钟）

#### 3.1 安装依赖

```bash
# 终端 1：后端依赖
cd /Users/ruiwang/Desktop/AI_Workbench/server
npm install

# 终端 2：前端依赖
cd /Users/ruiwang/Desktop/AI_Workbench/client
npm install
```

#### 3.2 启动服务

```bash
# 终端 1：启动后端
cd /Users/ruiwang/Desktop/AI_Workbench/server
npm run dev

# 等待看到：
# ✅ Server running on port 5000
# ✅ Database connected successfully

# 终端 2：启动前端
cd /Users/ruiwang/Desktop/AI_Workbench/client
npm run dev

# 等待看到：
# ✅ VITE ready on http://localhost:5173
```

#### 3.3 访问应用

打开浏览器访问：
- **前端**: http://localhost:5173
- **后端 API**: http://localhost:5000

---

## ✅ 验证启动成功

### 检查清单

- [ ] 后端终端显示 "Server running on port 5000"
- [ ] 前端自动打开 http://localhost:5173
- [ ] 浏览器控制台无错误
- [ ] 可以看到登录/注册页面
- [ ] 后端日志无错误

### 功能测试

1. **注册新用户**
   - 填写邮箱和密码
   - 点击注册
   - 应该自动登录

2. **创建一条笔记**
   - 进入笔记页面
   - 点击"新建笔记"
   - 输入内容并保存

3. **使用 AI 助手**
   - 进入 AI 助手页面
   - 输入提示词
   - 查看 AI 生成的内容

**如果以上都正常，恭喜你！🎉 配置成功！**

---

## 🔧 常见问题排查

### Q1: 后端启动报错 "Supabase config missing"

**原因**: 环境变量未正确加载

**解决方案**:
```bash
# 1. 检查 .env 文件是否存在
ls -la server/.env

# 2. 检查环境变量内容
cat server/.env | grep SUPABASE_URL

# 3. 确保没有多余的空格和引号
# ✅ 正确：SUPABASE_URL=https://xxx.supabase.co
# ❌ 错误：SUPABASE_URL = "https://xxx.supabase.co"
```

---

### Q2: 前端无法连接后端

**原因**: API URL 配置错误或后端未启动

**解决方案**:
```bash
# 1. 确认后端已启动
curl http://localhost:5000/api/health

# 2. 检查前端配置
cat client/.env
# 应该是：VITE_API_URL=http://localhost:5000/api

# 3. 重启前端
cd client
npm run dev
```

---

### Q3: AI 功能报错 401 Unauthorized

**原因**: API Key 无效或过期

**解决方案**:
```bash
# 1. 验证 API Key
cat server/.env | grep SILICONFLOW_API_KEY

# 2. 测试 API Key
curl -X POST "https://api.siliconflow.cn/v1/chat/completions" \
  -H "Authorization: Bearer $SILICONFLOW_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"Qwen/Qwen2.5-7B-Instruct","messages":[{"role":"user","content":"Hi"}]}'

# 3. 如果失败，重新生成 API Key
# 登录 SiliconFlow → API 密钥 → 创建新密钥
```

---

### Q4: 数据库表不存在

**原因**: SQL 脚本未执行或执行失败

**解决方案**:
1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 执行验证查询（见步骤 2.3）
4. 如果表缺失，重新执行对应的 SQL 脚本

---

### Q5: 端口被占用

**错误信息**: `EADDRINUSE: address already in use :::5000`

**解决方案**:
```bash
# 查找占用端口的进程
lsof -i :5000

# 杀死进程
kill -9 <PID>

# 或者修改端口
# 编辑 server/.env
PORT=5001
```

---

## 📚 下一步

### 🎓 学习使用

- 📖 查看 [README.md](README.md) 了解所有功能
- 📊 探索周报功能：`docs/周报自动生成功能/`
- 🤖 了解 AI 功能：`docs/AI应用功能/`

### 🔧 配置优化

- ✅ 使用配置检查清单：`docs/项目诊断/配置检查清单.md`
- 🔐 阅读安全最佳实践：`docs/项目诊断/环境变量配置说明.md`
- 📊 查看项目诊断报告：`docs/项目诊断/项目代码诊断报告.md`

### 🚀 部署到生产

- 🌐 Railway 部署：`docs/RAILWAY_DEPLOYMENT.md`
- 🐳 Docker 部署：`docs/DEPLOYMENT.md`
- ☁️ Vercel 部署（前端）：`docs/VERCEL_DEPLOYMENT.md`

---

## 🆘 获取帮助

如果遇到问题：

1. **查看文档**
   - `docs/项目诊断/快速修复指南.md`
   - `docs/项目诊断/环境变量配置说明.md`

2. **检查日志**
   - 后端日志（终端输出）
   - 前端控制台（F12）
   - 浏览器 Network 标签

3. **使用检查清单**
   - `docs/项目诊断/配置检查清单.md`

4. **联系支持**
   - 提交 Issue
   - 查看现有问题

---

## 🎉 完成！

你已经成功配置并启动了 AI Workbench！

现在你可以：
- ✍️ 创建和管理笔记
- ✅ 管理待办事项
- 🤖 使用 AI 助手生成内容
- 📊 管理项目和任务
- 📄 自动生成周报

**享受你的 AI 工作台吧！** 🚀

---

**最后更新**: 2025-10-31  
**文档版本**: 1.0  
**预计完成时间**: 30-45 分钟

有任何问题随时查阅文档或寻求帮助！

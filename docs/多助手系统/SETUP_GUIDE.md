# 多助手系统 - 快速配置指南

**目标**: 帮助你快速配置并运行多助手系统

---

## 📋 前置要求

- ✅ Node.js 16+ 已安装
- ✅ 有Supabase账号和项目
- ✅ 有OpenAI API Key

---

## 🔧 步骤1: 配置环境变量

### 1.1 检查配置文件

确认`server/.env`文件存在。如果不存在，创建它：

```bash
cd server
touch .env
```

### 1.2 获取Supabase配置

1. 登录 [Supabase控制台](https://app.supabase.com)
2. 选择你的项目
3. 点击左侧菜单 **Settings** → **API**
4. 复制以下信息：
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

### 1.3 获取数据库连接字符串

1. 在Supabase控制台，点击 **Settings** → **Database**
2. 找到 **Connection string** → **URI**
3. 点击复制按钮
4. 替换`[YOUR-PASSWORD]`为你的数据库密码

**注意**: 如果忘记密码，可以在同一页面重置。

### 1.4 填写.env文件

编辑`server/.env`文件，填入以下内容：

```env
# OpenAI配置
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Supabase配置
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx

# 数据库连接（用于迁移）
DATABASE_URL=postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres
```

**检查清单**:
- [ ] `OPENAI_API_KEY` 以 `sk-` 开头
- [ ] `SUPABASE_URL` 以 `https://` 开头，包含 `.supabase.co`
- [ ] `SUPABASE_ANON_KEY` 和 `SUPABASE_SERVICE_ROLE_KEY` 都是长字符串
- [ ] `DATABASE_URL` 包含你的实际密码（不是`[YOUR-PASSWORD]`）

---

## 🗄️ 步骤2: 执行数据库迁移

### 2.1 安装依赖

```bash
cd server
npm install
```

### 2.2 运行迁移脚本

```bash
cd database
node run-migration.js
```

### 2.3 验证成功

你应该看到类似输出：

```
🚀 开始数据库迁移...

📄 读取SQL文件: /path/to/create-assistant-tables.sql
⚙️  连接数据库...
✅ 数据库连接成功
⚙️  执行SQL...
✅ SQL执行成功！

✅ 数据库迁移完成！
```

### 2.4 验证表创建

在Supabase控制台：
1. 点击左侧 **Table Editor**
2. 应该看到3个新表：
   - `assistants`
   - `topics`
   - `messages`

---

## 🚀 步骤3: 启动服务

### 3.1 启动后端

打开终端1：

```bash
cd server
npm run dev
```

应该看到：
```
Server is running on port 3000
```

### 3.2 启动前端

打开终端2：

```bash
cd client
npm install  # 首次运行需要
npm run dev
```

应该看到：
```
Local: http://localhost:5173/
```

---

## ✅ 步骤4: 验证功能

### 4.1 打开浏览器

访问: http://localhost:5173/ai/multi

### 4.2 测试基本功能

1. **创建助手**
   - 点击左上角 "创建新助手"
   - 选择 "代码助手" 预设
   - 点击保存

2. **创建对话**
   - 选择刚创建的助手
   - 点击 "新建对话"

3. **发送消息**
   - 输入: "你好，请介绍一下自己"
   - 按Enter发送
   - 应该收到AI回复

**如果以上都成功，恭喜！系统已正常运行！** 🎉

---

## 🔍 常见问题

### ❌ 问题1: 迁移脚本报错 "client password must be a string"

**原因**: `DATABASE_URL` 配置不正确

**解决**:
1. 检查`DATABASE_URL`是否包含实际密码
2. 确保没有多余的空格或换行
3. 如果密码包含特殊字符，尝试用URL编码

**测试连接**:
```bash
# 安装psql（如果没有）
brew install postgresql

# 测试连接（替换为你的URL）
psql "postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"
```

---

### ❌ 问题2: 前端无法连接后端

**原因**: 后端未启动或端口被占用

**解决**:
1. 确认后端正在运行（终端1有输出）
2. 检查端口3000是否被占用：
   ```bash
   lsof -i :3000
   ```
3. 如果被占用，杀掉进程或修改端口

---

### ❌ 问题3: AI不回复消息

**原因**: OpenAI API Key无效或余额不足

**解决**:
1. 检查API Key是否正确
2. 访问 [OpenAI控制台](https://platform.openai.com/account/api-keys) 验证
3. 检查账户余额
4. 查看后端终端的错误信息

---

### ❌ 问题4: Supabase连接失败

**原因**: Supabase配置错误或网络问题

**解决**:
1. 检查所有Supabase环境变量
2. 确认项目未暂停（免费版会自动暂停）
3. 在Supabase控制台唤醒项目
4. 检查网络连接

---

## 📚 下一步

配置成功后，你可以：

1. 📖 阅读 [FINAL_多助手系统.md](./FINAL_多助手系统.md) 了解系统功能
2. 🎨 创建更多助手和预设
3. 💡 查看 [TODO_多助手系统.md](./TODO_多助手系统.md) 了解可选功能
4. 🔧 根据需要自定义配置

---

## 🆘 获取帮助

如果遇到其他问题：

1. 检查后端终端的错误信息
2. 检查浏览器控制台的错误
3. 查看Supabase日志（Logs → Database）
4. 参考完整的故障排查文档

---

## ✨ 快速参考

### 环境变量位置
```
server/.env
```

### 启动命令
```bash
# 后端
cd server && npm run dev

# 前端
cd client && npm run dev
```

### 访问地址
- 新系统: http://localhost:5173/ai/multi
- 旧系统: http://localhost:5173/ai

### 重要文档
- 配置指南: `SETUP_GUIDE.md` (本文档)
- 使用说明: `FINAL_多助手系统.md`
- 故障排查: `TODO_多助手系统.md`

---

**祝你使用愉快！** 🚀

如果成功运行，请在TODO文档中标记完成。


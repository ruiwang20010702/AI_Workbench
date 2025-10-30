# 🧙 Supabase MCP 配置向导

**配置Supabase MCP，让AI成为您的数据库管理员！**

---

## 📋 **配置检查清单**

跟随此向导，逐步完成MCP配置：

---

### ☑️ **步骤1: 获取Supabase凭证** (2分钟)

1. 打开浏览器访问: https://app.supabase.com
2. 登录并选择项目 `AI_Workbench`
3. 导航到: **Settings** → **API**
4. 找到并复制:

```
📍 Project URL
示例: https://abcdefghijk.supabase.co
您的: _________________________

🔑 service_role (Service Role Key)
示例: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
您的: _________________________
```

⚠️ **重要提示**:
- 使用 **service_role** 密钥，不是 **anon** 密钥
- Service Role Key 具有完整数据库权限，请妥善保管
- 不要在代码或文档中分享此密钥

**完成？** → 继续步骤2

---

### ☑️ **步骤2: 在Cursor中配置MCP** (3分钟)

#### **方式A: 快速配置（推荐新手）**

1. 在Cursor中按快捷键:
   - Mac: `Cmd + Shift + P`
   - Windows: `Ctrl + Shift + P`

2. 输入并选择: `Preferences: Open User Settings (JSON)`

3. 在打开的JSON文件中，找到或添加 `mcpServers` 配置:

```json
{
  // ... 其他配置 ...
  
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-supabase"
      ],
      "env": {
        "SUPABASE_URL": "在这里粘贴您的Project URL",
        "SUPABASE_SERVICE_ROLE_KEY": "在这里粘贴您的Service Role Key"
      }
    }
  }
}
```

4. **重要**: 用步骤1中复制的实际值替换引号中的文本

5. 保存文件 (`Cmd/Ctrl + S`)

#### **方式B: 使用环境变量（推荐进阶用户）**

1. 在项目根目录创建文件 `.env.mcp`:

```bash
# 创建文件
touch .env.mcp

# 编辑文件，添加以下内容:
SUPABASE_URL=https://你的项目.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

2. 在Cursor设置JSON中添加:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "envFile": "${workspaceFolder}/.env.mcp"
    }
  }
}
```

**完成？** → 继续步骤3

---

### ☑️ **步骤3: 重启Cursor** (1分钟)

1. **完全关闭** Cursor
   - Mac: `Cmd + Q`
   - Windows: `Alt + F4` 或关闭所有窗口

2. 重新打开Cursor

3. 打开 `AI_Workbench` 项目文件夹

**完成？** → 继续步骤4

---

### ☑️ **步骤4: 验证MCP连接** (1分钟)

1. 在Cursor中打开AI对话框（通常在右侧）

2. 输入以下测试命令:

```
请查询数据库中有哪些表
```

3. 等待AI响应

**预期结果（成功）**:
```
✅ 我找到了以下表：
- users
- notes
- todos
- projects
- tasks
- notifications
- ai_usage
- ...
```

**如果失败**:
```
❌ "无法连接到数据库"
❌ "MCP服务器未响应"
❌ "权限不足"
```

→ 跳转到"故障排查"部分

---

### ☑️ **步骤5: 执行数据库迁移** (2分钟)

**现在MCP已配置完成，让AI自动执行数据库迁移！**

在AI对话框中输入:

```
请执行以下操作：
1. 读取 server/database/create-weekly-reports-tables.sql 文件
2. 执行其中的SQL语句创建周报相关的表
3. 验证表是否创建成功
```

**AI会自动**:
1. 读取SQL文件
2. 连接到Supabase数据库
3. 执行CREATE TABLE语句
4. 插入默认模板
5. 验证结果

**完成？** → 恭喜！配置完成 🎉

---

## 🎉 **配置完成！您现在可以...**

### **让AI管理数据库**

```
查询所有用户
统计笔记数量
列出最近的周报
检查数据完整性
```

### **调试和验证**

```
检查 weekly_reports 表结构
验证默认模板是否存在
统计各状态的周报数量
查找可能的数据问题
```

### **生成报告**

```
生成用户活动统计报告
分析任务完成趋势
导出周报数据为CSV
```

---

## 🚨 **故障排查**

### **问题: "MCP服务器未响应"**

**原因**: MCP包未安装或无法启动

**解决方案**:
```bash
# 手动安装MCP服务器
npm install -g @modelcontextprotocol/server-supabase

# 重启Cursor后重试
```

---

### **问题: "无法连接到数据库"**

**检查清单**:
- [ ] Supabase URL 是否正确？
- [ ] Service Role Key 是否正确？
- [ ] 是否使用了 service_role 而不是 anon key？
- [ ] Cursor 是否已重启？
- [ ] 网络连接是否正常？

**调试命令**:
```bash
# 测试Supabase连接
curl https://你的项目.supabase.co/rest/v1/ \
  -H "apikey: 你的service_role_key"
```

---

### **问题: "权限不足"**

**原因**: 使用了错误的API密钥

**解决方案**:
1. 确认使用的是 **service_role** 密钥
2. 在Supabase Dashboard中找到正确的密钥
3. 重新配置Cursor设置
4. 重启Cursor

---

### **问题: Cursor变慢**

**原因**: MCP查询可能较慢

**优化方案**:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": { ... },
      "timeout": 5000  // 添加5秒超时
    }
  }
}
```

---

## 📚 **下一步**

MCP配置完成后，继续完成其他配置:

1. ✅ **MCP配置** - 已完成
2. ⏳ **安装依赖包**:
   ```bash
   cd server
   npm install mustache marked docx
   ```
3. ⏳ **重新构建项目**:
   ```bash
   npm run build
   ```
4. ⏳ **启动开发服务器**:
   ```bash
   npm run dev
   ```

详细步骤请参考: `docs/周报自动生成功能/TODO_周报自动生成功能.md`

---

## 🎓 **学习更多**

- **快速开始**: `docs/QUICK_START_MCP.md`
- **详细配置**: `docs/SUPABASE_MCP_SETUP.md`
- **周报功能文档**: `docs/周报自动生成功能/FINAL_周报自动生成功能.md`
- **MCP官方文档**: https://modelcontextprotocol.io/

---

## ❓ **需要帮助？**

如果遇到问题：

1. 查看"故障排查"部分
2. 检查Cursor输出日志: `View` → `Output`
3. 查看详细文档: `docs/SUPABASE_MCP_SETUP.md`
4. 在项目中提Issue

---

**恭喜您完成配置！享受AI数据库助手带来的便利吧！** 🚀✨


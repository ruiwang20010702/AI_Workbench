# ⚡ Supabase MCP 快速开始

**5分钟配置完成，让AI直接操作您的数据库！**

---

## 🎯 **第一步: 获取Supabase凭证**

1. 打开 https://app.supabase.com
2. 选择您的项目 `AI_Workbench`
3. 点击左侧 **Settings** → **API**
4. 复制两个值：

   ```
   ✅ Project URL: https://xxxxx.supabase.co
   ✅ Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

⚠️ **Service Role Key 很重要，不要分享给任何人！**

---

## 🔧 **第二步: 配置Cursor**

### **选项A: 直接配置（推荐）**

1. 在Cursor中按 `Cmd+Shift+P` (Mac) 或 `Ctrl+Shift+P` (Windows)
2. 输入 "Preferences: Open User Settings (JSON)"
3. 在JSON文件中添加：

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-supabase"
      ],
      "env": {
        "SUPABASE_URL": "粘贴您的Project URL",
        "SUPABASE_SERVICE_ROLE_KEY": "粘贴您的Service Role Key"
      }
    }
  }
}
```

**重要**: 替换引号中的内容为实际值！

### **选项B: 使用环境变量（更安全）**

1. 在项目根目录创建文件 `.env.mcp`:

```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

2. 在Cursor设置中添加：

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

---

## 🔄 **第三步: 重启Cursor**

1. 完全关闭Cursor（所有窗口）
2. 重新打开Cursor
3. 打开AI_Workbench项目

---

## ✅ **第四步: 测试MCP连接**

在Cursor的AI对话框中输入：

```
请查询数据库中有哪些表
```

**如果成功**，AI会返回类似：
```
找到以下表：
- users
- notes
- todos
- projects
- tasks
- notifications
- weekly_reports (如果已创建)
- report_templates (如果已创建)
```

**如果失败**，检查：
- [ ] URL和Key是否正确
- [ ] 是否已重启Cursor
- [ ] 网络连接是否正常

---

## 🎉 **开始使用！**

现在您可以让AI帮您：

### **执行数据库迁移**
```
请执行 server/database/create-weekly-reports-tables.sql 文件中的SQL语句
```

### **查询数据**
```
查询所有用户
统计笔记数量
列出最近10条待办事项
```

### **验证功能**
```
检查 weekly_reports 表是否存在
验证默认模板是否已创建
统计各状态的周报数量
```

---

## 🚨 **常见问题**

### **问题1: "MCP服务器未响应"**

**解决**:
```bash
# 手动安装MCP服务器包
npm install -g @modelcontextprotocol/server-supabase
```

### **问题2: "权限不足"**

**原因**: 使用了Anon Key而不是Service Role Key

**解决**: 确认使用的是 **service_role** 开头的密钥

### **问题3: "找不到表"**

**原因**: 数据库迁移脚本还未执行

**解决**: 让AI执行迁移脚本（见上方示例）

---

## 📖 **更多帮助**

- 详细配置: `docs/SUPABASE_MCP_SETUP.md`
- 问题排查: `docs/SUPABASE_MCP_SETUP.md` → "常见问题"章节
- Supabase文档: https://supabase.com/docs

---

**配置完成后，AI将成为您的数据库小助手！** 🤖✨


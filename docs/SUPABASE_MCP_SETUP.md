# Supabase MCP 配置指南

**目的**: 让AI能够直接访问和操作Supabase数据库，提高开发效率

**更新日期**: 2025-10-30

---

## 📋 **前置条件**

- ✅ 已安装 Cursor IDE
- ✅ 有Supabase项目的访问权限
- ✅ 已获取Supabase Service Role Key

---

## 🔧 **配置步骤**

### **步骤1: 获取Supabase凭证**

1. 访问您的Supabase项目: https://app.supabase.com
2. 进入项目 **Settings** → **API**
3. 复制以下信息:
   ```
   Project URL: https://xxx.supabase.co
   Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

⚠️ **重要**: Service Role Key具有完整数据库权限，请妥善保管！

---

### **步骤2: 在Cursor中配置MCP**

#### **方式1: 通过Cursor设置界面（推荐）**

1. 打开Cursor IDE
2. 按 `Cmd/Ctrl + ,` 打开设置
3. 搜索 "MCP" 或 "Model Context Protocol"
4. 点击 "Edit in settings.json"
5. 添加以下配置:

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
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
  }
}
```

**替换占位符**:
- `your-project.supabase.co` → 您的实际Supabase URL
- `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` → 您的实际Service Role Key

#### **方式2: 使用环境变量（更安全）**

1. 在项目根目录创建 `.env.mcp` 文件（已添加到.gitignore）:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

2. 在Cursor设置中引用环境变量:

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

### **步骤3: 重启Cursor**

1. 关闭所有Cursor窗口
2. 重新打开Cursor
3. 打开AI_Workbench项目

---

### **步骤4: 验证MCP连接**

在Cursor AI对话框中输入：

```
请查询 weekly_reports 表是否存在
```

**预期响应**:
- ✅ 如果MCP配置成功，AI会直接查询数据库并返回结果
- ❌ 如果配置失败，AI会提示无法访问数据库

---

## 🎯 **MCP功能列表**

配置完成后，您可以让AI执行：

### **1. 数据库查询**
```
查询所有周报模板
查询最近10条周报记录
统计用户的周报数量
```

### **2. 数据库操作**
```
执行数据库迁移脚本
插入一条测试数据
更新某条记录
删除测试数据
```

### **3. 结构检查**
```
检查 weekly_reports 表结构
列出所有表和字段
验证外键关系
```

### **4. 数据验证**
```
检查默认模板是否存在
验证周报数据完整性
统计各状态的周报数量
```

### **5. 故障排查**
```
查询最近的错误日志
检查数据一致性
分析性能问题
```

---

## 🔍 **常见问题**

### **Q1: MCP服务器启动失败**

**原因**: 
- 凭证配置错误
- 网络连接问题
- MCP包未安装

**解决方案**:
```bash
# 手动安装MCP包
npm install -g @modelcontextprotocol/server-supabase

# 测试连接
curl https://your-project.supabase.co/rest/v1/
```

---

### **Q2: AI无法访问数据库**

**检查清单**:
- [ ] Supabase URL是否正确
- [ ] Service Role Key是否正确
- [ ] 是否已重启Cursor
- [ ] 网络是否正常

**调试命令**:
```bash
# 测试Supabase连接
curl -X GET "https://your-project.supabase.co/rest/v1/weekly_reports?select=count" \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

---

### **Q3: 权限不足错误**

**问题**: `insufficient_privilege` 或 `permission denied`

**解决方案**:
1. 确认使用的是 **Service Role Key** 而不是 Anon Key
2. 检查RLS（Row Level Security）策略
3. 在Supabase Dashboard中验证表权限

---

### **Q4: MCP配置后Cursor变慢**

**原因**: MCP服务器在每次查询时都会连接数据库

**优化方案**:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "...",
        "SUPABASE_SERVICE_ROLE_KEY": "..."
      },
      "timeout": 5000  // 添加超时设置
    }
  }
}
```

---

## 🛡️ **安全最佳实践**

### **1. 凭证管理**
- ✅ 使用 `.env.mcp` 文件存储凭证
- ✅ 将 `.env.mcp` 添加到 `.gitignore`
- ✅ 不要在聊天记录中粘贴完整的Service Role Key
- ✅ 定期轮换API密钥

### **2. 访问控制**
- ✅ 仅在开发环境使用MCP
- ✅ 生产环境使用受限权限的密钥
- ✅ 启用Supabase的审计日志

### **3. 数据保护**
- ✅ 不要通过AI查询敏感用户数据
- ✅ 使用参数化查询避免SQL注入
- ✅ 定期备份数据库

---

## 📚 **使用示例**

### **示例1: 执行数据库迁移**

**对AI说**:
```
请执行 server/database/create-weekly-reports-tables.sql 文件中的SQL
```

**AI会**:
1. 读取SQL文件
2. 通过MCP连接到Supabase
3. 执行SQL语句
4. 返回执行结果

---

### **示例2: 验证功能**

**对AI说**:
```
帮我检查：
1. weekly_reports 表是否存在
2. report_templates 表是否有默认模板
3. 索引是否正确创建
```

**AI会**:
1. 查询系统表
2. 检查数据
3. 返回详细报告

---

### **示例3: 数据调试**

**对AI说**:
```
查询user_id为xxx的所有周报，并分析数据完整性
```

**AI会**:
1. 执行查询
2. 分析结果
3. 指出可能的问题

---

## 🎉 **配置完成检查清单**

完成以下检查确认配置成功：

- [ ] Supabase凭证已正确配置
- [ ] Cursor已重启
- [ ] AI可以响应数据库查询
- [ ] `.env.mcp` 已添加到 `.gitignore`
- [ ] 测试查询返回正确结果

---

## 🔗 **相关资源**

- [Supabase MCP官方文档](https://github.com/modelcontextprotocol/servers/tree/main/src/supabase)
- [MCP协议规范](https://modelcontextprotocol.io/)
- [Cursor MCP配置指南](https://docs.cursor.com/mcp)
- [Supabase API文档](https://supabase.com/docs/reference)

---

## ❓ **需要帮助？**

如果遇到配置问题：

1. 检查Cursor控制台输出 (`View` → `Output`)
2. 查看Supabase Dashboard的API日志
3. 参考本文档的"常见问题"部分
4. 在项目Issue中提问

---

**配置愉快！有了MCP，AI将成为您的数据库助手！** 🚀


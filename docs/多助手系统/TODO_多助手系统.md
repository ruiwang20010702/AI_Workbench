# 多助手系统 - 待办事项清单

**创建时间**: 2025-11-02  
**项目状态**: ✅ 核心功能已完成

---

## 🔧 必要配置

### 1. 环境变量配置 ⚠️ 必须

在`server/.env`文件中确认以下配置：

```env
# OpenAI API配置（必须）
OPENAI_API_KEY=your_openai_api_key_here

# Supabase配置（必须）
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# 数据库连接字符串（用于迁移脚本）
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

**操作步骤**:
1. 检查`server/.env`文件是否存在
2. 填写你的OpenAI API Key
3. 填写Supabase配置（从Supabase控制台获取）
4. 填写DATABASE_URL（从Supabase控制台 → Settings → Database → Connection string）

---

## 🗄️ 数据库迁移

### 2. 执行数据库迁移 ⚠️ 必须

创建新的数据库表：

```bash
cd server/database
node run-migration.js
```

**预期输出**:
```
✅ 数据库连接成功
✅ 创建assistants表成功
✅ 创建topics表成功
✅ 创建messages表成功
✅ 所有迁移执行成功
```

---

### 3. 旧数据迁移 📦 可选

如果你有旧的AI对话数据需要迁移：

```bash
cd server/database/migrations
node migrate-old-conversations.js
```

**注意事项**:
- 脚本会自动检测是否有旧数据表
- 会为每个用户创建默认助手
- 旧对话会转换为新的主题和消息
- 迁移完成后建议备份旧表

---

## 🚀 启动服务

### 4. 安装依赖 ⚠️ 必须

**后端**:
```bash
cd server
npm install
```

**前端**:
```bash
cd client
npm install
```

---

### 5. 启动开发服务器 ⚠️ 必须

**后端**（终端1）:
```bash
cd server
npm run dev
```

**前端**（终端2）:
```bash
cd client
npm run dev
```

---

## 🌐 访问应用

### 6. 打开浏览器

- **新多助手系统**: http://localhost:5173/ai/multi
- **旧AI助手系统**: http://localhost:5173/ai（保留兼容）

---

## ✅ 功能验证

### 7. 基本功能测试 📋 建议

测试以下核心功能：

- [ ] **创建助手**
  - 点击"创建新助手"
  - 选择预设模板或自定义
  - 保存并验证助手出现在列表中

- [ ] **创建对话**
  - 选择一个助手
  - 点击"新建对话"
  - 验证主题创建成功

- [ ] **发送消息**
  - 在输入框输入测试消息
  - 点击发送或按Enter
  - 验证收到AI回复

- [ ] **编辑功能**
  - 重命名主题
  - 编辑助手配置
  - 删除主题/助手

---

## 🔍 故障排查

### 常见问题及解决方案

#### 问题1: 数据库连接失败

**错误信息**: `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`

**解决方案**:
1. 确认`server/.env`文件中的`DATABASE_URL`配置正确
2. 检查Supabase连接字符串格式
3. 确保密码部分没有特殊字符问题

**获取DATABASE_URL**:
1. 登录Supabase控制台
2. 进入你的项目
3. 点击左侧 Settings → Database
4. 找到 Connection string → URI
5. 复制完整的连接字符串（包含密码）

**正确格式**:
```
DATABASE_URL=postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres
```

---

#### 问题2: OpenAI API调用失败

**错误信息**: `401 Unauthorized` 或 `API密钥未配置`

**解决方案**:
1. 检查`.env`文件中的`OPENAI_API_KEY`
2. 确认API Key有效且有余额
3. 重启后端服务使环境变量生效

```bash
# 测试API Key（可选）
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

#### 问题3: 前端无法连接后端

**错误信息**: `Network Error` 或 `ERR_CONNECTION_REFUSED`

**解决方案**:
1. 确认后端服务正在运行（端口3000）
2. 检查前端环境变量`VITE_API_URL`
3. 查看浏览器控制台的详细错误

```bash
# 检查端口占用
lsof -i :3000
```

---

#### 问题4: 迁移脚本执行失败

**错误信息**: 各种数据库错误

**解决方案**:
1. 确认数据库连接正常
2. 检查是否有足够的权限
3. 查看详细错误日志
4. 如果失败，可以手动执行SQL文件

```bash
# 手动执行SQL
mysql -u root -p ai_workbench < server/database/migrations/create-assistant-tables.sql
```

---

## 📊 性能优化建议

### 8. 生产环境配置 🚀 可选

如果部署到生产环境：

1. **环境变量**
   ```env
   NODE_ENV=production
   ```

2. **构建前端**
   ```bash
   cd client
   npm run build
   ```

3. **使用PM2管理进程**
   ```bash
   npm install -g pm2
   pm2 start server/src/index.ts --name ai-workbench
   ```

4. **配置Nginx反向代理**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location /api {
           proxy_pass http://localhost:3000;
       }
       
       location / {
           root /path/to/client/dist;
           try_files $uri /index.html;
       }
   }
   ```

---

## 🔐 安全建议

### 9. 安全配置 🔒 重要

1. **保护API Key**
   - 不要将`.env`文件提交到Git
   - 使用环境变量管理敏感信息
   - 定期轮换API Key

2. **数据库安全**
   - 使用强密码
   - 限制数据库访问IP
   - 定期备份数据

3. **API安全**
   - 启用HTTPS
   - 实施速率限制
   - 验证用户输入

---

## 📈 监控和维护

### 10. 日常维护 📅 建议

1. **监控API使用**
   - 定期检查OpenAI API使用量
   - 设置用量告警
   - 优化Token使用

2. **数据库维护**
   - 定期备份数据库
   - 清理过期数据
   - 优化查询性能

3. **日志管理**
   - 定期查看错误日志
   - 监控异常请求
   - 分析用户行为

---

## 🎯 后续增强功能

### 11. 功能扩展 💡 可选

以下是一些可以考虑添加的功能：

- [ ] **对话导出**
  - 导出为Markdown
  - 导出为PDF
  - 导出为JSON

- [ ] **高级搜索**
  - 全文搜索消息
  - 按时间范围筛选
  - 按助手/主题筛选

- [ ] **协作功能**
  - 分享对话链接
  - 多人协作对话
  - 权限管理

- [ ] **AI增强**
  - 支持更多模型（Claude、Gemini等）
  - 图片理解（GPT-4 Vision）
  - 语音输入/输出

- [ ] **用户体验**
  - 快捷键自定义
  - 主题颜色自定义
  - 消息编辑和重试

---

## 📞 获取帮助

### 12. 支持渠道

如果遇到问题：

1. **查看文档**
   - [设计文档](./DESIGN_多助手系统.md)
   - [最终报告](./FINAL_多助手系统.md)
   - [数据库文档](../../server/database/README.md)

2. **检查日志**
   - 后端日志：终端输出
   - 前端日志：浏览器控制台
   - 数据库日志：MySQL错误日志

3. **调试技巧**
   - 使用浏览器开发者工具
   - 检查网络请求
   - 查看数据库记录

---

## ✨ 总结

### 核心待办（必须完成）

1. ✅ 配置环境变量（OpenAI API Key）
2. ✅ 执行数据库迁移
3. ✅ 安装依赖
4. ✅ 启动服务
5. ✅ 验证基本功能

### 可选待办（建议完成）

1. 📦 旧数据迁移（如有需要）
2. 🚀 生产环境配置（如需部署）
3. 🔒 安全加固
4. 📊 监控配置
5. 💡 功能扩展

---

**当前状态**: 🎉 核心功能已完成，可以开始使用！  
**下一步**: 配置环境变量 → 执行迁移 → 启动服务 → 开始使用

---

**文档版本**: 1.0.0  
**创建时间**: 2025-11-02  
**最后更新**: 2025-11-02


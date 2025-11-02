# AI Workbench

一个现代化的 AI 驱动的工作台应用，集成了笔记管理、待办事项、AI 助手和周报自动生成功能。

## 🆕 **最新更新：周报自动生成功能**

**新增功能** (2025-10-30):
- ✅ 自动数据聚合（任务、项目、笔记、工时）
- ✅ 灵活的模板系统（Mustache语法）
- ✅ AI智能优化和建议
- ✅ 多格式导出（Word、Markdown、HTML）
- ✅ 周报管理（草稿/发布/归档）

**📚 快速开始**:
1. 配置Supabase MCP（强烈推荐）→ [5分钟配置向导](docs/MCP_SETUP_WIZARD.md)
2. 完成周报功能配置 → [TODO清单](docs/周报自动生成功能/TODO_周报自动生成功能.md)
3. 查看完整文档 → [项目总结](docs/周报自动生成功能/FINAL_周报自动生成功能.md)

---

## ✨ 功能特性

### 🔐 用户认证
- 用户注册和登录
- JWT 令牌认证
- 安全的密码加密
- 会话管理

### 📝 笔记管理
- 创建、编辑、删除笔记
- 富文本编辑器支持
- 笔记分类和标签
- 全文搜索功能
- 笔记导出 (PDF, Markdown)

### ✅ 待办事项
- 任务创建和管理
- 优先级设置
- 截止日期提醒
- 任务状态跟踪
- 批量操作

### 🤖 AI 助手
- **文本生成**: 基于提示生成内容
- **文本改写**: 改进和重写文本
- **内容总结**: 提取关键信息
- **多语言翻译**: 支持多种语言互译
- **文本分析**: 情感分析和关键词提取
- **模板生成**: 各种文档模板
- **内容优化**: SEO 和可读性优化

### 📋 项目管理
- **多层级项目结构**: 项目→子项目→任务层级管理
- **项目生命周期**: 创建、编辑、删除和归档项目
- **团队协作**: 项目成员管理、角色权限控制
- **任务管理**: 任务创建、分配、依赖关系设置
- **进度跟踪**: 甘特图、看板视图、进度统计
- **资源管理**: 团队成员工作量分析、项目资源分配
- **项目模板**: 可复用的项目结构和流程模板

### 📊 数据统计
- 使用情况分析
- 生产力指标
- AI 功能使用统计
- 个人数据洞察

### 📄 周报自动生成（新功能）
- **自动数据聚合**: 从任务、项目、笔记自动收集数据
- **灵活模板系统**: Mustache语法，支持自定义模板
- **AI智能优化**: 内容优化、改进建议、摘要生成
- **多格式导出**: Word (docx)、Markdown、HTML
- **周报管理**: 草稿、发布、归档状态流转
- **数据源扩展**: 支持内部数据源、Git统计（GitHub/GitLab）
- **模板市场**: 公共模板分享和使用

## 🛠️ 技术栈

### 前端
- **React 18** - 用户界面框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具和开发服务器
- **Tailwind CSS** - 样式框架
- **TipTap** - 富文本编辑器
- **Lucide React** - 图标库
- **React Router** - 路由管理
- **Axios** - HTTP 客户端
- **React Hot Toast** - 通知系统

### 后端
- **Node.js** - 运行时环境
- **Express.js** - Web 框架
- **TypeScript** - 类型安全
- **Supabase** - 后端即服务平台 (PostgreSQL + 实时功能)
- **JWT** - 身份认证
- **SiliconFlow API** - 主要 AI 服务提供商
- **OpenAI API** - 备用 AI 服务提供商

### 部署
- **Docker** - 容器化
- **Docker Compose** - 多容器编排
- **Nginx** - 反向代理和负载均衡
- **Let's Encrypt** - SSL 证书

## 🚀 快速开始

### 前置要求
- Node.js 18+
- Docker & Docker Compose (可选)
- Git
- Supabase 账户 (数据库服务)
- SiliconFlow API 密钥 (AI 服务)
- Railway 账户 (推荐部署平台，可选)

### 开发环境设置

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd AI_Workbench
   ```

2. **服务配置**

   **配置 Supabase:**
   1. 访问 [supabase.com](https://supabase.com) 创建免费账户
   2. 创建新项目并获取项目配置
   3. 在项目设置中找到 API 配置
   4. 获取 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY`

   **配置 SiliconFlow API:**
   1. 访问 [siliconflow.cn](https://siliconflow.cn) 注册账户
   2. 在控制台获取 API 密钥
   3. 获取 `SILICONFLOW_API_KEY` 和基础 URL

   **配置环境变量:**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，填入以下关键配置：
   # - SUPABASE_URL (来自 Supabase 项目设置)
   # - SUPABASE_ANON_KEY (来自 Supabase 项目设置)
   # - SILICONFLOW_API_KEY (来自 SiliconFlow 控制台)
   # - JWT_SECRET (生成安全的随机字符串)
   ```

3. **启动开发环境**
   ```bash
   # 使用 Docker Compose
   docker-compose up -d
   
   # 或者分别启动前后端
   # 后端
   cd server
   npm install
   npm run dev
   
   # 前端
   cd client
   npm install
   npm start
   ```

4. **访问应用**
   - 前端: http://localhost:5173
   - 后端 API: http://localhost:5000
   - API 文档: http://localhost:5000/api-docs

### 生产环境部署

我们支持多种部署方式，请选择适合您需求的方案：

#### Railway 部署 (推荐)
Railway 提供一键部署和自动数据库配置：

1. **准备环境变量**
   ```bash
   cp .env.example .env
   # 配置 Supabase 和 SiliconFlow API 密钥
   ```

2. **连接数据库**
   - Railway 会自动提供 PostgreSQL 数据库
   - 数据库 URL 会自动注入到环境变量

3. **部署前端**
   - 连接 GitHub 仓库到 Railway
   - 设置构建命令: `npm run build`
   - 设置输出目录: `dist`

4. **部署后端**
   - Railway 会自动检测 Node.js 应用
   - 设置端口: `5000`
   - 配置环境变量

详细指南请参考: [Railway 部署指南](./docs/RAILWAY_DEPLOYMENT.md)

#### Vercel 部署 (前端)
适用于前端静态部署：

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **部署项目**
   ```bash
   cd client
   vercel --prod
   ```

详细指南请参考: [Vercel 部署指南](./docs/VERCEL_DEPLOYMENT.md)

#### Docker 部署
适用于自建服务器：

```bash
# 使用 Docker Compose 一键部署
docker-compose up -d

# 或者使用部署脚本
./scripts/deploy.sh production
```

详细指南请参考: [DEPLOYMENT.md](./docs/DEPLOYMENT.md)

## 📁 项目结构

```
AI_Workbench/
├── client/                 # 前端应用
│   ├── public/            # 静态资源
│   ├── src/               # 源代码
│   │   ├── components/    # React 组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API 服务
│   │   ├── hooks/         # 自定义 Hooks
│   │   ├── contexts/      # React Context
│   │   └── utils/         # 工具函数
│   ├── Dockerfile         # 前端 Docker 配置
│   └── package.json       # 前端依赖
├── server/                # 后端应用
│   ├── src/               # 源代码
│   │   ├── controllers/   # 控制器
│   │   ├── models/        # 数据模型
│   │   ├── routes/        # 路由定义
│   │   ├── middleware/    # 中间件
│   │   ├── services/      # 业务逻辑
│   │   └── utils/         # 工具函数
│   ├── Dockerfile         # 后端 Docker 配置
│   └── package.json       # 后端依赖
├── nginx/                 # Nginx 配置
├── scripts/               # 部署和维护脚本
├── docker-compose.yml     # Docker Compose 配置
├── .env.example          # 环境变量模板
└── README.md             # 项目说明
```

## 🔧 配置说明

### 环境变量

| 变量名 | 描述 | 必需 |
|--------|------|------|
| `NODE_ENV` | 运行环境 | ✅ |
| `DATABASE_URL` | 数据库连接字符串 | ✅ |
| `JWT_SECRET` | JWT 签名密钥 | ✅ |
| `SILICONFLOW_API_KEY` | SiliconFlow API 密钥 (主要 AI 服务) | ✅ |
| `SILICONFLOW_BASE_URL` | SiliconFlow API 基础 URL | ✅ |
| `OPENAI_API_KEY` | OpenAI API 密钥 (备用) | ❌ |
| `CORS_ORIGIN` | CORS 允许的源 | ❌ |
| `SUPABASE_URL` | Supabase 项目 URL | ✅ |
| `SUPABASE_ANON_KEY` | Supabase 匿名密钥 | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色密钥 | ✅ |
| `VITE_API_URL` | 前端 API 地址配置 | ✅ |

### API 配置

```javascript
// 前端 API 配置
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';

// 后端服务配置
const config = {
  port: process.env.PORT || 5000,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  jwtSecret: process.env.JWT_SECRET,
  siliconflowApiKey: process.env.SILICONFLOW_API_KEY
};
```

## 📚 API 文档

### 认证端点
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户信息

### 笔记端点
- `GET /api/notes` - 获取笔记列表
- `POST /api/notes` - 创建笔记
- `GET /api/notes/:id` - 获取单个笔记
- `PUT /api/notes/:id` - 更新笔记
- `DELETE /api/notes/:id` - 删除笔记

### 待办事项端点
- `GET /api/todos` - 获取待办事项列表
- `POST /api/todos` - 创建待办事项
- `PUT /api/todos/:id` - 更新待办事项
- `DELETE /api/todos/:id` - 删除待办事项

### AI 助手端点
- `POST /api/ai/generate` - 文本生成
- `POST /api/ai/rewrite` - 文本改写
- `POST /api/ai/summarize` - 内容总结
- `POST /api/ai/translate` - 文本翻译
- `POST /api/ai/analyze` - 文本分析
- `POST /api/ai/extract-todos` - 从文本提取待办事项
- `POST /api/ai/assistant-qa` - AI 助手问答

### 项目管理端点
- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建项目
- `GET /api/projects/:id` - 获取项目详情
- `PUT /api/projects/:id` - 更新项目
- `DELETE /api/projects/:id` - 删除项目
- `GET /api/projects/:id/stats` - 获取项目统计
- `GET /api/projects/:id/members` - 获取项目成员
- `POST /api/projects/:id/members` - 添加项目成员
- `PUT /api/projects/:id/members/:userId` - 更新成员角色
- `DELETE /api/projects/:id/members/:userId` - 移除项目成员

### 任务管理端点
- `GET /api/tasks` - 获取任务列表
- `POST /api/tasks` - 创建任务
- `GET /api/tasks/:id` - 获取任务详情
- `PUT /api/tasks/:id` - 更新任务
- `DELETE /api/tasks/:id` - 删除任务
- `PUT /api/tasks/:id/status` - 更新任务状态
- `PUT /api/tasks/:id/assignee` - 分配任务
- `GET /api/tasks/:id/dependencies` - 获取任务依赖
- `POST /api/tasks/:id/dependencies` - 添加任务依赖

### 通知端点
- `GET /api/notifications` - 获取通知列表
- `PUT /api/notifications/:id/read` - 标记通知为已读
- `PUT /api/notifications/mark-all-read` - 标记所有通知为已读
- `DELETE /api/notifications/:id` - 删除通知

## 🧪 测试

### 运行测试
```bash
# 后端测试
cd server
npm test

# 前端测试
cd client
npm test

# 端到端测试
npm run test:e2e
```

### 测试覆盖率
```bash
# 生成测试覆盖率报告
npm run test:coverage
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范
- 使用 ESLint 和 Prettier 进行代码格式化
- 遵循 TypeScript 最佳实践
- 编写单元测试
- 更新相关文档

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🆘 支持

如果您遇到问题或有疑问，请：

1. 查看 [FAQ](docs/FAQ.md)
2. 搜索现有的 [Issues](https://github.com/your-repo/issues)
3. 创建新的 Issue
4. 联系维护者

## 🗺️ 路线图

### v1.1.0 (计划中)
- [ ] 实时协作功能
- [ ] 移动端适配
- [ ] 更多 AI 模型支持
- [ ] 插件系统

### v1.2.0 (计划中)
- [ ] 团队协作功能
- [ ] 高级分析面板
- [ ] API 限流和配额管理
- [ ] 多租户支持

## 📊 项目状态

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Coverage](https://img.shields.io/badge/coverage-85%25-yellowgreen)

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户！

特别感谢：
- OpenAI 提供的强大 AI 能力
- React 和 Node.js 社区
- 所有开源项目的贡献者

---

**注意**: 这是一个开源项目，欢迎社区贡献和反馈。如果您觉得这个项目有用，请给我们一个 ⭐️！
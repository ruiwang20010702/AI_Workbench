<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Workbench is a full-stack AI-powered note-taking and productivity web application with project management capabilities. It features user authentication, rich text editing, todo management, AI text processing, and comprehensive project collaboration tools.

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: PostgreSQL with pgvector extension for semantic search
- **AI Integration**: OpenAI API and SiliconFlow API support
- **Authentication**: JWT-based authentication
- **Deployment**: Docker + Docker Compose + Nginx

## Essential Commands

### Development
```bash
# Install all dependencies
npm run install:all

# Start both frontend and backend in development mode
npm run dev

# Start only frontend (port 3000)
cd client && npm run dev

# Start only backend (port 8000)
cd server && npm run dev
```

### Build & Production
```bash
# Build frontend for production
npm run build

# Start production server
npm run start

# Full stack deployment with Docker
docker-compose up -d
```

### Database Operations
```bash
# Run database migrations
cd server && npm run db:migrate

# Generate Prisma client (if using Prisma)
cd server && npm run db:generate

# Seed database with initial data
cd server && npm run db:seed
```

### Testing & Quality
```bash
# Run backend tests
cd server && npm test

# Run frontend linting
cd client && npm run lint
```

## Architecture & Code Organization

### Frontend Structure (`/client`)
- `src/components/` - Reusable React components
- `src/pages/` - Page-level components
- `src/services/` - API service layer (axios-based)
- `src/hooks/` - Custom React hooks
- `src/contexts/` - React Context providers
- `src/utils/` - Utility functions

### Backend Structure (`/server`)
- `src/controllers/` - Request handlers and business logic
- `src/models/` - Data access layer (raw SQL queries)
- `src/routes/` - API route definitions
- `src/middleware/` - Express middleware (auth, error handling)
- `src/services/` - Business logic services
- `src/utils/` - Utility functions
- `database/` - SQL scripts and migrations

### Key API Endpoints
- **Auth**: `/api/auth/*` - Registration, login, JWT management
- **Notes**: `/api/notes/*` - CRUD operations for notes
- **Todos**: `/api/todos/*` - Task management
- **AI**: `/api/ai/*` - Text generation, rewriting, summarization, translation
- **Projects**: `/api/projects/*` - Project management (if implemented)

## Database Schema

The application uses PostgreSQL with the following core tables:
- **users** - User authentication and profile data
- **notebooks** - Note organization containers
- **notes** - Main content with vector embeddings for semantic search
- **todos** - Task management with notifications
- **ai_usage_logs** - AI feature usage tracking and cost monitoring
- **projects*** - Project management hierarchy (if implemented)
- **project_members*** - Team collaboration (if implemented)
- **tasks*** - Project task management (if implemented)

*Note: Project management features may be in development

## Environment Configuration

Copy `.env.example` to `.env` and configure these essential variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing key
- `SILICONFLOW_API_KEY` or `OPENAI_API_KEY` - AI service API key
- `CORS_ORIGIN` - Frontend domain for CORS
- `VITE_API_URL` - Backend API URL for frontend

## Development Workflow

1. **Database Setup**: Ensure PostgreSQL is running and migrations are applied
2. **Environment**: Configure `.env` file with correct API keys and database URL
3. **Dependencies**: Run `npm run install:all` to install all packages
4. **Development**: Use `npm run dev` for concurrent frontend/backend development
5. **Testing**: Backend tests with `cd server && npm test`
6. **Deployment**: Use Docker Compose for production deployment

## Key Features to Consider

- **AI Integration**: Text processing uses SiliconFlow API (primary) or OpenAI API (fallback)
- **Semantic Search**: Notes have vector embeddings for AI-powered search
- **Real-time Features**: WebSocket connections may be used for collaboration
- **File Upload**: Supports file attachments with size limits
- **Multi-language**: Chinese full-text search support
- **Cost Tracking**: AI usage is logged for cost monitoring

## Common Development Tasks

- **Adding new AI features**: Update `server/src/services/aiService.ts` and corresponding controller
- **Modifying database schema**: Create SQL migration files in `server/database/`
- **Adding API endpoints**: Create route in `server/src/routes/`, controller in `server/src/controllers/`
- **Frontend state management**: Use React Context providers in `client/src/contexts/`
- **Styling**: Use Tailwind CSS classes, avoid inline styles

## Important Notes

- The codebase uses raw SQL queries rather than an ORM for database operations
- Authentication is JWT-based with middleware protection on routes
- AI features require API keys and have usage tracking for cost control
- The application supports both Chinese and English with full-text search
- File uploads are handled with size limits and security considerations
- 请使用中文和我交流
- # 身份定义
你是一位资深的软件架构师和工程师，具备丰富的项目经验和系统思维能力。你的核心优势在于：

- 上下文工程专家：构建完整的任务上下文，而非简单的提示响应
- 规范驱动思维：将模糊需求转化为精确、可执行的规范
- 质量优先理念：每个阶段都确保高质量输出
- 项目对齐能力：深度理解现有项目架构和约束

# 6A工作流执行规则

## 阶段1: Align (对齐阶段)
**目标:** 模糊需求 → 精确规范

### 执行步骤

### 1. 项目上下文分析

- 分析现有项目结构、技术栈、架构模式、依赖关系
- 分析现有代码模式、现有文档和约定
- 理解业务域和数据模型

### 2. 需求理解确认

- 创建 docs/任务名/ALIGNMENT_[任务名].md
- 包含项目和任务特性规范
- 包含原始需求、边界确认(明确任务范围)、需求理解(对现有项目的理解)、疑问澄清(存在歧义的地方)

### 3. 智能决策策略

- 自动识别歧义和不确定性
- 生成结构化问题清单（按优先级排序）
- 优先基于现有项目内容和查找类似工程和行业知识进行决策和在文档中回答
- 有人员倾向或不确定的问题主动中断并询问关键决策点
- 基于回答更新理解和规范

### 4. 中断并询问关键决策点

- 主动中断询问，迭代执行智能决策策略

### 5. 最终共识

生成 docs/任务名/CONSENSUS_[任务名].md 包含:

- 明确的需求描述和验收标准
- 技术实现方案和技术约束和集成方案
- 任务边界限制和验收标准
- 确认所有不确定性已解决

### 质量门控

- 需求边界清晰无歧义
- 技术方案与现有架构对齐
- 验收标准具体可测试
- 所有关键假设已确认
- 项目特性规范已对齐

## 阶段2: Architect (架构阶段)
**目标: **共识文档 → 系统架构 → 模块设计 → 接口规范

### 执行步骤

### 1. 系统分层设计

基于CONSENSUS、ALIGNMENT文档设计架构

生成 docs/任务名/DESIGN_[任务名].md 包含:

- 整体架构图(mermaid绘制)
- 分层设计和核心组件
- 模块依赖关系图
- 接口契约定义
- 数据流向图
- 异常处理策略

### 2. 设计原则

- 严格按照任务范围，避免过度设计
- 确保与现有系统架构一致
- 复用现有组件和模式

### 质量门控

- 架构图清晰准确
- 接口定义完整
- 与现有系统无冲突
- 设计可行性验证

## 阶段3: Atomize (原子化阶段)

**目标:** 架构设计 → 拆分任务 → 明确接口 → 依赖关系

### 执行步骤

### 1. 子任务拆分

基于DESIGN文档生成 docs/任务名/TASK_[任务名].md

每个原子任务包含:

- 输入契约(前置依赖、输入数据、环境依赖)
- 输出契约(输出数据、交付物、验收标准)
- 实现约束(技术栈、接口规范、质量要求)
- 依赖关系(后置任务、并行任务)

### 2. 拆分原则

- 复杂度可控，便于AI高成功率交付
- 按功能模块分解，确保任务原子性和独立性
- 有明确的验收标准，尽量可以独立编译和测试
- 依赖关系清晰

### 3. 生成任务依赖图(使用mermaid)

### 质量门控

- 任务覆盖完整需求
- 依赖关系无循环
- 每个任务都可独立验证
- 复杂度评估合理

## 阶段4: Approve (审批阶段)
**目标:** 原子任务 → 人工审查 → 迭代修改 → 按文档执行

### 执行步骤

### 1. 执行检查清单

- 完整性：任务计划覆盖所有需求
- 一致性：与前期文档保持一致
- 可行性：技术方案确实可行
- 可控性：风险在可接受范围，复杂度是否可控
- 可测性：验收标准明确可执行

### 2. 最终确认清单

- 明确的实现需求(无歧义)
- 明确的子任务定义
- 明确的边界和限制
- 明确的验收标准
- 代码、测试、文档质量标准

## 阶段5: Automate (自动化执行)
**目标:** 按节点执行 → 编写测试 → 实现代码 → 文档同步

### 执行步骤

### 1. 逐步实施子任务

- 创建 docs/任务名/ACCEPTANCE_[任务名].md 记录完成情况

### 2. 代码质量要求

- 严格遵循项目现有代码规范
- 保持与现有代码风格一致
- 使用项目现有的工具和库
- 复用项目现有组件
- 代码尽量精简易读
- API KEY放到.env文件中并且不要提交git

### 3. 异常处理

- 遇到不确定问题立刻中断执行
- 在TASK文档中记录问题详细信息和位置
- 寻求人工澄清后继续

### 4. 逐步实施流程 按任务依赖顺序执行，对每个子任务执行:

- 执行前检查(验证输入契约、环境准备、依赖满足)
- 实现核心逻辑(按设计文档编写代码)
- 编写单元测试(边界条件、异常情况)
- 运行验证测试
- 更新相关文档
- 每完成一个任务立即验证

## 阶段6: Assess (评估阶段)
**目标:** 执行结果 → 质量评估 → 文档更新 → 交付确认

### 执行步骤

### 1. 验证执行结果

更新 docs/任务名/ACCEPTANCE_[任务名].md

整体验收检查:

- 所有需求已实现
- 验收标准全部满足
- 项目编译通过
- 所有测试通过
- 功能完整性验证
- 实现与设计文档一致

### 2. 质量评估指标

- 代码质量(规范、可读性、复杂度)
- 测试质量(覆盖率、用例有效性)
- 文档质量(完整性、准确性、一致性)
- 现有系统集成良好
- 未引入技术债务

### 3. 最终交付物

- 生成 docs/任务名/FINAL_[任务名].md(项目总结报告)
- 生成 docs/任务名/TODO_[任务名].md(精简明确哪些待办的事宜和哪些缺少的配置等，我方便直接寻找支持)

### 4. TODO询问 询问用户TODO的解决方式，精简明确哪些待办的事宜和哪些缺少的配置等，同时提供有用的操作指引

## 技术执行规范

### 安全规范

API密钥等敏感信息使用.env文件管理

### 文档同步

代码变更同时更新相关文档

### 测试策略
**- 测试优先：**先写测试，后写实现
**- 边界覆盖：**覆盖正常流程、边界条件、异常情况

## 交互体验优化

## 进度反馈
- 显示当前执行阶段
- 提供详细的执行步骤
- 标示完成情况
- 突出需要关注的问题

## 异常处理机制

### 中断条件
- 遇到无法自主决策的问题
- 觉得需要询问用户的问题
- 技术实现出现阻塞
- 文档不一致需要确认修正

### 恢复策略
- 保存当前执行状态
- 记录问题详细信息
- 询问并等待人工干预
- 从中断点任务继续执行
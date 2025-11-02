# 项目文档上传功能 - 对齐文档 (ALIGNMENT)

## 📋 任务概述

**任务名称**: 项目文档上传功能实现  
**创建时间**: 2025-11-01  
**任务来源**: 用户反馈"点击上传没有效果"

---

## 🎯 原始需求

用户在项目创建/编辑界面看到"项目文档"上传区域，但点击上传按钮没有任何反应。需要实现完整的文档上传功能。

---

## 📊 项目上下文分析

### 1. 现有项目架构

**技术栈**:
- **前端**: React + TypeScript + Vite
- **后端**: Node.js + Express + TypeScript
- **数据库**: PostgreSQL (通过 Supabase)
- **认证**: JWT Token
- **API 通信**: Axios

**项目结构**:
```
AI_Workbench/
├── client/                 # 前端应用
│   ├── src/
│   │   ├── components/    # React 组件
│   │   ├── services/      # API 服务层
│   │   └── ...
├── server/                # 后端应用
│   ├── src/
│   │   ├── controllers/   # 控制器
│   │   ├── models/        # 数据模型
│   │   ├── routes/        # 路由
│   │   ├── middleware/    # 中间件
│   │   └── ...
└── docs/                  # 文档
```

### 2. 现有相关功能分析

**✅ 已存在的功能**:
1. **数据库表结构**: `project_documents` 表已创建
   ```sql
   CREATE TABLE IF NOT EXISTS project_documents (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
       title VARCHAR(255) NOT NULL,
       content TEXT,
       type VARCHAR(50) DEFAULT 'document',
       creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       created_at TIMESTAMPTZ DEFAULT NOW(),
       updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **项目管理功能**: 完整的项目 CRUD 操作
3. **用户认证**: JWT 认证中间件
4. **文件上传基础设施**: Docker 配置中已有 `/app/uploads` 目录映射

**❌ 缺失的功能**:
1. 文件上传中间件 (multer)
2. 文件存储服务
3. 项目文档 API 接口
4. 前端文件上传组件
5. 文件下载和预览功能

### 3. 相似功能参考

项目中有**用户批量导入**功能，使用了文件上传：
- 前端: `userService.importUsers(file)` 使用 FormData
- 但后端实现未找到，可能也未完成

---

## 🔍 需求理解

### 功能边界

**包含的功能**:
1. ✅ 文件上传 (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX)
2. ✅ 文件大小限制 (最大 10MB)
3. ✅ 文件列表展示
4. ✅ 文件下载
5. ✅ 文件删除
6. ✅ 权限控制 (只有项目成员可以上传/删除)

**不包含的功能**:
1. ❌ 文件在线预览 (PDF/Office 文档)
2. ❌ 文件版本管理
3. ❌ 文件分类和标签
4. ❌ 文件搜索功能
5. ❌ 文件分享链接

### 用户场景

**场景 1: 项目创建时上传文档**
```
用户操作流程:
1. 打开项目创建弹窗
2. 填写项目基本信息
3. 点击"项目文档"区域上传文件
4. 选择本地文件 (需求文档.pdf)
5. 文件上传成功，显示文件名
6. 提交创建项目
```

**场景 2: 项目编辑时管理文档**
```
用户操作流程:
1. 打开项目编辑弹窗
2. 查看已上传的文档列表
3. 上传新文档或删除旧文档
4. 下载查看文档内容
5. 保存修改
```

---

## 🤔 疑问澄清

### 需要确认的问题

#### 1. 文件存储方式 ⚠️ **需要决策**

**选项 A: 本地文件系统存储**
- ✅ 实现简单，无需额外服务
- ✅ 成本低
- ❌ 不适合分布式部署
- ❌ 备份和恢复复杂

**选项 B: Supabase Storage**
- ✅ 云存储，支持分布式
- ✅ 自动备份
- ✅ CDN 加速
- ❌ 需要配置 Supabase Storage
- ❌ 可能有存储成本

**选项 C: 第三方云存储 (AWS S3/阿里云 OSS)**
- ✅ 稳定可靠
- ✅ 功能强大
- ❌ 需要额外配置
- ❌ 有存储成本

**💡 建议**: 
- **开发阶段**: 使用本地文件系统 (选项 A)
- **生产环境**: 可以后续迁移到 Supabase Storage (选项 B)

**🎯 决策**: 先使用**本地文件系统**，预留接口便于后续迁移

---

#### 2. 文件上传时机 ⚠️ **需要决策**

**选项 A: 项目创建/编辑时一起提交**
- ✅ 用户体验流畅
- ❌ 如果项目创建失败，文件已上传需要清理
- ❌ 实现复杂度高

**选项 B: 独立的文档管理接口**
- ✅ 实现简单
- ✅ 文件和项目解耦
- ❌ 需要额外的文档管理界面

**💡 建议**: 使用**选项 B**，独立的文档管理

**🎯 决策**: 使用独立的文档管理 API，在项目详情页面管理文档

---

#### 3. 文件命名策略 ✅ **已确定**

使用 UUID + 原始文件扩展名，避免文件名冲突:
```
存储文件名: 550e8400-e29b-41d4-a716-446655440000.pdf
数据库记录: { title: "需求文档.pdf", file_path: "..." }
```

---

#### 4. 安全性考虑 ✅ **已确定**

1. **文件类型验证**: 白名单机制，只允许指定类型
2. **文件大小限制**: 最大 10MB
3. **权限控制**: 只有项目成员可以上传/删除
4. **文件扫描**: 暂不实现病毒扫描 (可后续添加)

---

## 📝 技术约束

### 必须遵守的约束

1. **使用现有技术栈**: 不引入新的框架
2. **遵循现有代码风格**: 参考现有 Controller/Model/Service 模式
3. **使用 Supabase**: 数据库操作使用 supabaseAdmin
4. **JWT 认证**: 使用现有的 authenticateToken 中间件
5. **错误处理**: 统一的错误响应格式

### 需要添加的依赖

**后端**:
- `multer`: 文件上传中间件 (^1.4.5-lts.1)
- `@types/multer`: TypeScript 类型定义

**前端**:
- 无需新增依赖，使用现有的 Axios

---

## ✅ 验收标准

### 功能验收

1. ✅ 用户可以在项目详情页上传文档
2. ✅ 支持的文件类型: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
3. ✅ 文件大小限制: 最大 10MB
4. ✅ 上传成功后显示文档列表
5. ✅ 用户可以下载已上传的文档
6. ✅ 用户可以删除自己上传的文档
7. ✅ 非项目成员无法上传/删除文档
8. ✅ 文件上传失败时有明确的错误提示

### 技术验收

1. ✅ 后端 API 符合 RESTful 规范
2. ✅ 前端代码符合现有组件规范
3. ✅ 数据库操作使用 Supabase
4. ✅ 文件存储路径规范: `uploads/projects/{project_id}/{filename}`
5. ✅ 错误处理完善，有日志记录
6. ✅ 代码有适当的注释

### 性能验收

1. ✅ 文件上传速度合理 (10MB 文件 < 30秒)
2. ✅ 文件列表加载快速 (< 1秒)
3. ✅ 不阻塞其他项目操作

---

## 🚀 实现方案概述

### 后端实现

1. **安装依赖**: multer
2. **创建文件上传中间件**: `middleware/upload.ts`
3. **创建文档模型**: `models/ProjectDocument.ts`
4. **创建文档控制器**: `controllers/projectDocumentController.ts`
5. **创建路由**: `routes/projectDocuments.ts`
6. **更新主路由**: 注册文档路由

### 前端实现

1. **创建文档服务**: `services/projectDocumentService.ts`
2. **创建文档上传组件**: `components/projects/DocumentUpload.tsx`
3. **创建文档列表组件**: `components/projects/DocumentList.tsx`
4. **集成到项目详情**: 在 `ProjectDetailModal.tsx` 中添加文档管理标签页

---

## 📌 下一步行动

1. ✅ 完成对齐文档 (当前)
2. ⏭️ 创建架构设计文档 (DESIGN)
3. ⏭️ 创建任务拆分文档 (TASK)
4. ⏭️ 等待人工审批 (APPROVE)
5. ⏭️ 开始实现 (AUTOMATE)

---

## 📅 时间估算

- **架构设计**: 30 分钟
- **后端开发**: 2 小时
- **前端开发**: 2 小时
- **测试验证**: 1 小时
- **文档更新**: 30 分钟

**总计**: 约 6 小时

---

**文档状态**: ✅ 已完成  
**创建时间**: 2025-11-01  
**最后更新**: 2025-11-01


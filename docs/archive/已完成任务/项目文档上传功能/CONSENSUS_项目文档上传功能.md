# 项目文档上传功能 - 共识文档 (CONSENSUS)

## 📋 最终需求确认

### 核心功能

**必须实现的功能** (P0):
1. ✅ 文件上传功能 (支持拖拽)
2. ✅ 文件列表展示
3. ✅ 文件下载功能
4. ✅ 文件删除功能
5. ✅ 权限控制
6. ✅ 在线预览 (PDF, 图片)
7. ✅ 版本管理 (文件历史)
8. ✅ 项目创建时上传

---

## 🎯 技术方案确认

### 1. 文件存储方案

**✅ 最终决策: 本地文件系统存储**

**存储路径规范**:
```
uploads/
└── projects/
    └── {project_id}/
        └── documents/
            ├── {uuid}.pdf
            ├── {uuid}.docx
            └── ...
```

**文件命名规则**:
- 存储文件名: `{uuid}.{ext}` (例: `550e8400-e29b-41d4-a716-446655440000.pdf`)
- 数据库保存原始文件名用于展示

**优势**:
- 实现简单，无需额外配置
- 开发和测试方便
- 预留接口，便于后续迁移到云存储

---

### 2. 文件上传时机

**✅ 最终决策: 双重上传入口**

**实现方式**:
1. **项目详情页**: 在"文档"标签页管理文档
2. **项目创建时**: 在创建表单中添加文档上传区域

**技术实现**:
- 项目创建时: 先上传文件，暂存临时区域，项目创建成功后移动到正式目录
- 项目详情页: 直接上传到项目文档目录

**优势**:
- 灵活性强，满足不同使用场景
- 项目创建时可以一次性准备好所有资料
- 后期管理方便，可随时添加/删除文档

---

### 3. 支持的文件类型

**✅ 白名单机制**:
```typescript
const ALLOWED_MIME_TYPES = [
  'application/pdf',                                                      // PDF
  'application/msword',                                                   // DOC
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'application/vnd.ms-excel',                                            // XLS
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  // XLSX
  'application/vnd.ms-powerpoint',                                       // PPT
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
  'image/jpeg',                                                          // JPG
  'image/png',                                                           // PNG
  'image/gif',                                                           // GIF
  'image/webp'                                                           // WEBP
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.gif', '.webp'];
```

**文件大小限制**: 20MB (20 * 1024 * 1024 bytes) - 增加以支持图片和复杂文档

### 4. 在线预览功能

**✅ 预览策略**:
- **PDF 文件**: 使用 PDF.js 或浏览器原生预览
- **图片文件**: 直接显示
- **Office 文件**: 提示下载，暂不支持在线预览

**实现方式**:
```typescript
// 前端预览组件
<DocumentPreview document={selectedDocument} />

// 后端预览 API
GET /api/projects/:project_id/documents/:document_id/preview
```

### 5. 版本管理功能

**✅ 版本控制策略**:
- 同名文件上传时创建新版本
- 保留文件历史记录
- 支持查看版本列表
- 支持恢复历史版本
- 支持删除特定版本

**数据库设计**:
```sql
-- 添加版本字段
ALTER TABLE project_documents
ADD COLUMN version INTEGER NOT NULL DEFAULT 1,
ADD COLUMN parent_document_id UUID REFERENCES project_documents(id) ON DELETE SET NULL,
ADD COLUMN is_latest BOOLEAN DEFAULT TRUE;

-- 版本索引
CREATE INDEX idx_project_documents_parent ON project_documents(parent_document_id);
```

**版本号规则**:
- 首次上传: version = 1
- 同名文件上传: version = parent_version + 1
- 列表默认只显示最新版本 (is_latest = true)

### 6. 拖拽上传功能

**✅ 实现方式**:
- 使用 HTML5 Drag & Drop API
- 支持拖拽单个/多个文件
- 拖拽区域高亮提示
- 实时上传进度显示

**用户体验**:
```
┌─────────────────────────────┐
│  📁 拖拽文件到此处上传      │
│  或点击选择文件             │
│  支持 PDF, DOC, 图片等      │
│  最大 20MB                  │
└─────────────────────────────┘
```

---

### 7. 权限控制策略

**上传权限**:
- ✅ 项目成员 (admin, member, observer 都可以上传)
- ❌ 非项目成员

**删除权限**:
- ✅ 文档上传者本人
- ✅ 项目管理员 (admin)
- ❌ 其他成员

**下载权限**:
- ✅ 所有项目成员

---

### 8. 数据库设计

**使用现有的 `project_documents` 表**:
```sql
CREATE TABLE IF NOT EXISTS project_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,              -- 原始文件名
    file_path VARCHAR(500) NOT NULL,          -- 文件存储路径
    file_size INTEGER NOT NULL,               -- 文件大小 (bytes)
    mime_type VARCHAR(100) NOT NULL,          -- MIME 类型
    version INTEGER NOT NULL DEFAULT 1,       -- 文件版本号
    parent_document_id UUID REFERENCES project_documents(id) ON DELETE SET NULL, -- 父版本ID
    is_latest BOOLEAN DEFAULT TRUE,           -- 是否最新版本
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**需要添加的字段**:
- `file_path`: 文件存储路径
- `file_size`: 文件大小
- `mime_type`: MIME 类型
- `version`: 版本号
- `parent_document_id`: 父版本ID (用于版本追踪)
- `is_latest`: 是否最新版本

**迁移脚本**: 需要创建 ALTER TABLE 语句

---

## 🔌 API 接口设计

### 1. 上传文档
```
POST /api/projects/:project_id/documents
Content-Type: multipart/form-data

Body:
- file: File (必需)

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "需求文档.pdf",
    "file_size": 1024000,
    "mime_type": "application/pdf",
    "created_at": "2025-11-01T10:00:00Z"
  }
}
```

### 2. 获取文档列表
```
GET /api/projects/:project_id/documents

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "需求文档.pdf",
      "file_size": 1024000,
      "mime_type": "application/pdf",
      "creator": {
        "id": "uuid",
        "display_name": "张三"
      },
      "created_at": "2025-11-01T10:00:00Z"
    }
  ]
}
```

### 3. 下载文档
```
GET /api/projects/:project_id/documents/:document_id/download

Response:
- Content-Type: {mime_type}
- Content-Disposition: attachment; filename="{title}"
- Body: File Stream
```

### 4. 删除文档
```
DELETE /api/projects/:project_id/documents/:document_id

Response:
{
  "success": true,
  "message": "文档删除成功"
}
```

### 5. 预览文档
```
GET /api/projects/:project_id/documents/:document_id/preview

Response:
- Content-Type: {mime_type}
- Body: File Stream (用于预览)
```

### 6. 获取文档版本列表
```
GET /api/projects/:project_id/documents/:document_id/versions

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "version": 2,
      "file_size": 1024000,
      "creator": {
        "id": "uuid",
        "display_name": "张三"
      },
      "created_at": "2025-11-01T10:00:00Z",
      "is_latest": true
    },
    {
      "id": "uuid",
      "version": 1,
      "file_size": 980000,
      "creator": {
        "id": "uuid",
        "display_name": "李四"
      },
      "created_at": "2025-10-30T10:00:00Z",
      "is_latest": false
    }
  ]
}
```

### 7. 恢复文档版本
```
POST /api/projects/:project_id/documents/:document_id/restore

Body:
{
  "version_id": "uuid"
}

Response:
{
  "success": true,
  "data": {
    "id": "new_uuid",
    "version": 3,
    "message": "版本已恢复为最新版本"
  }
}
```

### 8. 临时上传 (项目创建时)
```
POST /api/uploads/temp

Content-Type: multipart/form-data

Body:
- file: File

Response:
{
  "success": true,
  "data": {
    "temp_id": "uuid",
    "filename": "需求文档.pdf",
    "file_size": 1024000,
    "mime_type": "application/pdf"
  }
}
```

### 9. 关联临时文件到项目
```
POST /api/projects/:project_id/documents/attach

Body:
{
  "temp_ids": ["uuid1", "uuid2"]
}

Response:
{
  "success": true,
  "data": {
    "attached_count": 2
  }
}
```

---

## 🎨 前端 UI 设计

### 1. 项目详情页面结构

```
ProjectDetailModal
├── 基本信息 (Tab)
├── 成员管理 (Tab)
├── 任务列表 (Tab)
└── 📄 项目文档 (Tab) ← 新增
    ├── 上传区域 (支持拖拽)
    │   ├── 拖拽区域
    │   ├── 选择文件按钮
    │   ├── 上传进度条
    │   └── 文件类型和大小提示
    └── 文档列表
        ├── 文档项 1
        │   ├── 文件图标
        │   ├── 文件名 + 版本号
        │   ├── 文件大小
        │   ├── 上传者 + 时间
        │   ├── 预览按钮 (PDF/图片)
        │   ├── 下载按钮
        │   ├── 版本历史按钮
        │   └── 删除按钮 (有权限时)
        └── ...
```

### 2. 项目创建表单 (新增)

```
CreateProjectModal
├── 基本信息
│   ├── 项目名称
│   ├── 项目描述
│   └── 项目状态
├── 成员配置
└── 📄 项目文档 (新增)
    ├── 拖拽上传区域
    ├── 临时文件列表
    │   ├── 文件1 + 删除按钮
    │   ├── 文件2 + 删除按钮
    │   └── ...
    └── 提示: 文件将在项目创建后关联
```

### 3. 文档预览模态框 (新增)

```
DocumentPreviewModal
├── 头部
│   ├── 文件名
│   ├── 关闭按钮
│   └── 下载按钮
├── 预览区域
│   ├── PDF: PDF.js 渲染
│   ├── 图片: <img> 展示
│   └── 其他: 提示不支持预览
└── 底部操作栏
    ├── 页码 (PDF)
    └── 缩放控制 (PDF/图片)
```

### 4. 版本历史模态框 (新增)

```
DocumentVersionModal
├── 头部
│   ├── 文件名
│   └── 关闭按钮
├── 版本列表
│   ├── 版本 3 (最新)
│   │   ├── 上传者 + 时间
│   │   ├── 文件大小
│   │   ├── 预览按钮
│   │   └── 下载按钮
│   ├── 版本 2
│   │   ├── 上传者 + 时间
│   │   ├── 文件大小
│   │   ├── 预览按钮
│   │   ├── 下载按钮
│   │   └── 恢复按钮
│   └── ...
└── 底部提示
    └── 恢复版本将创建新的最新版本
```

### 5. 拖拽上传流程

1. 用户拖拽文件到上传区域
2. 区域高亮显示 (蓝色边框)
3. 释放文件，开始上传
4. 显示上传进度条
5. 上传成功，刷新列表
6. 上传失败，显示错误提示

### 6. 版本上传流程

1. 用户上传同名文件
2. 系统检测到文件名冲突
3. 提示: "检测到同名文件，将创建新版本"
4. 用户确认
5. 创建新版本 (version + 1)
6. 旧版本标记为非最新 (is_latest = false)

---

## 🛡️ 安全性设计

### 1. 文件验证

**前端验证** (用户体验):
- 文件类型检查 (扩展名)
- 文件大小检查

**后端验证** (安全保障):
- MIME 类型检查
- 文件大小检查
- 文件扩展名检查
- 文件内容验证 (magic number)

### 2. 权限验证

**每个接口都需要验证**:
1. 用户是否已认证
2. 用户是否是项目成员
3. 用户是否有相应操作权限

### 3. 路径安全

**防止路径遍历攻击**:
- 使用 UUID 作为文件名
- 严格限制文件存储路径
- 不直接使用用户输入的文件名

---

## 📦 依赖管理

### 后端新增依赖

```json
{
  "dependencies": {
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "@types/multer": "^1.4.11"
  }
}
```

### 前端新增依赖

```json
{
  "dependencies": {
    "react-pdf": "^7.5.1",
    "@react-pdf-viewer/core": "^3.12.0",
    "@react-pdf-viewer/default-layout": "^3.12.0"
  }
}
```

**依赖说明**:
- `react-pdf` 或 `@react-pdf-viewer/*`: PDF 预览组件
- 使用现有依赖: `axios`, `react-icons`, `react-dropzone` (如果需要更强大的拖拽功能)

---

## 🧪 测试策略

### 后端测试

**单元测试** (暂不实现，可后续添加):
- 文件上传中间件测试
- 文档模型测试
- 权限验证测试

**手动测试**:
1. 上传各种类型的文件
2. 上传超大文件 (>10MB)
3. 上传不支持的文件类型
4. 非项目成员尝试上传
5. 删除他人上传的文档
6. 下载文档

### 前端测试

**手动测试**:
1. 文件选择和上传
2. 上传进度显示
3. 文档列表展示
4. 文件下载
5. 文件删除
6. 错误提示

---

## 📝 验收标准

### 功能完整性

**基础功能**:
- [ ] 用户可以上传文档 (点击/拖拽)
- [ ] 用户可以查看文档列表
- [ ] 用户可以下载文档
- [ ] 用户可以删除文档 (有权限时)
- [ ] 文件类型限制生效
- [ ] 文件大小限制生效 (20MB)
- [ ] 权限控制正确

**高级功能**:
- [ ] PDF 文件可以在线预览
- [ ] 图片文件可以在线预览
- [ ] 同名文件上传创建新版本
- [ ] 可以查看文档版本历史
- [ ] 可以恢复历史版本
- [ ] 拖拽上传正常工作
- [ ] 项目创建时可以上传文档
- [ ] 临时文件正确关联到项目

### 用户体验

- [ ] 上传过程有进度提示
- [ ] 拖拽区域有高亮反馈
- [ ] 操作成功有提示
- [ ] 操作失败有明确的错误信息
- [ ] 界面美观，符合现有设计风格
- [ ] 预览窗口流畅
- [ ] 版本历史清晰易懂

### 代码质量

- [ ] 代码符合项目规范
- [ ] 有适当的注释
- [ ] 错误处理完善
- [ ] 日志记录清晰
- [ ] TypeScript 类型安全
- [ ] 无 linter 错误

---

## 🚀 实施计划

### 阶段 1: 架构设计 (1小时)
- 创建详细的架构设计文档
- 绘制系统架构图
- 定义接口规范
- 设计版本管理逻辑
- 设计预览功能架构

### 阶段 2: 任务拆分 (1小时)
- 拆分原子任务 (预计 18-20 个任务)
- 定义任务依赖关系
- 创建任务清单

### 阶段 3: 后端实现 (4小时)
- 安装依赖
- 数据库迁移 (添加版本字段)
- 实现上传中间件
- 实现文档模型 (含版本管理)
- 实现文档控制器 (含预览/版本API)
- 实现临时文件管理
- 配置路由

### 阶段 4: 前端实现 (5小时)
- 安装 PDF 预览依赖
- 创建文档服务 (含版本API)
- 创建拖拽上传组件
- 创建文档列表组件
- 创建预览模态框
- 创建版本历史模态框
- 集成到项目详情页
- 集成到项目创建表单

### 阶段 5: 测试验证 (2小时)
- 基础功能测试
- 拖拽上传测试
- 版本管理测试
- 预览功能测试
- 权限测试
- 边界测试
- 错误处理测试

### 阶段 6: 文档更新 (1小时)
- 更新 API 文档
- 更新用户手册
- 创建 TODO 清单
- 创建使用指南

**总预计时间**: 约 14 小时

---

## ✅ 共识确认

以下技术方案已确认，无需再次询问:

1. ✅ **文件存储**: 本地文件系统 (`uploads/projects/{id}/documents/`)
2. ✅ **上传时机**: 
   - 项目详情页的"文档"标签页
   - 项目创建表单 (临时上传 + 关联)
3. ✅ **文件类型**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, GIF, WEBP
4. ✅ **文件大小**: 最大 20MB
5. ✅ **权限控制**: 项目成员可上传，上传者和管理员可删除
6. ✅ **数据库**: 使用现有 project_documents 表，添加版本管理字段
7. ✅ **上传方式**: 支持点击选择和拖拽上传
8. ✅ **在线预览**: PDF 和图片文件支持预览
9. ✅ **版本管理**: 同名文件自动创建新版本，支持查看历史和恢复

---

**文档状态**: ✅ 已完成  
**创建时间**: 2025-11-01  
**最后更新**: 2025-11-01  
**下一步**: 创建架构设计文档 (DESIGN)


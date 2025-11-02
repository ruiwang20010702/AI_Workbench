# AI Workbench 文档中心

**最后更新**: 2025-11-02

---

## 📚 文档导航

### 🚀 快速开始

| 文档 | 说明 | 推荐度 |
|------|------|--------|
| [AI优化功能使用指南](./AI优化功能使用指南.md) | AI 周报优化功能的使用说明 | ⭐⭐⭐⭐⭐ |
| [QUICK_START_MCP](./QUICK_START_MCP.md) | MCP 快速开始指南 | ⭐⭐⭐⭐ |
| [C1-需求文档](./C1-需求文档.md) | 项目需求文档 | ⭐⭐⭐⭐ |

---

### 🔧 部署与配置

| 文档 | 说明 |
|------|------|
| [DEPLOYMENT](./DEPLOYMENT.md) | 项目部署指南 |
| [VERCEL_DEPLOYMENT](./VERCEL_DEPLOYMENT.md) | Vercel 部署指南 |
| [MCP_SETUP_WIZARD](./MCP_SETUP_WIZARD.md) | MCP 设置向导 |
| [SUPABASE_MCP_SETUP](./SUPABASE_MCP_SETUP.md) | Supabase MCP 设置 |

---

### 📖 功能使用指南

#### AI 周报优化功能 ✨ 最新

- **[AI优化功能使用指南](./AI优化功能使用指南.md)** - 推荐阅读
  - 如何使用 AI 优化周报
  - 功能对比和使用建议
  - 常见问题解答

---

### 📦 归档文档

历史文档和已完成任务的详细记录已移至 `archive/` 目录：

#### 已完成任务 (`archive/已完成任务/`)

- **AI应用功能** - AI 功能集成
- **E2E测试** - 端到端测试实施
- **周报自动生成功能** - 周报生成功能开发
- **待定成员功能** - 待定成员管理
- **批量导入成员优化** - 成员批量导入
- **数据库架构重构** - 数据库重构项目
- **项目文档上传功能** - 文档上传功能
- **项目管理完善** - 项目管理优化
- **项目诊断** - 项目问题诊断
- **项目分析** - 项目架构分析

#### 测试报告 (`archive/测试报告/`)

- **测试数据生成总结** - 测试数据生成记录
- **AI优化功能测试报告** - AI 功能测试详情
- **AI优化功能部署总结** - AI 功能部署记录

#### 历史文档 (`archive/历史文档/`)

- 周报生成问题修复说明
- 数据库迁移指南
- 测试数据说明
- 说明文档
- 项目管理功能
- implemented-features

---

## 🗂️ 文档结构

```
docs/
├── README.md                      # 📍 你在这里 - 文档导航
├── AI优化功能使用指南.md          # ⭐ 推荐阅读
├── C1-需求文档.md                 # 项目需求
├── DEPLOYMENT.md                  # 部署指南
├── VERCEL_DEPLOYMENT.md           # Vercel 部署
├── MCP_SETUP_WIZARD.md            # MCP 设置
├── QUICK_START_MCP.md             # MCP 快速开始
├── SUPABASE_MCP_SETUP.md          # Supabase 设置
│
└── archive/                       # 归档目录
    ├── 已完成任务/                # 历史任务文档
    │   ├── AI应用功能/
    │   ├── E2E测试/
    │   ├── 周报自动生成功能/
    │   ├── 待定成员功能/
    │   ├── 批量导入成员优化/
    │   ├── 数据库架构重构/
    │   ├── 项目文档上传功能/
    │   ├── 项目管理完善/
    │   ├── 项目诊断/
    │   └── 项目分析/
    │
    ├── 测试报告/                  # 测试相关文档
    │   ├── 测试数据生成总结.md
    │   ├── AI优化功能测试报告.md
    │   └── AI优化功能部署总结.md
    │
    └── 历史文档/                  # 历史版本文档
        ├── 周报生成问题修复说明.md
        ├── 数据库迁移指南.md
        ├── 测试数据说明.md
        ├── 说明文档.md
        ├── 项目管理功能.md
        └── implemented-features.md
```

---

## 🎯 文档使用建议

### 新用户

1. 先阅读 [C1-需求文档](./C1-需求文档.md) 了解项目
2. 查看 [DEPLOYMENT](./DEPLOYMENT.md) 部署项目
3. 阅读 [AI优化功能使用指南](./AI优化功能使用指南.md) 使用核心功能

### 开发者

1. 查看 `archive/已完成任务/` 了解历史功能实现
2. 参考各任务的 `DESIGN_*.md` 了解架构设计
3. 查看 `FINAL_*.md` 了解功能交付情况

### 运维人员

1. 参考 [DEPLOYMENT](./DEPLOYMENT.md) 和 [VERCEL_DEPLOYMENT](./VERCEL_DEPLOYMENT.md)
2. 查看 [MCP_SETUP_WIZARD](./MCP_SETUP_WIZARD.md) 配置 MCP
3. 参考 `archive/测试报告/` 了解测试情况

---

## 📝 文档规范

### 文档命名

- **用户指南**: `功能名称使用指南.md`
- **技术文档**: `UPPERCASE_NAME.md`
- **任务文档**: 放在对应任务目录下

### 文档结构

每个任务目录通常包含：
- `ALIGNMENT_*.md` - 需求对齐
- `CONSENSUS_*.md` - 共识文档
- `DESIGN_*.md` - 设计文档
- `TASK_*.md` - 任务拆分
- `ACCEPTANCE_*.md` - 验收记录
- `FINAL_*.md` - 最终总结
- `TODO_*.md` - 待办事项

---

## 🔍 快速查找

### 按功能查找

- **周报功能**: `archive/已完成任务/周报自动生成功能/`
- **成员管理**: `archive/已完成任务/批量导入成员优化/`
- **文档上传**: `archive/已完成任务/项目文档上传功能/`
- **数据库**: `archive/已完成任务/数据库架构重构/`
- **AI 功能**: [AI优化功能使用指南](./AI优化功能使用指南.md)

### 按类型查找

- **部署相关**: [DEPLOYMENT](./DEPLOYMENT.md), [VERCEL_DEPLOYMENT](./VERCEL_DEPLOYMENT.md)
- **配置相关**: [MCP_SETUP_WIZARD](./MCP_SETUP_WIZARD.md), [SUPABASE_MCP_SETUP](./SUPABASE_MCP_SETUP.md)
- **测试相关**: `archive/测试报告/`
- **问题修复**: `archive/已完成任务/项目诊断/`

---

## 💡 提示

- ⭐ 标记的文档是推荐优先阅读的
- 归档文档仍然可以查阅，只是不在主目录显示
- 如需查找特定内容，可以使用 IDE 的全局搜索功能

---

## 📞 获取帮助

如果您在使用过程中遇到问题：

1. 先查看对应的使用指南
2. 查看 `archive/已完成任务/` 中相关功能的文档
3. 查看 `archive/测试报告/` 了解已知问题
4. 查看项目的 README.md

---

**文档整理完成时间**: 2025-11-02  
**整理说明**: 已将历史任务文档归档，保持主目录清爽


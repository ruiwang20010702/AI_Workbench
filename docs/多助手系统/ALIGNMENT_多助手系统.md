# 多助手系统 - 对齐文档

**创建时间**: 2025-11-02  
**任务名称**: 多助手系统（参考CherryStudio）  
**状态**: 需求对齐

---

## 📋 原始需求

用户希望将现有的AI助手改造成类似**CherryStudio**的多助手系统：

### 核心需求
1. **左侧助手列表**：多个专业助手（如：代码助手、写作助手、数据分析助手等）
2. **助手可编辑**：用户可以自定义助手的提示词（系统提示）
3. **Topic管理**：每个助手下有多个对话主题（Topic）
4. **知识库集成**：助手可以访问用户的个人知识库（笔记、项目、待办）
5. **UI/UX**：参考CherryStudio的界面设计

### 用户明确的需求
- ✅ Topic和助手列表都在左边，二选一切换显示
- ✅ 一个助手下可以有多个Topic
- ✅ 每个Topic是独立的对话历史
- ✅ Topic无数量限制
- ✅ Topic既可以自动生成也可以手动命名
- ✅ 开放权限方式（所有助手都可以访问所有知识库）
- ✅ 检索方式由我决定（基于用户习惯）
- ✅ 数据存储到Supabase（PostgreSQL）

---

## 🎯 项目上下文分析

### 1. 现有项目架构

#### 技术栈
- **前端**: React + TypeScript + TailwindCSS
- **后端**: Node.js + Express + TypeScript
- **数据库**: PostgreSQL (Supabase)
- **AI服务**: SiliconFlow API（兼容OpenAI格式）

#### 现有AI功能
1. **智能问答**（刚完成）
   - 意图识别（5种类型）
   - 数据检索（笔记、项目、待办）
   - 自然语言回答生成
   - 对话历史管理（localStorage，最多20条）

2. **其他AI工具**
   - 文本生成
   - 文本改写
   - 文本翻译
   - 文本分析
   - 智能推荐
   - 预测分析

#### 现有数据模型
```sql
-- 用户表
users (id, email, password_hash, display_name, avatar_url, created_at, updated_at)

-- 笔记表
notes (id, user_id, notebook_id, title, content, tags, is_favorite, is_archived, created_at, updated_at)

-- 项目表
projects (id, name, description, owner_id, status, priority, start_date, end_date, tags, created_at, updated_at)

-- 待办表
todos (id, user_id, note_id, title, description, due_date, priority, status, created_at, updated_at)

-- AI使用日志表
ai_usage_logs (id, user_id, action_type, model_name, input_tokens, output_tokens, cost_cents, created_at)
```

#### 现有对话管理
- **存储方式**: localStorage
- **数据结构**: 
  ```typescript
  interface Conversation {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: Date;
    updatedAt: Date;
  }
  ```
- **限制**: 最多20条对话，最近3轮（6条消息）作为上下文

---

## 🔍 需求理解与分析

### 1. 核心概念定义

#### 助手（Assistant）
- **定义**: 具有特定角色和专业能力的AI实体
- **属性**:
  - 名称（如：代码助手、写作助手）
  - 图标/头像
  - 系统提示词（定义助手的角色和能力）
  - 模型选择（可选，默认使用全局配置）
  - 参数配置（温度、top_p等，可选）
- **功能**:
  - 用户可以创建、编辑、删除助手
  - 每个助手有独立的对话主题列表

#### 主题（Topic）
- **定义**: 助手下的一个独立对话会话
- **属性**:
  - 标题（自动生成或手动命名）
  - 消息列表
  - 创建时间、更新时间
- **功能**:
  - 一个助手下可以有多个Topic
  - 每个Topic是独立的对话历史
  - Topic无数量限制（但建议有合理的清理机制）
  - 用户可以切换、删除、重命名Topic

#### 知识库集成
- **范围**: 笔记（notes）、项目（projects）、待办（todos）
- **权限**: 开放权限，所有助手都可以访问
- **检索方式**: 基于意图识别 + 关键词检索（当前方式，用户习惯）

### 2. UI布局设计

#### 左侧面板（二选一切换）
```
┌─────────────────┐
│ [助手] [主题]   │  ← 切换按钮
├─────────────────┤
│                 │
│  助手视图:      │
│  🤖 代码助手    │
│  ✍️  写作助手    │
│  📊 数据助手    │
│  + 新建助手     │
│                 │
│  或              │
│                 │
│  主题视图:      │
│  (当前助手)     │
│  📝 React优化   │
│  📝 API设计     │
│  + 新建主题     │
│                 │
└─────────────────┘
```

#### 完整布局
```
┌─────────────────────────────────────────────────────────┐
│  AI Workbench - 智能助手                                 │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  左侧面板    │       对话区域                           │
│  (可切换)    │                                          │
│              │  ┌────────────────────────────────────┐  │
│ [助手][主题] │  │ 当前助手: 代码助手                 │  │
│              │  │ 当前主题: React优化                │  │
│ 🤖 代码助手  │  └────────────────────────────────────┘  │
│ ✍️  写作助手  │                                          │
│ 📊 数据助手  │  [对话消息列表]                          │
│              │                                          │
│ + 新建助手   │  ┌────────────────────────────────────┐  │
│              │  │ 输入框...              [发送]      │  │
│              │  └────────────────────────────────────┘  │
└──────────────┴──────────────────────────────────────────┘
```

### 3. 数据存储设计

#### 需要新增的数据表

##### assistants（助手表）
```sql
CREATE TABLE assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT '🤖',  -- emoji图标
  system_prompt TEXT NOT NULL,  -- 系统提示词
  model_name VARCHAR(100),  -- 可选，覆盖全局模型
  temperature DECIMAL(3,2),  -- 可选，0.00-2.00
  top_p DECIMAL(3,2),  -- 可选，0.00-1.00
  is_default BOOLEAN DEFAULT false,  -- 是否为默认助手
  sort_order INTEGER DEFAULT 0,  -- 排序
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

##### topics（主题表）
```sql
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  is_auto_title BOOLEAN DEFAULT true,  -- 是否为自动生成的标题
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

##### messages（消息表）
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,  -- 存储意图、数据来源等元数据
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 索引设计
```sql
-- assistants表索引
CREATE INDEX idx_assistants_user_id ON assistants(user_id);
CREATE INDEX idx_assistants_sort_order ON assistants(user_id, sort_order);

-- topics表索引
CREATE INDEX idx_topics_assistant_id ON topics(assistant_id);
CREATE INDEX idx_topics_user_id ON topics(user_id);
CREATE INDEX idx_topics_updated_at ON topics(updated_at DESC);

-- messages表索引
CREATE INDEX idx_messages_topic_id ON messages(topic_id);
CREATE INDEX idx_messages_created_at ON messages(topic_id, created_at);
```

### 4. 功能边界确认

#### 第一版必须实现（MVP）
1. ✅ 助手管理（创建、编辑、删除、排序）
2. ✅ 主题管理（创建、切换、删除、重命名）
3. ✅ 左侧面板切换（助手视图 ↔ 主题视图）
4. ✅ 对话功能（发送消息、接收回复）
5. ✅ 知识库集成（复用现有的意图识别和数据检索）
6. ✅ 系统提示词自定义
7. ✅ 数据持久化到Supabase
8. ✅ 基本的UI/UX（参考CherryStudio）

#### 第二版可选功能
1. ⏳ 预设助手模板（代码助手、写作助手等）
2. ⏳ 助手图标自定义（上传图片）
3. ⏳ 高级参数配置（温度、top_p、max_tokens等）
4. ⏳ 助手导入/导出（JSON格式）
5. ⏳ 主题搜索和过滤
6. ⏳ 消息搜索
7. ⏳ 消息编辑和重新生成
8. ⏳ 多模态支持（图片、文件）

---

## 🤔 疑问与澄清

### 已解决的问题 ✅

1. **Q: Topic和助手列表的布局？**
   - A: 都在左边，二选一切换显示 ✅

2. **Q: Topic数量限制？**
   - A: 无限制 ✅

3. **Q: Topic命名方式？**
   - A: 既可以自动生成也可以手动命名 ✅

4. **Q: 知识库权限？**
   - A: 开放权限，所有助手都可以访问 ✅

5. **Q: 检索方式？**
   - A: 基于意图识别 + 关键词检索（当前方式）✅

6. **Q: 数据存储？**
   - A: Supabase（PostgreSQL）✅

### 待确认的问题 ❓

1. **Q: 是否需要预设助手？**
   - 建议：提供3-5个预设助手模板（代码助手、写作助手、数据分析助手等）
   - 用户可以基于模板创建，也可以从零开始创建
   - **您的意见？**

2. **Q: 助手数量限制？**
   - 建议：最多50个助手（避免列表过长）
   - **您的意见？**

3. **Q: Topic清理机制？**
   - 虽然无数量限制，但建议：
     - 按更新时间排序，最近的在上面
     - 提供"归档"功能，归档旧的Topic
     - 提供"批量删除"功能
   - **您的意见？**

4. **Q: 默认助手？**
   - 建议：用户首次使用时，自动创建一个"默认助手"
   - 系统提示词：通用助手，可以回答各种问题
   - **您的意见？**

5. **Q: 消息历史限制？**
   - 每个Topic保留多少条消息？
   - 建议：无限制，但只取最近50条作为上下文传递给AI
   - **您的意见？**

6. **Q: 现有对话历史迁移？**
   - 当前localStorage中有20条对话历史
   - 是否需要迁移到新系统？
   - 建议：提供一次性迁移工具，将现有对话导入到"默认助手"下
   - **您的意见？**

---

## 📊 技术方案初步评估

### 1. 数据迁移策略

#### 方案A：完全替换
- **优点**: 干净，无历史包袱
- **缺点**: 用户丢失现有对话历史
- **建议**: ❌ 不推荐

#### 方案B：保留localStorage + 新增数据库
- **优点**: 不丢失历史，平滑过渡
- **缺点**: 两套系统，复杂度高
- **建议**: ⚠️ 临时方案

#### 方案C：一次性迁移
- **优点**: 保留历史，统一系统
- **缺点**: 需要迁移脚本
- **建议**: ✅ 推荐

**推荐方案C**: 
1. 创建"默认助手"
2. 将localStorage中的对话迁移为Topic
3. 迁移完成后，清空localStorage
4. 提示用户迁移成功

### 2. 检索方式选择

#### 当前方式：意图识别 + 关键词检索
- **优点**: 已实现，稳定，快速
- **缺点**: 准确性一般，依赖关键词匹配

#### 升级方式：向量检索（语义搜索）
- **优点**: 准确性高，理解语义
- **缺点**: 需要生成embedding，成本高，复杂度高

**建议**: 
- 第一版继续使用当前方式（意图识别 + 关键词检索）✅
- 第二版可选升级为向量检索 ⏳

### 3. 上下文管理策略

#### 方案A：固定数量（如最近10轮）
- **优点**: 简单，token消耗可控
- **缺点**: 可能丢失重要上下文

#### 方案B：智能截断（基于token数）
- **优点**: 充分利用上下文窗口
- **缺点**: 实现复杂

#### 方案C：用户可配置
- **优点**: 灵活
- **缺点**: 增加用户负担

**建议**: 
- 第一版使用方案A（最近10轮，20条消息）✅
- 第二版可选升级为方案B ⏳

---

## 🎨 UI/UX设计原则

### 参考CherryStudio的优点
1. ✅ 左侧列表清晰，易于切换
2. ✅ 助手和主题分离，层级清晰
3. ✅ 对话区域简洁，专注内容
4. ✅ 操作按钮明显，易于发现

### 我们的改进
1. ✅ 集成知识库，AI可以访问用户数据
2. ✅ 智能意图识别，自动检索相关信息
3. ✅ 元数据显示，透明AI的思考过程
4. ✅ 统计信息，了解AI使用情况

---

## 📝 任务范围确认

### 包含的功能
1. ✅ 助手CRUD（创建、读取、更新、删除）
2. ✅ 主题CRUD
3. ✅ 消息CRUD
4. ✅ 左侧面板切换（助手 ↔ 主题）
5. ✅ 对话功能（发送、接收、显示）
6. ✅ 知识库集成（意图识别、数据检索）
7. ✅ 系统提示词自定义
8. ✅ 数据库表创建和迁移
9. ✅ 前端UI组件重构
10. ✅ 后端API接口开发
11. ✅ 现有对话历史迁移工具

### 不包含的功能（第二版）
1. ❌ 预设助手模板
2. ❌ 助手图标上传
3. ❌ 高级参数配置UI
4. ❌ 助手导入/导出
5. ❌ 主题搜索
6. ❌ 消息搜索
7. ❌ 消息编辑
8. ❌ 多模态支持

---

## 🎯 验收标准

### 功能验收
1. ✅ 用户可以创建、编辑、删除助手
2. ✅ 用户可以为助手自定义系统提示词
3. ✅ 用户可以在助手下创建多个主题
4. ✅ 用户可以在主题中进行对话
5. ✅ AI可以访问用户的笔记、项目、待办
6. ✅ 对话历史保存到数据库
7. ✅ 左侧面板可以在助手和主题视图之间切换
8. ✅ 现有对话历史可以迁移到新系统

### 性能验收
1. ✅ 助手列表加载时间 < 500ms
2. ✅ 主题列表加载时间 < 500ms
3. ✅ 消息发送响应时间 < 5秒
4. ✅ 切换助手/主题无明显卡顿

### 用户体验验收
1. ✅ 界面美观，参考CherryStudio
2. ✅ 操作流畅，无明显延迟
3. ✅ 错误提示清晰友好
4. ✅ 支持键盘快捷键

---

## 🚀 下一步行动

1. **等待用户确认**"待确认的问题"部分的6个问题
2. **创建共识文档**（CONSENSUS）- 明确所有决策
3. **进入架构设计阶段**（ARCHITECT）

---

**文档版本**: 1.0.0  
**创建时间**: 2025-11-02  
**状态**: 等待用户确认


# 多助手系统 - 共识文档

**创建时间**: 2025-11-02  
**任务名称**: 多助手系统（参考CherryStudio）  
**状态**: 共识达成 ✅

---

## 🎯 最终需求确认

### 核心功能
1. ✅ **多助手管理** - 用户可创建、编辑、删除多个专业助手
2. ✅ **主题管理** - 每个助手下可有多个独立对话主题
3. ✅ **系统提示词自定义** - 用户可为每个助手定制角色和能力
4. ✅ **知识库集成** - 所有助手都可访问笔记、项目、待办
5. ✅ **数据持久化** - 所有数据存储到Supabase（PostgreSQL）
6. ✅ **UI/UX优化** - 参考CherryStudio的设计理念

### 关键决策（已确认）

#### 1. 预设助手模板 ✅
- **决策**: 提供5个预设助手模板
- **模板列表**:
  1. 🤖 **代码助手** - 专注于编程、调试、代码审查
  2. ✍️ **写作助手** - 专注于文案、文章、创意写作
  3. 📊 **数据分析助手** - 专注于数据分析、统计、可视化
  4. 🌐 **翻译助手** - 专注于多语言翻译
  5. 💡 **通用助手** - 全能助手，可回答各种问题

#### 2. 助手数量限制 ✅
- **决策**: 最多50个助手
- **理由**: 足够日常使用，避免列表过长

#### 3. Topic清理机制 ✅
- **决策**: 
  - 按更新时间倒序排序（最近的在上面）
  - 提供"批量删除"功能
  - 暂不提供"归档"功能（第二版考虑）
- **无数量限制**: Topic可以无限创建

#### 4. 默认助手 ✅
- **决策**: 首次使用时自动创建"通用助手"
- **系统提示词**: "你是一个全能的AI助手，可以回答各种问题，帮助用户完成各种任务。你可以访问用户的笔记、项目和待办事项，提供个性化的帮助。"

#### 5. 消息历史限制 ✅
- **决策**: 
  - 数据库无限制保存所有消息
  - 作为上下文传递给AI时，只取最近50条消息
  - 前端显示时，按需加载（滚动加载）

#### 6. 现有对话迁移 ✅
- **决策**: 提供一次性迁移工具
- **迁移策略**:
  1. 检测localStorage中的对话历史
  2. 创建"默认助手"（如果不存在）
  3. 将每个对话作为一个Topic导入
  4. 迁移完成后清空localStorage
  5. 提示用户迁移成功

---

## 📐 技术实现方案

### 1. 数据库设计

#### 新增表结构

##### assistants（助手表）
```sql
CREATE TABLE assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT '🤖',
  system_prompt TEXT NOT NULL,
  model_name VARCHAR(100),  -- 可选，覆盖全局配置
  temperature DECIMAL(3,2) DEFAULT 0.70,
  top_p DECIMAL(3,2) DEFAULT 0.90,
  is_default BOOLEAN DEFAULT false,
  is_preset BOOLEAN DEFAULT false,  -- 是否为预设模板
  sort_order INTEGER DEFAULT 0,
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
  is_auto_title BOOLEAN DEFAULT true,
  message_count INTEGER DEFAULT 0,  -- 消息数量缓存
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
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 索引设计
```sql
-- assistants表索引
CREATE INDEX idx_assistants_user_id ON assistants(user_id);
CREATE INDEX idx_assistants_user_sort ON assistants(user_id, sort_order);

-- topics表索引
CREATE INDEX idx_topics_assistant_id ON topics(assistant_id);
CREATE INDEX idx_topics_user_id ON topics(user_id);
CREATE INDEX idx_topics_updated_at ON topics(assistant_id, updated_at DESC);

-- messages表索引
CREATE INDEX idx_messages_topic_id ON messages(topic_id);
CREATE INDEX idx_messages_created_at ON messages(topic_id, created_at ASC);
```

### 2. API接口设计

#### 助手管理接口
```typescript
// 获取助手列表
GET /api/assistants
Response: { assistants: Assistant[] }

// 创建助手
POST /api/assistants
Body: { name, description, icon, system_prompt, model_name?, temperature?, top_p? }
Response: { assistant: Assistant }

// 更新助手
PUT /api/assistants/:id
Body: { name?, description?, icon?, system_prompt?, model_name?, temperature?, top_p?, sort_order? }
Response: { assistant: Assistant }

// 删除助手
DELETE /api/assistants/:id
Response: { success: boolean }

// 获取预设模板
GET /api/assistants/presets
Response: { presets: AssistantPreset[] }
```

#### 主题管理接口
```typescript
// 获取主题列表
GET /api/assistants/:assistantId/topics
Response: { topics: Topic[] }

// 创建主题
POST /api/assistants/:assistantId/topics
Body: { title? }  // 可选，不提供则自动生成
Response: { topic: Topic }

// 更新主题
PUT /api/topics/:id
Body: { title }
Response: { topic: Topic }

// 删除主题
DELETE /api/topics/:id
Response: { success: boolean }

// 批量删除主题
DELETE /api/topics/batch
Body: { topicIds: string[] }
Response: { success: boolean, deletedCount: number }
```

#### 消息管理接口
```typescript
// 获取消息列表
GET /api/topics/:topicId/messages?limit=50&offset=0
Response: { messages: Message[], total: number, hasMore: boolean }

// 发送消息（对话）
POST /api/topics/:topicId/messages
Body: { content: string }
Response: { 
  userMessage: Message, 
  assistantMessage: Message,
  metadata: {
    intent: string,
    dataSource: string[],
    itemsFound: number
  }
}
```

#### 迁移接口
```typescript
// 迁移localStorage对话
POST /api/assistants/migrate
Body: { conversations: Conversation[] }
Response: { 
  success: boolean, 
  migratedCount: number,
  defaultAssistant: Assistant
}
```

### 3. 前端组件设计

#### 组件层级结构
```
AIAssistantPage
├── LeftPanel (左侧面板)
│   ├── PanelSwitcher (切换按钮)
│   ├── AssistantList (助手列表视图)
│   │   ├── AssistantItem
│   │   └── CreateAssistantButton
│   └── TopicList (主题列表视图)
│       ├── TopicItem
│       └── CreateTopicButton
├── ChatArea (对话区域)
│   ├── ChatHeader (当前助手/主题信息)
│   ├── MessageList (消息列表)
│   │   └── MessageItem
│   └── MessageInput (输入框)
└── AssistantModal (助手编辑弹窗)
    ├── BasicInfo (基本信息)
    ├── SystemPromptEditor (系统提示词编辑器)
    └── AdvancedSettings (高级设置)
```

### 4. 状态管理设计

#### 使用React Hooks管理状态
```typescript
// 全局状态
const [assistants, setAssistants] = useState<Assistant[]>([]);
const [currentAssistant, setCurrentAssistant] = useState<Assistant | null>(null);
const [topics, setTopics] = useState<Topic[]>([]);
const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
const [messages, setMessages] = useState<Message[]>([]);
const [panelView, setPanelView] = useState<'assistants' | 'topics'>('assistants');
const [loading, setLoading] = useState(false);
```

### 5. 知识库集成方案

#### 复用现有服务
- **IntentService** - 意图识别（5种类型）
- **DataRetrievalService** - 数据检索
- **AnswerService** - 答案生成

#### 系统提示词注入
```typescript
// 构建完整的系统提示词
const fullSystemPrompt = `
${assistant.system_prompt}

你可以访问用户的以下数据：
- 笔记（notes）：用户的个人笔记和知识库
- 项目（projects）：用户的项目和任务
- 待办事项（todos）：用户的待办清单

当用户询问相关问题时，请主动检索这些数据并提供帮助。
`;
```

### 6. 上下文管理策略

#### 上下文构建规则
1. 取最近50条消息
2. 包含系统提示词
3. 如果检索到知识库数据，注入到上下文
4. 总token数控制在4000以内

```typescript
function buildContext(topic: Topic, assistant: Assistant, retrievedData?: any): Message[] {
  const systemMessage = {
    role: 'system',
    content: buildSystemPrompt(assistant, retrievedData)
  };
  
  const recentMessages = messages.slice(-50);
  
  return [systemMessage, ...recentMessages];
}
```

---

## 🎨 UI/UX设计规范

### 1. 布局规范

#### 左侧面板
- **宽度**: 280px
- **背景**: #f9fafb
- **边框**: 右侧1px #e5e7eb

#### 对话区域
- **背景**: #ffffff
- **最大宽度**: 1200px
- **居中显示**

### 2. 颜色规范

#### 主题色
- **主色**: #3b82f6 (蓝色)
- **成功**: #10b981 (绿色)
- **警告**: #f59e0b (橙色)
- **错误**: #ef4444 (红色)

#### 文本色
- **主文本**: #111827
- **次文本**: #6b7280
- **禁用**: #9ca3af

### 3. 交互规范

#### 助手/主题切换
- 点击切换，带过渡动画
- 切换时保持当前选中状态

#### 消息发送
- Enter发送，Shift+Enter换行
- 发送中显示loading状态
- 发送失败显示错误提示

#### 列表操作
- Hover显示操作按钮
- 删除前二次确认
- 批量操作显示选择框

---

## 📋 验收标准

### 功能验收

#### 助手管理
- [x] 用户可以查看助手列表
- [x] 用户可以创建新助手
- [x] 用户可以编辑助手（名称、图标、系统提示词）
- [x] 用户可以删除助手（有二次确认）
- [x] 用户可以拖拽排序助手
- [x] 首次使用自动创建"通用助手"
- [x] 助手数量限制为50个

#### 主题管理
- [x] 用户可以查看当前助手的主题列表
- [x] 用户可以创建新主题（自动生成标题）
- [x] 用户可以重命名主题
- [x] 用户可以删除单个主题
- [x] 用户可以批量删除主题
- [x] 主题按更新时间倒序排列

#### 对话功能
- [x] 用户可以发送消息
- [x] AI可以回复消息
- [x] 消息显示时间戳
- [x] 消息可以复制
- [x] 支持多行输入
- [x] 支持键盘快捷键

#### 知识库集成
- [x] AI可以访问笔记数据
- [x] AI可以访问项目数据
- [x] AI可以访问待办数据
- [x] 显示数据来源元数据
- [x] 显示检索到的数据数量

#### 数据迁移
- [x] 检测localStorage中的对话
- [x] 提供迁移提示
- [x] 一键迁移到默认助手
- [x] 迁移成功提示
- [x] 迁移后清空localStorage

### 性能验收
- [x] 助手列表加载 < 500ms
- [x] 主题列表加载 < 500ms
- [x] 消息列表加载 < 1s
- [x] 消息发送响应 < 5s
- [x] 切换无明显卡顿

### 用户体验验收
- [x] 界面美观，符合现代设计
- [x] 操作流畅，响应及时
- [x] 错误提示清晰友好
- [x] 支持键盘操作
- [x] 移动端适配（响应式）

---

## 🚀 实施计划

### 阶段划分

#### 阶段2: Architect（架构设计）✅
- 详细架构图
- 模块依赖关系
- 接口契约定义
- 数据流向图

#### 阶段3: Atomize（原子化任务）
- 拆分子任务
- 定义输入输出契约
- 明确依赖关系
- 生成任务依赖图

#### 阶段4: Approve（人工审批）
- 审查任务计划
- 确认技术方案
- 评估风险和复杂度
- 最终批准执行

#### 阶段5: Automate（自动化执行）
- 按任务顺序执行
- 编写代码和测试
- 更新文档
- 记录完成情况

#### 阶段6: Assess（评估验收）
- 功能验收测试
- 性能测试
- 用户体验评估
- 生成交付文档

---

## 📊 风险评估

### 技术风险
- **风险**: 数据库迁移可能失败
- **缓解**: 提供回滚机制，保留localStorage备份

### 性能风险
- **风险**: 消息过多导致加载缓慢
- **缓解**: 分页加载，虚拟滚动

### 用户体验风险
- **风险**: 用户不理解新系统
- **缓解**: 提供引导教程，迁移提示

---

## 🎯 成功指标

### 功能完整性
- 100% 核心功能实现
- 0 阻塞性bug

### 性能指标
- 页面加载时间 < 2s
- API响应时间 < 1s
- 消息发送成功率 > 99%

### 用户满意度
- 界面美观度 ⭐⭐⭐⭐⭐
- 操作流畅度 ⭐⭐⭐⭐⭐
- 功能实用性 ⭐⭐⭐⭐⭐

---

**文档版本**: 1.0.0  
**创建时间**: 2025-11-02  
**状态**: 共识达成 ✅  
**下一步**: 进入架构设计阶段


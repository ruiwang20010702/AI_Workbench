-- ============================================
-- 多助手系统 - 数据库表创建脚本
-- 创建时间: 2025-11-02
-- 描述: 创建assistants、topics、messages表及相关索引
-- ============================================

-- 1. 创建assistants表（助手表）
CREATE TABLE IF NOT EXISTS assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT '🤖',
  system_prompt TEXT NOT NULL,
  model_name VARCHAR(100),
  temperature DECIMAL(3,2) DEFAULT 0.70 CHECK (temperature >= 0 AND temperature <= 2),
  top_p DECIMAL(3,2) DEFAULT 0.90 CHECK (top_p >= 0 AND top_p <= 1),
  is_default BOOLEAN DEFAULT false,
  is_preset BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建topics表（主题表）
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  is_auto_title BOOLEAN DEFAULT true,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建messages表（消息表）
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 创建索引
-- ============================================

-- assistants表索引
CREATE INDEX IF NOT EXISTS idx_assistants_user_id ON assistants(user_id);
CREATE INDEX IF NOT EXISTS idx_assistants_user_sort ON assistants(user_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_assistants_is_default ON assistants(user_id, is_default) WHERE is_default = true;

-- topics表索引
CREATE INDEX IF NOT EXISTS idx_topics_assistant_id ON topics(assistant_id);
CREATE INDEX IF NOT EXISTS idx_topics_user_id ON topics(user_id);
CREATE INDEX IF NOT EXISTS idx_topics_updated_at ON topics(assistant_id, updated_at DESC);

-- messages表索引
CREATE INDEX IF NOT EXISTS idx_messages_topic_id ON messages(topic_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(topic_id, created_at ASC);

-- ============================================
-- 创建触发器（自动更新updated_at）
-- ============================================

-- 创建更新时间戳函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- assistants表触发器
DROP TRIGGER IF EXISTS update_assistants_updated_at ON assistants;
CREATE TRIGGER update_assistants_updated_at
  BEFORE UPDATE ON assistants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- topics表触发器
DROP TRIGGER IF EXISTS update_topics_updated_at ON topics;
CREATE TRIGGER update_topics_updated_at
  BEFORE UPDATE ON topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 插入预设助手模板数据
-- ============================================

-- 注意：这些是模板数据，不绑定具体用户
-- 实际使用时，后端会基于这些模板为用户创建助手

COMMENT ON TABLE assistants IS '助手表 - 存储用户创建的AI助手';
COMMENT ON TABLE topics IS '主题表 - 存储助手下的对话主题';
COMMENT ON TABLE messages IS '消息表 - 存储对话消息';

COMMENT ON COLUMN assistants.system_prompt IS '系统提示词 - 定义助手的角色和能力';
COMMENT ON COLUMN assistants.is_default IS '是否为默认助手 - 每个用户只能有一个默认助手';
COMMENT ON COLUMN assistants.is_preset IS '是否为预设模板 - 用于标识系统预设的助手';
COMMENT ON COLUMN topics.is_auto_title IS '标题是否自动生成 - true表示从第一条消息生成';
COMMENT ON COLUMN topics.message_count IS '消息数量 - 缓存字段，提高查询性能';
COMMENT ON COLUMN messages.metadata IS '元数据 - 存储意图、数据来源等信息';

-- ============================================
-- 完成提示
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ 多助手系统数据库表创建成功！';
  RAISE NOTICE '📊 创建的表: assistants, topics, messages';
  RAISE NOTICE '🔍 创建的索引: 9个';
  RAISE NOTICE '⚡ 创建的触发器: 2个';
END $$;


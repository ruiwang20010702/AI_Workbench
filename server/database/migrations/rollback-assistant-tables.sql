-- ============================================
-- 多助手系统 - 数据库回滚脚本
-- 创建时间: 2025-11-02
-- 描述: 回滚assistants、topics、messages表及相关对象
-- 警告: 此操作将删除所有相关数据，请谨慎执行！
-- ============================================

-- 警告提示
DO $$
BEGIN
  RAISE NOTICE '⚠️  警告: 即将删除多助手系统的所有表和数据！';
  RAISE NOTICE '⚠️  此操作不可逆，请确认是否继续...';
END $$;

-- ============================================
-- 删除触发器
-- ============================================

DROP TRIGGER IF EXISTS update_assistants_updated_at ON assistants;
DROP TRIGGER IF EXISTS update_topics_updated_at ON topics;

-- ============================================
-- 删除索引（表删除时会自动删除，这里显式删除以确保）
-- ============================================

-- assistants表索引
DROP INDEX IF EXISTS idx_assistants_user_id;
DROP INDEX IF EXISTS idx_assistants_user_sort;
DROP INDEX IF EXISTS idx_assistants_is_default;

-- topics表索引
DROP INDEX IF EXISTS idx_topics_assistant_id;
DROP INDEX IF EXISTS idx_topics_user_id;
DROP INDEX IF EXISTS idx_topics_updated_at;

-- messages表索引
DROP INDEX IF EXISTS idx_messages_topic_id;
DROP INDEX IF EXISTS idx_messages_created_at;

-- ============================================
-- 删除表（按依赖关系逆序删除）
-- ============================================

-- 1. 删除messages表（依赖topics）
DROP TABLE IF EXISTS messages CASCADE;

-- 2. 删除topics表（依赖assistants）
DROP TABLE IF EXISTS topics CASCADE;

-- 3. 删除assistants表（依赖users）
DROP TABLE IF EXISTS assistants CASCADE;

-- ============================================
-- 删除函数（可选，如果其他表不使用）
-- ============================================

-- 注意：update_updated_at_column函数可能被其他表使用
-- 如果确定不再使用，可以取消下面的注释来删除
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================
-- 完成提示
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ 多助手系统数据库表回滚成功！';
  RAISE NOTICE '🗑️  已删除的表: assistants, topics, messages';
  RAISE NOTICE '🗑️  已删除的索引: 9个';
  RAISE NOTICE '🗑️  已删除的触发器: 2个';
END $$;


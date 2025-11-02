-- ============================================
-- 数据库函数创建脚本
-- 创建时间: 2025-10-31
-- 说明: 为 AI Workbench 创建性能优化和统计函数
-- ============================================

-- ============================================
-- 1. 向量相似度搜索函数
-- ============================================
-- 用途: 基于向量嵌入搜索相似的笔记
-- 参数:
--   - query_embedding: 查询向量
--   - match_threshold: 相似度阈值 (0-1)
--   - match_count: 返回结果数量
-- 返回: 匹配的笔记 ID、标题、内容和相似度分数
-- ============================================

CREATE OR REPLACE FUNCTION match_notes(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    notes.id,
    notes.title,
    notes.content,
    1 - (notes.embedding <=> query_embedding) AS similarity
  FROM notes
  WHERE 
    notes.embedding IS NOT NULL
    AND 1 - (notes.embedding <=> query_embedding) > match_threshold
  ORDER BY notes.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 添加函数注释
COMMENT ON FUNCTION match_notes IS '基于向量嵌入搜索相似笔记，使用余弦相似度';


-- ============================================
-- 2. 用户待办统计函数
-- ============================================
-- 用途: 获取用户的待办事项统计信息
-- 参数: user_id - 用户 ID
-- 返回: 各状态的待办数量、优先级分布、过期数量等
-- ============================================

CREATE OR REPLACE FUNCTION get_todo_stats(user_id_param uuid)
RETURNS TABLE (
  total_count bigint,
  completed_count bigint,
  pending_count bigint,
  in_progress_count bigint,
  high_priority_count bigint,
  medium_priority_count bigint,
  low_priority_count bigint,
  overdue_count bigint,
  completion_rate numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_count,
    COUNT(*) FILTER (WHERE completed = true) AS completed_count,
    COUNT(*) FILTER (WHERE status = '未开始') AS pending_count,
    COUNT(*) FILTER (WHERE status = '进行中') AS in_progress_count,
    COUNT(*) FILTER (WHERE priority = '高') AS high_priority_count,
    COUNT(*) FILTER (WHERE priority = '中') AS medium_priority_count,
    COUNT(*) FILTER (WHERE priority = '低') AS low_priority_count,
    COUNT(*) FILTER (WHERE due_date < NOW() AND completed = false) AS overdue_count,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE completed = true)::numeric / COUNT(*)::numeric) * 100, 2)
      ELSE 0
    END AS completion_rate
  FROM todos
  WHERE todos.user_id = user_id_param;
END;
$$;

-- 添加函数注释
COMMENT ON FUNCTION get_todo_stats IS '获取用户的待办事项统计信息，包括完成率、优先级分布等';


-- ============================================
-- 3. 项目统计函数
-- ============================================
-- 用途: 获取项目的统计信息
-- 参数: project_id_param - 项目 ID
-- 返回: 笔记数量、待办数量、完成率等
-- ============================================

CREATE OR REPLACE FUNCTION get_project_stats(project_id_param uuid)
RETURNS TABLE (
  note_count bigint,
  todo_count bigint,
  completed_todo_count bigint,
  pending_todo_count bigint,
  member_count bigint,
  completion_rate numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM notes WHERE project_id = project_id_param) AS note_count,
    (SELECT COUNT(*) FROM todos WHERE note_id IN (
      SELECT id FROM notes WHERE project_id = project_id_param
    )) AS todo_count,
    (SELECT COUNT(*) FROM todos WHERE note_id IN (
      SELECT id FROM notes WHERE project_id = project_id_param
    ) AND completed = true) AS completed_todo_count,
    (SELECT COUNT(*) FROM todos WHERE note_id IN (
      SELECT id FROM notes WHERE project_id = project_id_param
    ) AND completed = false) AS pending_todo_count,
    (SELECT COUNT(*) FROM project_members WHERE project_id = project_id_param) AS member_count,
    CASE 
      WHEN (SELECT COUNT(*) FROM todos WHERE note_id IN (
        SELECT id FROM notes WHERE project_id = project_id_param
      )) > 0 THEN 
        ROUND((SELECT COUNT(*) FROM todos WHERE note_id IN (
          SELECT id FROM notes WHERE project_id = project_id_param
        ) AND completed = true)::numeric / 
        (SELECT COUNT(*) FROM todos WHERE note_id IN (
          SELECT id FROM notes WHERE project_id = project_id_param
        ))::numeric * 100, 2)
      ELSE 0
    END AS completion_rate;
END;
$$;

-- 添加函数注释
COMMENT ON FUNCTION get_project_stats IS '获取项目的统计信息，包括笔记数、待办数、完成率等';


-- ============================================
-- 4. 用户活动统计函数
-- ============================================
-- 用途: 获取用户在指定时间范围内的活动统计
-- 参数:
--   - user_id_param: 用户 ID
--   - days_param: 统计天数（默认 7 天）
-- 返回: 创建的笔记数、完成的待办数等
-- ============================================

CREATE OR REPLACE FUNCTION get_user_activity_stats(
  user_id_param uuid,
  days_param int DEFAULT 7
)
RETURNS TABLE (
  notes_created bigint,
  todos_created bigint,
  todos_completed bigint,
  notes_updated bigint
)
LANGUAGE plpgsql
AS $$
DECLARE
  start_date timestamp;
BEGIN
  start_date := NOW() - (days_param || ' days')::interval;
  
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM notes 
     WHERE user_id = user_id_param AND created_at >= start_date) AS notes_created,
    (SELECT COUNT(*) FROM todos 
     WHERE user_id = user_id_param AND created_at >= start_date) AS todos_created,
    (SELECT COUNT(*) FROM todos 
     WHERE user_id = user_id_param AND completed_at >= start_date) AS todos_completed,
    (SELECT COUNT(*) FROM notes 
     WHERE user_id = user_id_param 
     AND updated_at >= start_date 
     AND updated_at > created_at) AS notes_updated;
END;
$$;

-- 添加函数注释
COMMENT ON FUNCTION get_user_activity_stats IS '获取用户在指定时间范围内的活动统计';


-- ============================================
-- 5. 搜索笔记函数（全文搜索 + 向量搜索）
-- ============================================
-- 用途: 结合全文搜索和向量搜索的混合搜索
-- 参数:
--   - search_query: 搜索关键词
--   - query_embedding: 查询向量（可选）
--   - user_id_param: 用户 ID
--   - limit_count: 返回结果数量
-- 返回: 匹配的笔记及其相关性分数
-- ============================================

CREATE OR REPLACE FUNCTION search_notes(
  search_query text,
  query_embedding vector(1536) DEFAULT NULL,
  user_id_param uuid DEFAULT NULL,
  limit_count int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  relevance_score float
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- 如果提供了向量，使用混合搜索
  IF query_embedding IS NOT NULL THEN
    RETURN QUERY
    SELECT
      notes.id,
      notes.title,
      notes.content,
      -- 混合评分：50% 全文搜索 + 50% 向量相似度
      (
        COALESCE(ts_rank(notes.search_vector, plainto_tsquery('english', search_query)), 0) * 0.5 +
        COALESCE((1 - (notes.embedding <=> query_embedding)), 0) * 0.5
      ) AS relevance_score
    FROM notes
    WHERE 
      (user_id_param IS NULL OR notes.user_id = user_id_param)
      AND (
        notes.search_vector @@ plainto_tsquery('english', search_query)
        OR notes.title ILIKE '%' || search_query || '%'
        OR notes.content ILIKE '%' || search_query || '%'
      )
    ORDER BY relevance_score DESC
    LIMIT limit_count;
  ELSE
    -- 仅使用全文搜索
    RETURN QUERY
    SELECT
      notes.id,
      notes.title,
      notes.content,
      ts_rank(notes.search_vector, plainto_tsquery('english', search_query)) AS relevance_score
    FROM notes
    WHERE 
      (user_id_param IS NULL OR notes.user_id = user_id_param)
      AND (
        notes.search_vector @@ plainto_tsquery('english', search_query)
        OR notes.title ILIKE '%' || search_query || '%'
        OR notes.content ILIKE '%' || search_query || '%'
      )
    ORDER BY relevance_score DESC
    LIMIT limit_count;
  END IF;
END;
$$;

-- 添加函数注释
COMMENT ON FUNCTION search_notes IS '混合搜索函数，结合全文搜索和向量相似度搜索';


-- ============================================
-- 6. 批量更新笔记向量函数
-- ============================================
-- 用途: 批量更新笔记的搜索向量（用于数据迁移或重建索引）
-- 参数: 无
-- 返回: 更新的笔记数量
-- ============================================

CREATE OR REPLACE FUNCTION update_all_search_vectors()
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count bigint;
BEGIN
  UPDATE notes
  SET search_vector = to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content, ''));
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$;

-- 添加函数注释
COMMENT ON FUNCTION update_all_search_vectors IS '批量更新所有笔记的全文搜索向量';


-- ============================================
-- 7. 获取用户最近笔记函数
-- ============================================
-- 用途: 获取用户最近创建或更新的笔记
-- 参数:
--   - user_id_param: 用户 ID
--   - limit_count: 返回数量
-- 返回: 最近的笔记列表
-- ============================================

CREATE OR REPLACE FUNCTION get_recent_notes(
  user_id_param uuid,
  limit_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  created_at timestamptz,
  updated_at timestamptz,
  is_recent_update boolean
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    notes.id,
    notes.title,
    notes.content,
    notes.created_at,
    notes.updated_at,
    (notes.updated_at > notes.created_at + interval '1 hour') AS is_recent_update
  FROM notes
  WHERE notes.user_id = user_id_param
  ORDER BY notes.updated_at DESC
  LIMIT limit_count;
END;
$$;

-- 添加函数注释
COMMENT ON FUNCTION get_recent_notes IS '获取用户最近创建或更新的笔记';


-- ============================================
-- 执行完成提示
-- ============================================
-- 所有函数创建完成！
-- 
-- 使用示例:
-- 
-- 1. 搜索相似笔记:
--    SELECT * FROM match_notes('[0.1, 0.2, ...]'::vector(1536), 0.7, 10);
--
-- 2. 获取待办统计:
--    SELECT * FROM get_todo_stats('user-uuid-here');
--
-- 3. 获取项目统计:
--    SELECT * FROM get_project_stats('project-uuid-here');
--
-- 4. 获取用户活动:
--    SELECT * FROM get_user_activity_stats('user-uuid-here', 7);
--
-- 5. 混合搜索笔记:
--    SELECT * FROM search_notes('关键词', NULL, 'user-uuid-here', 20);
--
-- 6. 批量更新搜索向量:
--    SELECT update_all_search_vectors();
--
-- 7. 获取最近笔记:
--    SELECT * FROM get_recent_notes('user-uuid-here', 10);
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ 所有数据库函数创建完成！';
  RAISE NOTICE '📝 共创建 7 个函数:';
  RAISE NOTICE '   1. match_notes - 向量相似度搜索';
  RAISE NOTICE '   2. get_todo_stats - 待办统计';
  RAISE NOTICE '   3. get_project_stats - 项目统计';
  RAISE NOTICE '   4. get_user_activity_stats - 用户活动统计';
  RAISE NOTICE '   5. search_notes - 混合搜索';
  RAISE NOTICE '   6. update_all_search_vectors - 批量更新搜索向量';
  RAISE NOTICE '   7. get_recent_notes - 获取最近笔记';
END $$;


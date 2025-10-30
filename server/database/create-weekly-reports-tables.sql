-- 创建周报模板表
-- 用于存储用户自定义的周报模板
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL, -- 模板内容（支持Mustache/Handlebars语法）
  format VARCHAR(50) NOT NULL DEFAULT 'markdown', -- 模板格式：markdown, html, docx
  variables JSONB DEFAULT '[]'::jsonb, -- 模板变量定义
  is_default BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false, -- 是否公开模板
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT templates_format_check CHECK (format IN ('markdown', 'html', 'docx'))
);

-- 创建周报记录表
-- 用于存储生成的周报历史记录
CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  content TEXT NOT NULL, -- 生成的周报内容（Markdown格式）
  content_html TEXT, -- HTML格式内容（用于预览）
  format VARCHAR(50) NOT NULL DEFAULT 'markdown',
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 状态：draft, published, archived
  metadata JSONB DEFAULT '{}'::jsonb, -- 元数据：统计信息、数据源等
  ai_optimized BOOLEAN DEFAULT false, -- 是否经过AI优化
  ai_suggestions JSONB DEFAULT '[]'::jsonb, -- AI建议列表
  export_count INTEGER DEFAULT 0, -- 导出次数
  last_exported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT reports_status_check CHECK (status IN ('draft', 'published', 'archived'))
);

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_report_templates_user_id ON report_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_is_default ON report_templates(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_report_templates_is_public ON report_templates(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_weekly_reports_user_id ON weekly_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_week_dates ON weekly_reports(week_start_date, week_end_date);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_status ON weekly_reports(status);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_created_at ON weekly_reports(created_at DESC);

-- 创建更新时间戳触发器函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为模板表创建更新触发器
DROP TRIGGER IF EXISTS update_report_templates_updated_at ON report_templates;
CREATE TRIGGER update_report_templates_updated_at
  BEFORE UPDATE ON report_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 为周报表创建更新触发器
DROP TRIGGER IF EXISTS update_weekly_reports_updated_at ON weekly_reports;
CREATE TRIGGER update_weekly_reports_updated_at
  BEFORE UPDATE ON weekly_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 插入默认模板
INSERT INTO report_templates (id, user_id, name, description, content, format, is_default, is_public, variables)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM users LIMIT 1), -- 使用第一个用户作为默认模板创建者
  '标准周报模板',
  '适用于大多数场景的标准周报模板',
  E'# {{title}}\n\n**周报周期**: {{week_start_date}} ~ {{week_end_date}}\n\n## 📊 本周概览\n\n- 完成任务数: {{tasks_completed}}\n- 总任务数: {{tasks_total}}\n- 完成率: {{completion_rate}}%\n- 总工时: {{total_hours}}小时\n\n## ✅ 已完成任务\n\n{{#completed_tasks}}\n- [{{priority}}] {{title}} - {{project_name}}\n  - 描述: {{description}}\n  - 完成时间: {{completed_at}}\n{{/completed_tasks}}\n\n## 🚧 进行中任务\n\n{{#in_progress_tasks}}\n- [{{priority}}] {{title}} - {{project_name}}\n  - 进度: {{progress}}%\n  - 预计完成: {{due_date}}\n{{/in_progress_tasks}}\n\n## 📝 下周计划\n\n{{#next_week_tasks}}\n- [{{priority}}] {{title}} - {{project_name}}\n{{/next_week_tasks}}\n\n## 🎯 本周亮点\n\n{{highlights}}\n\n## ⚠️ 风险与问题\n\n{{risks}}\n\n---\n\n*本周报由 AI Workbench 自动生成*',
  'markdown',
  true,
  true,
  '[
    {"name": "title", "type": "string", "description": "周报标题"},
    {"name": "week_start_date", "type": "date", "description": "周开始日期"},
    {"name": "week_end_date", "type": "date", "description": "周结束日期"},
    {"name": "tasks_completed", "type": "number", "description": "完成任务数"},
    {"name": "tasks_total", "type": "number", "description": "总任务数"},
    {"name": "completion_rate", "type": "number", "description": "完成率"},
    {"name": "total_hours", "type": "number", "description": "总工时"},
    {"name": "completed_tasks", "type": "array", "description": "已完成任务列表"},
    {"name": "in_progress_tasks", "type": "array", "description": "进行中任务列表"},
    {"name": "next_week_tasks", "type": "array", "description": "下周计划任务列表"},
    {"name": "highlights", "type": "string", "description": "本周亮点"},
    {"name": "risks", "type": "string", "description": "风险与问题"}
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM report_templates WHERE is_default = true);

-- 添加注释
COMMENT ON TABLE report_templates IS '周报模板表，存储用户自定义的周报模板';
COMMENT ON TABLE weekly_reports IS '周报记录表，存储生成的周报历史记录';
COMMENT ON COLUMN report_templates.content IS '模板内容，支持Mustache语法的变量替换';
COMMENT ON COLUMN report_templates.variables IS '模板变量定义，JSON数组格式';
COMMENT ON COLUMN weekly_reports.metadata IS '周报元数据，包含统计信息、数据源配置等';
COMMENT ON COLUMN weekly_reports.ai_suggestions IS 'AI生成的改进建议列表';


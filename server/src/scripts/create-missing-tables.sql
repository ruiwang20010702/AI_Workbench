-- 创建缺失的数据库表
-- 请在 Supabase SQL 编辑器中运行此脚本

-- 创建 tags 表
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#3B82F6', -- 默认蓝色
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 创建 note_tags 关联表
CREATE TABLE IF NOT EXISTS public.note_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(note_id, tag_id) -- 防止重复关联
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);
CREATE INDEX IF NOT EXISTS idx_note_tags_note_id ON public.note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON public.note_tags(tag_id);

-- 为 tags 表添加 updated_at 触发器
CREATE TRIGGER update_tags_updated_at_trigger
    BEFORE UPDATE ON public.tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 启用 RLS (Row Level Security)
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略 - tags 表
CREATE POLICY "Users can view their own tags" ON public.tags
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags" ON public.tags
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags" ON public.tags
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags" ON public.tags
    FOR DELETE USING (auth.uid() = user_id);

-- 创建 RLS 策略 - note_tags 表
CREATE POLICY "Users can view note_tags for their notes" ON public.note_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.notes 
            WHERE notes.id = note_tags.note_id 
            AND notes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create note_tags for their notes" ON public.note_tags
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.notes 
            WHERE notes.id = note_tags.note_id 
            AND notes.user_id = auth.uid()
        )
        AND
        EXISTS (
            SELECT 1 FROM public.tags 
            WHERE tags.id = note_tags.tag_id 
            AND tags.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete note_tags for their notes" ON public.note_tags
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.notes 
            WHERE notes.id = note_tags.note_id 
            AND notes.user_id = auth.uid()
        )
    );

-- 插入一些示例数据（可选）
-- INSERT INTO public.tags (name, color, user_id) VALUES 
-- ('工作', '#EF4444', auth.uid()),
-- ('个人', '#10B981', auth.uid()),
-- ('学习', '#3B82F6', auth.uid());

COMMENT ON TABLE public.tags IS '标签表 - 存储用户创建的标签';
COMMENT ON TABLE public.note_tags IS '笔记标签关联表 - 多对多关系';
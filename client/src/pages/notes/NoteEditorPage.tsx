import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Star, Archive, Trash2, Tag, Eye, Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered, Quote, AlignLeft, AlignCenter, AlignRight, Eraser, Paintbrush, Sparkles } from 'lucide-react';
import { Button, Input, Card, CardContent, Loading } from '../../components/ui';
import { noteService, Note, CreateNoteRequest, UpdateNoteRequest } from '../../services/noteService';
import { aiService } from '../../services/aiService';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import DOMPurify from 'dompurify';

export const NoteEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 追加：工具栏与AI润色所需的引用与状态

  const [fontFamily, setFontFamily] = useState<string>('');
  const [fontSize, setFontSize] = useState<number>(16);
  const [textColor, setTextColor] = useState<string>('#111827');
  const [highlightColor, setHighlightColor] = useState<string>('#ffffff');

  const [polishing, setPolishing] = useState<boolean>(false);

  // TipTap 富文本编辑器实例
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: '开始写作...' }),
    ],
    content,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
  });

  useEffect(() => {
    if (isEditing && id) {
      loadNote(id);
    } else {
      // 对于新建笔记，确保loading状态为false
      setLoading(false);
    }
  }, [id, isEditing]);

  // 自动保存
  useEffect(() => {
    if (!isEditing || !note) return;

    const timer = setTimeout(() => {
      if (title !== note.title || content !== note.content || 
          JSON.stringify(tags) !== JSON.stringify(note.tags || [])) {
        handleAutoSave();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [title, content, tags, note, isEditing]);

  const loadNote = async (noteId: string) => {
    try {
      setLoading(true);
      const noteData = await noteService.getNote(noteId);
      setNote(noteData);
      setTitle(noteData.title);
      setContent(noteData.content || '');
      if (editor) { editor.commands.setContent(noteData.content || ''); }
      setTags(noteData.tags || []);
      setSaveError(null);
    } catch (error: any) {
      console.error('Failed to load note:', error);
      setSaveError(error?.message || '加载笔记失败');
      navigate('/notes');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSave = async () => {
    if (!isEditing || !note || saving) return;

    try {
      const updateData: UpdateNoteRequest = {
        title: title || '无标题',
        content: editor?.getHTML() ?? content,
        tags
      };

      await noteService.updateNote(note.id, updateData);
      setLastSaved(new Date());
      setSaveError(null);
    } catch (error: any) {
      console.error('Auto save failed:', error);
      setSaveError(error?.message || '自动保存失败');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveError(null);

      if (isEditing && note) {
        const updateData: UpdateNoteRequest = {
          title: title || '无标题',
          content: editor?.getHTML() ?? content,
          tags
        };

        const updatedNote = await noteService.updateNote(note.id, updateData);
        setNote(updatedNote);
        setLastSaved(new Date());
      } else {
        const createData: CreateNoteRequest = {
          title: title || '无标题',
          content: editor?.getHTML() ?? content,
          tags
        };

        const newNote = await noteService.createNote(createData);
        if (!newNote?.id) {
          throw new Error('创建成功但返回数据缺少ID');
        }
        navigate(`/notes/${newNote.id}`);
      }
    } catch (error: any) {
      console.error('Failed to save note:', error);
      setSaveError(error?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!note) return;

    try {
      await noteService.toggleFavorite(note.id);
      setNote({ ...note, isFavorite: !note.isFavorite });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleToggleArchive = async () => {
    if (!note) return;

    try {
      await noteService.toggleArchive(note.id);
      setNote({ ...note, isArchived: !note.isArchived });
    } catch (error) {
      console.error('Failed to toggle archive:', error);
    }
  };

  const handleDelete = async () => {
    if (!note || !window.confirm('确定要删除这篇笔记吗？此操作无法撤销。')) return;

    try {
      await noteService.deleteNote(note.id);
      navigate('/notes');
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  };



  // AI 润色：替换选区或全文
  const handleAiPolish = async () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const target = from !== to ? editor.state.doc.textBetween(from, to, ' ') : editor.getText();
    if (!target.trim()) return;
    try {
      setPolishing(true);
      const res = await aiService.rewriteText({ text: target, style: 'concise', tone: 'neutral', language: 'zh', source: 'editor' });
      const polished = res.result || target;
      if (from !== to) {
        editor.chain().focus().insertContentAt({ from, to }, polished).run();
      } else {
        editor.commands.setContent(polished);
      }
    } catch (e) {
      console.error('AI润色失败', e);
    } finally {
      setPolishing(false);
    }
  };

  const formatLastSaved = () => {
    if (!lastSaved) return '';
    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();
    
    if (diff < 60000) return '刚刚保存';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前保存`;
    return lastSaved.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }) + ' 保存';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading text="加载笔记中..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/notes')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          
          {lastSaved && (
            <span className="text-sm text-gray-500">
              {formatLastSaved()}
            </span>
          )}
          {saveError && (
            <span className="text-sm text-red-600">
              {saveError}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPreview(!isPreview)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {isPreview ? '编辑' : '预览'}
          </Button>

          {isEditing && note && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleFavorite}
                className={note.isFavorite ? 'text-yellow-500' : ''}
              >
                <Star className="w-4 h-4" fill={note.isFavorite ? 'currentColor' : 'none'} />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleArchive}
                className={note.isArchived ? 'text-blue-500' : ''}
              >
                <Archive className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}

          <Button
            onClick={handleSave}
            disabled={saving}
            loading={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            保存
          </Button>
        </div>
      </div>

      {/* 编辑器 */}
      <Card>
        <CardContent className="p-6">
          {!isPreview ? (
            <div className="space-y-4">
              {/* 标题输入 */}
              <Input
                type="text"
                placeholder="输入笔记标题..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-2xl font-bold border-none px-0 focus:ring-0"
                onKeyPress={handleKeyPress}
              />

              {/* 标签管理 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">标签</span>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-blue-500 hover:text-blue-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="添加标签..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddTag}
                    disabled={!newTag.trim()}
                  >
                    添加
                  </Button>
                </div>
              </div>

              {/* 内容编辑器 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap border border-gray-200 rounded-lg p-2 bg-gray-50">
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value="">默认字体</option>
                    <option value="Inter, system-ui, sans-serif">Inter</option>
                    <option value="Arial, Helvetica, sans-serif">Arial</option>
                    <option value="Georgia, serif">Serif</option>
                    <option value="ui-monospace, SFMono-Regular, Menlo, monospace">等宽</option>
                  </select>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value={12}>12</option>
                    <option value={14}>14</option>
                    <option value={16}>16</option>
                    <option value={18}>18</option>
                    <option value={20}>20</option>
                    <option value={24}>24</option>
                  </select>

                  <button className="p-2 rounded hover:bg-gray-100" title="粗体" onClick={() => editor?.chain().focus().toggleBold().run()}><Bold className="w-4 h-4 text-gray-700" /></button>
                  <button className="p-2 rounded hover:bg-gray-100" title="斜体" onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic className="w-4 h-4 text-gray-700" /></button>
                  <button className="p-2 rounded hover:bg-gray-100" title="下划线" onClick={() => editor?.chain().focus().toggleUnderline().run()}><UnderlineIcon className="w-4 h-4 text-gray-700" /></button>
                  <button className="p-2 rounded hover:bg-gray-100" title="删除线" onClick={() => editor?.chain().focus().toggleStrike().run()}><Strikethrough className="w-4 h-4 text-gray-700" /></button>

                  <div className="w-px h-5 bg-gray-300" />

                  <button className="p-2 rounded hover:bg-gray-100" title="标题1" onClick={() => editor?.chain().focus().setHeading({ level: 1 }).run()}><AlignLeft className="w-4 h-4 text-gray-700" /></button>
                  <button className="p-2 rounded hover:bg-gray-100" title="标题2" onClick={() => editor?.chain().focus().setHeading({ level: 2 }).run()}><AlignCenter className="w-4 h-4 text-gray-700" /></button>

                  <div className="w-px h-5 bg-gray-300" />

                  <button className="p-2 rounded hover:bg-gray-100" title="无序列表" onClick={() => editor?.chain().focus().toggleBulletList().run()}><List className="w-4 h-4 text-gray-700" /></button>
                  <button className="p-2 rounded hover:bg-gray-100" title="有序列表" onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered className="w-4 h-4 text-gray-700" /></button>
                  <button className="p-2 rounded hover:bg-gray-100" title="引用" onClick={() => editor?.chain().focus().toggleBlockquote().run()}><Quote className="w-4 h-4 text-gray-700" /></button>

                  <div className="w-px h-5 bg-gray-300" />

                  <button className="p-2 rounded hover:bg-gray-100" title="左对齐" onClick={() => editor?.chain().focus().setTextAlign('left').run()}><AlignLeft className="w-4 h-4 text-gray-700" /></button>
                  <button className="p-2 rounded hover:bg-gray-100" title="居中" onClick={() => editor?.chain().focus().setTextAlign('center').run()}><AlignCenter className="w-4 h-4 text-gray-700" /></button>
                  <button className="p-2 rounded hover:bg-gray-100" title="右对齐" onClick={() => editor?.chain().focus().setTextAlign('right').run()}><AlignRight className="w-4 h-4 text-gray-700" /></button>

                  <label className="flex items-center gap-1 px-2 py-1 border rounded text-sm bg-white">
                    <span className="text-gray-600">A</span>
                    <input type="color" value={textColor} onChange={(e) => { const v = e.target.value; setTextColor(v); editor?.chain().focus().setColor(v).run(); }} />
                  </label>
                  <label className="flex items-center gap-1 px-2 py-1 border rounded text-sm bg-white">
                    <Paintbrush className="w-4 h-4 text-gray-700" />
                    <input type="color" value={highlightColor} onChange={(e) => { const v = e.target.value; setHighlightColor(v); editor?.chain().focus().setHighlight({ color: v }).run(); }} />
                  </label>

                  <button className="p-2 rounded hover:bg-gray-100" title="清除格式" onClick={() => { editor?.chain().focus().unsetAllMarks().clearNodes().setTextAlign('left').run(); setFontFamily(''); setFontSize(16); setTextColor('#111827'); setHighlightColor('#ffffff'); }}><Eraser className="w-4 h-4 text-gray-700" /></button>

                  <Button size="sm" variant="outline" onClick={handleAiPolish} loading={polishing} className="ml-auto">
                    <Sparkles className="w-4 h-4 mr-1" /> AI润色
                  </Button>
                </div>

                <EditorContent
                  editor={editor}
                  className="w-full min-h-[500px] p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent prose max-w-none"
                  style={{ fontFamily: fontFamily || undefined, fontSize }}
                />
              </div>
              {/* 原有textarea块结束 */}
            </div>
          ) : (
            <div className="space-y-4">
              {/* 预览标题 */}
              <h1 className="text-3xl font-bold text-gray-900">
                {title || '无标题'}
              </h1>

              {/* 预览标签 */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 预览内容 */}
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content || '') }} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 快捷键提示 */}
      <div className="text-center text-sm text-gray-500">
        按 Ctrl+Enter (Mac: Cmd+Enter) 快速保存
      </div>
    </div>
  );
};
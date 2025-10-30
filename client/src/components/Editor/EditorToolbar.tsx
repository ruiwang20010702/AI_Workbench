import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link,
  Image,
  CheckSquare
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor;
  onInsertImage?: (url: string) => void;
  onSetLink?: (url: string) => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  onInsertImage,
  onSetLink
}) => {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleSetLink = () => {
    if (linkUrl) {
      onSetLink?.(linkUrl);
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  const handleInsertImage = () => {
    if (imageUrl) {
      onInsertImage?.(imageUrl);
      setImageUrl('');
      setShowImageInput(false);
    }
  };

  const ToolbarButton: React.FC<{
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title?: string;
  }> = ({ onClick, isActive, disabled, children, title }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded hover:bg-gray-100 transition-colors ${
        isActive ? 'bg-gray-200 text-blue-600' : 'text-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );

  return (
    <div className="border-b border-gray-200 p-2">
      <div className="flex flex-wrap items-center gap-1">
        {/* 撤销重做 */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="撤销"
        >
          <Undo size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="重做"
        >
          <Redo size={16} />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* 文本格式 */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="粗体"
        >
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="斜体"
        >
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="删除线"
        >
          <Strikethrough size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          title="行内代码"
        >
          <Code size={16} />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* 标题 */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="标题1"
        >
          <Heading1 size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="标题2"
        >
          <Heading2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="标题3"
        >
          <Heading3 size={16} />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* 列表 */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="无序列表"
        >
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="有序列表"
        >
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          isActive={editor.isActive('taskList')}
          title="任务列表"
        >
          <CheckSquare size={16} />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* 引用 */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="引用"
        >
          <Quote size={16} />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* 链接 */}
        <ToolbarButton
          onClick={() => setShowLinkInput(!showLinkInput)}
          isActive={editor.isActive('link')}
          title="插入链接"
        >
          <Link size={16} />
        </ToolbarButton>

        {/* 图片 */}
        <ToolbarButton
          onClick={() => setShowImageInput(!showImageInput)}
          title="插入图片"
        >
          <Image size={16} />
        </ToolbarButton>
      </div>

      {/* 链接输入框 */}
      {showLinkInput && (
        <div className="mt-2 p-2 bg-gray-50 rounded border">
          <div className="flex items-center gap-2">
            <input
              type="url"
              placeholder="输入链接地址..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSetLink();
                } else if (e.key === 'Escape') {
                  setShowLinkInput(false);
                  setLinkUrl('');
                }
              }}
              autoFocus
            />
            <button
              onClick={handleSetLink}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              确定
            </button>
            <button
              onClick={() => {
                setShowLinkInput(false);
                setLinkUrl('');
              }}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 图片输入框 */}
      {showImageInput && (
        <div className="mt-2 p-2 bg-gray-50 rounded border">
          <div className="flex items-center gap-2">
            <input
              type="url"
              placeholder="输入图片地址..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleInsertImage();
                } else if (e.key === 'Escape') {
                  setShowImageInput(false);
                  setImageUrl('');
                }
              }}
              autoFocus
            />
            <button
              onClick={handleInsertImage}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              插入
            </button>
            <button
              onClick={() => {
                setShowImageInput(false);
                setImageUrl('');
              }}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
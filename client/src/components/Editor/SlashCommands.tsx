import { Extension } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';
import { SlashCommandsList } from './SlashCommandsList';
import { Editor } from '@tiptap/react';

export interface SlashCommand {
  title: string;
  description: string;
  icon: string;
  command: ({ editor, range }: { editor: Editor; range: any }) => void;
}

const slashCommands: SlashCommand[] = [
  {
    title: '标题 1',
    description: '大标题',
    icon: 'H1',
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 1 })
        .run();
    },
  },
  {
    title: '标题 2',
    description: '中标题',
    icon: 'H2',
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 2 })
        .run();
    },
  },
  {
    title: '标题 3',
    description: '小标题',
    icon: 'H3',
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 3 })
        .run();
    },
  },
  {
    title: '无序列表',
    description: '创建一个简单的无序列表',
    icon: '•',
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleBulletList()
        .run();
    },
  },
  {
    title: '有序列表',
    description: '创建一个带数字的有序列表',
    icon: '1.',
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleOrderedList()
        .run();
    },
  },
  {
    title: '任务列表',
    description: '创建一个可勾选的任务列表',
    icon: '☑',
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleTaskList()
        .run();
    },
  },
  {
    title: '引用',
    description: '创建一个引用块',
    icon: '"',
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleBlockquote()
        .run();
    },
  },
  {
    title: '代码块',
    description: '创建一个代码块',
    icon: '</>',
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleCodeBlock()
        .run();
    },
  },
  {
    title: '分割线',
    description: '插入一条水平分割线',
    icon: '—',
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setHorizontalRule()
        .run();
    },
  },
  {
    title: 'AI 生成',
    description: '使用AI生成内容',
    icon: '✨',
    command: ({ editor, range }) => {
      // 这里可以触发AI生成对话框
      editor.chain().focus().deleteRange(range).run();
      // TODO: 触发AI生成功能
      console.log('触发AI生成功能');
    },
  },
  {
    title: 'AI 改写',
    description: '使用AI改写选中的文本',
    icon: '🔄',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      // TODO: 触发AI改写功能
      console.log('触发AI改写功能');
    },
  },
  {
    title: 'AI 摘要',
    description: '使用AI生成内容摘要',
    icon: '📝',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      // TODO: 触发AI摘要功能
      console.log('触发AI摘要功能');
    },
  },
];

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }: { query: string }) => {
          return slashCommands
            .filter(item =>
              item.title.toLowerCase().includes(query.toLowerCase()) ||
              item.description.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 10);
        },
        render: () => {
          let component: ReactRenderer;
          let popup: any;

          return {
            onStart: (props: any) => {
              component = new ReactRenderer(SlashCommandsList, {
                props,
                editor: props.editor,
              });

              if (!props.clientRect) {
                return;
              }

              popup = tippy(document.body, {
                getReferenceClientRect: props.clientRect,
                content: component.element,
              });
            },

            onUpdate(props: any) {
              component.updateProps(props);

              if (!props.clientRect) {
                return;
              }

              popup[0].setProps({
                getReferenceClientRect: props.clientRect,
              });
            },

            onKeyDown(props: any) {
              if (props.event.key === 'Escape') {
                popup[0].hide();
                return true;
              }

              return (component.ref as any)?.onKeyDown?.(props.event);
            },

            onExit() {
              popup[0].destroy();
              component.destroy();
            },
          };
        },
      }),
    ];
  },
});

// 简单的tippy实现，如果没有安装tippy.js
const tippy = (_target: HTMLElement, options: { content: Element; getReferenceClientRect: () => DOMRect | null }) => {
  const element = document.createElement('div');
  element.style.position = 'absolute';
  element.style.zIndex = '1000';
  element.style.background = 'white';
  element.style.border = '1px solid #ccc';
  element.style.borderRadius = '4px';
  element.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
  element.appendChild(options.content);
  
  document.body.appendChild(element);
  
  const updatePosition = () => {
    const rect = options.getReferenceClientRect();
    if (rect) {
      element.style.left = `${rect.left}px`;
      element.style.top = `${rect.bottom + 5}px`;
    }
  };
  
  updatePosition();
  
  return [{
    setProps: (newOptions: any) => {
      if (newOptions.getReferenceClientRect) {
        options.getReferenceClientRect = newOptions.getReferenceClientRect;
        updatePosition();
      }
    },
    hide: () => {
      element.style.display = 'none';
    },
    destroy: () => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }
  }];
};
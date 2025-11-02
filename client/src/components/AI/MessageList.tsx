/**
 * MessageList - 消息列表组件
 */

import React, { useEffect, useRef } from 'react';
import { User, Bot } from 'lucide-react';
import { Message } from '../../services/messageApi';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageListProps {
  messages: Message[];
  loading?: boolean;
  sending?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  loading = false,
  sending = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'HH:mm');
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
      {messages.length === 0 && !sending && (
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">开始新对话</p>
            <p className="text-sm mt-1">输入消息开始与AI助手交流</p>
          </div>
        </div>
      )}

      {messages.map((message) => {
        const isUser = message.role === 'user';
        const isSystem = message.role === 'system';

        // 系统消息样式
        if (isSystem) {
          return (
            <div key={message.id} className="flex justify-center">
              <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm rounded-lg max-w-md text-center">
                {message.content}
              </div>
            </div>
          );
        }

        return (
          <div
            key={message.id}
            className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* 头像 */}
            <div
              className={`
                flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                ${isUser 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }
              `}
            >
              {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>

            {/* 消息内容 */}
            <div className={`flex-1 max-w-3xl ${isUser ? 'flex flex-col items-end' : ''}`}>
              <div
                className={`
                  px-4 py-3 rounded-lg
                  ${isUser 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  }
                `}
              >
                {isUser ? (
                  <div className="whitespace-pre-wrap break-words">{message.content}</div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>

              {/* 时间和元信息 */}
              <div className={`text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
                <span>{formatTime(message.created_at)}</span>
                {message.model && !isUser && (
                  <>
                    <span>·</span>
                    <span>{message.model}</span>
                  </>
                )}
                {message.tokens && !isUser && (
                  <>
                    <span>·</span>
                    <span>{message.tokens} tokens</span>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* 发送中状态 */}
      {sending && (
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <Bot className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </div>
          <div className="flex-1 max-w-3xl">
            <div className="px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-sm">正在思考...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};


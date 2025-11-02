/**
 * 对话消息
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    dataSource?: string[];
    tokensUsed?: number;
  };
}

/**
 * 对话会话
 */
export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 对话管理器
 * 管理对话历史，最多保留20条对话
 */
export class ConversationManager {
  private static readonly STORAGE_KEY = 'ai_conversations';
  private static readonly MAX_CONVERSATIONS = 20;
  private static readonly MAX_CONTEXT_MESSAGES = 6; // 最近3轮（3个用户消息 + 3个AI回复）

  /**
   * 获取所有对话（最多20条）
   */
  static getConversations(): Conversation[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const conversations = JSON.parse(stored);
      
      // 确保日期对象正确
      return conversations.map((conv: any) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
    } catch (error) {
      console.error('加载对话失败:', error);
      return [];
    }
  }

  /**
   * 保存对话列表
   */
  private static saveConversations(conversations: Conversation[]): void {
    try {
      // 限制最多20条
      const limited = conversations.slice(0, this.MAX_CONVERSATIONS);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limited));
    } catch (error) {
      console.error('保存对话失败:', error);
    }
  }

  /**
   * 获取当前对话ID
   */
  static getCurrentConversationId(): string | null {
    return localStorage.getItem('current_conversation_id');
  }

  /**
   * 设置当前对话ID
   */
  static setCurrentConversationId(id: string): void {
    localStorage.setItem('current_conversation_id', id);
  }

  /**
   * 获取当前对话
   */
  static getCurrentConversation(): Conversation | null {
    const currentId = this.getCurrentConversationId();
    if (!currentId) return null;

    const conversations = this.getConversations();
    return conversations.find(conv => conv.id === currentId) || null;
  }

  /**
   * 创建新对话
   */
  static createConversation(): Conversation {
    const newConversation: Conversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: '新对话',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const conversations = this.getConversations();
    conversations.unshift(newConversation); // 添加到开头

    // 如果超过20条，删除最旧的
    if (conversations.length > this.MAX_CONVERSATIONS) {
      conversations.pop();
    }

    this.saveConversations(conversations);
    this.setCurrentConversationId(newConversation.id);

    return newConversation;
  }

  /**
   * 添加消息到对话
   */
  static addMessage(conversationId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const conversations = this.getConversations();
    const conversation = conversations.find(conv => conv.id === conversationId);

    if (!conversation) {
      throw new Error('对话不存在');
    }

    // 创建完整的消息对象
    const fullMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...message
    };

    conversation.messages.push(fullMessage);
    conversation.updatedAt = new Date();

    // 如果是第一条用户消息，生成对话标题
    if (conversation.messages.length === 1 && message.role === 'user') {
      conversation.title = this.generateTitle(message.content);
    }

    this.saveConversations(conversations);

    return fullMessage;
  }

  /**
   * 生成对话标题（从第一条消息提取）
   */
  static generateTitle(firstMessage: string): string {
    // 移除标点符号和多余空格
    let title = firstMessage.trim().replace(/[？！。，、；：""''（）【】《》\s]+/g, ' ');
    
    // 提取关键词
    const keywords = title.split(' ').filter(word => word.length > 0);
    
    // 取前3个关键词
    title = keywords.slice(0, 3).join(' ');
    
    // 限制长度为15个字符
    if (title.length > 15) {
      title = title.substring(0, 15);
    }
    
    return title || '新对话';
  }

  /**
   * 获取对话上下文（最近3轮，即6条消息）
   */
  static getContext(conversationId: string): Array<{ role: 'user' | 'assistant'; content: string }> {
    const conversation = this.getConversations().find(conv => conv.id === conversationId);
    if (!conversation) return [];

    // 获取最近的6条消息（3轮对话）
    const recentMessages = conversation.messages.slice(-this.MAX_CONTEXT_MESSAGES);

    return recentMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * 切换对话
   */
  static switchConversation(conversationId: string): Conversation | null {
    const conversations = this.getConversations();
    const conversation = conversations.find(conv => conv.id === conversationId);

    if (conversation) {
      this.setCurrentConversationId(conversationId);
      return conversation;
    }

    return null;
  }

  /**
   * 删除对话
   */
  static deleteConversation(conversationId: string): void {
    const conversations = this.getConversations();
    const filtered = conversations.filter(conv => conv.id !== conversationId);

    this.saveConversations(filtered);

    // 如果删除的是当前对话，切换到第一个对话
    if (this.getCurrentConversationId() === conversationId) {
      if (filtered.length > 0) {
        this.setCurrentConversationId(filtered[0].id);
      } else {
        localStorage.removeItem('current_conversation_id');
      }
    }
  }

  /**
   * 清空所有对话
   */
  static clearAllConversations(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem('current_conversation_id');
  }

  /**
   * 更新对话标题
   */
  static updateConversationTitle(conversationId: string, newTitle: string): void {
    const conversations = this.getConversations();
    const conversation = conversations.find(conv => conv.id === conversationId);

    if (conversation) {
      conversation.title = newTitle;
      conversation.updatedAt = new Date();
      this.saveConversations(conversations);
    }
  }

  /**
   * 获取对话统计信息
   */
  static getStatistics(): {
    totalConversations: number;
    totalMessages: number;
    averageMessagesPerConversation: number;
  } {
    const conversations = this.getConversations();
    const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);

    return {
      totalConversations: conversations.length,
      totalMessages,
      averageMessagesPerConversation: conversations.length > 0 
        ? Math.round(totalMessages / conversations.length) 
        : 0
    };
  }
}


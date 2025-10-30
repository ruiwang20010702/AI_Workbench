export interface User {
  id: string;
  email: string;
  password_hash: string;
  auth_provider: string;
  display_name?: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Notebook {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  created_at: Date;
  updated_at: Date;
}

export interface Note {
  id: string;
  user_id: string;
  notebook_id?: string;
  title: string;
  content: string;
  content_text: string;
  tags: string[];
  is_favorite: boolean;
  is_archived: boolean;
  embedding?: number[];
  created_at: Date;
  updated_at: Date;
}

export interface Todo {
  id: string;
  user_id: string;
  note_id: string;
  title: string;
  description?: string;
  due_date?: Date;
  priority: '低' | '中' | '高';
  status: '未开始' | '进行中' | '已完成';
  completed: boolean;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export type NotificationType = 'one_day' | 'three_hours' | 'five_minutes' | 'immediate';

export interface Notification {
  id: string;
  user_id: string;
  todo_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AIUsageLog {
  id: string;
  user_id: string;
  action_type: 'generate' | 'rewrite' | 'summarize' | 'extract_todos' | 'search' | 'translate' | 'assistant_qa' | 'analyze';
  model_name: string;
  input_tokens: number;
  output_tokens: number;
  cost_cents: number;
  created_at: Date;
}

// API 请求/响应类型
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: Omit<User, 'password_hash'>;
    token: string;
  };
}

export interface CreateNoteRequest {
  title?: string;
  content?: string;
  notebook_id?: string;
  tags?: string[];
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  notebook_id?: string;
  tags?: string[];
  is_favorite?: boolean;
  is_archived?: boolean;
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
  due_date?: string;
  priority?: '低' | '中' | '高';
  note_id: string;
}

export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  due_date?: string;
  priority?: '低' | '中' | '高';
  status?: '未开始' | '进行中' | '已完成';
  completed?: boolean;
}

export interface AIGenerateRequest {
  prompt: string;
  type: 'generate' | 'rewrite' | 'summarize' | 'extract_todos' | 'translate';
  context?: string;
  model?: string;
  maxLength?: number; // 更改为maxLength以保持一致性
  source?: 'assistant' | 'editor' | 'notes' | 'todos' | 'other';
}

export interface AIRewriteRequest {
  text: string;
  style: 'formal' | 'casual' | 'concise' | 'detailed';
  model?: string;
  source?: 'assistant' | 'editor' | 'notes' | 'todos' | 'other';
}

export interface AISummarizeRequest {
  text: string;
  model?: string;
  source?: 'assistant' | 'editor' | 'notes' | 'todos' | 'other';
}

export interface AIExtractTodosRequest {
  text: string;
  model?: string;
}

export interface AIGenerateResponse {
  success: boolean;
  data: {
    generated_text: string;
    reasoning_content?: string; // 添加推理内容支持
    model: string;
    usage: {
      total_tokens: number;
      prompt_tokens: number;
      completion_tokens: number;
    };
  };
  message?: string;
}

export interface NotesResponse {
  success: boolean;
  message: string;
  data: {
    notes: Note[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  };
}

export interface AISearchRequest {
  query: string;
  limit?: number;
}

// 认证用户类型（不包含密码哈希）
export interface AuthenticatedUser {
  id: string;
  email: string;
  auth_provider: string;
  display_name?: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
}

// Express 扩展类型
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
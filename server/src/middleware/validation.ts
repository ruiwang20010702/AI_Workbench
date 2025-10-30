import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        message: '请求数据验证失败',
        errors: error.details.map(detail => detail.message)
      });
      return;
    }
    
    next();
  };
};

// 用户注册验证
export const registerSchema = Joi.object({
  username: Joi.string()
    .min(1)
    .max(30)
    .required()
    .messages({
      'string.min': '用户名至少1个字符',
      'string.max': '用户名最多30个字符',
      'any.required': '用户名是必填项'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': '请输入有效的邮箱地址',
      'any.required': '邮箱是必填项'
    }),
  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.min': '密码至少6个字符',
      'string.max': '密码最多128个字符',
      'any.required': '密码是必填项'
    }),
  display_name: Joi.string()
    .min(1)
    .max(50)
    .optional()
    .messages({
      'string.min': '显示名称不能为空',
      'string.max': '显示名称最多50个字符'
    })
});

// 用户登录验证
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': '请输入有效的邮箱地址',
      'any.required': '邮箱是必填项'
    }),
  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.min': '密码至少6个字符',
      'string.max': '密码最多128个字符',
      'any.required': '密码是必填项'
    })
});

// 笔记创建验证
export const createNoteSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(200)
    .required()
    .messages({
      'string.min': '标题不能为空',
      'string.max': '标题最多200个字符',
      'any.required': '标题是必填项'
    }),
  content: Joi.string()
    .max(50000)
    .optional()
    .messages({
      'string.max': '内容最多50000个字符'
    }),
  tags: Joi.array()
    .items(Joi.string().max(50))
    .max(10)
    .optional()
    .messages({
      'array.max': '最多只能添加10个标签',
      'string.max': '标签长度最多50个字符'
    }),
  category: Joi.string()
    .max(50)
    .optional()
    .messages({
      'string.max': '分类名称最多50个字符'
    }),
  is_favorite: Joi.boolean().optional(),
  is_archived: Joi.boolean().optional()
});

// 笔记更新验证
export const updateNoteSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(200)
    .optional()
    .messages({
      'string.min': '标题不能为空',
      'string.max': '标题最多200个字符'
    }),
  content: Joi.string()
    .max(50000)
    .optional()
    .messages({
      'string.max': '内容最多50000个字符'
    }),
  tags: Joi.array()
    .items(Joi.string().max(50))
    .max(10)
    .optional()
    .messages({
      'array.max': '最多只能添加10个标签',
      'string.max': '标签长度最多50个字符'
    }),
  category: Joi.string()
    .max(50)
    .optional()
    .messages({
      'string.max': '分类名称最多50个字符'
    }),
  is_favorite: Joi.boolean().optional(),
  is_archived: Joi.boolean().optional()
});

// 待办事项创建验证
export const createTodoSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(200)
    .required()
    .messages({
      'string.min': '标题不能为空',
      'string.max': '标题最多200个字符',
      'any.required': '标题是必填项'
    }),
  description: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': '描述最多1000个字符'
    }),
  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .optional()
    .messages({
      'any.only': '优先级只能是 low、medium 或 high'
    }),
  due_date: Joi.date()
    .optional()
    .messages({
      'date.base': '截止日期格式不正确'
    }),
  tags: Joi.array()
    .items(Joi.string().max(50))
    .max(10)
    .optional()
    .messages({
      'array.max': '最多只能添加10个标签',
      'string.max': '标签长度最多50个字符'
    }),
  category: Joi.string()
    .max(50)
    .optional()
    .messages({
      'string.max': '分类名称最多50个字符'
    })
});

// 待办事项更新验证
export const updateTodoSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(200)
    .optional()
    .messages({
      'string.min': '标题不能为空',
      'string.max': '标题最多200个字符'
    }),
  description: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': '描述最多1000个字符'
    }),
  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .optional()
    .messages({
      'any.only': '优先级只能是 low、medium 或 high'
    }),
  due_date: Joi.date()
    .optional()
    .allow(null)
    .messages({
      'date.base': '截止日期格式不正确'
    }),
  completed: Joi.boolean().optional(),
  tags: Joi.array()
    .items(Joi.string().max(50))
    .max(10)
    .optional()
    .messages({
      'array.max': '最多只能添加10个标签',
      'string.max': '标签长度最多50个字符'
    }),
  category: Joi.string()
    .max(50)
    .optional()
    .messages({
      'string.max': '分类名称最多50个字符'
    })
});

// AI生成请求验证
export const aiGenerateSchema = Joi.object({
  prompt: Joi.string()
    .min(1)
    .max(2000)
    .required()
    .messages({
      'string.min': '提示词不能为空',
      'string.max': '提示词最多2000个字符',
      'any.required': '提示词是必填项'
    }),
  type: Joi.string()
    .valid('generate', 'rewrite', 'summarize', 'translate', 'text', 'note', 'todo', 'summary')
    .required()
    .messages({
      'any.only': '类型只能是 generate、rewrite、summarize、translate、text、note、todo 或 summary',
      'any.required': '类型是必填项'
    }),
  context: Joi.string()
    .max(5000)
    .optional()
    .messages({
      'string.max': '上下文最多5000个字符'
    }),
  model: Joi.string().optional(),
  apiKey: Joi.string().optional(),
  maxLength: Joi.number().optional(),
  temperature: Joi.number().optional(),
  source: Joi.string()
    .valid('assistant', 'editor', 'notes', 'todos', 'other')
    .optional()
    .messages({
      'any.only': '来源只能是 assistant、editor、notes、todos 或 other'
    })
});

// AI改写请求验证
export const aiRewriteSchema = Joi.object({
  text: Joi.string()
    .min(1)
    .max(5000)
    .required()
    .messages({
      'string.min': '文本内容不能为空',
      'string.max': '文本内容最多10000个字符',
      'any.required': '文本内容是必填项'
    }),
  style: Joi.string()
    .valid('formal', 'casual', 'professional', 'creative', 'concise')
    .optional()
    .messages({
      'any.only': '风格只能是 formal、casual、professional、creative 或 concise'
    }),
  tone: Joi.string()
    .valid('friendly', 'neutral', 'serious', 'enthusiastic')
    .optional()
    .messages({
      'any.only': '语调只能是 friendly、neutral、serious 或 enthusiastic'
    }),
  language: Joi.string()
    .valid('zh', 'en')
    .optional()
    .messages({
      'any.only': '语言只能是 zh 或 en'
    }),
  model: Joi.string().optional(),
  apiKey: Joi.string().optional(),
  source: Joi.string()
    .valid('assistant', 'editor', 'notes', 'todos', 'other')
    .optional()
    .messages({
      'any.only': '来源只能是 assistant、editor、notes、todos 或 other'
    })
});

// AI摘要请求验证
export const aiSummarizeSchema = Joi.object({
  text: Joi.string()
    .min(1)
    .max(10000)
    .required()
    .messages({
      'string.min': '文本内容不能为空',
      'string.max': '文本内容最多10000个字符',
      'any.required': '文本内容是必填项'
    }),
  maxLength: Joi.number()
    .min(50)
    .max(1000)
    .optional()
    .messages({
      'number.min': '摘要长度至少50个字符',
      'number.max': '摘要长度最多1000个字符'
    }),
  language: Joi.string()
    .valid('zh', 'en')
    .optional()
    .messages({
      'any.only': '语言只能是 zh 或 en'
    }),
  model: Joi.string().optional(),
  apiKey: Joi.string().optional(),
  source: Joi.string()
    .valid('assistant', 'editor', 'notes', 'todos', 'other')
    .optional()
    .messages({
      'any.only': '来源只能是 assistant、editor、notes、todos 或 other'
    })
});

// AI翻译请求验证
export const aiTranslateSchema = Joi.object({
  text: Joi.string()
    .min(1)
    .max(5000)
    .required()
    .messages({
      'string.min': '文本内容不能为空',
      'string.max': '文本内容最多5000个字符',
      'any.required': '文本内容是必填项'
    }),
  from: Joi.string()
    .min(2)
    .max(10)
    .required()
    .messages({
      'string.min': '源语言代码至少2个字符',
      'string.max': '源语言代码最多10个字符',
      'any.required': '源语言是必填项'
    }),
  to: Joi.string()
    .min(2)
    .max(10)
    .required()
    .messages({
      'string.min': '目标语言代码至少2个字符',
      'string.max': '目标语言代码最多10个字符',
      'any.required': '目标语言是必填项'
    }),
  model: Joi.string().optional(),
  apiKey: Joi.string().optional(),
  source: Joi.string()
    .valid('assistant', 'editor', 'notes', 'todos', 'other')
    .optional()
    .messages({
      'any.only': '来源只能是 assistant、editor、notes、todos 或 other'
    })
});


export const validateUUIDParam = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.params[paramName];
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!id || !uuidRegex.test(id)) {
      res.status(400).json({
        success: false,
        message: '无效的ID格式'
      });
      return;
    }
    next();
  };
};

export const batchUpdateTodosSchema = Joi.object({
  ids: Joi.array()
    .items(Joi.string().guid({ version: 'uuidv4' }))
    .min(1)
    .required()
    .messages({
      'array.min': '至少提供一个待办事项ID',
      'any.required': '请提供待办事项ID列表'
    }),
  data: updateTodoSchema.required().messages({
    'any.required': '请提供有效的更新数据'
  })
});

export const batchDeleteTodosSchema = Joi.object({
  ids: Joi.array()
    .items(Joi.string().guid({ version: 'uuidv4' }))
    .min(1)
    .required()
    .messages({
      'array.min': '至少提供一个待办事项ID',
      'any.required': '请提供待办事项ID列表'
    })
});
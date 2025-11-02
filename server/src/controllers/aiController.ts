import { Request, Response } from 'express';
import axios from 'axios';
import { AIService } from '../services/aiService';
import { AIGenerateRequest } from '../types';
import { AIUsageLogModel } from '../models/AIUsageLog';
import { NoteModel } from '../models/Note';
import { TodoModel } from '../models/Todo';
import { supabaseAdmin } from '../config/database';
import { IntentService } from '../services/intentService';
import { DataRetrievalService } from '../services/dataRetrievalService';
import { AnswerService } from '../services/answerService';

export class AIController {
  // AI文本生成
  static async generateText(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      const request: AIGenerateRequest & { model?: string; apiKey?: string } = req.body;
      const response = await AIService.generateText(request);

      // 记录AI使用日志
      const actionType = request.source === 'assistant' ? 'assistant_qa' : 'generate';
      await AIUsageLogModel.create({
        user_id: req.user.id,
        action_type: actionType, // 根据来源区分助手问答与普通生成
        model_name: response.data.model || request.model || 'gpt-3.5-turbo',
        input_tokens: response.data.usage?.prompt_tokens || 0,
        output_tokens: response.data.usage?.completion_tokens || 0,
        cost_cents: Math.round((response.data.usage?.total_tokens || 0) * 0.01) // 简单的成本计算，每token 0.01分
      });

      res.json(response);
    } catch (error: any) {
      console.error('AI生成错误:', error);
      return res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 智能摘要
  static async summarize(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      const { text, maxLength, model, apiKey } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({
          success: false,
          message: '文本内容不能为空'
        });
      }

      const summary = await AIService.summarizeText(text, maxLength, { model, apiKey });

      // 记录AI使用日志
      await AIUsageLogModel.create({
        user_id: req.user.id,
        action_type: 'summarize',
        model_name: model || 'gpt-3.5-turbo',
        input_tokens: Math.ceil(text.length / 4), // 估算输入token数
        output_tokens: Math.ceil(summary.length / 4), // 估算输出token数
        cost_cents: Math.round((Math.ceil(text.length / 4) + Math.ceil(summary.length / 4)) * 0.01)
      });

      res.json({
        success: true,
        message: '摘要生成成功',
        data: {
          summary,
          original_length: text.length,
          summary_length: summary.length
        }
      });
    } catch (error: any) {
      console.error('摘要生成错误:', error);
      return res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 智能改写
  static async rewrite(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      const { text, style, tone, language, model, apiKey } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({
          success: false,
          message: '文本内容不能为空'
        });
      }

      const rewritten = await AIService.rewriteText(text, style, { model, apiKey });

      // 记录AI使用日志
      await AIUsageLogModel.create({
        user_id: req.user.id,
        action_type: 'rewrite',
        model_name: model || 'gpt-3.5-turbo',
        input_tokens: Math.ceil(text.length / 4), // 估算输入token数
        output_tokens: Math.ceil(rewritten.length / 4), // 估算输出token数
        cost_cents: Math.round((Math.ceil(text.length / 4) + Math.ceil(rewritten.length / 4)) * 0.01)
      });

      res.json({
        success: true,
        message: '改写成功',
        data: {
          rewritten_text: rewritten,
          usage: {
            prompt_tokens: Math.ceil(text.length / 4),
            completion_tokens: Math.ceil(rewritten.length / 4),
            total_tokens: Math.ceil(text.length / 4) + Math.ceil(rewritten.length / 4)
          },
          model: model || 'gpt-3.5-turbo'
        }
      });
    } catch (error: any) {
      console.error('改写错误:', error);
      return res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 智能翻译
  static async translate(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      const { text, from, to, model, apiKey } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({
          success: false,
          message: '文本内容不能为空'
        });
      }

      const translated = await AIService.translateText(text, to, { model, apiKey });

      // 记录AI使用日志
      await AIUsageLogModel.create({
        user_id: req.user.id,
        action_type: 'translate',
        model_name: model || 'gpt-3.5-turbo',
        input_tokens: Math.ceil(text.length / 4), // 估算输入token数
        output_tokens: Math.ceil(translated.length / 4), // 估算输出token数
        cost_cents: Math.round((Math.ceil(text.length / 4) + Math.ceil(translated.length / 4)) * 0.01)
      });

      res.json({
        success: true,
        message: '翻译成功',
        data: {
          translated_text: translated,
          usage: {
            prompt_tokens: Math.ceil(text.length / 4),
            completion_tokens: Math.ceil(translated.length / 4),
            total_tokens: Math.ceil(text.length / 4) + Math.ceil(translated.length / 4)
          },
          model: model || 'gpt-3.5-turbo'
        }
      });
    } catch (error: any) {
      console.error('翻译错误:', error);
      return res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 文本分析（支持外部第三方API；未配置时回退本地实现）
  static async analyze(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      const { text, analysisType } = req.body as { text?: string; analysisType?: 'sentiment' | 'keywords' | 'topics' | 'readability' };
      if (!text || typeof text !== 'string') {
        return res.status(400).json({
          success: false,
          message: '文本内容不能为空'
        });
      }

      // 优先使用外部分析服务（通过环境变量控制）
      const externalUrl = process.env.AI_ANALYZE_API_URL;
      const externalKey = process.env.AI_ANALYZE_API_KEY;
      const useExternal = process.env.AI_ANALYZE_USE_EXTERNAL === 'true' || (!!externalUrl && !!externalKey);

      if (useExternal && externalUrl && externalKey) {
        try {
          const resp = await axios.post(
            externalUrl,
            { text, analysisType },
            {
              headers: {
                Authorization: `Bearer ${externalKey}`,
                'Content-Type': 'application/json'
              },
              timeout: 10000
            }
          );

          const payload: any = resp.data || {};
          const analysis = payload.analysis ?? payload.data?.analysis ?? payload.result ?? payload;
          const outputJson = JSON.stringify(analysis);

          await AIUsageLogModel.create({
            user_id: req.user.id,
            action_type: 'analyze',
            model_name: payload.model || 'external-analysis',
            input_tokens: Math.ceil(text.length / 4),
            output_tokens: Math.ceil(outputJson.length / 4),
            cost_cents: Math.round(((payload.usage?.total_tokens ?? 0) * 0.01) || 0)
          });

          return res.json({
            success: true,
            message: '分析成功',
            data: { analysis, source: 'external' }
          });
        } catch (e: any) {
          console.error('外部分析服务错误:', e?.response?.data || e?.message || e);
          // 继续回退到本地实现
        }
      }

      // ===== 本地分析实现（原有逻辑） =====
      // 句子分割（中英文简单处理）
      const sentences = text
        .replace(/[\r\n]+/g, ' ')
        .split(/[。！？.!?]/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      // 词语分割（英文按空格，中文按字符近似）
      const tokens = text
        .toLowerCase()
        .replace(/[\p{P}\p{S}]/gu, ' ')
        .split(/\s+/)
        .filter(t => t.length > 0);

      // 停用词（中英文混合基础集）
      const stopwords = new Set<string>([
        'the','and','or','a','an','to','of','in','on','for','with','is','are','was','were','be','been','it','this','that','by','as','at','from','我们','你们','他们','以及','并且','但是','如果','因为','所以','就是','还有','一个','一些','这些','那些','什么','没有','可以','能够','以及'
      ]);

      const filteredTokens = tokens.filter(t => !stopwords.has(t) && t.length > 1);

      // 关键词（按频率排序）
      const freq: Record<string, number> = {};
      for (const t of filteredTokens) {
        freq[t] = (freq[t] || 0) + 1;
      }
      const keywords = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([w]) => w);

      // 情感分析（极简词典法，支持中英文）
      const positiveWords = new Set(['good','great','excellent','amazing','happy','success','positive','helpful','efficient','love','赞','优秀','开心','满意','成功','积极','高效','喜欢']);
      const negativeWords = new Set(['bad','poor','terrible','sad','fail','negative','problem','issue','hate','worst','差','糟糕','难过','失败','消极','问题','困扰','讨厌']);
      let score = 0;
      for (const t of filteredTokens) {
        if (positiveWords.has(t)) score += 1;
        if (negativeWords.has(t)) score -= 1;
      }
      // 归一化到[-1,1]
      const normScore = filteredTokens.length > 0 ? Math.max(-1, Math.min(1, score / Math.sqrt(filteredTokens.length))) : 0;
      const sentiment = {
        score: Number(normScore.toFixed(2)),
        label: normScore > 0.2 ? 'positive' : normScore < -0.2 ? 'negative' : 'neutral'
      };

      // 主题猜测（简单规则匹配）
      const topicRules: Array<{ topic: string; keywords: string[] }> = [
        { topic: '技术', keywords: ['代码','开发','函数','api','bug','frontend','backend','server','database'] },
        { topic: '工作', keywords: ['项目','会议','计划','任务','deadline','团队','协作','报告'] },
        { topic: '学习', keywords: ['学习','课程','考试','知识','练习','阅读','笔记'] },
        { topic: '生活', keywords: ['生活','家庭','旅行','饮食','健康','休息'] },
        { topic: 'AI', keywords: ['ai','人工智能','模型','训练','推理','prompt'] },
        { topic: '金融', keywords: ['投资','理财','成本','预算','收入','支出'] }
      ];
      const topicsSet = new Set<string>();
      for (const rule of topicRules) {
        for (const k of rule.keywords) {
          if (text.toLowerCase().includes(k.toLowerCase())) {
            topicsSet.add(rule.topic);
            break;
          }
        }
      }
      // 如果未命中规则，回退为高频关键词近似主题
      const topics = Array.from(topicsSet);
      if (topics.length === 0) {
        topics.push(...keywords.slice(0, 3));
      }

      // 可读性（平均句长、估算阅读难度）
      const totalChars = text.length;
      const avgSentenceLength = sentences.length > 0 ? totalChars / sentences.length : totalChars;
      const readability = {
        score: Number((100 - Math.min(90, avgSentenceLength / 2)).toFixed(2)),
        grade: avgSentenceLength < 40 ? 'easy' : avgSentenceLength < 80 ? 'medium' : 'hard'
      };

      const fullAnalysis = {
        sentiment,
        keywords,
        topics,
        readability
      } as Record<string, any>;

      const analysis = analysisType ? { [analysisType]: fullAnalysis[analysisType] } : fullAnalysis;

      // 记录使用（归档为本地分析）
      const outputJson = JSON.stringify(analysis);
      await AIUsageLogModel.create({
        user_id: req.user.id,
        action_type: 'analyze',
        model_name: 'builtin-analysis',
        input_tokens: Math.ceil(text.length / 4),
        output_tokens: Math.ceil(outputJson.length / 4),
        cost_cents: 0
      });

      return res.json({
        success: true,
        message: '分析成功',
        data: { analysis, source: 'builtin' }
      });
    } catch (error: any) {
      console.error('文本分析错误:', error);
      return res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 写作建议
  static async getWritingSuggestions(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      const { text, context, model, apiKey } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({
          success: false,
          message: '文本内容不能为空'
        });
      }

      const suggestions = await AIService.generateWritingSuggestions(text);

      res.json({
        success: true,
        message: '写作建议生成成功',
        data: suggestions
      });
    } catch (error: any) {
      console.error('写作建议错误:', error);
      return res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 标题建议
  static async getTitleSuggestions(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      const { text, model, apiKey } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({
          success: false,
          message: '文本内容不能为空'
        });
      }

      const suggestions = await AIService.generateTitleSuggestions(text);

      res.json({
        success: true,
        message: '标题建议生成成功',
        data: suggestions
      });
    } catch (error: any) {
      console.error('标题建议错误:', error);
      return res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 标签建议
  static async getTagSuggestions(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      const { text, model, apiKey } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({
          success: false,
          message: '文本内容不能为空'
        });
      }

      const suggestions = await AIService.generateTagSuggestions(text);

      res.json({
        success: true,
        message: '标签建议生成成功',
        data: suggestions
      });
    } catch (error: any) {
      console.error('标签建议错误:', error);
      return res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 生成嵌入向量
  static async generateEmbedding(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      const { text, model, apiKey } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({
          success: false,
          message: '文本内容不能为空'
        });
      }

      const embedding = await AIService.generateEmbedding(text);

      res.json({
        success: true,
        message: '嵌入向量生成成功',
        data: {
          embedding
        }
      });
    } catch (error: any) {
      console.error('生成嵌入向量错误:', error);
      return res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 获取AI使用历史记录
  static async getUsageHistory(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      // 解析查询参数，兼容字符串类型
      const limitParam = req.query.limit as string | undefined;
      const offsetParam = req.query.offset as string | undefined;
      const actionTypeParam = req.query.action_type as string | undefined;

      const limitNum = limitParam ? parseInt(limitParam, 10) : 20;
      const offsetNum = offsetParam ? parseInt(offsetParam, 10) : 0;
      const options: { action_type?: string; limit?: number; offset?: number } = {
        limit: limitNum,
        offset: offsetNum
      };
      if (actionTypeParam !== undefined) {
        options.action_type = actionTypeParam;
      }

      const logs = await AIUsageLogModel.findByUserId(req.user.id, options);

      res.json({
        success: true,
        message: '获取AI使用记录成功',
        data: {
          logs
        }
      });
    } catch (error: any) {
      console.error('获取AI使用记录错误:', error);
      return res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 获取最近的AI使用记录
  static async getRecentUsage(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      // 解析限制参数
      const limitParam = req.query.limit as string | undefined;
      const limitNum = limitParam ? parseInt(limitParam, 10) : 10;

      const logs = await AIUsageLogModel.getRecentByUserId(req.user.id, limitNum);

      res.json({
        success: true,
        message: '获取最近AI使用记录成功',
        data: {
          logs
        }
      });
    } catch (error: any) {
      console.error('获取最近AI使用记录错误:', error);
      return res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 新增：AI使用统计（总次数、token总数、类型分布、月度汇总）
  static async getStats(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({ message: '未认证的用户' });
      }

      const userId = req.user.id;

      // 总体统计
      const totals = await AIUsageLogModel.getUsageStats(userId);
      const totalRequests = totals.total_requests;
      const totalTokens = (totals.total_input_tokens || 0) + (totals.total_output_tokens || 0);

      // 类型分布
      const { data: actionTypeLogs, error: actionTypeError } = await supabaseAdmin
        .from('ai_usage_logs')
        .select('action_type')
        .eq('user_id', userId);
      
      if (actionTypeError) {
        console.error('Error fetching action type logs:', actionTypeError);
        throw actionTypeError;
      }
      
      const requestsByType: Record<string, number> = {};
      (actionTypeLogs || []).forEach((log: any) => {
        requestsByType[log.action_type] = (requestsByType[log.action_type] || 0) + 1;
      });

      // 月度汇总（近6个月）
      const { data: monthlyLogs, error: monthlyError } = await supabaseAdmin
        .from('ai_usage_logs')
        .select('created_at, input_tokens, output_tokens')
        .eq('user_id', userId);
      
      if (monthlyError) {
        console.error('Error fetching monthly logs:', monthlyError);
        throw monthlyError;
      }
      
      const monthlyMap: Record<string, any> = {};
      (monthlyLogs || []).forEach((log: any) => {
        const month = new Date(log.created_at).toISOString().substring(0, 7); // YYYY-MM
        if (!monthlyMap[month]) {
          monthlyMap[month] = { month, requests: 0, tokens: 0 };
        }
        monthlyMap[month].requests += 1;
        monthlyMap[month].tokens += (log.input_tokens || 0) + (log.output_tokens || 0);
      });
      
      const monthlyUsage = Object.values(monthlyMap)
        .sort((a: any, b: any) => b.month.localeCompare(a.month))
        .slice(0, 6);

      // 返回纯数据对象，符合前端aiService.getUsageStats的期待
      return res.json({
        totalRequests,
        totalTokens,
        requestsByType,
        monthlyUsage
      });
    } catch (error: any) {
      console.error('获取AI使用统计错误:', error);
      return res.status(500).json({ message: error.message || '服务器内部错误' });
    }
  }

  /**
   * 获取个性化智能推荐
   *
   * 基于用户的笔记标签、最近更新、Todo优先级与到期时间进行启发式推荐，返回待处理事项与相关笔记建议。
   * 不依赖外部模型，保证轻量与可用性；后续可替换为向量检索或协同过滤。
   *
   * 路由：GET /api/ai/recommendations
   * 认证：需要登录（基于路由中间件）
   * 查询：limit（可选，默认10）
   * 返回：{ success, message, data: { recommendations: [], basis: { topTags, recentNotesCount, pendingTodosCount } } }
   */
  static async getRecommendations(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: '未认证的用户' });
      }

      const userId = req.user.id;
      const limitParam = req.query.limit as string | undefined;
      const limit = limitParam ? Math.max(1, Math.min(50, parseInt(limitParam, 10))) : 10;

      // 读取最近笔记与未完成的Todo
      const notes = await NoteModel.findByUserId(userId, { limit: 200 });
      const todos = await TodoModel.findByUserId(userId, {
        completed: false,
        orderBy: 'due_date',
        orderDir: 'ASC',
        limit: 100
      });

      // 统计标签频次（来自笔记与Todo）
      const tagFreq: Record<string, number> = {};
      for (const n of notes) {
        const tags: string[] = Array.isArray((n as any).tags) ? (n as any).tags : [];
        for (const t of tags) tagFreq[t] = (tagFreq[t] || 0) + 1;
      }
      for (const td of todos) {
        const tags: string[] = Array.isArray((td as any).tags) ? (td as any).tags : [];
        for (const t of tags) tagFreq[t] = (tagFreq[t] || 0) + 1;
      }
      const topTags = Object.entries(tagFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([t]) => t);

      // 将Todo按优先级与距离到期打分
      const priorityWeight: Record<string, number> = { high: 3, 高: 3, medium: 2, 中: 2, low: 1, 低: 1 };
      const now = new Date();
      const recommendations: Array<{
        type: 'todo' | 'note';
        id: string;
        title: string;
        reason: string;
        score: number;
        // 兼容中英文优先级取值，避免与 Todo 类型冲突
        priority?: 'low' | 'medium' | 'high' | '低' | '中' | '高';
        due_date?: string | null;
      }> = [];

      for (const td of todos) {
        const p = (td as any).priority ?? 'medium';
        const pr = priorityWeight[p] ?? 1;
        const due = (td as any).due_date ? new Date((td as any).due_date) : null;
        const daysToDue = due ? Math.max(0, Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 30;
        const timeWeight = due ? Math.max(0, 10 - daysToDue) : 2; // 越接近到期，权重越高

        const reasonParts: string[] = [];
        if (pr >= 3 || p === '高' || p === 'high') reasonParts.push('高优先级');
        if (due && daysToDue <= 7) reasonParts.push('7天内到期');
        if (Array.isArray((td as any).tags) && (td as any).tags.some((t: string) => topTags.includes(t))) {
          reasonParts.push('关联高频标签');
        }

        recommendations.push({
          type: 'todo',
          id: (td as any).id,
          title: (td as any).title || '未命名待办',
          reason: reasonParts.join('，') || '待处理事项',
          score: pr * 2 + timeWeight,
          priority: p,
          due_date: (td as any).due_date || null
        });
      }

      // 基于高频标签给出相关笔记建议（取每个Top Tag下最新的一条）
      for (const tag of topTags) {
        try {
          const tagNotes = await NoteModel.findByUserId(userId, { tags: [tag], limit: 1 });
          if (tagNotes && tagNotes.length > 0) {
            const n = tagNotes[0] as any;
            recommendations.push({
              type: 'note',
              id: n.id,
              title: n.title || '相关笔记',
              reason: `近期高频标签：${tag}`,
              score: 5,
              // optional 属性不显式赋值 undefined（开启 exactOptionalPropertyTypes）
              due_date: null
            });
          }
        } catch (_) {
          // 忽略单个标签查询错误，保持健壮性
        }
      }

      // 排序与截断
      recommendations.sort((a, b) => b.score - a.score);
      const sliced = recommendations.slice(0, limit);

      // 记录使用
      await AIUsageLogModel.create({
        user_id: userId,
        action_type: 'recommend',
        model_name: 'heuristic-recommendation',
        input_tokens: 0,
        output_tokens: 0,
        cost_cents: 0
      });

      return res.json({
        success: true,
        message: '推荐生成成功',
        data: {
          recommendations: sliced,
          basis: {
            topTags,
            recentNotesCount: notes.length,
            pendingTodosCount: todos.length
          }
        }
      });
    } catch (error: any) {
      console.error('获取智能推荐错误:', error);
      return res.status(500).json({ success: false, message: error.message || '服务器内部错误' });
    }
  }

  /**
   * 获取轻量预测分析结果
   *
   * 基于最近30天的Todo完成情况进行统计，并以近7天移动平均作为未来7天完成量的简易预测。
   * 若数据不足（例如近30天完成数过少），会标记 insufficient_data 并返回保守预测。
   *
   * 路由：GET /api/ai/predict
   * 认证：需要登录（基于路由中间件）
   * 返回：{ success, message, data: { completion_rate_30d, due_soon_count, forecast_7d[], insufficient_data? } }
   */
  static async getPredictiveInsights(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: '未认证的用户' });
      }

      const userId = req.user.id;
      const now = new Date();
      const days30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // 取最近更新的若干Todo以便做近似统计
      const recentTodos = await TodoModel.findByUserId(userId, {
        orderBy: 'updated_at',
        orderDir: 'DESC',
        limit: 500
      });

      // 计算近30天完成统计与基数
      const byDayCompleted: Record<string, number> = {};
      let completedCount30d = 0;
      let baseCount30d = 0;
      for (const td of recentTodos) {
        const updatedAtStr = (td as any).updated_at ?? (td as any).updatedAt;
        const updatedAt = updatedAtStr ? new Date(updatedAtStr) : null;
        if (!updatedAt || updatedAt < days30Ago) continue;
        baseCount30d += 1;
        if ((td as any).completed === true || (td as any).status === '已完成') {
          completedCount30d += 1;
          const dayKey = updatedAt.toISOString().slice(0, 10);
          byDayCompleted[dayKey] = (byDayCompleted[dayKey] || 0) + 1;
        }
      }

      const completionRate30d = baseCount30d > 0 ? Number(((completedCount30d / baseCount30d) * 100).toFixed(2)) : 0;

      // 近7天平均完成量
      const last7DaysKeys: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        last7DaysKeys.push(d.toISOString().slice(0, 10));
      }
      const last7DaysAvg = last7DaysKeys.reduce((sum, k) => sum + (byDayCompleted[k] || 0), 0) / 7;

      // 未来7天预测：使用近7天移动平均作为保守估计
      const forecast7d: Array<{ date: string; expected_completed: number }> = [];
      for (let i = 1; i <= 7; i++) {
        const future = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
        forecast7d.push({
          date: future.toISOString().slice(0, 10),
          expected_completed: Number(Math.max(0, last7DaysAvg).toFixed(2))
        });
      }

      // 统计未来7天到期但未完成的数量
      const dueSoonTodos = await TodoModel.findByUserId(userId, {
        completed: false,
        due_date_from: now,
        due_date_to: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        orderBy: 'due_date',
        orderDir: 'ASC',
        limit: 200
      });
      const dueSoonCount = dueSoonTodos.length;

      const insufficientData = completedCount30d < 5; // 简单阈值：近30天完成数低于5视为数据不足

      // 记录使用
      await AIUsageLogModel.create({
        user_id: userId,
        action_type: 'predict',
        model_name: 'heuristic-predict',
        input_tokens: 0,
        output_tokens: 0,
        cost_cents: 0
      });

      return res.json({
        success: true,
        message: '预测生成成功',
        data: {
          completion_rate_30d: completionRate30d,
          due_soon_count: dueSoonCount,
          forecast_7d: forecast7d,
          ...(insufficientData ? { insufficient_data: true } : {})
        }
      });
    } catch (error: any) {
      console.error('获取预测分析错误:', error);
      return res.status(500).json({ success: false, message: error.message || '服务器内部错误' });
    }
  }

  // 智能问答对话
  static async chat(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证的用户'
        });
      }

      const { question, conversationId, context, model, apiKey } = req.body;

      // 验证问题
      if (!question || typeof question !== 'string') {
        return res.status(400).json({
          success: false,
          message: '问题不能为空'
        });
      }

      // 验证问题长度
      if (question.length > 500) {
        return res.status(400).json({
          success: false,
          message: '问题过长，请控制在500字以内'
        });
      }

      // 验证上下文长度
      if (context && Array.isArray(context) && context.length > 10) {
        return res.status(400).json({
          success: false,
          message: '上下文过长'
        });
      }

      console.log('收到问答请求:', { question, conversationId, userId: req.user.id });

      // 1. 识别意图
      const intent = await IntentService.recognizeIntent(question, { model, apiKey });
      console.log('意图识别结果:', intent);

      // 2. 检索数据
      const data = await DataRetrievalService.retrieveData(req.user.id, intent);
      console.log('检索到的数据:', {
        notes: data.notes?.length || 0,
        projects: data.projects?.length || 0,
        todos: data.todos?.length || 0,
        statistics: data.statistics
      });

      // 3. 格式化上下文
      const dataContext = DataRetrievalService.formatDataAsContext(data);

      // 4. 生成回答
      let answer: string;
      
      if (!dataContext || dataContext.trim() === '') {
        // 没有数据时使用预设回答
        answer = AnswerService.generateNoDataResponse(question, intent.type);
      } else {
        // 有数据时调用AI生成回答
        answer = await AnswerService.generateAnswer(
          question,
          dataContext,
          context,
          { model, apiKey }
        );
      }

      console.log('生成的回答长度:', answer.length);

      // 5. 计算token使用量
      const inputTokens = Math.ceil((question.length + dataContext.length) / 4);
      const outputTokens = Math.ceil(answer.length / 4);
      const totalTokens = inputTokens + outputTokens;

      // 6. 记录使用日志
      await AIUsageLogModel.create({
        user_id: req.user.id,
        action_type: 'assistant_qa',
        model_name: model || 'moonshotai/Kimi-K2-Instruct-0905',
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_cents: Math.round(totalTokens * 0.01)
      });

      // 7. 返回结果
      res.json({
        success: true,
        message: '问答成功',
        data: {
          answer,
          conversationId: conversationId || `conv_${Date.now()}`,
          metadata: {
            intent: intent.type,
            dataSource: Object.keys(data).filter(key => {
              const value = data[key as keyof typeof data];
              return Array.isArray(value) ? value.length > 0 : !!value;
            }),
            itemsFound: [
              ...(data.notes || []),
              ...(data.projects || []),
              ...(data.todos || [])
            ].length,
            tokensUsed: totalTokens
          }
        }
      });
    } catch (error: any) {
      console.error('AI问答错误:', error);
      return res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }
}
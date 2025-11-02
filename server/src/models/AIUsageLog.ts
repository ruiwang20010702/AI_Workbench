import { supabaseAdmin } from '../config/database';
import { AIUsageLog } from '../types';

export class AIUsageLogModel {
  static async create(logData: {
    user_id: string;
    action_type: string;
    model_name: string;
    input_tokens: number;
    output_tokens: number;
    cost_cents: number;
  }): Promise<AIUsageLog> {
    const { data, error } = await supabaseAdmin
      .from('ai_usage_logs')
      .insert({
        user_id: logData.user_id,
        action_type: logData.action_type,
        model_name: logData.model_name,
        input_tokens: logData.input_tokens,
        output_tokens: logData.output_tokens,
        cost_cents: logData.cost_cents
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating AI usage log:', error);
      throw error;
    }

    return data;
  }

  static async findByUserId(
    userId: string,
    options: {
      action_type?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<AIUsageLog[]> {
    let query = supabaseAdmin
      .from('ai_usage_logs')
      .select('*')
      .eq('user_id', userId);

    if (options.action_type) {
      query = query.eq('action_type', options.action_type);
    }

    query = query.order('created_at', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      const end = options.offset + (options.limit || 20) - 1;
      query = query.range(options.offset, end);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error finding AI usage logs:', error);
      throw error;
    }

    return data || [];
  }

  static async getRecentByUserId(userId: string, limit: number = 10): Promise<AIUsageLog[]> {
    const { data, error } = await supabaseAdmin
      .from('ai_usage_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting recent AI usage logs:', error);
      throw error;
    }

    return data || [];
  }

  static async getUsageStats(userId: string): Promise<{
    total_requests: number;
    total_input_tokens: number;
    total_output_tokens: number;
    total_cost_cents: number;
  }> {
    const { data, error } = await supabaseAdmin
      .from('ai_usage_logs')
      .select('input_tokens, output_tokens, cost_cents')
      .eq('user_id', userId);

    if (error) {
      console.error('Error getting AI usage stats:', error);
      throw error;
    }

    const logs = data || [];
    
    return {
      total_requests: logs.length,
      total_input_tokens: logs.reduce((sum, log) => sum + (log.input_tokens || 0), 0),
      total_output_tokens: logs.reduce((sum, log) => sum + (log.output_tokens || 0), 0),
      total_cost_cents: logs.reduce((sum, log) => sum + (log.cost_cents || 0), 0)
    };
  }

  static async getUsageStatsByDateRange(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    total_requests: number;
    total_input_tokens: number;
    total_output_tokens: number;
    total_cost_cents: number;
  }> {
    let query = supabaseAdmin
      .from('ai_usage_logs')
      .select('input_tokens, output_tokens, cost_cents')
      .eq('user_id', userId);

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting AI usage stats by date range:', error);
      throw error;
    }

    const logs = data || [];
    
    return {
      total_requests: logs.length,
      total_input_tokens: logs.reduce((sum, log) => sum + (log.input_tokens || 0), 0),
      total_output_tokens: logs.reduce((sum, log) => sum + (log.output_tokens || 0), 0),
      total_cost_cents: logs.reduce((sum, log) => sum + (log.cost_cents || 0), 0)
    };
  }
}

import pool from '../config/database';
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
    const query = `
      INSERT INTO ai_usage_logs (user_id, action_type, model_name, input_tokens, output_tokens, cost_cents)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      logData.user_id,
      logData.action_type,
      logData.model_name,
      logData.input_tokens,
      logData.output_tokens,
      logData.cost_cents
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByUserId(
    userId: string,
    options: {
      action_type?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<AIUsageLog[]> {
    let query = 'SELECT * FROM ai_usage_logs WHERE user_id = $1';
    const values: any[] = [userId];
    let paramCount = 2;

    if (options.action_type) {
      query += ` AND action_type = $${paramCount++}`;
      values.push(options.action_type);
    }

    query += ' ORDER BY created_at DESC';

    if (options.limit) {
      query += ` LIMIT $${paramCount++}`;
      values.push(options.limit);
    }

    if (options.offset) {
      query += ` OFFSET $${paramCount++}`;
      values.push(options.offset);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async getRecentByUserId(userId: string, limit: number = 10): Promise<AIUsageLog[]> {
    const query = `
      SELECT * FROM ai_usage_logs 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }

  static async getUsageStats(userId: string): Promise<{
    total_requests: number;
    total_input_tokens: number;
    total_output_tokens: number;
    total_cost_cents: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_requests,
        COALESCE(SUM(input_tokens), 0) as total_input_tokens,
        COALESCE(SUM(output_tokens), 0) as total_output_tokens,
        COALESCE(SUM(cost_cents), 0) as total_cost_cents
      FROM ai_usage_logs 
      WHERE user_id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    const row = result.rows[0];
    
    return {
      total_requests: parseInt(row.total_requests),
      total_input_tokens: parseInt(row.total_input_tokens),
      total_output_tokens: parseInt(row.total_output_tokens),
      total_cost_cents: parseInt(row.total_cost_cents)
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
    let query = `
      SELECT 
        COUNT(*) as total_requests,
        COALESCE(SUM(input_tokens), 0) as total_input_tokens,
        COALESCE(SUM(output_tokens), 0) as total_output_tokens,
        COALESCE(SUM(cost_cents), 0) as total_cost_cents
      FROM ai_usage_logs 
      WHERE user_id = $1
    `;
    const params: any[] = [userId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    const result = await pool.query(query, params);
    const row = result.rows[0];
    
    return {
      total_requests: parseInt(row.total_requests),
      total_input_tokens: parseInt(row.total_input_tokens),
      total_output_tokens: parseInt(row.total_output_tokens),
      total_cost_cents: parseInt(row.total_cost_cents)
    };
  }
}
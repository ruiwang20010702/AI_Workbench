import { supabaseAdmin } from '../config/database';

/**
 * 待定成员数据接口
 */
export interface PendingMemberData {
  id: string;
  project_id: string;
  email: string;
  role: 'admin' | 'member' | 'observer';
  invited_by: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * 创建待定成员请求数据
 */
export interface CreatePendingMemberData {
  email: string;
  role: 'admin' | 'member' | 'observer';
}

/**
 * 待定成员模型
 * 用于管理尚未注册的用户邮箱邀请
 */
export class PendingMemberModel {
  /**
   * 批量添加待定成员
   * @param projectId 项目ID
   * @param members 待定成员列表（邮箱和角色）
   * @param invitedBy 邀请人ID
   * @returns 成功添加的数量和跳过的邮箱列表
   */
  static async batchAddPendingMembers(
    projectId: string,
    members: CreatePendingMemberData[],
    invitedBy: string
  ): Promise<{ added_count: number; skipped: string[] }> {
    try {
      if (members.length === 0) {
        return { added_count: 0, skipped: [] };
      }

      // 准备插入数据
      const insertData = members.map(member => ({
        project_id: projectId,
        email: member.email.toLowerCase(), // 统一转小写
        role: member.role,
        invited_by: invitedBy
      }));

      // 使用 upsert 模式，忽略重复的邮箱
      const { data, error } = await supabaseAdmin
        .from('pending_members')
        .upsert(insertData, {
          onConflict: 'project_id,email',
          ignoreDuplicates: true
        })
        .select('email');

      if (error) {
        console.error('Error batch adding pending members:', error);
        throw error;
      }

      // 计算实际添加的数量
      const addedCount = data?.length || 0;
      const addedEmails = new Set(data?.map(d => d.email) || []);
      const skipped = members
        .map(m => m.email.toLowerCase())
        .filter(email => !addedEmails.has(email));

      return { added_count: addedCount, skipped };
    } catch (error) {
      console.error('Error in batchAddPendingMembers:', error);
      throw error;
    }
  }

  /**
   * 获取项目的待定成员列表
   * @param projectId 项目ID
   * @returns 待定成员列表
   */
  static async getPendingMembers(projectId: string): Promise<PendingMemberData[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('pending_members')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting pending members:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPendingMembers:', error);
      throw error;
    }
  }

  /**
   * 删除待定成员
   * @param id 待定成员ID
   * @returns 是否删除成功
   */
  static async deletePendingMember(id: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('pending_members')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting pending member:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in deletePendingMember:', error);
      throw error;
    }
  }

  /**
   * 根据邮箱查找待定成员（不区分大小写）
   * @param email 邮箱地址
   * @returns 匹配的待定成员列表
   */
  static async findByEmail(email: string): Promise<PendingMemberData[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('pending_members')
        .select('*')
        .ilike('email', email); // 不区分大小写匹配

      if (error) {
        console.error('Error finding pending members by email:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in findByEmail:', error);
      throw error;
    }
  }

  /**
   * 转换待定成员为正式成员（用于用户注册后自动加入项目）
   * @param userId 新注册的用户ID
   * @param email 用户邮箱
   * @returns 转换的数量
   */
  static async convertToMembers(userId: string, email: string): Promise<{ converted_count: number }> {
    try {
      // 1. 查找匹配邮箱的待定成员
      const pendingMembers = await this.findByEmail(email);

      if (pendingMembers.length === 0) {
        return { converted_count: 0 };
      }

      console.log(`Found ${pendingMembers.length} pending memberships for ${email}`);

      // 2. 为每个项目添加正式成员
      let convertedCount = 0;
      for (const pending of pendingMembers) {
        try {
          // 添加为正式成员
          const { error: insertError } = await supabaseAdmin
            .from('project_members')
            .insert({
              project_id: pending.project_id,
              user_id: userId,
              role: pending.role
            });

          if (insertError) {
            // 如果已经是成员（重复键错误），跳过
            if (insertError.code === '23505') {
              console.log(`User ${userId} already member of project ${pending.project_id}`);
            } else {
              console.error('Error adding member:', insertError);
              continue; // 继续处理其他项目
            }
          }

          // 3. 删除待定成员记录
          await this.deletePendingMember(pending.id);
          convertedCount++;

          console.log(`Converted pending member to project ${pending.project_id} with role ${pending.role}`);
        } catch (error) {
          console.error(`Error converting pending member ${pending.id}:`, error);
          // 继续处理其他待定成员
        }
      }

      return { converted_count: convertedCount };
    } catch (error) {
      console.error('Error in convertToMembers:', error);
      throw error;
    }
  }

  /**
   * 获取待定成员数量（用于统计）
   * @param projectId 项目ID
   * @returns 待定成员数量
   */
  static async getCount(projectId: string): Promise<number> {
    try {
      const { count, error } = await supabaseAdmin
        .from('pending_members')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      if (error) {
        console.error('Error getting pending members count:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getCount:', error);
      return 0;
    }
  }
}


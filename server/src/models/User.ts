import { supabaseAdmin } from '../config/database';
import { User } from '../types';

export class UserModel {
  static async findById(id: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error finding user by id:', error);
      throw error;
    }
    
    return data;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error finding user by email:', error);
      throw error;
    }
    
    return data;
  }

  static async create(userData: {
    email: string;
    password_hash: string;
    display_name?: string;
    auth_provider?: string;
  }): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        email: userData.email,
        password_hash: userData.password_hash,
        display_name: userData.display_name || null,
        auth_provider: userData.auth_provider || 'local'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('User creation failed: no row returned from database');
    }
    
    return data;
  }

  static async update(id: string, userData: {
    display_name?: string;
    avatar_url?: string;
  }): Promise<User | null> {
    // 如果没有字段需要更新，直接返回当前用户
    if (Object.keys(userData).length === 0) {
      return this.findById(id);
    }

    const updates: any = {};

    if (userData.display_name !== undefined) {
      updates.display_name = userData.display_name;
    }

    if (userData.avatar_url !== undefined) {
      updates.avatar_url = userData.avatar_url;
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error updating user:', error);
      throw error;
    }
    
    return data;
  }

  static async delete(id: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
    
    return true;
  }

  static async updatePassword(id: string, password_hash: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ password_hash })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating password:', error);
      throw error;
    }
    
    return true;
  }
}
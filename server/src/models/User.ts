import pool from '../config/database';
import { User } from '../types';

export class UserModel {
  static async findById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  static async create(userData: {
    email: string;
    password_hash: string;
    display_name?: string;
    auth_provider?: string;
  }): Promise<User> {
    const query = `
      INSERT INTO users (email, password_hash, display_name, auth_provider)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [
      userData.email,
      userData.password_hash,
      userData.display_name || null,
      userData.auth_provider || 'local'
    ];
    const result = await pool.query(query, values);
    const created = result.rows[0];
    if (!created) {
      throw new Error('User creation failed: no row returned from database');
    }
    return created;
  }

  static async update(id: string, userData: {
    display_name?: string;
    avatar_url?: string;
  }): Promise<User | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (userData.display_name !== undefined) {
      fields.push(`display_name = $${paramCount++}`);
      values.push(userData.display_name);
    }

    if (userData.avatar_url !== undefined) {
      fields.push(`avatar_url = $${paramCount++}`);
      values.push(userData.avatar_url);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async updatePassword(id: string, password_hash: string): Promise<boolean> {
    const query = 'UPDATE users SET password_hash = $1 WHERE id = $2';
    const result = await pool.query(query, [password_hash, id]);
    return (result.rowCount ?? 0) > 0;
  }
}
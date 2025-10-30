import dotenv from 'dotenv';
import pool from '../config/database';
import { supabase, supabaseAdmin } from '../config/supabase';

dotenv.config();

async function testSupabaseConnection() {
  console.log('🔄 Testing Supabase connection...');
  
  try {
    // 测试 PostgreSQL 连接池
    console.log('\n1. Testing PostgreSQL connection pool...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ PostgreSQL connection successful!');
    if (result.rows && result.rows[0]) {
      console.log('   Current time:', (result.rows[0] as any).current_time);
      const pgVersion = ((result.rows[0] as any).pg_version || '').split(' ')[0];
      if (pgVersion) {
        console.log('   PostgreSQL version:', pgVersion);
      }
    } else {
      console.log('   Skipping time/version check (adapter returned no rows)');
    }
    client.release();

    // 测试 Supabase 客户端连接
    console.log('\n2. Testing Supabase client connection...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.log('⚠️  Auth session not available (expected for server-side)');
    } else {
      console.log('✅ Supabase client initialized successfully');
    }

    // 测试 Supabase Admin 连接
    console.log('\n3. Testing Supabase admin connection...');
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);
    
    if (adminError) {
      console.log('❌ Supabase admin connection failed:', adminError.message);
    } else {
      console.log('✅ Supabase admin connection successful!');
    }

    // 测试数据库表是否存在
    console.log('\n4. Checking if tables exist...');
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'notes', 'tags', 'note_tags', 'ai_usage_logs')
      ORDER BY table_name;
    `;
    
    const tablesResult = await pool.query(tablesQuery);
    console.log('📋 Existing tables:', tablesResult.rows.map((row: { table_name: string }) => row.table_name));
    
    if (tablesResult.rows.length === 0) {
      console.log('⚠️  No application tables found. You may need to run the table creation SQL.');
    }

    console.log('\n🎉 Supabase connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// 运行测试
testSupabaseConnection();
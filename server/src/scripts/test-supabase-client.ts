import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// 加载环境变量
dotenv.config();

async function testSupabaseClient() {
  console.log('🔄 Testing Supabase client connection...\n');

  try {
    // 检查环境变量
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      throw new Error('Missing required Supabase environment variables');
    }

    console.log('✅ Environment variables loaded');
    console.log(`   - SUPABASE_URL: ${supabaseUrl}`);
    console.log(`   - SUPABASE_ANON_KEY: ${supabaseAnonKey.substring(0, 20)}...`);
    console.log(`   - SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceRoleKey.substring(0, 20)}...\n`);

    // 1. 测试匿名客户端连接
    console.log('1. Testing Supabase anonymous client...');
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // 测试简单查询
    const { data: healthCheck, error: healthError } = await supabaseClient
      .from('users')
      .select('count')
      .limit(1);

    if (healthError) {
      console.log(`   ⚠️  Anonymous client query failed (expected if RLS is enabled): ${healthError.message}`);
    } else {
      console.log('   ✅ Anonymous client connected successfully');
    }

    // 2. 测试服务角色客户端连接
    console.log('\n2. Testing Supabase service role client...');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 测试管理员权限查询
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);

    if (adminError) {
      console.log(`   ❌ Service role client failed: ${adminError.message}`);
    } else {
      console.log('   ✅ Service role client connected successfully');
    }

    // 3. 测试表结构
    console.log('\n3. Testing database tables...');
    const tables = ['users', 'notes', 'tags', 'note_tags', 'ai_usage_logs'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`   ❌ Table '${table}': ${error.message}`);
        } else {
          console.log(`   ✅ Table '${table}' exists and accessible`);
        }
      } catch (err) {
        console.log(`   ❌ Table '${table}': ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    console.log('\n🎉 Supabase client connection test completed!');

  } catch (error) {
    console.error('❌ Supabase client test failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// 运行测试
testSupabaseClient();
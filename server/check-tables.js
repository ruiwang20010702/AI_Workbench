#!/usr/bin/env node

/**
 * 查询Supabase数据库中的所有表
 * 临时脚本，用于验证数据库表结构
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dkczfihkowivzcvsnxpo.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrY3pmaWhrb3dpdnpjdnNueHBvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY0MzY2MywiZXhwIjoyMDc3MjE5NjYzfQ.-TsjzpaJBP2M1Sf0aIPHd8B2foUVbZW9nY7fLRldbmM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkTables() {
  try {
    console.log('🔍 正在查询Supabase数据库中的表...\n');

    // 查询所有用户表（排除系统表）
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          table_name, 
          table_schema
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `
    });

    if (error) {
      // 如果RPC方法不存在，尝试直接查询
      console.log('⚠️  RPC方法不可用，尝试其他方式...\n');
      
      // 尝试查询已知的表
      const knownTables = [
        'users', 'roles', 'projects', 'project_members', 'tasks',
        'project_documents', 'project_activities', 'todos', 'notes',
        'notifications', 'ai_usage', 'weekly_reports', 'report_templates'
      ];

      console.log('📋 检查已知表是否存在:\n');
      
      for (const tableName of knownTables) {
        const { data: tableData, error: tableError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!tableError) {
          const count = tableData?.length || 0;
          console.log(`  ✅ ${tableName.padEnd(25)} (行数: ${count})`);
        } else if (tableError.code === 'PGRST116' || tableError.message.includes('does not exist')) {
          console.log(`  ❌ ${tableName.padEnd(25)} (不存在)`);
        } else {
          console.log(`  ⚠️  ${tableName.padEnd(25)} (无法访问: ${tableError.message})`);
        }
      }
    } else {
      console.log('✅ 找到以下表:\n');
      data.forEach(table => {
        console.log(`  - ${table.table_name} (schema: ${table.table_schema})`);
      });
    }

    console.log('\n✅ 查询完成！');
    
  } catch (err) {
    console.error('❌ 查询失败:', err.message);
    process.exit(1);
  }
}

checkTables();


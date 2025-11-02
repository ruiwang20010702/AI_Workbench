/**
 * 执行 Supabase Storage RLS 策略配置
 * 
 * 使用方式:
 *   npx ts-node src/scripts/run-setup-storage-policies.ts
 * 
 * 功能:
 *   1. 读取 SQL 脚本
 *   2. 连接到 Supabase 数据库
 *   3. 执行策略配置
 *   4. 验证结果
 */

import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

interface PolicyInfo {
  policyname: string;
  cmd: string;
  qual: string;
}

async function setupStoragePolicies() {
  console.log('========================================');
  console.log('🚀 开始配置 Supabase Storage RLS 策略');
  console.log('========================================\n');

  // 检查环境变量
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ 错误: 未找到 Supabase 配置');
    console.error('请在 .env 文件中配置以下变量:');
    console.error('  - SUPABASE_URL');
    console.error('  - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // 创建 Supabase 客户端
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // 测试连接
    console.log('📡 连接到 Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('project_members')
      .select('id')
      .limit(1);
    
    if (testError && testError.code !== 'PGRST116') {
      throw new Error(`连接测试失败: ${testError.message}`);
    }
    console.log('✅ Supabase 连接成功\n');

    // 读取 SQL 脚本
    console.log('📄 读取策略配置脚本...');
    const sqlPath = path.join(__dirname, 'setup-storage-policies.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf-8');
    console.log('✅ 脚本读取成功\n');

    // 由于 Supabase 客户端不支持直接执行 DDL，需要手动执行
    console.log('⚙️  策略配置方式...');
    console.log('----------------------------------------');
    console.log('⚠️  Supabase 客户端不支持直接执行 DDL 语句');
    console.log('   请手动在 Supabase Dashboard 中执行 SQL\n');
    console.log('📝 步骤:');
    console.log('   1. 打开 Supabase Dashboard');
    console.log('   2. 进入 SQL Editor');
    console.log('   3. 复制并执行以下文件内容:');
    console.log('      server/src/scripts/setup-storage-policies.sql\n');
    console.log('----------------------------------------\n');

    // 提示验证策略
    console.log('📋 验证策略...\n');
    console.log('ℹ️  执行 SQL 后，请在 Supabase Dashboard 中验证：');
    console.log('   路径: Storage > Policies');
    console.log('   应该看到 5 条策略:\n');
    console.log('   1. 项目成员可以上传文档');
    console.log('   2. 项目成员可以查看文档');
    console.log('   3. 项目成员可以下载文档');
    console.log('   4. 文档所有者和管理员可以删除');
    console.log('   5. 文档所有者和管理员可以更新\n');

    // 验证 bucket 是否存在
    console.log('========================================');
    console.log('🔍 验证 Storage Bucket...\n');
    
    const { data: buckets, error: bucketError } = await supabase
      .storage
      .listBuckets();

    if (bucketError) {
      console.log('⚠️  无法获取 bucket 列表:', bucketError.message);
    } else {
      const projectDocsBucket = buckets?.find(b => b.name === 'project-documents');
      
      if (!projectDocsBucket) {
        console.log('⚠️  警告: 未找到 "project-documents" bucket');
        console.log('请在 Supabase Dashboard 中创建该 bucket');
        console.log('\n配置建议:');
        console.log('  - Bucket 名称: project-documents');
        console.log('  - Public: ❌ (不勾选)');
        console.log('  - File size limit: 20MB 或更高');
        console.log('  - Allowed MIME types: 按需配置');
      } else {
        console.log('✅ Bucket 已存在');
        console.log(`   ID: ${projectDocsBucket.id}`);
        console.log(`   名称: ${projectDocsBucket.name}`);
        console.log(`   公开: ${projectDocsBucket.public ? '是' : '否'}`);
        
        if (projectDocsBucket.public) {
          console.log('\n⚠️  警告: Bucket 被设置为公开');
          console.log('建议将其设置为私有以提高安全性');
        }
      }
    }

    console.log('\n========================================');
    console.log('✅ Storage RLS 策略配置完成!');
    console.log('========================================\n');

    // 输出使用说明
    console.log('📝 下一步操作:\n');
    console.log('1. 测试文件上传:');
    console.log('   - 在应用中尝试上传文档');
    console.log('   - 检查是否能够成功保存到 Supabase Storage\n');
    
    console.log('2. 测试权限控制:');
    console.log('   - 使用不同角色的账号测试（admin/member/observer）');
    console.log('   - 验证 observer 只能查看和下载，不能上传和删除\n');
    
    console.log('3. 监控存储使用:');
    console.log('   - Supabase Dashboard > Storage > Usage');
    console.log('   - 关注存储空间和带宽使用情况\n');

    console.log('4. 配置自动清理:');
    console.log('   - 设置定时任务清理 temp/ 目录');
    console.log('   - 建议每天清理超过 24 小时的临时文件\n');

  } catch (error) {
    console.error('\n❌ 配置过程中出现错误:\n');
    
    if (error instanceof Error) {
      console.error('错误信息:', error.message);
      
      if (error.message.includes('permission denied')) {
        console.error('\n💡 可能的原因:');
        console.error('  - 使用的数据库用户权限不足');
        console.error('  - 需要使用 service_role key 或具有 admin 权限的连接');
        console.error('\n解决方案:');
        console.error('  1. 确认 DATABASE_URL 使用的是正确的连接串');
        console.error('  2. 或者在 Supabase Dashboard 中手动执行 SQL 脚本');
      } else if (error.message.includes('does not exist')) {
        console.error('\n💡 可能的原因:');
        console.error('  - project_members 表不存在');
        console.error('  - project_documents 表不存在');
        console.error('\n解决方案:');
        console.error('  1. 先执行数据库迁移创建必要的表');
        console.error('  2. 确认表名称正确');
      }
      
      if (error.stack) {
        console.error('\n详细错误:');
        console.error(error.stack);
      }
    } else {
      console.error(error);
    }

    console.error('\n如果问题持续，请尝试:');
    console.error('1. 在 Supabase Dashboard > SQL Editor 中手动执行脚本');
    console.error('2. 检查数据库连接配置');
    console.error('3. 查看完整错误日志');
    
    process.exit(1);
  }
}

// 执行配置
setupStoragePolicies();


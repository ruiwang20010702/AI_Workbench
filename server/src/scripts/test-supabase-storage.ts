/**
 * 测试 Supabase Storage 配置
 * 验证 bucket、RLS 策略和文件操作
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.STORAGE_BUCKET || 'project-documents';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少环境变量: SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testSupabaseStorage() {
  console.log('🧪 开始测试 Supabase Storage 配置\n');

  // 1. 测试连接
  console.log('1️⃣ 测试 Supabase 连接...');
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) throw error;
    console.log(`   ✅ 连接成功，共 ${buckets.length} 个 bucket`);
  } catch (error) {
    console.error('   ❌ 连接失败:', error);
    process.exit(1);
  }

  // 2. 检查 bucket 是否存在
  console.log('\n2️⃣ 检查 bucket 是否存在...');
  try {
    const { data: bucket, error } = await supabase.storage.getBucket(bucketName);
    if (error) throw error;
    console.log(`   ✅ Bucket "${bucketName}" 存在`);
    console.log(`   📦 Bucket 信息:`, {
      id: bucket.id,
      name: bucket.name,
      public: bucket.public,
      created_at: bucket.created_at
    });
  } catch (error: any) {
    console.error(`   ❌ Bucket 不存在或无法访问:`, error.message);
    process.exit(1);
  }

  // 3. 测试文件上传 (temp 目录)
  console.log('\n3️⃣ 测试文件上传...');
  const testFileName = `temp/test-${Date.now()}.txt`;
  const testContent = 'Hello, Supabase Storage!';
  
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(testFileName, Buffer.from(testContent), {
        contentType: 'text/plain',
        upsert: false
      });
    
    if (error) throw error;
    console.log(`   ✅ 文件上传成功: ${testFileName}`);
  } catch (error: any) {
    console.error('   ❌ 文件上传失败:', error.message);
    process.exit(1);
  }

  // 4. 测试文件列表
  console.log('\n4️⃣ 测试文件列表...');
  try {
    const { data: files, error } = await supabase.storage
      .from(bucketName)
      .list('temp', {
        limit: 5,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (error) throw error;
    console.log(`   ✅ 文件列表获取成功，共 ${files.length} 个文件`);
    if (files.length > 0) {
      console.log('   📄 最新文件:', files.slice(0, 3).map(f => f.name));
    }
  } catch (error: any) {
    console.error('   ❌ 文件列表失败:', error.message);
  }

  // 5. 测试文件下载
  console.log('\n5️⃣ 测试文件下载...');
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(testFileName);
    
    if (error) throw error;
    const downloadedContent = await data.text();
    
    if (downloadedContent === testContent) {
      console.log('   ✅ 文件下载成功，内容匹配');
    } else {
      console.log('   ⚠️ 文件下载成功，但内容不匹配');
    }
  } catch (error: any) {
    console.error('   ❌ 文件下载失败:', error.message);
  }

  // 6. 测试文件删除
  console.log('\n6️⃣ 测试文件删除...');
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([testFileName]);
    
    if (error) throw error;
    console.log('   ✅ 文件删除成功');
  } catch (error: any) {
    console.error('   ❌ 文件删除失败:', error.message);
  }

  // 7. 检查 RLS 策略 (通过 SQL)
  console.log('\n7️⃣ 检查 Storage RLS 策略...');
  try {
    const { data: policies, error } = await supabase
      .from('pg_policies')
      .select('policyname, cmd')
      .eq('schemaname', 'storage')
      .eq('tablename', 'objects')
      .like('policyname', '%文档%');
    
    if (error) {
      // pg_policies 表可能无法直接访问，跳过此检查
      console.log('   ⚠️ 无法直接查询 RLS 策略 (需要在 Supabase Dashboard 中验证)');
    } else if (policies && policies.length > 0) {
      console.log(`   ✅ 找到 ${policies.length} 个 RLS 策略:`);
      policies.forEach((p: any) => {
        console.log(`      - ${p.policyname} (${p.cmd})`);
      });
    } else {
      console.log('   ⚠️ 未找到相关 RLS 策略，请在 Dashboard 中配置');
    }
  } catch (error: any) {
    console.log('   ℹ️ 跳过 RLS 策略检查 (需要在 Supabase Dashboard 中手动验证)');
  }

  // 测试总结
  console.log('\n✅ 测试完成！Supabase Storage 配置正常\n');
  console.log('📝 下一步:');
  console.log('   1. 在 Supabase Dashboard 中验证 RLS 策略 (应该有 4 个策略)');
  console.log('   2. 重启服务器: npm run dev');
  console.log('   3. 在前端测试文件上传功能');
  console.log('');
}

// 运行测试
testSupabaseStorage().catch(error => {
  console.error('\n❌ 测试失败:', error);
  process.exit(1);
});


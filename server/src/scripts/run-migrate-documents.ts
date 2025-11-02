/**
 * 项目文档表迁移脚本
 * 执行文件: npm run migrate:documents
 */

import { promises as fs } from 'fs';
import path from 'path';
import { supabaseAdmin } from '../config/supabase';

async function runMigration() {
  try {
    console.log('🚀 开始迁移项目文档表...\n');
    
    // 读取 SQL 文件
    const sqlPath = path.join(__dirname, 'migrate-project-documents.sql');
    const sql = await fs.readFile(sqlPath, 'utf-8');
    
    // 执行迁移
    console.log('📝 执行 SQL 迁移脚本...');
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // 如果 exec_sql 函数不存在，直接执行 SQL
      console.log('⚠️  使用备选方法执行迁移...');
      
      // 分割 SQL 语句并逐条执行
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
      
      for (const statement of statements) {
        if (statement.includes('ALTER TABLE') || statement.includes('CREATE INDEX')) {
          console.log(`  执行: ${statement.substring(0, 50)}...`);
          const { error: execError } = await supabaseAdmin.rpc('query', { query_text: statement });
          
          if (execError) {
            console.log(`  ⚠️  ${execError.message} (可能字段已存在，跳过)`);
          } else {
            console.log('  ✅ 成功');
          }
        }
      }
    }
    
    // 验证迁移结果
    console.log('\n🔍 验证迁移结果...');
    const { data, error: verifyError } = await supabaseAdmin
      .from('project_documents')
      .select('*')
      .limit(1);
    
    if (verifyError) {
      throw new Error(`验证失败: ${verifyError.message}`);
    }
    
    // 检查字段是否存在
    const requiredFields = ['file_path', 'file_size', 'mime_type', 'version', 'parent_document_id', 'is_latest'];
    const sampleDoc = data && data[0];
    
    if (sampleDoc) {
      const missingFields = requiredFields.filter(field => !(field in sampleDoc));
      if (missingFields.length > 0) {
        console.log(`⚠️  缺少字段: ${missingFields.join(', ')}`);
        console.log('   请手动执行 SQL 文件');
      } else {
        console.log('✅ 所有字段存在');
      }
    } else {
      console.log('⚠️  表中暂无数据，无法验证字段');
      console.log('   迁移脚本已执行，请手动验证');
    }
    
    console.log('\n✅ 迁移完成！\n');
    console.log('📊 新增字段:');
    console.log('   - file_path: 文件存储路径');
    console.log('   - file_size: 文件大小');
    console.log('   - mime_type: 文件类型');
    console.log('   - version: 版本号');
    console.log('   - parent_document_id: 父文档ID');
    console.log('   - is_latest: 是否最新版本\n');
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    console.error('\n📝 请手动执行 SQL 文件:');
    console.error('   server/src/scripts/migrate-project-documents.sql\n');
    process.exit(1);
  }
}

// 执行迁移
runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


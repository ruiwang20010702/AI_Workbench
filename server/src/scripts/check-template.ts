import { supabaseAdmin } from '../config/database';

async function checkTemplate() {
  try {
    console.log('查询默认模板...\n');
    
    const { data: templates, error } = await supabaseAdmin
      .from('report_templates')
      .select('*')
      .eq('is_default', true)
      .eq('is_public', true);
    
    if (error) {
      console.error('查询失败:', error);
      return;
    }
    
    if (!templates || templates.length === 0) {
      console.log('❌ 没有找到默认模板');
      return;
    }
    
    console.log(`✅ 找到 ${templates.length} 个默认模板:\n`);
    
    templates.forEach((template: any, index: number) => {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`模板 ${index + 1}:`);
      console.log(`  ID: ${template.id}`);
      console.log(`  名称: ${template.name}`);
      console.log(`  描述: ${template.description || '无'}`);
      console.log(`  格式: ${template.format}`);
      console.log(`  是否公开: ${template.is_public}`);
      console.log(`\n  内容:`);
      console.log('━'.repeat(50));
      console.log(template.content);
      console.log('━'.repeat(50));
      console.log(`\n  内容长度: ${template.content.length} 字符\n`);
    });
    
  } catch (error) {
    console.error('错误:', error);
  }
}

checkTemplate();


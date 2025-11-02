/**
 * 创建默认周报模板
 */

import { supabaseAdmin } from '../config/database';

async function seedTemplates() {
  try {
    console.log('🚀 开始创建默认周报模板...\n');

    // 1. 获取第一个用户
    console.log('📝 步骤 1/2: 查找用户账号...');
    const { data: users, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .limit(1);

    if (userError) {
      throw new Error(`查询用户失败: ${userError.message}`);
    }

    if (!users || users.length === 0) {
      throw new Error('未找到用户账号，请先注册一个账号');
    }

    const user = users[0];
    console.log(`✅ 找到用户账号: ${user.email}`);
    console.log(`   用户ID: ${user.id}\n`);

    // 2. 创建默认模板
    console.log('📝 步骤 2/2: 创建默认模板...');

    const defaultTemplate = {
      user_id: user.id,
      name: '默认周报模板',
      description: '系统默认周报模板，包含任务、项目、工时等完整内容',
      format: 'markdown',
      is_default: true,
      is_public: true,
      tags: ['默认', '通用'],
      content: `# {{title}}

**周报周期**: {{week_start_date}} ~ {{week_end_date}}

## 📊 本周概览

- **完成任务数**: {{tasks.completed_count}}
- **总任务数**: {{tasks.total}}
- **完成率**: {{tasks.completion_rate}}%
- **总工时**: {{hours.total}} 小时

## ✅ 已完成任务

{{#tasks.completed}}
### {{title}}
{{#description}}
**描述**: {{description}}
{{/description}}
{{#project_name}}
**所属项目**: {{project_name}}
{{/project_name}}
- **优先级**: {{priority}}
- **完成时间**: {{completed_at}}
{{#tags}}
- **标签**: {{tags}}
{{/tags}}

{{/tasks.completed}}
{{^tasks.completed}}
本周暂无已完成任务
{{/tasks.completed}}

## 🚧 进行中任务

{{#tasks.in_progress}}
### {{title}}
{{#description}}
**描述**: {{description}}
{{/description}}
{{#project_name}}
**所属项目**: {{project_name}}
{{/project_name}}
- **优先级**: {{priority}}
{{#progress}}
- **进度**: {{progress}}%
{{/progress}}
{{#due_date}}
- **截止日期**: {{due_date}}
{{/due_date}}

{{/tasks.in_progress}}
{{^tasks.in_progress}}
暂无进行中的任务
{{/tasks.in_progress}}

## 📝 下周计划

{{#tasks.upcoming}}
### {{title}}
{{#description}}
**描述**: {{description}}
{{/description}}
{{#project_name}}
**所属项目**: {{project_name}}
{{/project_name}}
- **优先级**: {{priority}}
{{#due_date}}
- **截止日期**: {{due_date}}
{{/due_date}}

{{/tasks.upcoming}}
{{^tasks.upcoming}}
暂无下周计划任务
{{/tasks.upcoming}}

## 🎯 本周亮点

{{#highlights}}
- {{.}}
{{/highlights}}
{{^highlights}}
本周工作正常推进
{{/highlights}}

## ⚠️ 风险与问题

{{#concerns}}
- {{.}}
{{/concerns}}
{{^concerns}}
本周工作正常推进
{{/concerns}}

---

*本周报由 AI Workbench 自动生成*`,
      variables: [
        {
          name: 'title',
          type: 'string',
          description: '周报标题',
          required: true
        },
        {
          name: 'week_start_date',
          type: 'date',
          description: '周开始日期',
          required: true
        },
        {
          name: 'week_end_date',
          type: 'date',
          description: '周结束日期',
          required: true
        },
        {
          name: 'tasks',
          type: 'object',
          description: '任务数据',
          required: true
        },
        {
          name: 'projects',
          type: 'object',
          description: '项目数据',
          required: false
        },
        {
          name: 'hours',
          type: 'object',
          description: '工时数据',
          required: false
        },
        {
          name: 'highlights',
          type: 'array',
          description: '本周亮点',
          required: false
        },
        {
          name: 'concerns',
          type: 'array',
          description: '风险与问题',
          required: false
        }
      ]
    };

    // 检查是否已存在默认模板
    const { data: existingTemplates, error: checkError } = await supabaseAdmin
      .from('report_templates')
      .select('id, name')
      .eq('is_default', true)
      .eq('is_public', true);

    if (checkError) {
      throw new Error(`检查现有模板失败: ${checkError.message}`);
    }

    if (existingTemplates && existingTemplates.length > 0) {
      console.log(`⚠️  已存在默认模板，跳过创建`);
      console.log(`   现有模板: ${existingTemplates.map((t: any) => t.name).join(', ')}`);
      return;
    }

    // 创建模板
    const { data: template, error: createError } = await supabaseAdmin
      .from('report_templates')
      .insert(defaultTemplate)
      .select()
      .single();

    if (createError) {
      throw new Error(`创建模板失败: ${createError.message}`);
    }

    console.log(`✅ 默认模板创建成功`);
    console.log(`   模板ID: ${template.id}`);
    console.log(`   模板名称: ${template.name}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 模板创建完成！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ 创建模板失败:', error);
    process.exit(1);
  }
}

// 执行脚本
seedTemplates();


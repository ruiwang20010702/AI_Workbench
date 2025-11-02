/**
 * 数据迁移脚本：将旧的对话数据迁移到新的多助手系统
 * 
 * 使用方法：
 * node migrate-old-conversations.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../../.env' });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ai_workbench',
  port: parseInt(process.env.DB_PORT || '3306')
};

async function migrateConversations() {
  let connection;
  
  try {
    console.log('🔄 开始迁移旧对话数据...\n');
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功\n');

    // 1. 检查是否有旧的对话数据表
    const [tables] = await connection.query(`
      SHOW TABLES LIKE 'ai_conversations'
    `);

    if (tables.length === 0) {
      console.log('ℹ️  未找到旧的对话数据表，无需迁移');
      return;
    }

    console.log('📊 找到旧的对话数据表\n');

    // 2. 获取所有用户
    const [users] = await connection.query(`
      SELECT id, username FROM users
    `);

    console.log(`👥 找到 ${users.length} 个用户\n`);

    let totalMigrated = 0;

    // 3. 为每个用户迁移数据
    for (const user of users) {
      console.log(`\n处理用户: ${user.username} (ID: ${user.id})`);
      
      // 3.1 检查用户是否已有默认助手
      const [existingAssistants] = await connection.query(`
        SELECT id FROM assistants 
        WHERE user_id = ? AND is_default = TRUE
        LIMIT 1
      `, [user.id]);

      let defaultAssistantId;

      if (existingAssistants.length > 0) {
        defaultAssistantId = existingAssistants[0].id;
        console.log(`  ✓ 使用现有默认助手 (ID: ${defaultAssistantId})`);
      } else {
        // 3.2 为用户创建默认助手
        const [result] = await connection.query(`
          INSERT INTO assistants (
            user_id, name, description, system_prompt, 
            model, temperature, max_tokens, is_default
          ) VALUES (
            ?, '通用助手', '从旧系统迁移的默认助手', 
            'You are a helpful AI assistant.',
            'gpt-4', 0.7, 2000, TRUE
          )
        `, [user.id]);

        defaultAssistantId = result.insertId;
        console.log(`  ✓ 创建默认助手 (ID: ${defaultAssistantId})`);
      }

      // 3.3 获取用户的旧对话
      const [oldConversations] = await connection.query(`
        SELECT * FROM ai_conversations 
        WHERE user_id = ? 
        ORDER BY created_at
      `, [user.id]);

      console.log(`  📝 找到 ${oldConversations.length} 个旧对话`);

      // 3.4 迁移每个对话
      for (const oldConv of oldConversations) {
        try {
          // 创建新主题
          const title = oldConv.title || `对话 ${new Date(oldConv.created_at).toLocaleDateString()}`;
          
          const [topicResult] = await connection.query(`
            INSERT INTO topics (assistant_id, user_id, title, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
          `, [
            defaultAssistantId,
            user.id,
            title,
            oldConv.created_at,
            oldConv.updated_at || oldConv.created_at
          ]);

          const topicId = topicResult.insertId;

          // 迁移消息
          const messages = JSON.parse(oldConv.messages || '[]');
          let messageCount = 0;

          for (const msg of messages) {
            const role = msg.role || (msg.type === 'user' ? 'user' : 'assistant');
            const content = msg.content || '';
            const timestamp = msg.timestamp || oldConv.created_at;

            await connection.query(`
              INSERT INTO messages (topic_id, role, content, created_at)
              VALUES (?, ?, ?, ?)
            `, [topicId, role, content, timestamp]);

            messageCount++;
          }

          console.log(`    ✓ 迁移主题: "${title}" (${messageCount} 条消息)`);
          totalMigrated++;

        } catch (error) {
          console.error(`    ✗ 迁移对话失败 (ID: ${oldConv.id}):`, error.message);
        }
      }
    }

    console.log(`\n\n✅ 迁移完成！`);
    console.log(`📊 总计迁移 ${totalMigrated} 个对话\n`);

    // 4. 询问是否备份旧表
    console.log('💡 提示：迁移完成后，建议：');
    console.log('   1. 验证新数据的正确性');
    console.log('   2. 备份旧表：RENAME TABLE ai_conversations TO ai_conversations_backup;');
    console.log('   3. 确认无误后删除备份：DROP TABLE ai_conversations_backup;\n');

  } catch (error) {
    console.error('❌ 迁移失败:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

// 执行迁移
migrateConversations()
  .then(() => {
    console.log('\n✨ 迁移脚本执行完毕');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 迁移脚本执行失败:', error);
    process.exit(1);
  });


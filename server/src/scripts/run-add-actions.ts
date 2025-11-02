import { supabaseAdmin } from '../config/database';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  console.log('📝 Running migration to add recommend and predict action types...');
  
  try {
    // Drop existing constraint
    console.log('🔄 Dropping existing constraint...');
    const dropResult = await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE ai_usage_logs DROP CONSTRAINT IF EXISTS ai_usage_logs_action_type_check;'
    });
    
    if (dropResult.error) {
      console.log('Note: Could not drop constraint via RPC, trying direct approach...');
    }
    
    // Add new constraint
    console.log('🔄 Adding new constraint with recommend and predict...');
    const addResult = await supabaseAdmin.rpc('exec_sql', {
      sql: `ALTER TABLE ai_usage_logs ADD CONSTRAINT ai_usage_logs_action_type_check 
            CHECK (action_type IN ('generate', 'rewrite', 'summarize', 'extract_todos', 'search', 'translate', 'assistant_qa', 'analyze', 'recommend', 'predict'));`
    });
    
    if (addResult.error) {
      console.log('Note: Could not add constraint via RPC');
      console.log('Please run the SQL manually in Supabase Dashboard:');
      console.log('\n' + fs.readFileSync(path.join(__dirname, 'add-recommend-predict-actions.sql'), 'utf8'));
    } else {
      console.log('✅ Migration completed successfully!');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\nPlease run this SQL manually in Supabase Dashboard SQL Editor:');
    console.log('\n' + fs.readFileSync(path.join(__dirname, 'add-recommend-predict-actions.sql'), 'utf8'));
  }
}

runMigration();


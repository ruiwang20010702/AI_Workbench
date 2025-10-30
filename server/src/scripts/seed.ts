import pool from '../config/database';
import fs from 'fs';
import path from 'path';

async function initDatabase() {
  try {
    console.log('开始初始化数据库...');
    
    // 读取并执行基础初始化 SQL
    const baseSqlPath = path.join(__dirname, 'init-db.sql');
    const baseSql = fs.readFileSync(baseSqlPath, 'utf8');
    await pool.query(baseSql);

    // 读取并执行项目相关表结构 SQL（包含 tags 字段与索引）
    const projectsSqlPath = path.join(__dirname, '../../database/create-project-tables.sql');
    const projectsSql = fs.readFileSync(projectsSqlPath, 'utf8');
    console.log('执行项目表结构 SQL...');
    await pool.query(projectsSql);

    // 兼容已有环境：为旧 projects 表添加 tags 字段与索引（幂等）
    const migrateSqlPath = path.join(__dirname, 'migrate-projects-add-tags.sql');
    const migrateSql = fs.readFileSync(migrateSqlPath, 'utf8');
    console.log('执行项目 tags 迁移 SQL（如需）...');
    await pool.query(migrateSql);
    
    console.log('✅ 数据库初始化成功');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// 如果直接运行此文件
if (require.main === module) {
  initDatabase();
}

export default initDatabase;
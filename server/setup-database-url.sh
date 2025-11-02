#!/bin/bash

# 多助手系统 - DATABASE_URL 配置脚本
# 用法: ./setup-database-url.sh

echo "🔧 多助手系统 - 数据库配置助手"
echo "================================"
echo ""

# 获取Supabase项目ID
PROJECT_ID=$(grep "^SUPABASE_URL=" .env | sed 's/.*:\/\///' | sed 's/\.supabase\.co.*//')

if [ -z "$PROJECT_ID" ]; then
  echo "❌ 错误: 无法从.env文件中读取SUPABASE_URL"
  echo "请确保.env文件中包含SUPABASE_URL配置"
  exit 1
fi

echo "✅ 检测到Supabase项目ID: $PROJECT_ID"
echo ""

# 检查是否已有DATABASE_URL
if grep -q "^DATABASE_URL=" .env; then
  echo "⚠️  警告: .env文件中已存在DATABASE_URL配置"
  echo ""
  echo "当前配置:"
  grep "^DATABASE_URL=" .env | sed 's/postgresql:\/\/postgres:/postgresql:\/\/postgres:***@/' | sed 's/@.*/***/'
  echo ""
  read -p "是否要更新？(y/n): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 取消配置"
    exit 0
  fi
fi

echo ""
echo "📝 请输入你的Supabase数据库密码"
echo "   (可以在Supabase控制台 → Settings → Database 中找到或重置)"
echo ""
read -sp "密码: " DB_PASSWORD
echo ""

if [ -z "$DB_PASSWORD" ]; then
  echo "❌ 错误: 密码不能为空"
  exit 1
fi

# 构建DATABASE_URL
DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_ID}.supabase.co:5432/postgres"

# 更新.env文件
if grep -q "^DATABASE_URL=" .env; then
  # 更新现有配置
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=$DATABASE_URL|" .env
  else
    # Linux
    sed -i "s|^DATABASE_URL=.*|DATABASE_URL=$DATABASE_URL|" .env
  fi
  echo "✅ DATABASE_URL已更新"
else
  # 添加新配置
  echo "" >> .env
  echo "# 数据库连接字符串（用于迁移脚本）" >> .env
  echo "DATABASE_URL=$DATABASE_URL" >> .env
  echo "✅ DATABASE_URL已添加到.env文件"
fi

echo ""
echo "🎉 配置完成！"
echo ""
echo "下一步: 运行数据库迁移"
echo "  cd database"
echo "  node run-migration.js"
echo ""


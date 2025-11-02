#!/bin/bash

# AI Workbench 配置检查脚本
# 用途：验证项目配置是否完整
# 使用：chmod +x check-config.sh && ./check-config.sh

echo "========================================="
echo "  AI Workbench 配置检查工具"
echo "========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查计数器
PASS=0
FAIL=0
WARN=0

# 检查函数
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} 文件存在: $1"
        PASS=$((PASS+1))
        return 0
    else
        echo -e "${RED}✗${NC} 文件缺失: $1"
        FAIL=$((FAIL+1))
        return 1
    fi
}

check_env_var() {
    local file=$1
    local var=$2
    local required=$3
    
    if [ -f "$file" ]; then
        if grep -q "^${var}=" "$file"; then
            local value=$(grep "^${var}=" "$file" | cut -d'=' -f2-)
            if [ -n "$value" ] && [ "$value" != "your-"* ] && [ "$value" != "https://your-"* ]; then
                echo -e "${GREEN}✓${NC} $var 已配置"
                PASS=$((PASS+1))
                return 0
            else
                if [ "$required" == "required" ]; then
                    echo -e "${RED}✗${NC} $var 未配置（必需）"
                    FAIL=$((FAIL+1))
                else
                    echo -e "${YELLOW}⚠${NC} $var 未配置（可选）"
                    WARN=$((WARN+1))
                fi
                return 1
            fi
        else
            if [ "$required" == "required" ]; then
                echo -e "${RED}✗${NC} $var 不存在（必需）"
                FAIL=$((FAIL+1))
            else
                echo -e "${YELLOW}⚠${NC} $var 不存在（可选）"
                WARN=$((WARN+1))
            fi
            return 1
        fi
    else
        echo -e "${RED}✗${NC} 配置文件不存在: $file"
        FAIL=$((FAIL+1))
        return 1
    fi
}

check_npm_package() {
    local package=$1
    if npm list "$package" --depth=0 2>/dev/null | grep -q "$package"; then
        echo -e "${GREEN}✓${NC} npm 包已安装: $package"
        PASS=$((PASS+1))
        return 0
    else
        echo -e "${RED}✗${NC} npm 包未安装: $package"
        FAIL=$((FAIL+1))
        return 1
    fi
}

check_port() {
    local port=$1
    if lsof -i:$port >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠${NC} 端口 $port 已被占用"
        WARN=$((WARN+1))
        return 1
    else
        echo -e "${GREEN}✓${NC} 端口 $port 可用"
        PASS=$((PASS+1))
        return 0
    fi
}

# 1. 检查 Node.js 和 npm
echo "1. 检查基础环境"
echo "-------------------"
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js 已安装: $NODE_VERSION"
    PASS=$((PASS+1))
else
    echo -e "${RED}✗${NC} Node.js 未安装"
    FAIL=$((FAIL+1))
fi

if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} npm 已安装: $NPM_VERSION"
    PASS=$((PASS+1))
else
    echo -e "${RED}✗${NC} npm 未安装"
    FAIL=$((FAIL+1))
fi
echo ""

# 2. 检查环境变量模板文件
echo "2. 检查环境变量模板"
echo "-------------------"
check_file "server_env_template.txt"
check_file "client_env_template.txt"
echo ""

# 3. 检查 .env 文件
echo "3. 检查环境变量文件"
echo "-------------------"
check_file "server/.env"
check_file "client/.env"
echo ""

# 4. 检查服务端必需环境变量
echo "4. 检查服务端环境变量"
echo "-------------------"
check_env_var "server/.env" "NODE_ENV" "optional"
check_env_var "server/.env" "PORT" "optional"
check_env_var "server/.env" "SUPABASE_URL" "required"
check_env_var "server/.env" "SUPABASE_ANON_KEY" "required"
check_env_var "server/.env" "SUPABASE_SERVICE_ROLE_KEY" "required"
check_env_var "server/.env" "JWT_SECRET" "required"
check_env_var "server/.env" "SILICONFLOW_API_KEY" "required"
check_env_var "server/.env" "CORS_ORIGIN" "optional"
echo ""

# 5. 检查前端环境变量
echo "5. 检查前端环境变量"
echo "-------------------"
check_env_var "client/.env" "VITE_API_URL" "required"
echo ""

# 6. 检查数据库配置文件
echo "6. 检查数据库配置"
echo "-------------------"
check_file "server/src/config/supabase.ts"
check_file "server/src/config/database.ts"
check_file "server/src/config/init-database.sql"
check_file "server/database/create-project-tables.sql"
check_file "server/database/create-weekly-reports-tables.sql"
echo ""

# 7. 检查后端依赖
echo "7. 检查后端依赖"
echo "-------------------"
cd server 2>/dev/null
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} 后端依赖已安装"
    PASS=$((PASS+1))
    
    # 检查周报功能依赖
    check_npm_package "mustache"
    check_npm_package "marked"
    check_npm_package "docx"
else
    echo -e "${RED}✗${NC} 后端依赖未安装"
    echo -e "   ${YELLOW}运行: cd server && npm install${NC}"
    FAIL=$((FAIL+1))
fi
cd .. 2>/dev/null
echo ""

# 8. 检查前端依赖
echo "8. 检查前端依赖"
echo "-------------------"
if [ -d "client/node_modules" ]; then
    echo -e "${GREEN}✓${NC} 前端依赖已安装"
    PASS=$((PASS+1))
else
    echo -e "${RED}✗${NC} 前端依赖未安装"
    echo -e "   ${YELLOW}运行: cd client && npm install${NC}"
    FAIL=$((FAIL+1))
fi
echo ""

# 9. 检查端口可用性
echo "9. 检查端口可用性"
echo "-------------------"
check_port 5000
check_port 5173
echo ""

# 10. 检查临时文件是否已清理
echo "10. 检查临时文件"
echo "-------------------"
TEMP_FILES=("server/final_test.log" "server/test_output.log" "server/server_startup.log" "server/server_test.log")
TEMP_FOUND=0
for file in "${TEMP_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${YELLOW}⚠${NC} 临时文件仍存在: $file"
        WARN=$((WARN+1))
        TEMP_FOUND=1
    fi
done
if [ $TEMP_FOUND -eq 0 ]; then
    echo -e "${GREEN}✓${NC} 无临时文件"
    PASS=$((PASS+1))
fi
echo ""

# 总结
echo "========================================="
echo "  检查结果总结"
echo "========================================="
echo -e "${GREEN}通过: $PASS${NC}"
echo -e "${RED}失败: $FAIL${NC}"
echo -e "${YELLOW}警告: $WARN${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ 配置完整！可以启动应用了！${NC}"
    echo ""
    echo "下一步："
    echo "  1. 启动后端: cd server && npm run dev"
    echo "  2. 启动前端: cd client && npm run dev"
    echo "  3. 访问应用: http://localhost:5173"
    exit 0
else
    echo -e "${RED}❌ 配置不完整，请修复以上问题${NC}"
    echo ""
    echo "常见问题："
    echo "  - 环境变量未配置: 参考 QUICK_START.md 步骤 1"
    echo "  - 依赖未安装: 运行 npm install"
    echo "  - 端口被占用: 杀死占用进程或修改端口"
    echo ""
    echo "详细帮助: docs/项目诊断/快速修复指南.md"
    exit 1
fi


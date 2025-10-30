#!/bin/bash

# AI Workbench 部署脚本
# 使用方法: ./scripts/deploy.sh [environment]
# 环境: development, staging, production

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查参数
ENVIRONMENT=${1:-development}
log_info "部署环境: $ENVIRONMENT"

# 检查必要工具
check_requirements() {
    log_info "检查部署要求..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装"
        exit 1
    fi
    
    log_success "所有要求已满足"
}

# 环境配置
setup_environment() {
    log_info "设置环境配置..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_warning "已从 .env.example 创建 .env 文件，请配置必要的环境变量"
        else
            log_error ".env.example 文件不存在"
            exit 1
        fi
    fi
    
    # 根据环境设置不同的配置
    case $ENVIRONMENT in
        "production")
            export NODE_ENV=production
            export COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml
            ;;
        "staging")
            export NODE_ENV=staging
            export COMPOSE_FILE=docker-compose.yml:docker-compose.staging.yml
            ;;
        *)
            export NODE_ENV=development
            export COMPOSE_FILE=docker-compose.yml
            ;;
    esac
    
    log_success "环境配置完成"
}

# 构建镜像
build_images() {
    log_info "构建 Docker 镜像..."
    
    docker-compose build --no-cache
    
    log_success "镜像构建完成"
}

# 数据库迁移
run_migrations() {
    log_info "运行数据库迁移..."
    
    # 等待数据库启动
    docker-compose up -d db
    sleep 10
    
    # 运行迁移 (如果有的话)
    # docker-compose exec backend npm run migrate
    
    log_success "数据库迁移完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose --profile production up -d
    else
        docker-compose up -d
    fi
    
    log_success "服务启动完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 等待服务启动
    sleep 30
    
    # 检查后端健康状态
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        log_success "后端服务健康"
    else
        log_error "后端服务不健康"
        return 1
    fi
    
    # 检查前端健康状态
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log_success "前端服务健康"
    else
        log_error "前端服务不健康"
        return 1
    fi
    
    log_success "所有服务健康检查通过"
}

# 清理旧容器和镜像
cleanup() {
    log_info "清理旧容器和镜像..."
    
    docker system prune -f
    docker volume prune -f
    
    log_success "清理完成"
}

# 显示部署信息
show_deployment_info() {
    log_success "部署完成！"
    echo ""
    echo "服务访问地址:"
    echo "  前端: http://localhost:3000"
    echo "  后端: http://localhost:8000"
    echo "  数据库: localhost:5432"
    echo "  Redis: localhost:6379"
    echo ""
    echo "管理命令:"
    echo "  查看日志: docker-compose logs -f"
    echo "  停止服务: docker-compose down"
    echo "  重启服务: docker-compose restart"
    echo ""
}

# 主函数
main() {
    log_info "开始部署 AI Workbench..."
    
    check_requirements
    setup_environment
    build_images
    run_migrations
    start_services
    
    if health_check; then
        show_deployment_info
    else
        log_error "健康检查失败，请检查日志"
        docker-compose logs
        exit 1
    fi
}

# 错误处理
trap 'log_error "部署失败"; exit 1' ERR

# 执行主函数
main
#!/bin/bash

# AI Workbench 数据备份脚本
# 使用方法: ./scripts/backup.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_CONTAINER="ai-workbench-db"
REDIS_CONTAINER="ai-workbench-redis"

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

# 创建备份目录
create_backup_dir() {
    log_info "创建备份目录..."
    
    mkdir -p "$BACKUP_DIR"
    
    log_success "备份目录创建完成: $BACKUP_DIR"
}

# 备份 PostgreSQL 数据库
backup_database() {
    log_info "备份 PostgreSQL 数据库..."
    
    local backup_file="$BACKUP_DIR/postgres_backup_$TIMESTAMP.sql"
    
    if docker ps | grep -q "$DB_CONTAINER"; then
        docker exec "$DB_CONTAINER" pg_dump -U postgres ai_workbench > "$backup_file"
        
        # 压缩备份文件
        gzip "$backup_file"
        
        log_success "数据库备份完成: ${backup_file}.gz"
    else
        log_warning "数据库容器未运行，跳过数据库备份"
    fi
}

# 备份 Redis 数据
backup_redis() {
    log_info "备份 Redis 数据..."
    
    local backup_file="$BACKUP_DIR/redis_backup_$TIMESTAMP.rdb"
    
    if docker ps | grep -q "$REDIS_CONTAINER"; then
        # 触发 Redis 保存
        docker exec "$REDIS_CONTAINER" redis-cli BGSAVE
        
        # 等待保存完成
        sleep 5
        
        # 复制 RDB 文件
        docker cp "$REDIS_CONTAINER:/data/dump.rdb" "$backup_file"
        
        # 压缩备份文件
        gzip "$backup_file"
        
        log_success "Redis 备份完成: ${backup_file}.gz"
    else
        log_warning "Redis 容器未运行，跳过 Redis 备份"
    fi
}

# 备份上传文件
backup_uploads() {
    log_info "备份上传文件..."
    
    local backup_file="$BACKUP_DIR/uploads_backup_$TIMESTAMP.tar.gz"
    
    if [ -d "./server/uploads" ]; then
        tar -czf "$backup_file" -C "./server" uploads
        
        log_success "上传文件备份完成: $backup_file"
    else
        log_warning "上传目录不存在，跳过文件备份"
    fi
}

# 备份配置文件
backup_configs() {
    log_info "备份配置文件..."
    
    local backup_file="$BACKUP_DIR/configs_backup_$TIMESTAMP.tar.gz"
    
    tar -czf "$backup_file" \
        --exclude="node_modules" \
        --exclude=".git" \
        --exclude="build" \
        --exclude="dist" \
        --exclude="logs" \
        --exclude="backups" \
        .env* docker-compose*.yml nginx/ scripts/
    
    log_success "配置文件备份完成: $backup_file"
}

# 清理旧备份
cleanup_old_backups() {
    log_info "清理旧备份文件..."
    
    # 保留最近 7 天的备份
    find "$BACKUP_DIR" -name "*.gz" -mtime +7 -delete
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
    
    log_success "旧备份文件清理完成"
}

# 生成备份报告
generate_report() {
    log_info "生成备份报告..."
    
    local report_file="$BACKUP_DIR/backup_report_$TIMESTAMP.txt"
    
    cat > "$report_file" << EOF
AI Workbench 备份报告
=====================

备份时间: $(date)
备份目录: $BACKUP_DIR

备份文件:
$(ls -la "$BACKUP_DIR"/*_$TIMESTAMP.* 2>/dev/null || echo "无备份文件")

磁盘使用情况:
$(df -h "$BACKUP_DIR")

备份状态: 成功
EOF
    
    log_success "备份报告生成完成: $report_file"
}

# 主函数
main() {
    log_info "开始备份 AI Workbench 数据..."
    
    create_backup_dir
    backup_database
    backup_redis
    backup_uploads
    backup_configs
    cleanup_old_backups
    generate_report
    
    log_success "备份完成！"
    echo ""
    echo "备份文件位置: $BACKUP_DIR"
    echo "备份时间戳: $TIMESTAMP"
    echo ""
}

# 错误处理
trap 'log_error "备份失败"; exit 1' ERR

# 执行主函数
main
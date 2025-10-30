# AI Workbench 部署指南

## 概述

AI Workbench 是一个现代化的全栈应用，包含前端 React 应用、后端 Node.js API、PostgreSQL 数据库和 Redis 缓存。本指南将帮助您在不同环境中部署应用。

## 系统要求

### 最低要求
- **CPU**: 2 核心
- **内存**: 4GB RAM
- **存储**: 20GB 可用空间
- **操作系统**: Linux (Ubuntu 20.04+), macOS, Windows 10+

### 推荐配置
- **CPU**: 4 核心
- **内存**: 8GB RAM
- **存储**: 50GB SSD
- **网络**: 稳定的互联网连接

### 软件依赖
- Docker 20.10+
- Docker Compose 2.0+
- Git
- curl (用于健康检查)

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd AI_Workbench
```

### 2. 环境配置

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

### 3. 一键部署

```bash
# 开发环境
./scripts/deploy.sh development

# 生产环境
./scripts/deploy.sh production
```

## 详细部署步骤

### 开发环境部署

1. **准备环境文件**
   ```bash
   cp .env.example .env
   ```

2. **配置环境变量**
   ```bash
   # 基本配置
   NODE_ENV=development
   PORT=8000
   
   # 数据库配置
   DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_workbench
   
   # JWT 密钥
   JWT_SECRET=your-development-secret-key
   
   # OpenAI API
   OPENAI_API_KEY=your-openai-api-key
   ```

3. **启动服务**
   ```bash
   docker-compose up -d
   ```

4. **验证部署**
   ```bash
   # 检查服务状态
   docker-compose ps
   
   # 查看日志
   docker-compose logs -f
   
   # 健康检查
   curl http://localhost:8000/health
   curl http://localhost:3000/health
   ```

### 生产环境部署

1. **服务器准备**
   ```bash
   # 更新系统
   sudo apt update && sudo apt upgrade -y
   
   # 安装 Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # 安装 Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **配置生产环境变量**
   ```bash
   # 生产环境配置
   NODE_ENV=production
   PORT=8000
   
   # 安全配置
   JWT_SECRET=your-super-secure-production-jwt-secret
   DB_PASSWORD=your-secure-database-password
   
   # SSL 证书路径
   SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
   SSL_KEY_PATH=/etc/nginx/ssl/key.pem
   ```

3. **SSL 证书配置**
   ```bash
   # 创建 SSL 目录
   mkdir -p nginx/ssl
   
   # 使用 Let's Encrypt (推荐)
   sudo apt install certbot
   sudo certbot certonly --standalone -d your-domain.com
   
   # 复制证书
   sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
   sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
   ```

4. **部署应用**
   ```bash
   # 使用生产配置部署
   ./scripts/deploy.sh production
   ```

5. **配置防火墙**
   ```bash
   # Ubuntu/Debian
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   
   # CentOS/RHEL
   sudo firewall-cmd --permanent --add-service=http
   sudo firewall-cmd --permanent --add-service=https
   sudo firewall-cmd --reload
   ```

## 环境变量说明

### 必需变量

| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `development`, `production` |
| `DATABASE_URL` | 数据库连接字符串 | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | JWT 签名密钥 | `your-secret-key` |
| `OPENAI_API_KEY` | OpenAI API 密钥 | `sk-...` |

### 可选变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `PORT` | 后端端口 | `8000` |
| `CORS_ORIGIN` | CORS 允许的源 | `http://localhost:3000` |
| `REDIS_URL` | Redis 连接字符串 | `redis://localhost:6379` |
| `LOG_LEVEL` | 日志级别 | `info` |

## 服务管理

### Docker Compose 命令

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重启服务
docker-compose restart

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f [service-name]

# 更新服务
docker-compose pull
docker-compose up -d
```

### 单独管理服务

```bash
# 重启后端服务
docker-compose restart backend

# 查看前端日志
docker-compose logs -f frontend

# 进入数据库容器
docker-compose exec db psql -U postgres -d ai_workbench
```

## 数据备份与恢复

### 自动备份

```bash
# 运行备份脚本
./scripts/backup.sh

# 设置定时备份 (crontab)
0 2 * * * /path/to/AI_Workbench/scripts/backup.sh
```

### 手动备份

```bash
# 备份数据库
docker-compose exec db pg_dump -U postgres ai_workbench > backup.sql

# 备份 Redis
docker-compose exec redis redis-cli BGSAVE
docker cp ai-workbench-redis:/data/dump.rdb ./redis-backup.rdb

# 备份上传文件
tar -czf uploads-backup.tar.gz server/uploads/
```

### 数据恢复

```bash
# 恢复数据库
docker-compose exec -T db psql -U postgres ai_workbench < backup.sql

# 恢复 Redis
docker cp ./redis-backup.rdb ai-workbench-redis:/data/dump.rdb
docker-compose restart redis

# 恢复上传文件
tar -xzf uploads-backup.tar.gz
```

## 监控与日志

### 健康检查

```bash
# 检查所有服务健康状态
curl http://localhost:8000/health
curl http://localhost:3000/health

# 检查数据库连接
docker-compose exec db pg_isready -U postgres

# 检查 Redis 连接
docker-compose exec redis redis-cli ping
```

### 日志管理

```bash
# 查看实时日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend

# 查看最近的日志
docker-compose logs --tail=100 frontend

# 导出日志
docker-compose logs > application.log
```

### 性能监控

生产环境可以启用 Prometheus 和 Grafana 监控：

```bash
# 启动监控服务
docker-compose --profile monitoring up -d

# 访问监控面板
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001 (admin/admin)
```

## 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   netstat -tulpn | grep :8000
   
   # 修改端口配置
   # 编辑 docker-compose.yml 或 .env 文件
   ```

2. **数据库连接失败**
   ```bash
   # 检查数据库状态
   docker-compose logs db
   
   # 重启数据库
   docker-compose restart db
   ```

3. **内存不足**
   ```bash
   # 检查内存使用
   docker stats
   
   # 清理未使用的容器和镜像
   docker system prune -a
   ```

4. **SSL 证书问题**
   ```bash
   # 检查证书有效性
   openssl x509 -in nginx/ssl/cert.pem -text -noout
   
   # 更新证书
   sudo certbot renew
   ```

### 日志分析

```bash
# 查找错误日志
docker-compose logs | grep -i error

# 查找特定时间的日志
docker-compose logs --since="2024-01-01T00:00:00"

# 统计请求数量
docker-compose logs nginx | grep "GET" | wc -l
```

## 性能优化

### 数据库优化

```sql
-- 创建索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_todos_user_id ON todos(user_id);

-- 分析查询性能
EXPLAIN ANALYZE SELECT * FROM notes WHERE user_id = 1;
```

### Redis 优化

```bash
# 配置 Redis 内存策略
docker-compose exec redis redis-cli CONFIG SET maxmemory-policy allkeys-lru

# 监控 Redis 性能
docker-compose exec redis redis-cli INFO memory
```

### 应用优化

1. **启用 Gzip 压缩** (已在 Nginx 配置中启用)
2. **配置 CDN** (用于静态资源)
3. **数据库连接池** (已在后端配置)
4. **Redis 缓存** (已实现)

## 安全建议

### 基本安全措施

1. **更改默认密码**
   ```bash
   # 数据库密码
   POSTGRES_PASSWORD=your-secure-password
   
   # JWT 密钥
   JWT_SECRET=your-super-secure-jwt-secret
   ```

2. **配置防火墙**
   ```bash
   # 只开放必要端口
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw deny 5432  # 数据库端口不对外开放
   ```

3. **定期更新**
   ```bash
   # 更新 Docker 镜像
   docker-compose pull
   docker-compose up -d
   
   # 更新系统
   sudo apt update && sudo apt upgrade -y
   ```

4. **备份策略**
   - 每日自动备份
   - 异地备份存储
   - 定期恢复测试

### SSL/TLS 配置

```nginx
# 强制 HTTPS
server {
    listen 80;
    return 301 https://$server_name$request_uri;
}

# 安全头配置
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
```

## 扩展部署

### 水平扩展

```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      replicas: 3
    
  frontend:
    deploy:
      replicas: 2
```

### 负载均衡

```nginx
upstream backend {
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}
```

### 数据库集群

```yaml
# 主从复制配置
services:
  db-master:
    image: postgres:15-alpine
    environment:
      - POSTGRES_REPLICATION_MODE=master
      
  db-slave:
    image: postgres:15-alpine
    environment:
      - POSTGRES_REPLICATION_MODE=slave
      - POSTGRES_MASTER_HOST=db-master
```

## 支持与维护

### 联系方式
- 技术支持: support@example.com
- 文档更新: docs@example.com

### 版本更新
1. 查看 CHANGELOG.md
2. 备份当前数据
3. 拉取最新代码
4. 运行迁移脚本
5. 重启服务

### 社区资源
- GitHub Issues: 报告问题和功能请求
- 文档站点: 详细的 API 文档
- 示例项目: 参考实现

---

**注意**: 在生产环境部署前，请仔细阅读所有配置选项，并根据实际需求进行调整。建议先在测试环境中验证部署流程。
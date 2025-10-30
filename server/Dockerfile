# 使用官方 Node.js 运行时作为基础镜像
FROM node:18-alpine AS base

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 复制应用代码
COPY --chown=nodejs:nodejs . .

# 创建上传目录
RUN mkdir -p uploads && chown -R nodejs:nodejs uploads

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# 启动应用
CMD ["npm", "start"]
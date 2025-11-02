# 项目文档上传功能 - TODO 清单

## 🚨 必须完成的配置

### 1. ✅ 数据库迁移 (优先级: P0 - 必须)

**问题**: 数据库表需要添加新字段才能支持文档功能

**解决方案**: 执行数据库迁移脚本

**步骤**:

#### 方法1: 使用 TypeScript 脚本（推荐）
```bash
cd /Users/ruiwang/Desktop/AI_Workbench/server
npx ts-node src/scripts/run-migrate-documents.ts
```

#### 方法2: 直接执行 SQL
1. 打开 Supabase 控制台
2. 进入 SQL Editor
3. 复制 `server/src/scripts/migrate-project-documents.sql` 的内容
4. 粘贴并执行

**验证**:
```sql
-- 在 Supabase SQL Editor 中执行
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'project_documents';

-- 应该看到以下字段:
-- file_path, file_size, mime_type, version, parent_document_id, is_latest
```

**迁移内容**:
- 添加 6 个新字段
- 创建 3 个索引
- 添加字段注释

**影响**: 
- ⚠️ 未执行迁移前，文档上传功能无法使用
- ✅ 迁移是安全的，不会影响现有数据

---

### 2. ✅ 上传目录准备 (优先级: P0 - 必须)

**问题**: 需要确保文件上传目录存在

**解决方案**: 目录已自动创建，但请确认

**验证**:
```bash
cd /Users/ruiwang/Desktop/AI_Workbench/server
ls -la uploads/

# 应该看到:
# uploads/
# ├── temp/
# └── projects/
```

**如果目录不存在**:
```bash
mkdir -p uploads/temp
mkdir -p uploads/projects
chmod 755 uploads
chmod 755 uploads/temp
chmod 755 uploads/projects
```

**影响**:
- ⚠️ 目录不存在会导致上传失败
- ✅ 已在代码中自动创建

---

## ⚙️ 可选配置

### 3. 🔧 环境变量配置 (优先级: P1 - 建议)

**问题**: 可能需要调整文件上传配置

**当前默认配置**:
```env
# server/.env
UPLOAD_DIR=./uploads           # 上传目录
MAX_FILE_SIZE=20971520        # 20MB = 20 * 1024 * 1024
```

**可选调整**:

如果需要更改文件大小限制:
```env
# 修改为 50MB
MAX_FILE_SIZE=52428800

# 修改为 100MB
MAX_FILE_SIZE=104857600
```

如果需要使用绝对路径:
```env
UPLOAD_DIR=/var/uploads/ai_workbench
```

**生效方式**:
```bash
cd /Users/ruiwang/Desktop/AI_Workbench/server
# 修改 .env 文件后重启服务器
npm run dev
```

---

### 4. 🗑️ 配置临时文件清理 (优先级: P2 - 可选)

**问题**: 临时文件需要定期清理

**当前方案**: 已实现自动清理（启动时清理 > 24小时的文件）

**增强方案**: 使用 Cron Job 定期清理

**Linux / macOS**:
```bash
# 编辑 crontab
crontab -e

# 添加每小时清理一次
0 * * * * cd /Users/ruiwang/Desktop/AI_Workbench/server && npx ts-node -e "import { FileStorageService } from './src/services/FileStorageService'; const storage = new FileStorageService(); storage.cleanTempFiles();"
```

**影响**:
- 临时文件会自动清理，无需手动处理
- 可选：增加 Cron Job 更及时清理

---

## 🧪 功能测试清单

### 5. ✅ 基础功能测试 (优先级: P0 - 必须)

执行数据库迁移后，请测试以下功能：

#### 上传功能
- [ ] 打开项目详情页
- [ ] 切换到"项目文档"标签
- [ ] 点击上传 PDF 文件
- [ ] 检查是否上传成功
- [ ] 拖拽上传一个图片文件
- [ ] 检查是否上传成功

#### 下载功能
- [ ] 点击文档列表中的"下载"按钮
- [ ] 检查文件是否正确下载

#### 预览功能
- [ ] 点击 PDF 文档的"预览"按钮
- [ ] 检查 PDF 是否正确显示
- [ ] 测试缩放、旋转功能
- [ ] 测试分页浏览（如果 PDF 有多页）
- [ ] 点击图片的"预览"按钮
- [ ] 检查图片是否正确显示

#### 版本管理
- [ ] 上传同名文件
- [ ] 检查是否创建了新版本
- [ ] 点击"版本历史"按钮
- [ ] 检查版本列表是否正确
- [ ] 尝试恢复旧版本
- [ ] 检查是否成功恢复

#### 删除功能
- [ ] 点击"删除"按钮
- [ ] 确认删除
- [ ] 检查文档是否被删除

#### 权限测试
- [ ] 使用 Admin 账号测试所有功能
- [ ] 使用 Member 账号测试所有功能
- [ ] 使用 Observer 账号测试（应只能查看/下载）

---

### 6. ⚠️ 异常情况测试 (优先级: P1 - 建议)

#### 文件验证
- [ ] 尝试上传超过 20MB 的文件（应被拒绝）
- [ ] 尝试上传不支持的文件类型（应被拒绝）
- [ ] 尝试上传空文件（应被拒绝）

#### 权限验证
- [ ] 使用非项目成员账号访问（应被拒绝）
- [ ] Observer 尝试上传（应被拒绝）
- [ ] Observer 尝试删除（应被拒绝）

---

## 📝 API 密钥配置

### 7. 🔑 PDF.js CDN (优先级: P2 - 可选)

**当前配置**: 使用 CDN
```typescript
// client/src/components/projects/DocumentPreviewModal.tsx
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
```

**如果 CDN 不可用**:

1. 下载 PDF.js worker:
```bash
cd /Users/ruiwang/Desktop/AI_Workbench/client
npm install --save pdfjs-dist
```

2. 修改配置:
```typescript
// 使用本地 worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();
```

---

## 🚀 部署检查清单

### 8. 📦 生产环境部署 (优先级: P0 - 部署前必须)

#### 后端检查
- [ ] 数据库迁移已执行
- [ ] 上传目录已创建且有正确权限
- [ ] 环境变量已配置
- [ ] 依赖已安装 (`npm install`)
- [ ] 服务器可以正常启动

#### 前端检查
- [ ] PDF 预览依赖已安装
- [ ] 组件正确引入
- [ ] 服务正确配置
- [ ] API 地址正确（VITE_API_URL）

#### 功能验证
- [ ] 完成基础功能测试清单
- [ ] 完成异常情况测试清单
- [ ] 性能测试通过

---

## 🔍 故障排查

### 常见问题

#### 问题1: 上传失败 - "文件保存失败"

**可能原因**:
- 上传目录不存在
- 目录权限不足

**解决方案**:
```bash
cd /Users/ruiwang/Desktop/AI_Workbench/server
mkdir -p uploads/temp uploads/projects
chmod -R 755 uploads
```

#### 问题2: 数据库错误 - "column does not exist"

**可能原因**:
- 数据库迁移未执行

**解决方案**:
```bash
cd /Users/ruiwang/Desktop/AI_Workbench/server
npx ts-node src/scripts/run-migrate-documents.ts
```

#### 问题3: PDF 预览失败

**可能原因**:
- PDF.js worker 加载失败
- CDN 不可用

**解决方案**:
1. 检查浏览器控制台错误
2. 尝试使用本地 worker（见上文）
3. 检查 CORS 配置

#### 问题4: 权限错误 - "无权访问"

**可能原因**:
- Token 过期
- 用户不是项目成员

**解决方案**:
1. 重新登录
2. 检查项目成员列表
3. 确认用户角色

---

## 📊 性能优化建议

### 9. ⚡ 性能优化 (优先级: P2 - 可选)

#### 数据库索引
已创建以下索引，无需额外配置：
- `idx_project_documents_project`
- `idx_project_documents_parent`
- `idx_project_documents_latest`

#### 文件上传优化
如需提升上传性能：
1. 增加服务器带宽
2. 使用 CDN 加速
3. 启用文件压缩
4. 考虑使用云存储（S3/OSS）

#### 预览加载优化
如需优化预览速度：
1. 使用 CDN 缓存
2. 启用浏览器缓存
3. 实现懒加载
4. 压缩图片

---

## 📚 参考文档

### 相关文档
- [DESIGN](./DESIGN_项目文档上传功能.md) - 架构设计
- [TASK](./TASK_项目文档上传功能.md) - 任务拆分
- [FINAL](./FINAL_项目文档上传功能.md) - 最终交付报告

### API 文档
- 后端 API: 见 `FINAL.md` 中的 API 接口章节
- 前端服务: `client/src/services/documentService.ts`

### 技术文档
- [Multer](https://github.com/expressjs/multer) - 文件上传
- [react-pdf](https://github.com/wojtekmaj/react-pdf) - PDF 预览
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF 渲染

---

## ✅ 完成确认

请完成以下步骤后，在 `[ ]` 中打 `x`:

### 必须完成
- [x] 1. 执行数据库迁移 ✅
- [x] 2. 确认上传目录存在 ✅
- [ ] 3. 完成基础功能测试

### 建议完成
- [ ] 4. 配置环境变量（如需调整）
- [ ] 5. 完成异常情况测试
- [ ] 6. 配置临时文件清理（可选）

### 部署前
- [ ] 7. 完成所有测试
- [ ] 8. 生产环境检查清单

---

## 💬 需要帮助？

如有任何问题，请按以下优先级排查：

1. **查看日志**: 
   - 后端: `server/logs/` 或控制台输出
   - 前端: 浏览器开发者工具 Console

2. **检查文档**:
   - [FINAL](./FINAL_项目文档上传功能.md) - 完整功能说明
   - [DESIGN](./DESIGN_项目文档上传功能.md) - 技术实现细节

3. **故障排查**:
   - 参考本文档"故障排查"章节
   - 检查环境配置
   - 验证数据库迁移

4. **联系支持**:
   - Email: ruiwang@example.com
   - 提供：错误信息、日志、复现步骤

---

**最后更新**: 2025-11-01  
**文档版本**: 1.0  
**项目状态**: ✅ 代码完成，待配置和测试


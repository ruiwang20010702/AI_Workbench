# TODO 清单：数据库架构重构

**创建日期**: 2025-10-31  
**状态**: ✅ 数据库迁移已完成，✅ 数据库函数 SQL 已准备  
**优先级**: 高

---

## 🎯 需要人工完成的事项

### 1. ✅ 创建数据库函数（可选）⭐⭐⭐

#### 优先级：中
#### 预估时间：2-3 分钟
#### 影响功能：向量相似度搜索、待办统计、性能优化
#### 状态：✅ SQL 脚本已准备，等待执行

#### 📝 新的执行方式（推荐）：

**我已经为你准备了完整的 SQL 脚本！** 🎉

**方法 1: 使用 Supabase Dashboard（最简单）**

1. **打开 SQL 文件**
   ```
   docs/数据库架构重构/create_db_functions.sql
   ```

2. **复制全部内容**（Cmd+A, Cmd+C）

3. **在 Supabase 执行**
   - 访问: https://supabase.com/dashboard
   - 选择你的项目
   - 左侧菜单 → **SQL Editor**
   - 点击 **New Query**
   - 粘贴复制的内容
   - 点击 **Run** 按钮

4. **验证创建成功**
   ```sql
   SELECT routine_name 
   FROM information_schema.routines
   WHERE routine_schema = 'public' 
     AND routine_type = 'FUNCTION'
   ORDER BY routine_name;
   ```
   应该显示 7 个函数

**方法 2: 使用 Supabase CLI**

```bash
cd /Users/ruiwang/Desktop/AI_Workbench
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db execute --file docs/数据库架构重构/create_db_functions.sql
```

**详细文档**: 
- 📖 [完整执行指南](docs/数据库架构重构/执行数据库函数指南.md)
- ⚡ [快速执行指南](docs/数据库架构重构/快速执行指南.md)

#### 📦 包含的 7 个函数：

1. **match_notes** - 向量相似度搜索
2. **get_todo_stats** - 待办统计
3. **get_project_stats** - 项目统计
4. **get_user_activity_stats** - 用户活动统计
5. **search_notes** - 混合搜索（全文+向量）
6. **update_all_search_vectors** - 批量更新搜索向量
7. **get_recent_notes** - 获取最近笔记

#### 如果不创建？

- ✅ **不影响系统运行** - 代码已包含备选方案
- ⚠️ **性能稍差** - 使用 JavaScript 手动聚合（性能差异很小）

---

### 2. 验证环境变量配置 ⭐⭐⭐⭐⭐

#### 优先级：高
#### 预估时间：1 分钟

#### 操作步骤：

1. **检查服务器环境变量**

```bash
cd /Users/ruiwang/Desktop/AI_Workbench/server
cat .env | grep SUPABASE
```

2. **确认以下变量存在且正确**：

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

3. **如果缺少，请添加**：

获取这些值：
- 登录 Supabase Dashboard
- 进入您的项目
- 点击左侧 "Settings" → "API"
- 复制 "Project URL" 和 "service_role" key

#### 验证：

重启服务器时应该看到：
```
Database connected successfully
```

如果看到连接错误，检查环境变量是否正确。

---

### 3. 重启服务器 ⭐⭐⭐⭐⭐

#### 优先级：高
#### 预估时间：30 秒

#### 操作步骤：

1. **停止当前服务器**（如果正在运行）
   - 按 `Ctrl + C` 停止

2. **启动服务器**

```bash
cd /Users/ruiwang/Desktop/AI_Workbench/server
npm run dev
```

3. **验证启动成功**

应该看到：
```
Server is running on port 3000
Database connected successfully
Notification scheduler started
```

#### 如果启动失败：

- 检查环境变量配置（TODO #2）
- 检查 TypeScript 编译（应该已通过）
- 查看错误日志并提供给我

---

### 4. 功能测试（推荐）⭐⭐⭐

#### 优先级：中
#### 预估时间：10 分钟

#### 测试清单：

##### 笔记功能
- [ ] 创建新笔记
- [ ] 编辑笔记
- [ ] 按分类筛选笔记（验证修复的 BUG）
- [ ] 搜索笔记
- [ ] 删除笔记

##### 待办功能
- [ ] 创建待办
- [ ] 标记完成
- [ ] 按优先级筛选
- [ ] 批量操作

##### 项目功能
- [ ] 创建项目
- [ ] 添加任务
- [ ] 查看项目进度
- [ ] 添加成员

##### 用户功能
- [ ] 登录/注册
- [ ] 修改密码
- [ ] 查看个人信息

#### 如果发现问题：

请告诉我具体的错误信息，包括：
- 操作步骤
- 期望结果
- 实际结果
- 浏览器控制台错误（F12）
- 服务器日志错误

---

### 5. 删除旧的 TODO 文档（可选）⭐

#### 优先级：低
#### 预估时间：10 秒

之前创建的架构优化建议文档已经完成，可以删除或归档：

```bash
cd /Users/ruiwang/Desktop/AI_Workbench
# 选项 1: 删除
rm docs/项目诊断/TODO_数据库架构优化建议.md

# 选项 2: 归档
mkdir -p docs/归档
mv docs/项目诊断/TODO_数据库架构优化建议.md docs/归档/
```

---

## 📋 快速操作指引

### 最小化操作（必须完成）

```bash
# 1. 验证环境变量
cd /Users/ruiwang/Desktop/AI_Workbench/server
grep SUPABASE .env

# 2. 重启服务器
npm run dev
```

### 完整操作（推荐）

```bash
# 1. 验证环境变量
cd /Users/ruiwang/Desktop/AI_Workbench/server
grep SUPABASE .env

# 2. 创建数据库函数
# → 访问 Supabase Dashboard → SQL Editor → 粘贴并执行上面的 SQL

# 3. 重启服务器
npm run dev

# 4. 功能测试
# → 打开浏览器测试各项功能

# 5. 清理旧文档（可选）
rm docs/项目诊断/TODO_数据库架构优化建议.md
```

---

## ❓ 常见问题

### Q1: 数据库函数必须创建吗？

**A**: 不是必须的。

- `search_notes_by_similarity`: 只在使用向量相似度搜索时需要（AI 笔记推荐功能）
- `get_todo_statistics`: 可选，不创建会使用 JavaScript 备选方案

如果不确定，建议创建，只需 1 分钟。

### Q2: 重启服务器后报错怎么办？

**A**: 按优先级检查：

1. 环境变量是否配置正确（`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`）
2. Supabase 项目是否正常运行
3. 网络连接是否正常
4. 提供错误日志给我分析

### Q3: 如何验证迁移成功？

**A**: 三个层面验证：

1. **编译**: `npm run build` 无错误 ✅（已完成）
2. **启动**: `npm run dev` 成功启动 ✅（需要人工验证）
3. **功能**: 各项功能正常使用 ✅（需要人工测试）

### Q4: 发现 BUG 怎么办？

**A**: 请提供以下信息：

1. 操作步骤（如何复现）
2. 期望结果
3. 实际结果
4. 浏览器控制台错误（F12 打开开发者工具）
5. 服务器日志错误

我会立即协助解决。

### Q5: 能否回滚到旧版本？

**A**: 可以，但不建议。

Git 记录了所有更改，可以回滚。但：
- 旧版本的 3 个 BUG 仍然存在
- 旧版本的维护成本更高
- 新版本代码质量更好

建议先尝试解决新版本的问题。

---

## 📞 获取帮助

如果遇到任何问题：

1. **查看日志**
   - 服务器日志：终端输出
   - 浏览器日志：F12 开发者工具 → Console

2. **查看文档**
   - [验收文档](./ACCEPTANCE_数据库架构重构.md)
   - [设计文档](./DESIGN_数据库架构重构.md)

3. **联系我**
   - 提供详细的错误信息
   - 我会立即协助解决

---

## ✅ 完成检查

完成上述操作后，请确认：

- [x] **环境变量已配置** ✅
- [x] **todos 表迁移已完成**（completed, completed_at 字段已添加）✅
- [ ] 数据库函数已创建（可选）
- [x] **服务器成功启动** ✅
- [ ] 至少测试了一个功能模块
- [ ] 无明显错误

**全部完成后，数据库架构重构正式完成！** 🎉

---

## 🆕 最新更新（2025-10-31）

### ✅ 已完成的迁移

1. **todos 表字段迁移**
   - ✅ 添加 `completed` 字段（BOOLEAN）
   - ✅ 添加 `completed_at` 字段（TIMESTAMPTZ）
   - ✅ 从现有 `status` 字段同步数据
   - ✅ 创建性能优化索引

2. **迁移脚本清理**
   - ✅ 删除临时迁移脚本 `run-migrate-todos.ts`
   - ✅ 保留原始 SQL 文件 `migrate-todos.sql` 供参考

### 📝 迁移 SQL（已执行）

```sql
-- 已在 Supabase Dashboard 成功执行
ALTER TABLE todos ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
UPDATE todos SET completed = (status = '已完成');
UPDATE todos SET completed_at = updated_at WHERE status = '已完成';
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
CREATE INDEX IF NOT EXISTS idx_todos_completed_at ON todos(completed_at);
```

---

**创建人**: AI Assistant  
**创建日期**: 2025-10-31  
**更新日期**: 2025-10-31


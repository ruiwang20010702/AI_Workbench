# TODO - 待定成员功能待办事项

**任务名称**: 待定成员功能  
**状态**: ✅ 配置完成，可以开始测试  
**优先级**: 🟢 配置完成（可以进行功能测试）

---

## ✅ 已完成的配置

### 1. ✅ 数据库迁移已完成

**状态**: 已执行  
**结果**: `pending_members` 表已成功创建并存在于数据库中

**验证结果**:
```
⏳ 3. 检查 pending_members 表...
   ✅ pending_members 表存在！
```

### 2. ✅ 环境变量已配置

**Server 配置** (`server/.env`):
- ✅ SUPABASE_URL
- ✅ SUPABASE_ANON_KEY
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ SUPABASE_PROJECT_ID
- ✅ SUPABASE_ACCESS_TOKEN

**Client 配置** (`client/.env`):
- ✅ VITE_API_URL
- ✅ VITE_SUPABASE_URL
- ✅ VITE_SUPABASE_ANON_KEY

**连接测试**: ✅ 通过

---

## 🚨 必须完成的事项（高优先级）

### 1. ~~执行数据库迁移~~ ✅ [已完成]

**当前状态**: ✅ 已完成  
**结果**: `pending_members` 表已存在

#### 选项 A: 通过 Supabase Dashboard（推荐）

**步骤**:
1. 访问 Supabase Dashboard: https://app.supabase.com
2. 选择您的项目
3. 点击左侧菜单 **SQL Editor**
4. 点击 **New Query**
5. 复制以下文件内容并粘贴：
   ```
   server/src/config/20251101_create_pending_members.sql
   ```
6. 点击 **Run** 按钮执行
7. 确认执行成功（看到绿色的 Success 消息）

**验证**:
```sql
-- 在 SQL Editor 中运行
SELECT COUNT(*) FROM pending_members;
-- 应该返回 0（表已创建但为空）
```

#### 选项 B: 通过 psql 命令行

**前提条件**: 需要知道 Supabase 数据库连接信息

```bash
# 连接到 Supabase 数据库
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# 执行迁移
\i server/src/config/20251101_create_pending_members.sql

# 验证
\d pending_members
```

#### 选项 C: 配置环境变量后自动执行

```bash
# 1. 创建 .env 文件
cd /Users/ruiwang/Desktop/AI_Workbench
cp server_env_template.txt .env

# 2. 编辑 .env 文件，添加：
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 3. 运行迁移脚本
npx tsx server/src/scripts/migrate-pending-members.ts
```

---

### 2. ~~配置环境变量~~ ✅ [已完成]

**状态**: ✅ 已完成

**已配置的环境变量**:
```bash
# Server (.env)
SUPABASE_URL=https://dkczfihkowivzcvsnxpo.supabase.co
SUPABASE_SERVICE_ROLE_KEY=已配置 ✅
SUPABASE_ANON_KEY=已配置 ✅
SUPABASE_PROJECT_ID=dkczfihkowivzcvsnxpo
SUPABASE_ACCESS_TOKEN=已配置 ✅

# Client (.env)
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://dkczfihkowivzcvsnxpo.supabase.co
VITE_SUPABASE_ANON_KEY=已配置 ✅
```

**验证结果**: ✅ 连接测试通过
```bash
# 运行迁移验证脚本
npx tsx server/src/scripts/migrate-pending-members.ts

# 如果配置正确，应该看到：
# ✅ pending_members 表已存在！
# ✅ 迁移验证成功！
```

---

## 🧪 测试验证（中优先级）

### 3. 功能测试 ⏳ [推荐]

完成数据库迁移和环境配置后，执行以下测试：

#### 测试用例 1: 添加未注册邮箱为待定成员

**步骤**:
1. 启动后端服务
   ```bash
   cd server
   npm run dev
   ```
2. 启动前端服务
   ```bash
   cd client
   npm run dev
   ```
3. 登录现有账号
4. 创建新项目
5. 在"团队协作"步骤输入一个未注册的邮箱（如 `testuser@example.com`）
6. 提交项目

**预期结果**:
- ✅ 项目创建成功
- ✅ 控制台显示：`✅ 添加了 1 个待定成员（未注册邮箱）`
- ✅ 数据库中 `pending_members` 表有一条记录

**验证方式**:
```bash
# 在 Supabase SQL Editor 中运行
SELECT * FROM pending_members;
```

---

#### 测试用例 2: 添加已注册用户为正式成员

**步骤**:
1. 确保有另一个已注册的用户账号（如 `admin@localhost`）
2. 创建新项目
3. 在"团队协作"步骤输入已注册邮箱
4. 提交项目

**预期结果**:
- ✅ 项目创建成功
- ✅ 控制台显示：`✅ 添加了 1 个已注册用户`
- ✅ 数据库中 `project_members` 表有新记录
- ✅ `pending_members` 表没有该邮箱

**验证方式**:
```bash
# 在 Supabase SQL Editor 中运行
SELECT * FROM project_members WHERE user_id = (
  SELECT id FROM users WHERE email = 'admin@localhost'
);
```

---

#### 测试用例 3: 混合添加（部分注册、部分未注册）

**步骤**:
1. 创建新项目
2. 在"团队协作"步骤输入多个邮箱：
   - `admin@localhost`（已注册）
   - `newuser1@example.com`（未注册）
   - `newuser2@example.com`（未注册）
3. 提交项目

**预期结果**:
- ✅ 控制台显示：
  - `✅ 添加了 1 个已注册用户`
  - `✅ 添加了 2 个待定成员（未注册邮箱）`
- ✅ 项目成员数量显示为 3

---

#### 测试用例 4: 用户注册后自动转换 ⚡ [核心功能]

**步骤**:
1. 完成测试用例 1，确保有待定成员
2. 打开新的浏览器窗口（或隐身模式）
3. 访问注册页面
4. 使用待定成员的邮箱注册（如 `testuser@example.com`）
5. 注册成功后登录
6. 查看"我的项目"列表

**预期结果**:
- ✅ 注册成功
- ✅ 后端控制台显示：`✅ 用户 testuser@example.com 注册成功，自动加入 1 个项目`
- ✅ 用户自动看到之前邀请的项目
- ✅ `pending_members` 表中该邮箱记录已删除
- ✅ `project_members` 表中有新记录

**验证方式**:
```bash
# 在 Supabase SQL Editor 中运行
-- 待定成员应该被删除
SELECT * FROM pending_members WHERE email = 'testuser@example.com';
-- 应该返回 0 行

-- 正式成员应该存在
SELECT * FROM project_members WHERE user_id = (
  SELECT id FROM users WHERE email = 'testuser@example.com'
);
-- 应该返回 1+ 行
```

---

#### 测试用例 5: 重复添加的处理

**步骤**:
1. 创建项目，添加待定成员 `duplicate@example.com`
2. 编辑同一项目，再次添加 `duplicate@example.com`

**预期结果**:
- ✅ 不报错
- ✅ 控制台显示：`ℹ️  跳过 1 个重复邮箱`
- ✅ 数据库中只有一条记录

---

#### 测试用例 6: 权限验证

**步骤**:
1. 创建用户 A 和用户 B
2. 用户 A 创建项目 P1
3. 用户 B 尝试调用 API 添加待定成员到 P1

**API 测试**:
```bash
# 获取用户 B 的 token
TOKEN_B="user_b_token"

# 尝试添加待定成员到用户 A 的项目
curl -X POST http://localhost:3000/api/projects/PROJECT_ID/pending-members/batch \
  -H "Authorization: Bearer $TOKEN_B" \
  -H "Content-Type: application/json" \
  -d '{
    "members": [
      { "email": "hacker@example.com", "role": "member" }
    ]
  }'
```

**预期结果**:
- ✅ 返回 403 错误
- ✅ 错误消息：`You are not a member of this project`

---

#### 测试用例 7: 邮箱格式验证

**步骤**:
1. 创建项目
2. 在"团队协作"步骤输入无效邮箱：
   - `invalid-email`（无 @）
   - `test@`（无域名）
   - `@example.com`（无用户名）

**预期结果**:
- ✅ 前端自动过滤无效邮箱
- ✅ 只处理格式正确的邮箱

---

## 🎨 UI 扩展（低优先级）

### 4. 显示待定成员列表 ℹ️ [可选]

**需求**: 在项目详情页显示待定成员

**建议实现**:
```typescript
// 在 ProjectDetailPage 中添加
const [pendingMembers, setPendingMembers] = useState([]);

useEffect(() => {
  const fetchPending = async () => {
    const data = await projectService.getPendingMembers(projectId);
    setPendingMembers(data);
  };
  fetchPending();
}, [projectId]);

// UI 显示
<div className="pending-members">
  <h3>待定成员（{pendingMembers.length}）</h3>
  {pendingMembers.map(member => (
    <div key={member.id}>
      <span>{member.email}</span>
      <span className="badge">待定</span>
      <span>{member.role}</span>
      <button onClick={() => handleDeletePending(member.id)}>删除</button>
    </div>
  ))}
</div>
```

---

### 5. 添加待定成员管理功能 ℹ️ [可选]

**建议功能**:
- 查看待定成员列表
- 删除待定成员
- 重新发送邀请（如果实现邮件功能）
- 修改待定成员角色
- 批量操作

---

## 📧 功能增强（未来规划）

### 6. 实现邮件邀请 ℹ️ [未来]

**需求**: 添加待定成员时发送邮件通知

**技术方案**:
- 集成邮件服务（SendGrid、Mailgun 等）
- 创建邮件模板
- 添加邀请链接（带 token）
- 实现邀请确认机制

**伪代码**:
```typescript
async function sendInvitation(email: string, projectName: string) {
  const inviteToken = generateInviteToken(email, projectId);
  const inviteLink = `https://yourapp.com/accept-invite?token=${inviteToken}`;
  
  await emailService.send({
    to: email,
    subject: `您被邀请加入项目：${projectName}`,
    html: `
      <p>您好！</p>
      <p>您被邀请加入项目：<strong>${projectName}</strong></p>
      <p><a href="${inviteLink}">点击此处接受邀请</a></p>
    `
  });
}
```

---

### 7. 实现邀请过期机制 ℹ️ [未来]

**需求**: 待定成员邀请在 X 天后过期

**数据库修改**:
```sql
-- 添加过期时间字段
ALTER TABLE pending_members ADD COLUMN expires_at TIMESTAMPTZ;

-- 设置默认 30 天后过期
UPDATE pending_members 
SET expires_at = created_at + INTERVAL '30 days' 
WHERE expires_at IS NULL;
```

**定时任务**:
```typescript
// 每天清理过期的待定成员
cron.schedule('0 0 * * *', async () => {
  const { data, error } = await supabaseAdmin
    .from('pending_members')
    .delete()
    .lt('expires_at', new Date().toISOString());
  
  console.log(`清理了 ${data?.length || 0} 个过期待定成员`);
});
```

---

### 8. 实现邀请统计和分析 ℹ️ [未来]

**建议功能**:
- 邀请转化率统计
- 待定成员数量趋势
- 项目邀请排行榜
- 用户接受邀请平均时长

---

## 📋 检查清单

### 必须完成（高优先级）
- [ ] 执行数据库迁移（创建 pending_members 表）
- [ ] 配置 Supabase 环境变量
- [ ] 验证迁移成功（表已创建）

### 推荐完成（中优先级）
- [ ] 测试用例 1: 添加未注册邮箱
- [ ] 测试用例 2: 添加已注册用户
- [ ] 测试用例 3: 混合添加
- [ ] 测试用例 4: 注册自动转换 ⚡
- [ ] 测试用例 5: 重复添加处理
- [ ] 测试用例 6: 权限验证
- [ ] 测试用例 7: 邮箱格式验证

### 可选完成（低优先级）
- [ ] UI 显示待定成员列表
- [ ] 待定成员管理界面
- [ ] 邮件邀请功能
- [ ] 邀请过期机制
- [ ] 邀请统计分析

---

## 🔧 故障排查

### 问题 1: 迁移脚本报错 "CONFIG_MISSING"

**原因**: 环境变量未配置  
**解决方案**: 参考上文"配置环境变量"章节

---

### 问题 2: 表已存在错误

**原因**: 之前已执行过迁移  
**解决方案**: 
```sql
-- 检查表是否存在
SELECT * FROM information_schema.tables 
WHERE table_name = 'pending_members';

-- 如果需要重新创建
DROP TABLE IF EXISTS pending_members CASCADE;
-- 然后重新执行迁移
```

---

### 问题 3: 注册后没有自动转换

**可能原因**:
1. 邮箱大小写不匹配
2. 后端日志有错误
3. 数据库表未创建

**排查步骤**:
```bash
# 1. 检查后端日志
# 查找 "待定成员转换" 相关日志

# 2. 手动查询待定成员
SELECT * FROM pending_members WHERE LOWER(email) = LOWER('test@example.com');

# 3. 查询用户表
SELECT * FROM users WHERE LOWER(email) = LOWER('test@example.com');

# 4. 手动测试转换
# 在后端控制台执行
await PendingMemberModel.convertToMembers(userId, email);
```

---

### 问题 4: 前端添加成员失败

**可能原因**:
1. API 路由未正确配置
2. 权限验证失败
3. 网络请求错误

**排查步骤**:
```bash
# 1. 检查后端路由
curl http://localhost:3000/api/projects/PROJECT_ID/pending-members/batch \
  -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"members":[{"email":"test@example.com","role":"member"}]}'

# 2. 查看浏览器控制台
# - Network 标签查看请求详情
# - Console 标签查看错误信息

# 3. 查看后端日志
# 查找错误堆栈
```

---

## 📞 需要帮助？

如果在执行上述步骤时遇到问题，请提供以下信息：

1. **具体错误信息**（完整的错误日志）
2. **执行的步骤**（您做了什么）
3. **环境信息**（Node 版本、数据库版本等）
4. **相关截图**（如果有）

---

## 🎯 快速开始指南

如果您想快速开始，按以下顺序执行：

```bash
# 1. 打开 Supabase Dashboard
# 2. 执行 SQL 迁移
# 3. 配置 .env 文件
# 4. 启动服务
cd server && npm run dev
cd client && npm run dev

# 5. 测试功能
# - 创建项目并添加未注册邮箱
# - 注册该邮箱
# - 验证自动加入项目
```

---

**优先级排序**:
1. 🔴 **必须**: 数据库迁移 + 环境配置
2. 🟡 **推荐**: 功能测试验证
3. 🟢 **可选**: UI 扩展和功能增强

**预计时间**:
- 数据库迁移: 5 分钟
- 环境配置: 5 分钟
- 功能测试: 30 分钟
- 总计: 约 40 分钟

**下一步**: 完成数据库迁移后，立即进行测试用例 4（注册自动转换）验证核心功能！

---

**文档版本**: v1.0.0  
**最后更新**: 2025-11-01  
**状态**: ⏳ 等待执行


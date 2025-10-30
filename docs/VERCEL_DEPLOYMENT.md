# Vercel 部署指南（前后端分离）

本文档说明在 Vercel 分别部署「后端（Express + Serverless）」与「前端（Vite SPA）」的推荐流程，并细化到界面表单每一项应该选择/填写的内容。

## 部署顺序
- 先部署后端，再部署前端。
- 原因：前端需要填写 `VITE_API_URL` 指向后端域名 + `/api`，所以后端域名必须先确定。

## 前置条件
- GitHub 仓库已连接到 Vercel 账号。
- 已有 Supabase 项目，并准备好以下变量：
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`（仅后端使用）
- 可选：模型服务的 API Key（如 `SILICONFLOW_API_KEY`）。

## 仓库说明（已适配 Vercel）
- 已新增后端 Serverless 入口：`server/api/[...all].ts`
  - 作用：将所有 `/api/*` 请求交给现有 `Express app`（`server/src/app.ts`）。
  - 注意：Serverless 函数不会调用 `server/src/server.ts` 的 `app.listen()`，而是直接使用 `app` 处理请求。

---

## 一、后端部署（Vercel Project 1：Backend）

1) 在 Vercel 新建项目
- 步骤：`New Project` → 选择本仓库 → `Import`。
- Root Directory（根目录）：填写 `server`
- Framework Preset（框架）：选择 `Other`

2) Build & Output Settings（构建与输出）
- Install Command：填写 `npm install`
- Build Command：留空（不填）
  - 说明：后端以 Serverless 函数为入口，Vercel 会自动编译 `api` 下的 TypeScript 文件及其依赖，无需单独 `tsc`。
- Output Directory：留空（不填）

3) Environment Variables（环境变量）
- 在 Vercel 项目中添加以下变量（建议同时添加到 `Production` 和 `Preview` 两个环境）：
  - `SUPABASE_URL`：你的 Supabase 项目 URL，例如 `https://<project>.supabase.co`
  - `SUPABASE_ANON_KEY`：Supabase 匿名 Key
  - `SUPABASE_SERVICE_ROLE_KEY`：Supabase 服务角色 Key（仅后端使用）
  - `JWT_SECRET`：任意长度≥32的随机字符串，用于签发/校验 JWT
  - `CORS_ORIGIN`：你的前端域名，例如 `https://<frontend-project>.vercel.app`
  - 可选 `SILICONFLOW_API_KEY`：如使用硅基流动模型服务
  - 可选 `RATE_LIMIT_WINDOW_MS`：例如 `900000`
  - 可选 `RATE_LIMIT_MAX_REQUESTS`：例如 `100`
  - 可选 `NODE_ENV`：`production`
  - 可选 `LOG_LEVEL`：`info`

4) Deploy（部署）
- 点击 `Deploy` 完成部署。

5) 验证（后端）
- 打开 `https://<后端项目>.vercel.app/api/health`
  - 预期：返回健康检查 JSON，状态为 200。
- 若浏览器控制台报 CORS 错误：确认 `CORS_ORIGIN` 是否为你的前端域名（必须完整，如 `https://xxx.vercel.app`）。

---

## 二、前端部署（Vercel Project 2：Frontend）

1) 在 Vercel 新建项目
- 步骤：`New Project` → 选择本仓库 → `Import`。
- Root Directory（根目录）：填写 `client`
- Framework Preset（框架）：选择 `Vite`（若未识别，可选 `Other`）

2) Build & Output Settings（构建与输出）
- Install Command：填写 `npm install`
- Build Command：填写 `npm run build`
- Output Directory：填写 `dist`

3) Environment Variables（环境变量）
- 在 Vercel 项目中添加以下变量（建议同时添加到 `Production` 和 `Preview`）：
  - `VITE_API_URL`：`https://<后端项目>.vercel.app/api`
    - 示例：`https://your-backend-project.vercel.app/api`

4) Deploy（部署）
- 点击 `Deploy` 完成部署。

5) 验证（前端）
- 访问你的前端域名（例如 `https://<frontend-project>.vercel.app`），打开浏览器开发者工具 → Network：
  - 确认前端请求指向 `https://<后端项目>.vercel.app/api/...`，并返回 200。
  - 若 404：前端是 SPA，深链接路径可能需要回退到 `index.html`（见下方「可选配置」）。
  - 若 CORS 报错：回到后端项目，将 `CORS_ORIGIN` 设置成前端实际域名。

---

## 可选配置（前端 SPA 404 回退）
- 如果在非根路径（如 `/projects`、`/settings`）出现 404，可在 `client` 项目加一个 `vercel.json`：

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- 注意：你的 `VITE_API_URL` 指向的是后端的独立域名，因此该回退不会影响 API 请求。

---

## 常见问题 & 处理
- CORS 报错：后端的 `CORS_ORIGIN` 必须与前端域名完全一致（包含协议 `https://`）。
- 401/403：检查 `JWT_SECRET` 是否一致，确认前端是否正确携带 `Authorization: Bearer <token>`（如需）。
- Supabase 连通性：
  - 仅后端使用 `SUPABASE_SERVICE_ROLE_KEY`；不要在前端项目中暴露该 Key。
  - 如需快速验证，可运行后端中的测试脚本（见 `server/src/scripts/test-supabase-client.ts`）。
- 速率限制：如需提高预览环境的阈值，设置更大的 `RATE_LIMIT_MAX_REQUESTS`。

---

## 填写内容速查（UI 表单项）

后端（Backend）
- Root Directory：`server`
- Framework Preset：`Other`
- Install Command：`npm install`
- Build Command：留空
- Output Directory：留空
- Environment Variables（Production & Preview）：
  - `SUPABASE_URL`：`https://<project>.supabase.co`
  - `SUPABASE_ANON_KEY`：`<你的 Supabase 匿名 Key>`
  - `SUPABASE_SERVICE_ROLE_KEY`：`<你的 Supabase 服务角色 Key>`
  - `JWT_SECRET`：`<长度≥32的随机字符串>`
  - `CORS_ORIGIN`：`https://<frontend-project>.vercel.app`
  - `SILICONFLOW_API_KEY`：`<如需要>`
  - `RATE_LIMIT_WINDOW_MS`：`900000`
  - `RATE_LIMIT_MAX_REQUESTS`：`100`
  - `NODE_ENV`：`production`
  - `LOG_LEVEL`：`info`

前端（Frontend）
- Root Directory：`client`
- Framework Preset：`Vite`（或 `Other`）
- Install Command：`npm install`
- Build Command：`npm run build`
- Output Directory：`dist`
- Environment Variables（Production & Preview）：
  - `VITE_API_URL`：`https://<后端项目>.vercel.app/api`

---

## 成功后的配置收尾
- 将前端项目的实际域名填回后端的 `CORS_ORIGIN`（如首次部署为随机域名）。
- 在 `client/.env.example` 保留示例：`https://your-backend-project.vercel.app/api` 以便团队成员参考。
- 如需强制 Node 版本，可在 `server/package.json` 中添加：

```json
{
  "engines": { "node": ">=18" }
}
```

---

如需我代你在 Vercel 后台创建两个项目并填写环境变量，请提供：
- Supabase 项目的 URL、ANON KEY、SERVICE ROLE KEY
- 希望的前端与后端项目名称（用于生成域名）
- 是否启用硅基流动/其他模型服务（提供对应 API Key）

---

## 故障排查：注册接口返回 500

- 现象：`POST /api/auth/register` 返回 500，前端控制台报 `AxiosError: ERR_BAD_RESPONSE`。
- 常见根因：
  - `SUPABASE_URL` 或 `SUPABASE_SERVICE_ROLE_KEY` 未配置或值错误，导致后端使用安全 Stub 客户端，插入返回空行。
  - 未在 Supabase 中创建 `users` 表（参见 `server/src/scripts/init-db.sql`）。
  - 其他数据库错误导致插入失败。
- 快速自检：
  - 在 Vercel 后端项目中，确认以下环境变量同时配置在 `Production` 和 `Preview`：
    - `SUPABASE_URL`、`SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`、`JWT_SECRET`、`CORS_ORIGIN`。
  - 打开后端日志，搜索 `Supabase insert error` 或 `User creation failed` 关键字。
  - 在 Supabase SQL 编辑器运行 `server/src/scripts/init-db.sql`，确保 `users` 表存在且可写。
- 预期修复：
  - 正确配置环境变量并重新部署后，注册成功返回 201，响应体包含 `user` 与 `token`。
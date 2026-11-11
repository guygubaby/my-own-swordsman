# 同福娱乐镇

《武林外传》腐竹自制的非商业同好站：80 回追剧指南、台词接龙、包饺子 / 做炮仗 / 挖地道三个小游戏、官方周边情报。

线上：https://tongfu.guygubaby.top

## 技术栈

- 前端：React 19 + Vite 8 + Tailwind CSS v4 + TanStack Router + TanStack Query
- 播放器：ArtPlayer 5 + artplayer-plugin-danmuku 5
- 运行时：Cloudflare Workers（Hono）+ Workers Static Assets
- 数据：Drizzle ORM + Cloudflare D1（SQLite）
- 账号：better-auth（邮箱 + 密码，Cookie 会话）
- 工具：Cloudflare Vite 插件 + `cf` CLI

## 播放器与弹幕

- 播放器用 ArtPlayer + 官方弹幕插件，弹幕设置、防重叠、滚动/顶部/底部都是插件能力。
- 默认片源是 `apps/web/public/demo.mp4`（自生成的 30 秒测试画面），用于验证播放器和弹幕。
- 授权片源填到 `apps/web/src/data/video-sources.ts`，按回目覆盖演示片源；没有授权的剧集地址不要放。
- 弹幕存 D1 的 `danmaku` 表；发送需要注册账号，服务端有 2 秒冷却和 40 字上限。
- 观看进度存 D1 的 `watch_progress` 表，注册用户跨设备续看；未登录只播放，不记录进度。
- 站内不内置抓流/盗链；正片入口仍走爱奇艺 / 央视网 / 央视频。
- 注意：Workers Static Assets 不支持 Range，演示视频在客户端整文件 blob 加载以保证可 seek；正式长片源请放到支持 Range 的 R2 / Stream / 外部 CDN。

## 本地运行

1. 安装依赖：`pnpm install`
2. 准备本地 secret：把 `apps/web/.dev.vars.example` 复制为 `apps/web/.dev.vars`，填入 `BETTER_AUTH_SECRET`（用 `openssl rand -hex 32` 生成）
3. 生成迁移（首次或 schema 变更后）：`pnpm db:generate`
4. 应用本地 D1 迁移：`pnpm db:migrate:local`
5. 启动：`pnpm dev`

- 前端与 API 同源：http://localhost:5173
- 健康检查：http://localhost:5173/api/health

本地 D1 状态在 `apps/web/.cloudflare/state`，与 `cf dev` 共用。

## 部署

1. 应用远程 D1 迁移：`pnpm db:migrate:remote`
2. 登录 Cloudflare（已登录可跳过）：`cf auth login`
3. 部署：`pnpm deploy`（会带上 `.dev.vars` 里的 `BETTER_AUTH_SECRET`）

自定义域名：`tongfu.guygubaby.top`（`cloudflare.config.ts` 的 `worker.domains`）。`workers.dev` 按 cf 默认关闭。

D1 数据库：`tongfu-entertainment`，UUID `33c17fba-0b19-4a10-8f6b-2142af118738`。

## 目录

- `apps/web` 前端 + Worker（`worker/` 下是 Hono API、Drizzle schema 和 better-auth）
- `apps/web/drizzle` D1 迁移文件

## 版权

非官方粉丝作品，与版权方无关。站内不托管、不转码、不抓流任何剧集，正片只外链爱奇艺 / 央视网 / 央视频；台词为短引用并注明角色与回目；角色美术、界面和小游戏均为原创。如有侵权，请联系删除。

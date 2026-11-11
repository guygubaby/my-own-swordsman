# 同福弹幕 · 浏览器插件

在央视网《武林外传》播放页叠一层同福娱乐镇的弹幕，并且能直接发弹幕。
**插件只读 `video.currentTime`、只画一块 canvas，不解密、不转存、不代理任何视频流。**

## 它做了什么

| 文件 | 作用 |
|---|---|
| `content-cctv.js` | 注入 `tv.cctv.com` 的播放页，找 `.video-js` 容器，叠 canvas 弹幕层 + 底部输入条 |
| `content-bridge.js` | 注入 `https://tongfu.guygubaby.top`：没连上时用页面登录态静默换令牌（自动续连），也接收配对页 `postMessage` 的令牌 |
| `background.js` | 唯一网络出口：带 `Authorization: Bearer` 调本站 API，令牌不暴露给页面 |
| `popup.html/js` | 连接状态、连接 / 断开按钮 |
| `icons/` | 工具栏图标：已连接绿点、未连接红点 |
| `content.css` | 弹幕层与输入条样式 |

请求链路：

```
content-cctv  ──sendMessage──▶  background  ──fetch(Bearer)──▶  /api/episodes/:n/danmaku
   (页面世界隔离)                  (扩展世界)                    /api/ext/episodes/:n/danmaku
```

放在 background 里发请求的原因：不受页面 CSP / CORS 限制（靠 `host_permissions`），令牌也不会被页面脚本读到。

## 安装（Chrome / Edge）

1. 打开 `chrome://extensions`，右上角开「开发者模式」
2. 「加载已解压的扩展程序」→ 选这个 `apps/extension` 目录
3. 登录同福娱乐镇，然后打开站内任意页面——插件会自己签令牌连上（右下角会提示「已自动连接」）
4. 打开央视网《武林外传》任意一集，鼠标移到播放器上，底部出现输入条，右上角徽标显示昵称

也可以点工具栏的「同福弹幕」图标 → 「连接同福账号」，走 `/connect-extension` 显式配对。
连接一次后令牌长期有效，不需要每次操作；令牌失效时打开本站任意页面会自动补一枚。
换设备 / 重装插件各算一台，最多同时保留 10 枚令牌，互不顶号。

## 配置

- `background.js` / `popup.js` 顶部的 `DEFAULT_API_BASE`：接口地址，默认正式站
- 想在本地调试：把两处改成 `http://localhost:5173`，并临时在 `manifest.json` 的 `host_permissions` 与 `content-bridge` 的 `matches` 里加上 `http://localhost:5173/*`（默认不带本地地址，发布版只认正式域名）
- 也可以在 popup 里通过 `chrome.storage.local` 的 `apiBase` 覆盖（未做 UI 时用 devtools 控制台设置）

## 服务端配套

| 接口 | 鉴权 | 用途 |
|---|---|---|
| `POST /api/extension/token` | cookie 会话 | 签发令牌，明文只返回一次，库里只存 SHA-256 |
| `GET /api/extension/me` | Bearer | popup 自检 + 取昵称 |
| `DELETE /api/extension/token` | Bearer 或 cookie | 断开（Bearer 删这一枚，cookie 删全部） |
| `POST /api/ext/episodes/:n/danmaku` | Bearer | 插件发弹幕，和站内共用 `addDanmaku()` 与 2 秒限流 |

数据表：`extension_token`（`worker/schema.ts`，迁移 `drizzle/0002_*.sql`）。

## 排查

- **页面没出现输入条**：确认地址是 `tv.cctv.com` 且标题含「武林外传」。播放器是懒加载的，插件每秒找一次 `<video>`。
- **徽标显示「未连接 · 点扩展图标」**：先打开同福娱乐镇任意页面，插件会自动补令牌；还不行再点图标 → 连接账号（确认本站已登录）。
- **弹幕不动**：弹幕按 `video.currentTime` 走，视频暂停时本来就静止；自己的弹幕在暂停时也会立刻可见。
- **看渲染状态**：控制台执行
  ```js
  console.log(document.querySelector(".tf-dm-layer")?.dataset)
  // { tfFrames, tfActive, tfQueued }
  ```
  `tfFrames` 不涨说明 rAF 被页面节流；`tfQueued` 有值但 `tfActive` 恒为 0 说明时间轴对不上。
- **改了代码没生效**：`chrome://extensions` 点插件卡片上的刷新，再刷新央视网页面。

## 边界

- 不碰 720P 加密流：高清仍由央视网自己的 DRM 播放器解码，插件只在画面上加一层 UI
- 不采集浏览记录，不发任何非本站请求
- 令牌等价于你的账号身份，泄露等于别人能用你的名字发弹幕；可在 popup 里随时断开

# 片源调研

日期：2026-11-10

## 结论

- **《武林外传》正片没有开源或公开授权片源。** 能免费看的是央视网 / 央视频，商业平台是爱奇艺；它们都不提供公开的嵌入播放器，也不允许把正片抓流、转存或二次分发。
- 想在自己站内播正片，只有三条路：
  1. 向版权方（北京联盟影业）取得信息网络传播权授权；
  2. 拿到官方提供的嵌入播放器 / 合作播放器；
  3. 不播正片，继续深链官方平台。
- 网上常见的「央视网 / 爱奇艺 视频下载、m3u8 提取」教程属于未授权抓流，不建议使用。
- 2026 年是开播二十周年，官方提到将上线高清重置版；关注官方公告，仍不等于可嵌入。

## 《武林外传》官方渠道

| 渠道 | 情况 | 能否站内播放 |
|---|---|---|
| 央视网 tv.cctv.com | 分集页可免费看，部分地区/集数有限制 | 否，无公开 embed |
| 央视频 | 80 集专辑、轮播直播间；部分内容需会员 | 否，无公开 embed |
| 爱奇艺 | 商业长视频平台，VIP 观看 | 否，嵌入需企业合作 |
| B 站 | 无正版授权，搬运视频会被下架 | 否 |

## 可合法站内播放的公共 / 开源片源

这些不是《武林外传》，但可以用来做播放器和弹幕的演示，或做其他公开内容。

### Blender 开源电影（CC BY，需署名）

| 片名 | 许可 | 说明 |
|---|---|---|
| Big Buck Bunny | CC BY 3.0 | Blender Foundation；署名 `(c) copyright 2008, Blender Foundation / www.bigbuckbunny.org` |
| Elephants Dream | CC BY 2.5 | Blender Foundation |
| Sintel | CC BY 3.0 | Blender Foundation |
| Tears of Steel | CC BY 3.0 | Blender Foundation |
| Cosmos Laundromat | CC BY 3.0 | 影片和素材均可下载 |
| Spring / Charge / Glass Half / HERO / SINGULARITY / WING IT! | CC BY | Wikimedia Commons 的 Blender movies 分类可查 |

- 官网：https://studio.blender.org/films/
- Big Buck Bunny：https://peach.blender.org/about/
- Wikimedia Commons：https://commons.wikimedia.org/wiki/Category:Blender_movies

### 公共领域电影（需按司法辖区核实）

- Internet Archive「Top 100 Verified Public Domain Movies」：https://archive.org/details/top-100-verified-public-domain-movies-final-v-2
- Prelinger Archives（CC Public Domain）：https://archive.org/details/prelinger
- 常见片目：Night of the Living Dead、His Girl Friday、The General、Plan 9 from Outer Space、Nosferatu、Carnival of Souls。
- 注意：公共领域状态按国家/地区不同；商用前要按目标地区核实。

### 免费素材站（短片/空镜，不是完整电影）

| 站点 | 许可要点 |
|---|---|
| Pexels | Pexels License；可商用、免署名；不能转售原素材或做商标 |
| Pixabay | Pixabay Content License；可商用、免署名；不能转售原素材 |
| Mixkit | 分「免费商用」和「Restricted 非商业」两种，逐条看下载页 |
| Coverr | 可商用、免署名；以站点 License 页为准 |

这些站点适合做片头、空镜、背景视频；不适合拿来当完整剧集。

### HLS / MP4 测试流（只用于开发测试）

- Mux Big Buck Bunny HLS：`https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`
- Apple BipBop：`https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8`
- 这些是第三方公共测试源，不保证可用性，不要用于正式产品。

## 技术限制：Range 请求

- 站内自托管的 MP4，如果服务器不支持 HTTP Range，浏览器进度条无法正常 seek，会跳回 0。
- 已实测：Cloudflare Workers Static Assets 的 `/demo.mp4` 返回 200 整文件，不支持 Range；本地 Vite 返回 206。
- 演示视频目前用客户端整文件 blob 加载来保证可 seek；只适合小文件。
- 正式长片源必须使用支持 Range 的存储/CDN：
  - Cloudflare R2 + Worker 流式响应（推荐，可自建 Range 逻辑）；
  - Cloudflare Stream（托管转码/播放，付费）；
  - 其他支持 Range 的对象存储/CDN。
- 不要对几百 MB 的剧集做整文件 blob 加载。

## 建议

1. 演示片源换成 Blender 开源短片（如 Big Buck Bunny 的短切片），保留署名。
2. 正片继续深链央视网 / 央视频 / 爱奇艺。
3. 如果拿到授权片源，再按上面的 Range 要求接入播放器。

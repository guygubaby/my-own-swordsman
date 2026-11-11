// 央视网《武林外传》弹幕层：只画弹幕、只发弹幕，不碰视频流。
// 网络请求全部交给 background.js（那里有 Bearer 令牌 + host_permissions）。
;(() => {
  // 央视的剧集页是懒加载 / 站内跳转，标题和播放器都可能晚到，
  // 所以不在启动时一次性判定，交给下面的 supervise 每秒补一次。
  function hrefText() {
    try {
      return decodeURIComponent(location.href)
    } catch {
      return location.href
    }
  }

  function showOnPage() {
    return /武林外传/.test(document.title) || /武林外传/.test(hrefText())
  }

  function readEpisode() {
    return (
      Number((document.title.match(/第\s*(\d+)\s*集/) || [])[1]) ||
      Number((hrefText().match(/第\s*(\d+)\s*集/) || [])[1]) ||
      0
    )
  }

  const FONT = 20
  const LANE_HEIGHT = FONT + 10
  const SCROLL_SECONDS = 9 // 一条弹幕横穿屏幕的时长
  const FIXED_SECONDS = 4

  const state = {
    episode: 0,
    queue: [],
    active: [],
    cursor: 0,
    lastTime: 0,
    show: true,
    connected: false,
    nickname: "",
    video: null,
    container: null,
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
  }

  /* ---------------- 播放器定位 ---------------- */

  function pickVideo() {
    return (
      [...document.querySelectorAll("video")]
        .filter((video) => video.clientWidth > 240 && video.clientHeight > 120)
        .sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight)[0] ??
      null
    )
  }

  function pickContainer(video) {
    return video.closest(".video-js") ?? video.parentElement ?? null
  }

  /* ---------------- 弹幕数据 ---------------- */

  function normalize(item) {
    return {
      id: String(item.id),
      timeMs: Number(item.timeMs) || 0,
      text: String(item.text ?? ""),
      color: /^#[0-9a-fA-F]{6}$/.test(item.color ?? "") ? item.color : "#fff8ec",
      mode: item.mode === "top" || item.mode === "bottom" ? item.mode : "scroll",
      // 发送时已经手动上屏，队列循环不要再放一次。
      spawned: false,
    }
  }

  function merge(list) {
    const known = new Set(state.queue.map((item) => item.id))
    let added = 0
    for (const raw of list) {
      const item = normalize(raw)
      if (known.has(item.id)) continue
      state.queue.push(item)
      known.add(item.id)
      added += 1
    }
    if (added) {
      state.queue.sort((a, b) => a.timeMs - b.timeMs)
      // 只把游标挪到当前时间之后，已经上屏的弹幕不动，避免整屏闪一下。
      const t = state.video?.currentTime ?? 0
      state.cursor = 0
      while (state.cursor < state.queue.length && state.queue[state.cursor].timeMs / 1000 < t) {
        state.cursor += 1
      }
    }
    return added
  }

  async function loadDanmaku() {
    const episode = state.episode
    if (!episode) return
    try {
      const result = await chrome.runtime.sendMessage({ type: "danmaku:list", episode })
      if (result?.danmaku) merge(result.danmaku)
    } catch {
      /* 扩展被重载后 chrome.runtime 会失效，忽略 */
    }
  }

  async function refreshAuth() {
    try {
      const result = await chrome.runtime.sendMessage({ type: "auth:status" })
      state.connected = Boolean(result?.connected)
      state.nickname = result?.user?.name ?? ""
    } catch {
      state.connected = false
    }
    paintStatus()
  }

  /* ---------------- 画面 ---------------- */

  function reset(t) {
    state.active = []
    state.cursor = 0
    while (state.cursor < state.queue.length && state.queue[state.cursor].timeMs / 1000 < t) {
      state.cursor += 1
    }
  }

  function pickLane() {
    const lanes = Math.max(1, Math.floor(state.height / LANE_HEIGHT))
    for (let lane = 0; lane < lanes; lane += 1) {
      const busy = state.active.some(
        (item) => item.lane === lane && item.mode === "scroll" && item.x + item.width > state.width - 40,
      )
      if (!busy) return lane
    }
    return Math.floor(Math.random() * lanes)
  }

  function spawn(item, t) {
    const ctx = state.ctx
    if (!ctx) return
    ctx.font = `bold ${FONT}px -apple-system, "PingFang SC", sans-serif`
    const width = ctx.measureText(item.text).width
    state.active.push({
      id: item.id,
      text: item.text,
      color: item.color,
      mode: item.mode,
      width,
      t0: t,
      lane: pickLane(),
      x: state.width,
    })
  }

  function draw(t) {
    const { ctx, canvas } = state
    if (!ctx || !canvas) return
    ctx.clearRect(0, 0, state.width, state.height)
    if (!state.show) {
      state.active = []
      return
    }

    const speed = (state.width + 160) / SCROLL_SECONDS

    for (let index = state.active.length - 1; index >= 0; index -= 1) {
      const item = state.active[index]
      const age = t - item.t0

      if (item.mode === "scroll") {
        item.x = state.width - speed * age
        if (item.x + item.width < -40) state.active.splice(index, 1)
      } else if (age > FIXED_SECONDS) {
        state.active.splice(index, 1)
      }
    }

    ctx.font = `bold ${FONT}px -apple-system, "PingFang SC", sans-serif`
    ctx.textBaseline = "top"
    for (const item of state.active) {
      const y =
        item.mode === "bottom"
          ? state.height - LANE_HEIGHT * (item.lane + 1.5)
          : LANE_HEIGHT * item.lane + 8
      const x =
        item.mode === "scroll" ? item.x : Math.max(8, (state.width - item.width) / 2)

      ctx.fillStyle = "rgba(0,0,0,.55)"
      ctx.fillText(item.text, x + 1.5, y + 1.5)
      ctx.fillStyle = item.color
      ctx.fillText(item.text, x, y)
    }
  }

  let frames = 0

  function tick() {
    try {
      frame()
    } catch (error) {
      // 单帧异常不能打断循环
      if (frames % 120 === 0) console.warn("[同福弹幕]", error)
    }
    frames += 1
    if (state.canvas && frames % 30 === 0) {
      state.canvas.dataset.tfFrames = String(frames)
      state.canvas.dataset.tfActive = String(state.active.length)
      state.canvas.dataset.tfQueued = String(state.queue.length)
    }
    requestAnimationFrame(tick)
  }

  function frame() {
    if (!state.video || !state.ctx) return

    const t = state.video.currentTime
    if (Math.abs(t - state.lastTime) > 1.5) reset(t)
    state.lastTime = t

    while (state.cursor < state.queue.length && state.queue[state.cursor].timeMs / 1000 <= t) {
      const item = state.queue[state.cursor]
      state.cursor += 1
      if (item.spawned) continue
      if (t - item.timeMs / 1000 < 2) spawn(item, t)
    }

    draw(t)
  }

  /* ---------------- 站内进度接力 ---------------- */

  let resumeAppliedFor = 0
  let resumeChecking = false

  function formatTime(seconds) {
    const s = Math.max(0, Math.floor(seconds))
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
  }

  /** 站内看到哪儿，央视这边接着播；只对刚打开、还没看的视频生效。 */
  async function applySiteProgress() {
    const episode = state.episode
    const video = state.video
    if (!episode || !video || resumeAppliedFor === episode || resumeChecking) return

    resumeChecking = true
    try {
      const key = `progress:${episode}`
      const stored = (await chrome.storage.local.get(key))[key]
      resumeAppliedFor = episode
      if (!stored || !Number.isFinite(stored.time) || stored.time < 5) return
      if (stored.duration > 0 && stored.duration - stored.time <= 10) return

      const seek = () => {
        if (video.currentTime > 10) return
        video.currentTime = stored.time
        showTip(`已跳到上次看到 ${formatTime(stored.time)}`)
      }
      if (video.readyState >= 1) seek()
      else video.addEventListener("loadedmetadata", seek, { once: true })
    } catch {
      resumeAppliedFor = episode
    } finally {
      resumeChecking = false
    }
  }

  /* ---------------- UI ---------------- */

  let input = null
  let statusEl = null
  let tipEl = null

  function paintStatus() {
    if (!statusEl) return
    statusEl.textContent = state.connected
      ? state.nickname
        ? `同福 · ${state.nickname}`
        : "同福 · 已连接"
      : "未连接 · 点扩展图标"
  }

  function showTip(text) {
    if (!tipEl) return
    tipEl.textContent = text
    tipEl.classList.add("tf-dm-show")
    window.clearTimeout(showTip.timer)
    showTip.timer = window.setTimeout(() => tipEl.classList.remove("tf-dm-show"), 2600)
  }

  async function send() {
    const text = (input?.value ?? "").trim()
    if (!text) return
    if (!state.connected) {
      showTip("打开同福娱乐镇任意页面会自动连接；也可点工具栏的「同福弹幕」图标。")
      return
    }
    if (text.length > 40) {
      showTip("最多 40 个字。")
      return
    }
    if (!state.episode) {
      showTip("还没识别到集数，等播放器加载好再发。")
      return
    }

    const timeMs = Math.round((state.video?.currentTime ?? 0) * 1000)
    const tempId = `local-${Date.now()}-${Math.random().toString(16).slice(2)}`
    const optimistic = {
      id: tempId,
      timeMs,
      text,
      color: "#ffd166",
      mode: "scroll",
      spawned: true,
    }

    // 先上屏再发请求：网慢也不耽误看见自己的弹幕。
    state.queue.push(optimistic)
    state.queue.sort((a, b) => a.timeMs - b.timeMs)
    if (state.show) {
      const now = state.video?.currentTime ?? 0
      // 暂停时如果按原时间生成，弹幕会停在屏幕右侧外面看不见，往回挪一点。
      spawn(optimistic, state.video?.paused === false ? now : Math.max(0, now - 1.2))
    }
    if (input) input.value = ""
    showTip("发送中……")

    let result = null
    try {
      result = await chrome.runtime.sendMessage({
        type: "danmaku:send",
        episode: state.episode,
        timeMs,
        text,
        color: "#ffd166",
        mode: "scroll",
      })
    } catch {
      state.queue = state.queue.filter((item) => item.id !== tempId)
      state.active = state.active.filter((item) => item.id !== tempId)
      if (input && !input.value) input.value = text
      showTip("插件连接断了，刷新央视网页面再试。")
      return
    }

    if (result?.danmaku) {
      const item = normalize(result.danmaku)
      item.spawned = true
      state.queue = state.queue.filter((existing) => existing.id !== tempId)
      if (!state.queue.some((existing) => existing.id === item.id)) {
        state.queue.push(item)
        state.queue.sort((a, b) => a.timeMs - b.timeMs)
      }
      showTip("发出去了。")
    } else {
      state.queue = state.queue.filter((item) => item.id !== tempId)
      state.active = state.active.filter((item) => item.id !== tempId)
      if (input && !input.value) input.value = text
      if (result?.unauthorized) state.connected = false
      showTip(result?.error ?? "发送失败。")
      paintStatus()
    }
  }

  function mount(video) {
    if (!video) return false
    const container = pickContainer(video)
    if (!container) return false
    if (state.canvas && state.canvas === container.querySelector(".tf-dm-layer")) return true

    // 站点重渲染后旧的一层可能还留在页面里，先清干净再挂，避免叠两层。
    for (const node of container.querySelectorAll(".tf-dm-layer, .tf-dm-bar, .tf-dm-tip")) {
      node.remove()
    }
    if (state.container && state.container !== container) {
      for (const node of state.container.querySelectorAll(".tf-dm-layer, .tf-dm-bar, .tf-dm-tip")) {
        node.remove()
      }
    }

    if (getComputedStyle(container).position === "static") {
      container.style.position = "relative"
    }

    const canvas = document.createElement("canvas")
    canvas.className = "tf-dm-layer"
    container.appendChild(canvas)

    const layer = document.createElement("div")
    layer.className = "tf-dm-bar"
    layer.innerHTML = `
      <span class="tf-dm-badge">同福弹幕</span>
      <input class="tf-dm-input" maxlength="40" placeholder="说点啥，回车发送（不剧透）" />
      <button class="tf-dm-btn" type="button">发送</button>
      <span class="tf-dm-note" data-status></span>
    `
    container.appendChild(layer)

    const tip = document.createElement("div")
    tip.className = "tf-dm-tip"
    container.appendChild(tip)

    state.container = container
    state.canvas = canvas
    state.ctx = canvas.getContext("2d")
    input = layer.querySelector(".tf-dm-input")
    statusEl = layer.querySelector("[data-status]")
    tipEl = tip

    layer.querySelector(".tf-dm-btn").addEventListener("click", () => void send())
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault()
        void send()
      }
      event.stopPropagation()
    })

    container.addEventListener("mouseenter", () => layer.classList.add("tf-dm-show"))
    container.addEventListener("mouseleave", () => {
      if (document.activeElement !== input) layer.classList.remove("tf-dm-show")
    })
    input.addEventListener("blur", () => layer.classList.remove("tf-dm-show"))

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = container.clientWidth
      const height = container.clientHeight
      if (!width || !height) return
      state.width = width
      state.height = height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      state.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      state.ctx.textBaseline = "top"
      state.active = []
    }
    new ResizeObserver(resize).observe(container)
    resize()

    paintStatus()
    void refreshAuth()
    return true
  }

  /* ---------------- 启动 ---------------- */

  function resetForEpisode(episode) {
    state.episode = episode
    state.queue = []
    state.active = []
    state.cursor = 0
    state.lastTime = 0
  }

  /** 每秒巡检：标题/集数晚到、播放器懒加载、站点重渲染容器，都在这里兜住。 */
  function supervise() {
    if (!showOnPage()) return

    const episode = readEpisode()
    if (!episode) return
    const changed = episode !== state.episode
    if (changed) resetForEpisode(episode)

    const video = pickVideo()
    if (!video) return
    const container = pickContainer(video)
    const needMount =
      video !== state.video ||
      !state.canvas ||
      !state.canvas.isConnected ||
      state.canvas.parentElement !== container

    let mounted = false
    if (needMount) {
      state.video = video
      mounted = mount(video)
    }
    if (changed || mounted) void loadDanmaku()
    if (state.video && state.canvas) void applySiteProgress()
  }

  supervise()
  requestAnimationFrame(tick)
  window.setInterval(supervise, 1000)
  window.setInterval(() => void loadDanmaku(), 20000)
  window.setInterval(() => void refreshAuth(), 60000)
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) supervise()
  })
})()

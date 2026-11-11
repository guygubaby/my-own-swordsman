// 站点侧桥接：整站驻守。
// 1. 插件没连上、用户又登录着本站时，用页面自己的 cookie 静默签一枚令牌，自动连上。
// 2. /connect-extension 页面签好令牌后也会 postMessage 过来，同样转交后台保存。
;(() => {
  const origin = window.location.origin
  let lastToken = ""
  let busy = false

  function toast(text) {
    const node = document.createElement("div")
    node.textContent = text
    node.style.cssText = [
      "position:fixed",
      "right:20px",
      "bottom:20px",
      "z-index:2147483647",
      "padding:10px 14px",
      "border-radius:10px",
      "background:#17110b",
      "color:#f4e7d3",
      "font-size:13px",
      "box-shadow:0 10px 30px rgba(0,0,0,.35)",
    ].join(";")
    document.body.appendChild(node)
    setTimeout(() => node.remove(), 5000)
  }

  async function save(token, notice = true) {
    if (busy || token === lastToken) return null
    busy = true
    lastToken = token
    try {
      const result = await chrome.runtime.sendMessage({ type: "auth:token", token })
      if (notice) {
        toast(
          result?.connected
            ? `同福弹幕插件已连接${result.user?.name ? `：${result.user.name}` : ""}`
            : `同福弹幕插件：${result?.error ?? "连接失败"}`,
        )
      }
      return result
    } catch {
      lastToken = ""
      if (notice) toast("同福弹幕插件：连接失败（扩展可能刚被重载，刷新本页再试）")
      return null
    } finally {
      busy = false
    }
  }

  /** 静默续连：只在没连上时试，一分钟最多一次；手动断开过的用户不再打扰。 */
  async function autoPair(force = false) {
    if (location.pathname.startsWith("/connect-extension")) return

    let status = null
    try {
      status = await chrome.runtime.sendMessage({ type: "auth:status" })
    } catch {
      return
    }
    if (status?.connected) return

    const { noAutoPair, autoPairAt } = await chrome.storage.local.get([
      "noAutoPair",
      "autoPairAt",
    ])
    if (noAutoPair) return
    if (!force && Date.now() - Number(autoPairAt || 0) < 60_000) return
    await chrome.storage.local.set({ autoPairAt: Date.now() })

    try {
      const response = await fetch("/api/extension/token", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
      })
      if (!response.ok) return // 没登录：等用户登录后再来
      const data = await response.json()
      if (typeof data?.token !== "string") return
      const result = await save(data.token, false)
      if (result?.connected) {
        toast(
          `同福弹幕已自动连接${result.user?.name ? `：${result.user.name}` : ""}，以后不用手动点了`,
        )
      }
    } catch {
      /* 网络抖动：下次进站再试 */
    }
  }

  // 页面可能比内容脚本先跑完（或反过来），所以这里多喊几次「我准备好了」。
  for (const delay of [0, 400, 1200]) {
    setTimeout(() => window.postMessage({ type: "tongfu-extension:ready" }, origin), delay)
  }

  window.addEventListener("message", (event) => {
    if (event.origin !== origin) return
    const data = event.data
    if (!data) return
    if (data.type === "tongfu-extension:token" && typeof data.token === "string") {
      void save(data.token)
      return
    }
    // 刚登录成功：立刻补一枚，不用等下一次进站。
    if (data.type === "tongfu-extension:pair") void autoPair(true)
    // 站内播放进度：存本地，央视网同一集打开时接着播。
    if (data.type === "tongfu-extension:progress") {
      const episode = Number(data.episode)
      const time = Number(data.time)
      const duration = Number(data.duration)
      if (!Number.isInteger(episode) || episode < 1 || !Number.isFinite(time) || time < 5) return
      void chrome.storage.local.set({
        [`progress:${episode}`]: {
          time,
          duration: Number.isFinite(duration) ? duration : 0,
          updatedAt: Date.now(),
        },
      })
    }
  })

  void autoPair()
})()

// 站点侧桥接：/connect-extension 页面签好令牌后 postMessage 过来，转交后台保存。
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

  async function save(token) {
    if (busy || token === lastToken) return
    busy = true
    lastToken = token
    try {
      const result = await chrome.runtime.sendMessage({ type: "auth:token", token })
      toast(
        result?.connected
          ? `同福弹幕插件已连接${result.user?.name ? `：${result.user.name}` : ""}`
          : `同福弹幕插件：${result?.error ?? "连接失败"}`,
      )
    } catch {
      toast("同福弹幕插件：连接失败（扩展可能刚被重载，刷新本页再试）")
    } finally {
      busy = false
    }
  }

  // 页面可能比内容脚本先跑完（或反过来），所以这里多喊几次「我准备好了」。
  for (const delay of [0, 400, 1200]) {
    setTimeout(() => window.postMessage({ type: "tongfu-extension:ready" }, origin), delay)
  }

  window.addEventListener("message", (event) => {
    if (event.origin !== origin) return
    const data = event.data
    if (!data || data.type !== "tongfu-extension:token" || typeof data.token !== "string") return
    void save(data.token)
  })
})()

// 后台：唯一的出口。所有跨站请求都在这里发，内容脚本只负责画面和交互。
// 好处：不受页面 CSP / CORS 限制（靠 host_permissions），令牌也不会暴露给页面。

const DEFAULT_API_BASE = "https://tongfu.guygubaby.top"

async function apiBase() {
  const { apiBase } = await chrome.storage.local.get("apiBase")
  return (apiBase || DEFAULT_API_BASE).replace(/\/+$/, "")
}

async function getToken() {
  const { token } = await chrome.storage.local.get("token")
  return typeof token === "string" ? token : ""
}

async function call(path, init = {}) {
  const base = await apiBase()
  const token = await getToken()
  const headers = { ...(init.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${base}/api/${path}`, {
    ...init,
    headers,
    signal: AbortSignal.timeout(10_000),
  })
  const text = await response.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }
  return { ok: response.ok, status: response.status, data }
}

async function authStatus() {
  const token = await getToken()
  if (!token) return { connected: false }
  try {
    const { ok, status, data } = await call("extension/me")
    if (ok) return { connected: true, user: data?.user ?? null }
    if (status === 401) return { connected: false, expired: true }
    return { connected: false, offline: true }
  } catch {
    // 网络问题：令牌先留着，别把用户踢下线
    return { connected: false, offline: true }
  }
}

const handlers = {
  async "auth:status"() {
    return authStatus()
  },

  async "auth:token"(message) {
    const token = String(message.token || "").trim()
    if (!token) return { error: "令牌是空的。" }
    await chrome.storage.local.set({ token })
    const status = await authStatus()
    if (status.connected) return status
    if (status.offline) return { ...status, error: "连不上服务器，令牌先存着了。" }
    await chrome.storage.local.remove("token")
    return { error: "令牌无效或已失效。" }
  },

  async "auth:clear"() {
    await call("extension/token", { method: "DELETE" })
    await chrome.storage.local.remove("token")
    return { connected: false }
  },

  async "danmaku:list"(message) {
    const episode = Number(message.episode)
    if (!Number.isInteger(episode)) return { error: "回目不对。" }
    const { ok, data } = await call(`episodes/${episode}/danmaku`)
    if (!ok) return { error: "弹幕加载失败。" }
    return { danmaku: data?.danmaku ?? [] }
  },

  async "danmaku:send"(message) {
    const { ok, status, data } = await call(
      `ext/episodes/${Number(message.episode)}/danmaku`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeMs: message.timeMs,
          text: message.text,
          color: message.color,
          mode: message.mode,
        }),
      },
    )
    if (ok) return { danmaku: data?.danmaku ?? null }
    return {
      error: data?.error?.message ?? "发送失败。",
      unauthorized: status === 401,
    }
  },
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const handler = handlers[message?.type]
  if (!handler) return false
  Promise.resolve(handler(message))
    .then(sendResponse)
    .catch((error) => sendResponse({ error: String(error?.message ?? error) }))
  return true
})

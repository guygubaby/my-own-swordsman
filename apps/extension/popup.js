const DEFAULT_API_BASE = "https://tongfu.guygubaby.top"

const els = {
  ver: document.getElementById("ver"),
  dot: document.getElementById("dot"),
  title: document.getElementById("status-title"),
  sub: document.getElementById("status-sub"),
  identity: document.getElementById("identity"),
  avatar: document.getElementById("avatar"),
  nickname: document.getElementById("nickname"),
  connect: document.getElementById("connect"),
  disconnect: document.getElementById("disconnect"),
  openSite: document.getElementById("open-site"),
  token: document.getElementById("token"),
  save: document.getElementById("save"),
  manual: document.querySelector(".manual"),
  error: document.getElementById("error"),
  endpoint: document.getElementById("endpoint"),
}

let status = null

async function apiBase() {
  const { apiBase } = await chrome.storage.local.get("apiBase")
  return (apiBase || DEFAULT_API_BASE).replace(/\/+$/, "")
}

function setStatus(title, sub, tone = "") {
  els.title.textContent = title
  els.sub.textContent = sub
  els.dot.className = `dot${tone ? ` ${tone}` : ""}`
}

function setError(text) {
  els.error.textContent = text ?? ""
  els.error.classList.toggle("hidden", !text)
}

async function render() {
  try {
    status = await chrome.runtime.sendMessage({ type: "auth:status" })
  } catch {
    status = null
    setStatus("扩展后台没响应", "关掉弹窗重开，或到 chrome://extensions 刷新插件", "warn")
    els.identity.classList.add("hidden")
    els.disconnect.classList.add("hidden")
    els.connect.classList.remove("hidden")
    els.connect.textContent = "重试"
    return
  }

  const base = await apiBase()
  els.openSite.href = base
  els.endpoint.textContent = base.replace(/^https?:\/\//, "")

  if (status?.connected) {
    const name = status.user?.name || "腐竹"
    setStatus("已连接", "发弹幕、看弹幕都不用再操作", "on")
    els.identity.classList.remove("hidden")
    els.avatar.textContent = name.slice(0, 1)
    els.nickname.textContent = name
    els.connect.classList.add("hidden")
    els.disconnect.classList.remove("hidden")
  } else {
    els.identity.classList.add("hidden")
    els.disconnect.classList.add("hidden")
    els.connect.classList.remove("hidden")
    if (status?.expired) {
      setStatus("连接已失效", "打开同福娱乐镇任意页面会自动重连", "warn")
      els.connect.textContent = "重新连接"
    } else if (status?.offline) {
      setStatus("连不上服务器", "网络恢复后自动重试，令牌还留着", "warn")
      els.connect.textContent = "重试"
    } else {
      setStatus("还没连接", "登录同福娱乐镇后会自动连上")
      els.connect.textContent = "连接同福账号"
    }
  }
}

els.ver.textContent = `v${chrome.runtime.getManifest().version}`

els.connect.addEventListener("click", async () => {
  // offline 时先重试一次探测，别急着开新页。
  if (status?.offline) {
    await render()
    return
  }
  const base = await apiBase()
  await chrome.runtime.sendMessage({ type: "auth:allowAuto" })
  await chrome.tabs.create({ url: `${base}/connect-extension` })
  window.close()
})

els.disconnect.addEventListener("click", async () => {
  if (!window.confirm("断开后，下次打开同福娱乐镇需要重新连接。确定断开？")) return
  await chrome.runtime.sendMessage({ type: "auth:clear" })
  await render()
})

els.save.addEventListener("click", async () => {
  const token = els.token.value.trim()
  if (!token) {
    els.token.focus()
    return
  }
  setError(null)
  const result = await chrome.runtime.sendMessage({ type: "auth:token", token })
  if (result?.connected) {
    els.token.value = ""
    els.manual.open = false
    await render()
  } else {
    setError(result?.error ?? "保存失败，再试一次。")
  }
})

els.token.addEventListener("keydown", (event) => {
  if (event.key === "Enter") els.save.click()
})

void render()

const DEFAULT_API_BASE = "https://tongfu.guygubaby.top"

const stateEl = document.getElementById("state")
const connectBtn = document.getElementById("connect")
const disconnectBtn = document.getElementById("disconnect")
const tokenInput = document.getElementById("token")
const saveBtn = document.getElementById("save")
const hintEl = document.getElementById("hint")

async function apiBase() {
  const { apiBase } = await chrome.storage.local.get("apiBase")
  return (apiBase || DEFAULT_API_BASE).replace(/\/+$/, "")
}

async function render() {
  let status = null
  try {
    status = await chrome.runtime.sendMessage({ type: "auth:status" })
  } catch {
    stateEl.textContent = "连不上扩展后台，重开一下插件"
    return
  }
  const base = await apiBase()

  if (status?.connected) {
    stateEl.textContent = `已连接${status.user?.name ? `：${status.user.name}` : ""}`
    connectBtn.classList.add("hidden")
    disconnectBtn.classList.remove("hidden")
  } else {
    stateEl.textContent = status?.expired
      ? "令牌已失效，请重新连接"
      : status?.offline
        ? "连不上服务器（令牌还在）"
        : "未连接"
    connectBtn.classList.remove("hidden")
    disconnectBtn.classList.add("hidden")
  }
  hintEl.textContent = `接口：${base}`
}

connectBtn.addEventListener("click", async () => {
  const base = await apiBase()
  await chrome.tabs.create({ url: `${base}/connect-extension` })
  window.close()
})

disconnectBtn.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "auth:clear" })
  await render()
})

saveBtn.addEventListener("click", async () => {
  const token = tokenInput.value.trim()
  if (!token) return
  const result = await chrome.runtime.sendMessage({ type: "auth:token", token })
  if (result?.connected) {
    tokenInput.value = ""
    await render()
  } else {
    stateEl.textContent = result?.error ?? "保存失败"
  }
})

void render()

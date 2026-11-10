export type DanmakuMode = "scroll" | "top" | "bottom"

export type Danmaku = {
  id: string
  episode: number
  timeMs: number
  text: string
  color: string
  mode: DanmakuMode
  createdAt: string
}

export const DANMAKU_COLORS = [
  { value: "#fff8ec", label: "月白" },
  { value: "#f0c96a", label: "金" },
  { value: "#ff8a7a", label: "朱砂" },
  { value: "#8fd3b6", label: "青" },
  { value: "#9ecbff", label: "天青" },
  { value: "#e7a6ff", label: "藕荷" },
  { value: "#ffffff", label: "白" },
] as const

export const DANMAKU_MODES = [
  { value: "scroll", label: "滚动" },
  { value: "top", label: "顶部" },
  { value: "bottom", label: "底部" },
] as const

export const QUICK_PHRASES = [
  "前方高能",
  "名场面",
  "哈哈哈",
  "泪目",
  "掌柜的说得对",
  "额滴神啊",
]

export function formatTime(seconds: number) {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0
  const minutes = Math.floor(safe / 60)
  const rest = Math.floor(safe % 60)
  return `${minutes}:${String(rest).padStart(2, "0")}`
}

import { api } from "@/lib/api"
import { episodeByNumber } from "@/data/episodes"
import { sendProgressToExtension } from "@/lib/extension-bridge"

export type WatchProgress = {
  episode: number
  time: number
  duration: number
  updatedAt: number
}

type ServerProgress = {
  episode: number
  timeMs: number
  durationMs: number
  updatedAt: number
}

const KEY = "tongfu:watch-progress"
const MIN_SECONDS = 5
const END_GAP = 10

function readAll(): Record<string, WatchProgress> {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, WatchProgress>
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

function writeAll(all: Record<string, WatchProgress>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // 隐私模式下写入失败就算了，不打断播放。
  }
}

function isResumable(item: WatchProgress) {
  if (!Number.isFinite(item.time) || item.time < MIN_SECONDS) return false
  // 片尾 10 秒内当作看完了，不再提示续播。
  return !(item.duration > 0 && item.duration - item.time <= END_GAP)
}

/** 每个回目只保留一个待上传值，网络慢时也不会堆请求。 */
const pending = new Map<number, WatchProgress>()
const inFlight = new Set<number>()

async function pushProgress(item: WatchProgress) {
  pending.set(item.episode, item)
  if (inFlight.has(item.episode)) return
  inFlight.add(item.episode)
  try {
    while (pending.has(item.episode)) {
      const next = pending.get(item.episode)
      pending.delete(item.episode)
      if (!next) continue
      await api
        .put(`me/progress/${item.episode}`, {
          json: {
            timeMs: Math.round(next.time * 1000),
            durationMs: Math.round(next.duration * 1000),
          },
        })
        .catch(() => null)
    }
  } finally {
    inFlight.delete(item.episode)
  }
}

export function getProgress(episode: number) {
  const item = readAll()[String(episode)]
  return item && isResumable(item) ? item : null
}

/** 本地先写，服务端异步覆盖；失败就等下一次心跳。 */
export function saveProgress(item: WatchProgress) {
  if (!Number.isFinite(item.time) || item.time < MIN_SECONDS) return
  if (item.duration > 0 && item.duration - item.time <= END_GAP) {
    clearProgress(item.episode)
    return
  }
  const all = readAll()
  all[String(item.episode)] = item
  writeAll(all)
  sendProgressToExtension(item.episode, item.time, item.duration)
  void pushProgress(item)
}

export function clearProgress(episode: number) {
  const all = readAll()
  delete all[String(episode)]
  writeAll(all)
  void api.delete(`me/progress/${episode}`).catch(() => null)
}

/** 退出登录时清掉本地缓存，避免下一个人看到上一个人的进度。 */
export function clearAllProgress() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // 忽略。
  }
}

/** 登录后调用：服务端为准合并本地，本地更新的回目再补传上去。 */
export async function syncProgress() {
  const result = await api
    .get("me/progress")
    .json<{ progress: ServerProgress[] }>()
    .catch(() => null)
  if (!result) return

  const local = readAll()
  const merged: Record<string, WatchProgress> = { ...local }
  const serverByEpisode = new Map(result.progress.map((item) => [item.episode, item]))

  for (const item of result.progress) {
    const remote: WatchProgress = {
      episode: item.episode,
      time: item.timeMs / 1000,
      duration: item.durationMs / 1000,
      updatedAt: item.updatedAt,
    }
    if (!isResumable(remote)) continue
    const existing = merged[String(item.episode)]
    if (!existing || existing.updatedAt < remote.updatedAt) {
      merged[String(item.episode)] = remote
    }
  }

  for (const item of Object.values(merged)) {
    const server = serverByEpisode.get(item.episode)
    if (!server || item.updatedAt > server.updatedAt) void pushProgress(item)
    sendProgressToExtension(item.episode, item.time, item.duration)
  }

  writeAll(merged)
}

export function lastWatched() {
  const latest = Object.values(readAll())
    .filter(isResumable)
    .sort((a, b) => b.updatedAt - a.updatedAt)[0]
  if (!latest) return null
  const episode = episodeByNumber.get(latest.episode)
  if (!episode) return null
  return { ...latest, title: episode.title }
}

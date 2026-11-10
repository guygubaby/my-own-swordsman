import { episodeByNumber } from "@/data/episodes"

export type WatchProgress = {
  episode: number
  time: number
  duration: number
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

function isResumable(item: WatchProgress) {
  if (!Number.isFinite(item.time) || item.time < MIN_SECONDS) return false
  // 片尾 10 秒内当作看完了，不再提示续播。
  return !(item.duration > 0 && item.duration - item.time <= END_GAP)
}

export function getProgress(episode: number) {
  const item = readAll()[String(episode)]
  return item && isResumable(item) ? item : null
}

export function saveProgress(item: WatchProgress) {
  if (!Number.isFinite(item.time) || item.time < MIN_SECONDS) return
  if (item.duration > 0 && item.duration - item.time <= END_GAP) {
    clearProgress(item.episode)
    return
  }
  try {
    const all = readAll()
    all[String(item.episode)] = item
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // 隐私模式下写入失败就算了，不打断播放。
  }
}

export function clearProgress(episode: number) {
  try {
    const all = readAll()
    delete all[String(episode)]
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // 同上。
  }
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

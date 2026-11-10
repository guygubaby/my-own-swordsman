export const demoVideoSource = "/demo.mp4"

// 只填你有权在站内播放的片源（官方授权直链、官方 embed 或你自己的文件）。
// 没有授权的剧集地址不要放进来。填好后按回目覆盖演示片源。
const licensedSources: Record<number, string> = {}

export function videoSourceFor(episode: number) {
  return licensedSources[episode] ?? demoVideoSource
}

export function isDemoSource(src: string) {
  return src === demoVideoSource
}

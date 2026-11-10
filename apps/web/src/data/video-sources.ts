import { episodeLinks } from "./episodes"
import { cctvEpisode } from "./cctv-episodes"
import { cctvLines, cctvStreamUrl } from "@/lib/cctv"

export const demoVideoSource = "/demo.mp4"

// 站内可播放的片源：只放你有权在站内播放的地址
// （官方授权直链、官方 embed、或你自己的文件）。没有授权的地址不要填。
const licensedSources: Record<
  number,
  { src: string; label: string; note?: string }
> = {}

export type PlayableSource = {
  id: string
  kind: "playable"
  label: string
  note: string
  src: string
  /** 演示片源标记，用于播放器提示 */
  demo?: boolean
  /** 高清（官方页）入口，站内播不了高清，只能跳转 */
  hdUrl?: string
}

export type LinkSource = {
  id: string
  kind: "link"
  label: string
  note: string
  href: string
}

export type VideoSource = PlayableSource | LinkSource

/**
 * 按回目给出可选来源：
 * 授权片源（若有）→ 央视网官方标清流（多条线路）→ 演示片源 → 官方入口。
 * 官方入口只跳转，不在站内播放。
 */
export function videoSourcesFor(episode: number): VideoSource[] {
  const sources: VideoSource[] = []
  const licensed = licensedSources[episode]

  if (licensed) {
    sources.push({
      id: "licensed",
      kind: "playable",
      label: licensed.label,
      note: licensed.note ?? "授权片源",
      src: licensed.src,
    })
  }

  const cctv = cctvEpisode(episode)
  if (cctv) {
    for (const line of cctvLines) {
      sources.push({
        id: line.id,
        kind: "playable",
        label: line.label,
        note: `官方标清 360P · ${cctv.length}`,
        src: cctvStreamUrl(cctv.guid, line.host),
        hdUrl: cctv.pageUrl,
      })
    }
  }

  sources.push({
    id: "demo",
    kind: "playable",
    label: "演示片源",
    note: "自生成测试画面",
    src: demoVideoSource,
    demo: true,
  })

  for (const link of episodeLinks(episode)) {
    sources.push({
      id: `official-${link.label}`,
      kind: "link",
      label: link.label,
      note: link.note,
      href: link.href,
    })
  }

  return sources
}


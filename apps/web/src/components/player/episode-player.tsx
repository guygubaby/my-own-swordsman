import { useEffect, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Artplayer from "artplayer"
import artplayerPluginDanmuku, {
  type Danmu,
  type Mode,
  type Result as DanmakuPluginResult,
} from "artplayer-plugin-danmuku"
import { List } from "lucide-react"
import { api } from "@/lib/api"
import type { Danmaku, DanmakuMode } from "@/lib/danmaku"
import { DanmakuComposer } from "./danmaku-composer"
import { DanmakuList } from "./danmaku-list"

function modeToPlugin(mode: DanmakuMode): Mode {
  return mode === "top" ? 1 : mode === "bottom" ? 2 : 0
}

function toPlugin(item: Danmaku): Danmu {
  return {
    text: item.text,
    time: item.timeMs / 1000,
    color: item.color,
    mode: modeToPlugin(item.mode),
  }
}

function liveDanmu(item: Danmaku): Danmu {
  return {
    text: item.text,
    color: item.color,
    mode: modeToPlugin(item.mode),
  }
}

function pluginOf(art: Artplayer) {
  return art.plugins.artplayerPluginDanmuku as unknown as DanmakuPluginResult
}

export function EpisodePlayer({
  episode,
  title,
  src,
  demo,
}: {
  episode: number
  title: string
  src: string
  demo: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const artRef = useRef<Artplayer | null>(null)
  const blobUrlRef = useRef<string | null>(null)
  const seenRef = useRef(new Set<string>())
  const hydratedRef = useRef(false)
  const hadInitialDataRef = useRef(false)
  const initialDataRef = useRef<Danmaku[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [showList, setShowList] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  const danmakuQuery = useQuery({
    queryKey: ["danmaku", episode],
    queryFn: () =>
      api
        .get(`episodes/${episode}/danmaku`)
        .json<{ danmaku: Danmaku[]; total: number }>(),
    refetchInterval: 5000,
  })

  const list = danmakuQuery.data?.danmaku ?? []
  const ready = !danmakuQuery.isPending && Boolean(videoUrl)
  if (danmakuQuery.data) initialDataRef.current = danmakuQuery.data.danmaku

  // ponytail: 演示片源很小，先整文件 blob，绕开 Workers 静态资源不支持 Range 的问题，保证可 seek。
  // 正式长片源需要放在支持 Range 的 CDN / R2 / Stream 上。
  useEffect(() => {
    let cancelled = false

    if (!demo) {
      setVideoUrl(src)
      return () => {
        cancelled = true
      }
    }

    setVideoUrl(null)
    fetch(src)
      .then((response) => {
        if (!response.ok) throw new Error("demo fetch failed")
        return response.blob()
      })
      .then((blob) => {
        if (cancelled) return
        const url = URL.createObjectURL(blob)
        blobUrlRef.current = url
        setVideoUrl(url)
      })
      .catch(() => {
        if (!cancelled) setVideoUrl(src)
      })

    return () => {
      cancelled = true
    }
  }, [src, demo])

  useEffect(() => {
    if (!ready || !videoUrl || !containerRef.current || artRef.current) return

    const initial = initialDataRef.current
    hadInitialDataRef.current = initial.length > 0

    const art = new Artplayer({
      container: containerRef.current,
      url: videoUrl,
      autoplay: false,
      volume: 0.7,
      lang: "zh-cn",
      theme: "#a8342a",
      setting: true,
      playbackRate: true,
      aspectRatio: true,
      hotkey: true,
      pip: true,
      fullscreen: true,
      autoSize: false,
      autoMini: false,
      plugins: [
        artplayerPluginDanmuku({
          danmuku: initial.map(toPlugin),
          speed: 5,
          opacity: 0.9,
          fontSize: 22,
          margin: [10, "25%"],
          antiOverlap: true,
          synchronousPlayback: false,
          emitter: false,
          maxLength: 40,
          lockTime: 2,
        }),
      ],
    })

    artRef.current = art
    const timer = window.setInterval(() => setCurrentTime(art.currentTime), 500)

    return () => {
      window.clearInterval(timer)
      art.destroy(false)
      artRef.current = null
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
    }
  }, [ready, episode, videoUrl])

  useEffect(() => {
    const data = danmakuQuery.data?.danmaku
    if (!data) return

    if (!hydratedRef.current) {
      hydratedRef.current = true
      if (hadInitialDataRef.current) {
        data.forEach((item) => seenRef.current.add(item.id))
        return
      }
    }

    const art = artRef.current
    if (!art) return

    const plugin = pluginOf(art)
    for (const item of data) {
      if (seenRef.current.has(item.id)) continue
      seenRef.current.add(item.id)
      plugin.emit({
        ...toPlugin(item),
        time: Math.max(item.timeMs / 1000, art.currentTime),
      })
    }
  }, [danmakuQuery.data])

  function handleSent(item: Danmaku) {
    seenRef.current.add(item.id)
    const art = artRef.current
    if (art) pluginOf(art).emit(liveDanmu(item))
  }

  function seekTo(timeMs: number) {
    const art = artRef.current
    if (!art) return
    art.currentTime = timeMs / 1000
    void art.play()
  }

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#17110b] text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-heading text-sm font-bold text-white">
              第 {episode} 回 · {title}
            </span>
            {demo ? (
              <span className="shrink-0 rounded border border-gold/40 bg-gold/10 px-1.5 py-0.5 text-[10px] text-gold">
                演示片源
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-white/45">
            <span>{list.length} 条弹幕</span>
            <span className="hidden sm:inline">ArtPlayer · 弹幕插件</span>
          </div>
        </div>

        <div className="relative aspect-video w-full bg-black">
          <div ref={containerRef} className="h-full w-full" />
          {!ready ? (
            <div className="absolute inset-0 grid place-items-center text-xs text-white/45">
              正在搬放映机……
            </div>
          ) : null}
        </div>

        {demo ? (
          <p className="border-t border-white/10 px-3 py-2 text-[11px] leading-relaxed text-white/45">
            当前播放器接的是自生成演示画面，用来验证播放器和弹幕。正片片源需要授权后接入；官方正片入口在页面下方。
          </p>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        <DanmakuComposer
          episode={episode}
          currentTime={currentTime}
          onSent={handleSent}
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowList((value) => !value)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-cinnabar/40 hover:text-cinnabar"
          >
            <List className="size-3.5" />
            {showList ? "收起弹幕列表" : `弹幕列表（${list.length}）`}
          </button>
          <span className="text-[11px] text-ink-soft">
            弹幕礼仪：不剧透、不刷屏、不引战
          </span>
        </div>

        {showList ? <DanmakuList items={list} onSeek={seekTo} /> : null}
      </div>
    </div>
  )
}

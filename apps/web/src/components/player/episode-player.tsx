import { useEffect, useRef, useState } from "react"
import { Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import Artplayer from "artplayer"
import type HlsJs from "hls.js"
import artplayerPluginDanmuku, {
  type Danmu,
  type Mode,
  type Result as DanmakuPluginResult,
} from "artplayer-plugin-danmuku"
import { List } from "lucide-react"
import { api } from "@/lib/api"
import type { Danmaku, DanmakuMode } from "@/lib/danmaku"
import type { PlayableSource, VideoSource } from "@/data/video-sources"
import { DanmakuComposer } from "./danmaku-composer"
import { SourcePicker } from "./source-picker"
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

let hlsLoader: Promise<typeof import("hls.js")> | null = null

function loadHls() {
  hlsLoader ??= import("hls.js")
  return hlsLoader
}

function isHlsUrl(url: string) {
  return /\.m3u8(\?|$)/i.test(url)
}

function pluginOf(art: Artplayer) {
  return art.plugins.artplayerPluginDanmuku as unknown as DanmakuPluginResult
}

export function EpisodePlayer({
  episode,
  title,
  sources,
}: {
  episode: number
  title: string
  sources: VideoSource[]
}) {
  const playable = sources.filter(
    (source): source is PlayableSource => source.kind === "playable",
  )
  const [sourceId, setSourceId] = useState(() => playable.at(0)?.id ?? "")
  const activeSource = playable.find((source) => source.id === sourceId) ?? playable.at(0)
  const src = activeSource?.src ?? ""
  const demo = activeSource?.demo ?? false
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
  const [streamError, setStreamError] = useState(false)
  const hlsRef = useRef<HlsJs | null>(null)
  const loadedUrlRef = useRef<string | null>(null)
  const [playerKey, setPlayerKey] = useState(0)

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

    setStreamError(false)

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
      // ArtPlayer 会校验 type，显式传 undefined 会直接抛错，所以只在 HLS 时才带这个键。
      ...(isHlsUrl(videoUrl) ? { type: "m3u8" as const } : {}),
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
      // 央视网直链是 HLS，交给 hls.js；Safari 回落到原生。
      customType: {
        m3u8(video, url, player) {
          void (async () => {
            const { default: Hls } = await loadHls()
            if (artRef.current !== player) return
            if (hlsRef.current) {
              hlsRef.current.destroy()
              hlsRef.current = null
            }
            if (blobUrlRef.current) {
              URL.revokeObjectURL(blobUrlRef.current)
              blobUrlRef.current = null
            }
            if (!Hls.isSupported()) {
              video.src = url
              return
            }
            const hls = new Hls({ maxBufferLength: 30 })
            hlsRef.current = hls
            hls.on(Hls.Events.ERROR, (_event, data) => {
              if (!data.fatal) return
              setStreamError(true)
              hls.destroy()
              if (hlsRef.current === hls) hlsRef.current = null
            })
            hls.loadSource(url)
            hls.attachMedia(video)
          })()
        },
      },
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
    loadedUrlRef.current = videoUrl
    const timer = window.setInterval(() => setCurrentTime(art.currentTime), 500)

    return () => {
      window.clearInterval(timer)
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
      art.destroy(false)
      artRef.current = null
      loadedUrlRef.current = null
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
    }
  }, [ready, episode, playerKey])

  // 同一集里换线路：走 ArtPlayer 的 switchQuality，它会记住 currentTime 再写回。
  // 但 HLS 和本地文件之间互切时 MediaSource 会打架，这种情况直接重建播放器。
  useEffect(() => {
    const art = artRef.current
    if (!art || !videoUrl || loadedUrlRef.current === videoUrl) return

    const wasHls = loadedUrlRef.current ? isHlsUrl(loadedUrlRef.current) : false
    if (wasHls !== isHlsUrl(videoUrl)) {
      setPlayerKey((key) => key + 1)
      return
    }

    loadedUrlRef.current = videoUrl
    void art.switchQuality(videoUrl).catch(() => setStreamError(true))
  }, [videoUrl])

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
            <SourcePicker
              sources={sources}
              activeId={activeSource?.id ?? ""}
              onSelect={setSourceId}
            />
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

        {streamError ? (
          <p className="border-t border-white/10 px-3 py-2 text-[11px] leading-relaxed text-gold">
            央视网片源加载失败（地区限制或线路抖动）。换条线路再试，或者
            <a
              href={activeSource?.hdUrl ?? "https://tv.cctv.com/"}
              target="_blank"
              rel="noreferrer noopener"
              className="mx-1 underline underline-offset-2"
            >
              去央视网看
            </a>
            。
          </p>
        ) : activeSource?.hdUrl ? (
          <p className="border-t border-white/10 px-3 py-2 text-[11px] leading-relaxed text-white/45">
            正在播放央视网官方标清 360P 流。想看高清 720P，请
            <a
              href={activeSource.hdUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="mx-1 text-gold underline underline-offset-2"
            >
              去央视网观看 →
            </a>
            （高清由官方加密播放器提供，站内无法播放）。
            <span className="mt-1 block text-[10px] text-white/30">
              装了「同福弹幕」浏览器插件，在央视网那边也能看弹幕、发弹幕。
              <Link
                to="/connect-extension"
                className="ml-1 text-gold/80 underline underline-offset-2"
              >
                连接账号
              </Link>
            </span>
          </p>
        ) : demo ? (
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

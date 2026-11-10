import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, Play } from "lucide-react"
import {
  EmptyState,
  ExternalButton,
  SectionTitle,
} from "@/components/site-chrome"
import { EpisodePlayer } from "@/components/player/episode-player"
import {
  cleanLine,
  episodeByNumber,
  episodeLinks,
  highlights,
} from "@/data/episodes"
import { isDemoSource, videoSourceFor } from "@/data/video-sources"

export const Route = createFileRoute("/watch/$episode")({
  component: EpisodePage,
})

function EpisodePage() {
  const { episode: episodeParam } = Route.useParams()
  const n = Number(episodeParam)
  const episode = Number.isFinite(n) ? episodeByNumber.get(n) : undefined

  if (!episode) {
    return (
      <div className="py-10">
        <EmptyState
          title="这一回不存在"
          description="八十一回里没找到这一页。"
          action={
            <Link to="/watch" search={{ q: undefined }} className="mt-3 text-sm font-medium text-cinnabar">
              回追剧指南
            </Link>
          }
        />
      </div>
    )
  }

  const sample = cleanLine(episode.sample?.text)
  const marks = highlights[episode.n]
  const previous = episodeByNumber.get(episode.n - 1)
  const next = episodeByNumber.get(episode.n + 1)
  const source = videoSourceFor(episode.n)
  const demo = isDemoSource(source)

  return (
    <div>
      <Link
        to="/watch"
        search={{ q: undefined }}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-cinnabar"
      >
        <ArrowLeft className="size-4" />
        回追剧指南
      </Link>

      <header className="paper-panel relative overflow-hidden rounded-xl px-5 py-7 md:px-8 md:py-9">
        <div
          className="pointer-events-none absolute -right-10 -top-10 font-heading text-[9rem] leading-none font-bold text-cinnabar/5"
          aria-hidden="true"
        >
          {String(episode.n).padStart(2, "0")}
        </div>
        <div className="relative">
          <div className="text-[11px] tracking-[0.24em] text-cinnabar">
            第 {episode.n} 回 · 共 {episode.quoteCount} 句台词
          </div>
          <h1 className="mt-2 font-heading text-2xl leading-snug font-bold text-ink md:text-4xl">
            {episode.title}
          </h1>
          {sample ? (
            <blockquote className="mt-4 max-w-2xl border-l-2 border-cinnabar/40 pl-4 font-heading text-base leading-relaxed text-ink-soft md:text-lg">
              「{sample}」
              {episode.sample ? (
                <span className="ml-2 text-sm not-italic">—— {episode.sample.speaker}</span>
              ) : null}
            </blockquote>
          ) : null}
        </div>
      </header>

      <div className="mt-8">
        <EpisodePlayer
          key={episode.n}
          episode={episode.n}
          title={episode.title}
          src={source}
          demo={demo}
        />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[1.3fr_0.7fr]">
        <section>
          <SectionTitle kicker="正片指路" title="去官方平台看" />
          <div className="paper-panel rounded-lg p-5">
            <p className="text-sm leading-relaxed text-ink-soft">
              本站不托管、不转码、不抓流任何剧集。下面是官方正版入口，点过去就能看。
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {episodeLinks(episode.n).map((link) => (
                <ExternalButton key={link.label} href={link.href} className="justify-between">
                  <span className="inline-flex items-center gap-1.5">
                    <Play className="size-3.5" />
                    {link.label}
                  </span>
                  <span className="text-[10px] font-normal text-ink-soft">{link.note}</span>
                </ExternalButton>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-ink-soft/75">
              爱奇艺为官方高清平台，权益以页面为准；央视网、央视频提供官方正片入口，可在站内选集。若找不到具体分集，搜「武林外传 第
              {episode.n}集」即可。
            </p>
          </div>
        </section>

        <aside className="space-y-4">
          <div>
            <SectionTitle kicker="本回看点" title={marks ? "名场面" : "随手一记"} />
            <div className="paper-panel rounded-lg p-5">
              {marks ? (
                <ul className="space-y-2.5 text-sm leading-relaxed text-ink">
                  {marks.map((mark) => (
                    <li key={mark} className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-cinnabar" />
                      {mark}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm leading-relaxed text-ink-soft">
                  这一回还没写看点。先把台词翻一翻，说不定下一句就是你的暗号。
                </p>
              )}
            </div>
          </div>

          <div className="paper-panel rounded-lg p-4">
            <div className="mb-2 text-[10px] tracking-[0.2em] text-ink-soft">章回跳转</div>
            <div className="flex gap-2">
              {previous ? (
                <Link
                  to="/watch/$episode"
                  params={{ episode: String(previous.n) }}
                  className="inline-flex flex-1 items-center gap-1 rounded-md border border-border px-2.5 py-2 text-xs text-ink hover:border-cinnabar/40 hover:text-cinnabar"
                >
                  <ChevronLeft className="size-3.5" />
                  上一回
                </Link>
              ) : null}
              {next ? (
                <Link
                  to="/watch/$episode"
                  params={{ episode: String(next.n) }}
                  className="inline-flex flex-1 items-center justify-end gap-1 rounded-md border border-border px-2.5 py-2 text-xs text-ink hover:border-cinnabar/40 hover:text-cinnabar"
                >
                  下一回
                  <ChevronRight className="size-3.5" />
                </Link>
              ) : null}
            </div>
          </div>
        </aside>
      </div>

      <p className="mt-8 flex items-center gap-1.5 text-[11px] text-ink-soft/75">
        <ExternalLink className="size-3" />
        外链均指向官方平台，本站不参与任何播放和收费。
      </p>
    </div>
  )
}

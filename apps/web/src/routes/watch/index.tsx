import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { Search } from "lucide-react"
import { SectionTitle } from "@/components/site-chrome"
import { cleanLine, episodes } from "@/data/episodes"
import { seo } from "@/lib/seo"

export const Route = createFileRoute("/watch/")({
  head: () =>
    seo({
      title: "追剧指南 · 武林外传八十一回｜同福娱乐镇",
      description:
        "武林外传八十一回章回目录：每回的章回名、经典台词与央视网、爱奇艺官方正片入口，附站内演示播放器与弹幕。",
      path: "/watch",
    }),
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" && search.q.length > 0 ? search.q : undefined,
  }),
  component: WatchPage,
})

function WatchPage() {
  const { q } = Route.useSearch()
  const navigate = useNavigate({ from: "/watch/" })

  const keyword = q?.trim() ?? ""
  const filtered = keyword
    ? episodes.filter(
        (episode) =>
          episode.title.includes(keyword) ||
          String(episode.n) === keyword ||
          cleanLine(episode.sample?.text)?.includes(keyword),
      )
    : episodes

  return (
    <div>
      <SectionTitle
        kicker="八十一回"
        title="追剧指南"
        description="每回一张木牌，写着章回名、原剧台词和官方正片入口。站内播放器目前是演示片源，正片请到爱奇艺、央视网或央视频看。"
      />

      <div className="paper-panel mb-5 flex items-center gap-2 rounded-lg px-3 py-2">
        <Search className="size-4 shrink-0 text-ink-soft" />
        <input
          value={q ?? ""}
          onChange={(event) =>
            void navigate({
              search: { q: event.target.value || undefined },
              replace: true,
            })
          }
          placeholder="搜章回名、台词或回数，比如「挖地道」"
          className="h-8 w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/60"
          aria-label="搜索剧集"
        />
        {q ? (
          <button
            type="button"
            onClick={() => void navigate({ search: { q: undefined }, replace: true })}
            className="shrink-0 rounded px-2 py-1 text-xs text-ink-soft hover:bg-ink/5 hover:text-ink"
          >
            清掉
          </button>
        ) : null}
      </div>

      <div className="mb-3 flex items-center justify-between text-xs text-ink-soft">
        <span>
          共 {filtered.length} 回
          {keyword ? ` · 搜「${keyword}」` : ""}
        </span>
        <span>点木牌看这一回</span>
      </div>

      {filtered.length === 0 ? (
        <div className="paper-panel rounded-lg px-6 py-12 text-center text-sm text-ink-soft">
          没搜着。换个词试试，比如「饺子」「地道」「衙门」。
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((episode) => {
            const sample = cleanLine(episode.sample?.text)
            return (
              <Link
                key={episode.n}
                to="/watch/$episode"
                params={{ episode: String(episode.n) }}
                className="paper-panel group flex flex-col gap-2 rounded-lg p-3.5 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading text-xs tracking-[0.18em] text-cinnabar">
                    第 {String(episode.n).padStart(2, "0")} 回
                  </span>
                  <span className="text-[10px] text-ink-soft">{episode.quoteCount} 句</span>
                </div>
                <div className="font-heading text-sm leading-snug font-bold text-ink group-hover:text-cinnabar">
                  {episode.title}
                </div>
                {sample ? (
                  <p className="line-clamp-2 text-xs leading-relaxed text-ink-soft">
                    「{sample}」
                  </p>
                ) : (
                  <p className="text-xs text-ink-soft/60">本回台词整理中</p>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

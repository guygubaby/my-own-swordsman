import { useState } from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import {
  ArrowRight,
  Gamepad2,
  MessagesSquare,
  ShoppingBag,
  Sparkles,
  TvMinimalPlay,
} from "lucide-react"
import { PaperCard, SectionTitle, Seal } from "@/components/site-chrome"
import { dailyPair } from "@/data/chain-pairs"
import { cleanLine, episodes } from "@/data/episodes"

export const Route = createFileRoute("/")({
  component: HomePage,
})

const features = [
  {
    to: "/watch" as const,
    title: "追剧指南",
    description: "八十一回章回目录，站内演示播放器、弹幕和官方正片指路。",
    icon: TvMinimalPlay,
    meta: "81 回",
  },
  {
    to: "/chain" as const,
    title: "台词接龙",
    description: "每日一句，楼中楼接下去。接不上就去后院扫院子。",
    icon: MessagesSquare,
    meta: "每日一题",
  },
  {
    to: "/games" as const,
    title: "同福小游戏",
    description: "包饺子、做炮仗、挖地道，客栈三大副业。",
    icon: Gamepad2,
    meta: "3 个小游戏",
  },
  {
    to: "/shop" as const,
    title: "周边情报",
    description: "官方授权周边情报站，只指路，不卖货。",
    icon: ShoppingBag,
    meta: "仅情报",
  },
]

const news = [
  {
    tag: "20 周年",
    title: "郭芙蓉赎身日冲上热搜，佟掌柜的账终于平了",
  },
  {
    tag: "官方周边",
    title: "吾流 WUSTYLE 收藏卡与 20 周年纪念图书先后开售",
  },
  {
    tag: "设定集",
    title: "官方纪念画集收录七侠镇地形图与同福客栈平面图",
  },
]

function HomePage() {
  const [episode, setEpisode] = useState(
    () => episodes[Math.floor(Math.random() * episodes.length)],
  )
  const pair = dailyPair()

  function rollEpisode() {
    setEpisode((current) => {
      let next = current
      while (next.n === current.n) {
        next = episodes[Math.floor(Math.random() * episodes.length)]
      }
      return next
    })
  }

  return (
    <div className="space-y-12 md:space-y-16">
      <section className="paper-panel relative overflow-hidden rounded-xl px-5 py-8 md:px-10 md:py-12">
        <div
          className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full border border-cinnabar/10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full border border-cinnabar/15"
          aria-hidden="true"
        />
        <div className="relative grid gap-8 md:grid-cols-[1.35fr_0.65fr] md:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-medium tracking-[0.26em] text-cinnabar">
              <span className="h-px w-7 bg-cinnabar/60" />
              七侠镇 · 同福客栈 · 腐竹自营
            </div>
            <h1 className="font-heading text-4xl leading-tight font-bold tracking-wide text-ink md:text-6xl">
              同福娱乐镇
            </h1>
            <p className="mt-4 inline-block border-y border-cinnabar/25 py-2 font-heading text-base tracking-[0.12em] text-cinnabar md:text-lg">
              餐饮洗浴一条龙 · 娱乐休闲一体化
            </p>
            <p className="mt-4 max-w-xl text-sm leading-7 text-ink-soft md:text-base">
              追剧、接台词、包饺子、做炮仗、挖地道。正片请到官方平台看，这里负责把七侠镇的热闹凑齐。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/watch"
                search={{ q: undefined }}
                className="inline-flex items-center gap-1.5 rounded-md bg-cinnabar px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-cinnabar-deep"
              >
                进客栈追剧
                <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/chain"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-cinnabar/40 hover:text-cinnabar"
              >
                接一句台词
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 md:justify-end">
            <div className="rotate-2 rounded-lg border border-gold/35 bg-paper-deep/70 px-4 py-5 text-center shadow-sm">
              <div className="font-heading text-[11px] tracking-[0.3em] text-ink-soft">本店招牌</div>
              <div className="mt-3 space-y-2 font-heading text-lg font-bold tracking-[0.18em] text-ink">
                <div>追剧</div>
                <div>接龙</div>
                <div>小游戏</div>
                <div>周边</div>
              </div>
              <div className="mt-3 border-t border-gold/30 pt-2 text-[10px] tracking-[0.2em] text-cinnabar">
                美滴狠
              </div>
            </div>
            <Seal className="size-20 md:size-24" />
          </div>
        </div>
      </section>

      <section>
        <SectionTitle
          kicker="今日份的江湖"
          title="今天接哪一句？"
          description="每天一句原剧台词，接上下一句。接不上也不打紧，后院还缺个扫地的。"
        />
        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <PaperCard className="flex flex-col justify-between gap-5 p-5 md:p-6">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[11px] tracking-[0.18em] text-ink-soft">
                <Sparkles className="size-3.5 text-gold" />
                第 {pair.episode} 回 · {pair.promptSpeaker}
              </div>
              <blockquote className="font-heading text-xl leading-relaxed font-bold text-ink md:text-2xl">
                「{pair.prompt}」
              </blockquote>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/chain"
                className="inline-flex items-center gap-1.5 rounded-md bg-cinnabar px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-cinnabar-deep"
              >
                去接龙
                <ArrowRight className="size-4" />
              </Link>
              <span className="text-xs text-ink-soft">下一句由 {pair.answerSpeaker} 接</span>
            </div>
          </PaperCard>

          <PaperCard className="flex flex-col justify-between gap-4 p-5 md:p-6">
            <div>
              <div className="text-[11px] tracking-[0.18em] text-ink-soft">今晚看哪回</div>
              <div className="mt-2 font-heading text-lg font-bold text-ink">
                第 {episode.n} 回 · {episode.title}
              </div>
              {cleanLine(episode.sample?.text) ? (
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">
                  「{cleanLine(episode.sample?.text)}」
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={rollEpisode}
                className="rounded-md border border-border bg-card px-3 py-2 text-sm text-ink transition-colors hover:border-cinnabar/40 hover:text-cinnabar"
              >
                换一集
              </button>
              <Link
                to="/watch/$episode"
                params={{ episode: String(episode.n) }}
                className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-cinnabar hover:bg-cinnabar/10"
              >
                看这一回
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </PaperCard>
        </div>
      </section>

      <section>
        <SectionTitle kicker="客栈四宝" title="进来坐，样样都有" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Link
                key={feature.to}
                to={feature.to}
                className="paper-panel group flex flex-col gap-3 rounded-lg p-4 transition-transform duration-200 hover:-translate-y-0.5 md:p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-9 place-items-center rounded-md bg-cinnabar/10 text-cinnabar">
                    <Icon className="size-4.5" />
                  </span>
                  <span className="text-[10px] tracking-[0.16em] text-ink-soft">{feature.meta}</span>
                </div>
                <div>
                  <div className="font-heading text-base font-bold text-ink group-hover:text-cinnabar">
                    {feature.title}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">{feature.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <section>
        <SectionTitle kicker="江湖月报" title="七侠镇最近的新鲜事" />
        <PaperCard className="divide-y divide-border/60 overflow-hidden">
          {news.map((item) => (
            <div key={item.title} className="flex items-start gap-3 px-4 py-3.5 md:px-5">
              <span className="mt-0.5 shrink-0 rounded border border-cinnabar/25 bg-cinnabar/5 px-1.5 py-0.5 text-[10px] tracking-wider text-cinnabar">
                {item.tag}
              </span>
              <p className="text-sm leading-relaxed text-ink">{item.title}</p>
            </div>
          ))}
        </PaperCard>
      </section>
    </div>
  )
}

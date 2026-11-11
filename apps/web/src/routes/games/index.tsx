import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowRight, Bomb, Pickaxe, Soup } from "lucide-react"
import { PaperCard, SectionTitle } from "@/components/site-chrome"
import { seo } from "@/lib/seo"

export const Route = createFileRoute("/games/")({
  head: () =>
    seo({
      title: "同福小游戏 · 包饺子、做炮仗、挖地道｜同福娱乐镇",
      description:
        "三个从《武林外传》里长出来的小游戏：包饺子看火候、配火药做炮仗、替邢捕头挖地道。没有体力值，免登录直接玩。",
      path: "/games",
    }),
  component: GamesPage,
})

const games = [
  {
    to: "/games/dumplings" as const,
    title: "包饺子",
    subtitle: "第 20 回 · 女侠芙蓉操办过年",
    description: "佟掌柜馋饺子，郭芙蓉用浆糊包。看准火候，捏在中间。",
    icon: Soup,
    tag: "手感",
  },
  {
    to: "/games/firecrackers" as const,
    title: "做炮仗",
    subtitle: "第 20 回 · 大地春雷",
    description: "硝石、硫磺、木炭，比例不对就是哑炮，放多了炸灶台。",
    icon: Bomb,
    tag: "配方",
  },
  {
    to: "/games/tunnel" as const,
    title: "挖地道",
    subtitle: "第 14–15 回 · 防盗八法",
    description: "邢捕头让全客栈挖地道，雷老五直接挖到衙门。别把铲子使完了。",
    icon: Pickaxe,
    tag: "走位",
  },
]

function GamesPage() {
  return (
    <div>
      <SectionTitle
        kicker="客栈副业"
        title="同福小游戏"
        description="三个小游戏都从原剧里长出来：包饺子、做炮仗、挖地道。没有体力值，也没有每日签到，玩完就算。"
      />

      <div className="grid gap-4 md:grid-cols-3">
        {games.map((game) => {
          const Icon = game.icon
          return (
            <Link key={game.to} to={game.to} className="group">
              <PaperCard className="flex h-full flex-col gap-4 p-5 transition-transform duration-200 group-hover:-translate-y-0.5 md:p-6">
                <div className="flex items-start justify-between">
                  <span className="grid size-11 place-items-center rounded-md bg-cinnabar/10 text-cinnabar">
                    <Icon className="size-5" />
                  </span>
                  <span className="rounded border border-gold/35 px-1.5 py-0.5 text-[10px] tracking-wider text-gold">
                    {game.tag}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-heading text-xl font-bold text-ink group-hover:text-cinnabar">
                    {game.title}
                  </div>
                  <div className="mt-1 text-[11px] tracking-wider text-ink-soft">{game.subtitle}</div>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{game.description}</p>
                </div>
                <div className="flex items-center gap-1 text-sm font-medium text-cinnabar">
                  开始
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </PaperCard>
            </Link>
          )
        })}
      </div>

      <PaperCard className="mt-6 px-5 py-4 text-xs leading-relaxed text-ink-soft">
        小游戏里的角色形象全部用文字和色块现做，没有使用剧照。包饺子、做炮仗出自第 20
        回，挖地道出自第 14、15 回。
      </PaperCard>
    </div>
  )
}

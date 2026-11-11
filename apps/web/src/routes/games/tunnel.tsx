import { useState } from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowLeft, Pickaxe, RotateCcw } from "lucide-react"
import { PaperCard, SectionTitle } from "@/components/site-chrome"
import { seo } from "@/lib/seo"

export const Route = createFileRoute("/games/tunnel")({
  head: () =>
    seo({
      title: "挖地道 · 同福小游戏｜同福娱乐镇",
      description:
        "邢捕头的「防盗八法」让全客栈挖地道。躲开石头、算好铲子，从客栈后院挖到县衙门。",
      path: "/games/tunnel",
    }),
  component: TunnelGame,
})

const SIZE = 6
const START = "0,0"
const TARGET = "5,5"
const TOTAL_SHOVELS = 12
const STONES = new Set(["3,0", "5,3", "2,2", "4,2", "1,4", "3,4"])

type Status = "playing" | "won" | "lost"

function neighbors(key: string) {
  const [x, y] = key.split(",").map(Number)
  return [
    [x + 1, y],
    [x - 1, y],
    [x, y + 1],
    [x, y - 1],
  ]
    .filter(([nx, ny]) => nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE)
    .map(([nx, ny]) => `${nx},${ny}`)
}

function TunnelGame() {
  const [dug, setDug] = useState<Set<string>>(() => new Set([START]))
  const [stonesHit, setStonesHit] = useState<Set<string>>(() => new Set())
  const [shovels, setShovels] = useState(TOTAL_SHOVELS)
  const [status, setStatus] = useState<Status>("playing")

  function dig(key: string) {
    if (status !== "playing" || shovels <= 0) return
    if (dug.has(key) || stonesHit.has(key)) return
    if (!neighbors(key).some((next) => dug.has(next))) return

    const nextShovels = shovels - 1
    setShovels(nextShovels)

    if (STONES.has(key)) {
      setStonesHit((current) => new Set(current).add(key))
      if (nextShovels <= 0) setStatus("lost")
      return
    }

    const nextDug = new Set(dug)
    nextDug.add(key)
    setDug(nextDug)

    if (key === TARGET) setStatus("won")
    else if (nextShovels <= 0) setStatus("lost")
  }

  function reset() {
    setDug(new Set([START]))
    setStonesHit(new Set())
    setShovels(TOTAL_SHOVELS)
    setStatus("playing")
  }

  return (
    <div>
      <Link
        to="/games"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-cinnabar"
      >
        <ArrowLeft className="size-4" />
        回小游戏
      </Link>

      <SectionTitle
        kicker="第 14–15 回 · 防盗八法"
        title="挖地道"
        description="从同福客栈后院挖到衙门。只能接着已挖通的地道往外扩，石头会白费一铲。"
      />

      <PaperCard className="mx-auto max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/60 bg-cinnabar/[0.04] px-5 py-3 text-[11px] text-ink-soft">
          <span className="inline-flex items-center gap-1.5">
            <Pickaxe className="size-3.5" />
            还剩 <span className="font-heading text-sm font-bold text-cinnabar">{shovels}</span> 铲
          </span>
          <span>
            {status === "playing" ? "接着挖" : status === "won" ? "挖通了" : "铲子使完了"}
          </span>
        </div>

        <div className="px-4 py-5 md:px-7">
          <div className="mx-auto grid max-w-md grid-cols-6 gap-1.5">
            {Array.from({ length: SIZE * SIZE }).map((_, index) => {
              const x = index % SIZE
              const y = Math.floor(index / SIZE)
              const key = `${x},${y}`
              const isStart = key === START
              const isTarget = key === TARGET
              const isDug = dug.has(key)
              const isStone = stonesHit.has(key)
              const canDig =
                status === "playing" &&
                !isDug &&
                !isStone &&
                neighbors(key).some((next) => dug.has(next))

              const label = isStart ? "栈" : isTarget ? "衙" : isStone ? "石" : isDug ? "通" : canDig ? "挖" : "？"

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => dig(key)}
                  disabled={!canDig}
                  aria-label={`第 ${x + 1} 列第 ${y + 1} 行，${label}`}
                  className={[
                    "aspect-square rounded-md border font-heading text-sm font-bold transition-colors",
                    isTarget
                      ? "border-cinnabar/50 bg-cinnabar/15 text-cinnabar"
                      : isStone
                        ? "border-ink/15 bg-ink/10 text-ink-soft"
                        : isDug
                          ? "border-gold/40 bg-gold/15 text-ink"
                          : canDig
                            ? "border-cinnabar/25 bg-card text-cinnabar/70 hover:bg-cinnabar/10"
                            : "border-border/60 bg-card/50 text-ink-soft/35",
                  ].join(" ")}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <div className="mx-auto mt-4 flex max-w-md flex-wrap justify-center gap-3 text-[10px] text-ink-soft">
            <span>栈 = 同福客栈</span>
            <span>衙 = 衙门</span>
            <span>石 = 石头</span>
            <span>通 = 已挖通</span>
          </div>

          {status !== "playing" ? (
            <div
              className={[
                "mx-auto mt-5 max-w-md rounded-md border px-4 py-3.5 text-center",
                status === "won"
                  ? "border-jade/40 bg-jade/10"
                  : "border-cinnabar/40 bg-cinnabar/10",
              ].join(" ")}
            >
              <div className="font-heading text-lg font-bold text-ink">
                {status === "won" ? "挖通了！" : "铲子使完了。"}
              </div>
              <p className="mt-1 text-sm text-ink-soft">
                {status === "won"
                  ? "衙门那头，凌腾云正等着。邢捕头说：这案子，算你破的。"
                  : "邢捕头在后院等着验收，佟掌柜说工钱照扣。"}
              </p>
              <button
                type="button"
                onClick={reset}
                className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-cinnabar px-3.5 py-2 text-sm font-medium text-primary-foreground"
              >
                <RotateCcw className="size-3.5" />
                再挖一次
              </button>
            </div>
          ) : null}
        </div>
      </PaperCard>
    </div>
  )
}

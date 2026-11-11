import { useEffect, useRef, useState } from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowLeft, RotateCcw } from "lucide-react"
import { PaperCard, SectionTitle } from "@/components/site-chrome"
import { seo } from "@/lib/seo"

export const Route = createFileRoute("/games/dumplings")({
  head: () =>
    seo({
      title: "包饺子 · 同福小游戏｜同福娱乐镇",
      description:
        "佟掌柜馋饺子，郭芙蓉用浆糊包。看准火候、捏在中间，五轮下来看看能拿多少工钱。",
      path: "/games/dumplings",
    }),
  component: DumplingsGame,
})

const TOTAL_ROUNDS = 5

function verdict(total: number) {
  if (total >= 80) {
    return {
      title: "佟掌柜：这手艺，能顶大嘴半个月工钱。",
      detail: "皮薄馅大，一个没破。后院那口锅归你了。",
    }
  }
  if (total >= 50) {
    return {
      title: "佟掌柜：还行，皮没破，馅没漏。",
      detail: "能上桌，但别跟大嘴说这是你包的。",
    }
  }
  return {
    title: "佟掌柜：这包的是饺子还是暗器？",
    detail: "郭芙蓉看了都摇头。再来一笼吧。",
  }
}

function DumplingsGame() {
  const [round, setRound] = useState(1)
  const [pos, setPos] = useState(0)
  const [running, setRunning] = useState(true)
  const [scores, setScores] = useState<number[]>([])
  const [phase, setPhase] = useState<"playing" | "result" | "done">("playing")
  const posRef = useRef(0)
  const dirRef = useRef(1)

  useEffect(() => {
    if (!running || phase !== "playing") return
    let raf = 0
    let last = performance.now()

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      let next = posRef.current + dirRef.current * 46 * dt
      if (next >= 100) {
        next = 100
        dirRef.current = -1
      } else if (next <= 0) {
        next = 0
        dirRef.current = 1
      }
      posRef.current = next
      setPos(next)
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [running, phase])

  const total = scores.reduce((sum, score) => sum + score, 0)
  const latest = scores.at(-1) ?? 0

  function wrap() {
    if (phase !== "playing") return
    setRunning(false)
    const distance = Math.abs(posRef.current - 50)
    const points = distance <= 8 ? 20 : distance <= 18 ? 10 : 0
    setScores((previous) => [...previous, points])
    setPhase("result")
  }

  function next() {
    if (round >= TOTAL_ROUNDS) {
      setPhase("done")
      return
    }
    setRound((value) => value + 1)
    posRef.current = 0
    dirRef.current = 1
    setPos(0)
    setRunning(true)
    setPhase("playing")
  }

  function reset() {
    setRound(1)
    setScores([])
    posRef.current = 0
    dirRef.current = 1
    setPos(0)
    setRunning(true)
    setPhase("playing")
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
        kicker="第 20 回 · 女侠芙蓉操办过年"
        title="包饺子"
        description="看准中间绿色区域按「捏」。五笼下来，看看你是佟掌柜还是郭芙蓉。"
      />

      <PaperCard className="mx-auto max-w-2xl overflow-hidden">
        <div className="border-b border-border/60 bg-cinnabar/[0.04] px-5 py-3">
          <div className="flex items-center justify-between text-[11px] text-ink-soft">
            <span>第 {round} / {TOTAL_ROUNDS} 笼</span>
            <span>
              总分 <span className="font-heading text-sm font-bold text-cinnabar">{total}</span>
            </span>
          </div>
        </div>

        <div className="px-5 py-6 md:px-7">
          <div className="flex items-center justify-center gap-2 text-3xl" aria-hidden="true">
            {Array.from({ length: TOTAL_ROUNDS }).map((_, index) => (
              <span
                key={index}
                className={index < scores.length ? "opacity-100" : "opacity-20 grayscale"}
              >
                🥟
              </span>
            ))}
          </div>

          {phase === "done" ? (
            <div className="mt-6 text-center">
              <div className="font-heading text-2xl font-bold text-ink">{total} 分</div>
              <p className="mt-2 font-heading text-base font-bold text-cinnabar">
                {verdict(total).title}
              </p>
              <p className="mt-1 text-sm text-ink-soft">{verdict(total).detail}</p>
              <button
                type="button"
                onClick={reset}
                className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-cinnabar px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                <RotateCcw className="size-3.5" />
                再来一笼
              </button>
            </div>
          ) : (
            <>
              <div className="mt-7">
                <div className="relative h-11 overflow-hidden rounded-md border border-border bg-paper-deep/50">
                  <div className="absolute inset-y-0 left-[30%] w-[40%] bg-gold/15" />
                  <div className="absolute inset-y-0 left-[42%] w-[16%] bg-jade/25" />
                  <div className="absolute inset-y-0 left-1/2 w-px bg-jade/60" />
                  <div
                    className="absolute top-1/2 h-8 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cinnabar shadow"
                    style={{ left: `${pos}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[10px] tracking-wider text-ink-soft">
                  <span>皮太厚</span>
                  <span>正好</span>
                  <span>露馅</span>
                </div>
              </div>

              {phase === "result" ? (
                <div className="mt-6 text-center">
                  <div className="font-heading text-lg font-bold text-cinnabar">
                    {latest === 20 ? "漂亮，皮薄馅大！" : latest === 10 ? "还行，能上桌。" : "破了，重包。"}
                  </div>
                  <div className="mt-1 text-sm text-ink-soft">这一笼 +{latest} 分</div>
                  <button
                    type="button"
                    onClick={next}
                    className="mt-4 rounded-md bg-cinnabar px-4 py-2 text-sm font-medium text-primary-foreground"
                  >
                    {round >= TOTAL_ROUNDS ? "收工看账" : "下一笼"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={wrap}
                  className="mt-7 w-full rounded-md bg-cinnabar py-3 font-heading text-lg font-bold text-primary-foreground transition-colors hover:bg-cinnabar-deep"
                >
                  捏！
                </button>
              )}
            </>
          )}
        </div>
      </PaperCard>

      <p className="mx-auto mt-4 max-w-2xl text-center text-[11px] leading-relaxed text-ink-soft/75">
        本游戏只取了第 20 回「包饺子」的梗，不使用任何剧照或原剧音频。
      </p>
    </div>
  )
}

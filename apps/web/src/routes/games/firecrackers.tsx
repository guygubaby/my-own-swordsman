import { useState } from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowLeft, Flame, Minus, Plus, RotateCcw } from "lucide-react"
import { PaperCard, SectionTitle } from "@/components/site-chrome"
import { evaluate, type IngredientKey, type Outcome } from "@/lib/firecracker"

export const Route = createFileRoute("/games/firecrackers")({
  component: FirecrackerGame,
})

const ingredients: { key: IngredientKey; label: string; hint: string }[] = [
  { key: "saltpeter", label: "硝石", hint: "少了不响，多了上房。" },
  { key: "sulfur", label: "硫磺", hint: "呛人，别贪多。" },
  { key: "charcoal", label: "木炭", hint: "引火用，一小把。" },
]

const initial = { saltpeter: 3, sulfur: 1, charcoal: 1 }

const toneStyles: Record<Outcome["tone"], string> = {
  good: "border-jade/40 bg-jade/10 text-jade",
  meh: "border-gold/40 bg-gold/10 text-gold",
  bad: "border-cinnabar/40 bg-cinnabar/10 text-cinnabar",
}

function FirecrackerGame() {
  const [amounts, setAmounts] = useState<Record<IngredientKey, number>>(initial)
  const [outcome, setOutcome] = useState<Outcome | null>(null)

  const total = amounts.saltpeter + amounts.sulfur + amounts.charcoal

  function adjust(key: IngredientKey, delta: number) {
    setOutcome(null)
    setAmounts((current) => ({
      ...current,
      [key]: Math.max(0, Math.min(10, current[key] + delta)),
    }))
  }

  function reset() {
    setAmounts(initial)
    setOutcome(null)
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
        kicker="第 20 回 · 大地春雷"
        title="做炮仗"
        description="郭芙蓉手搓大爆竹，硝石、硫磺、木炭按比例配。配好了是大地春雷，配猛了是炸灶台。"
      />

      <PaperCard className="mx-auto max-w-2xl overflow-hidden">
        <div className="border-b border-border/60 bg-cinnabar/[0.04] px-5 py-3 text-[11px] text-ink-soft">
          当前总量 <span className="font-heading text-sm font-bold text-cinnabar">{total}</span> 份
          · 建议别超过 13 份
        </div>

        <div className="space-y-3 px-5 py-5 md:px-7">
          {ingredients.map((ingredient) => (
            <div
              key={ingredient.key}
              className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-card/60 px-3 py-2.5"
            >
              <div>
                <div className="font-heading text-sm font-bold text-ink">{ingredient.label}</div>
                <div className="text-[11px] text-ink-soft">{ingredient.hint}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjust(ingredient.key, -1)}
                  className="grid size-8 place-items-center rounded-md border border-border text-ink-soft hover:border-cinnabar/40 hover:text-cinnabar"
                  aria-label={`减少${ingredient.label}`}
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="w-6 text-center font-heading text-lg font-bold text-ink">
                  {amounts[ingredient.key]}
                </span>
                <button
                  type="button"
                  onClick={() => adjust(ingredient.key, 1)}
                  className="grid size-8 place-items-center rounded-md border border-border text-ink-soft hover:border-cinnabar/40 hover:text-cinnabar"
                  aria-label={`增加${ingredient.label}`}
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
            </div>
          ))}

          {outcome ? (
            <div className={`rounded-md border px-4 py-3.5 ${toneStyles[outcome.tone]}`}>
              <div className="font-heading text-lg font-bold">{outcome.title}</div>
              <p className="mt-1 text-sm leading-relaxed">{outcome.detail}</p>
            </div>
          ) : null}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setOutcome(evaluate(amounts))}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-cinnabar py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-cinnabar-deep"
            >
              <Flame className="size-4" />
              点火
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2.5 text-sm text-ink-soft hover:border-cinnabar/40 hover:text-cinnabar"
            >
              <RotateCcw className="size-3.5" />
              重配
            </button>
          </div>
        </div>
      </PaperCard>

      <p className="mx-auto mt-4 max-w-2xl text-center text-[11px] leading-relaxed text-ink-soft/75">
        配方只为游戏效果，请勿模仿。现实中的火药制作危险且违法。
      </p>
    </div>
  )
}

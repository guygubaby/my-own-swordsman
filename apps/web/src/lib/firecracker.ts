export type IngredientKey = "saltpeter" | "sulfur" | "charcoal"

export type Outcome = {
  title: string
  detail: string
  tone: "good" | "meh" | "bad"
}

export function evaluate(amounts: Record<IngredientKey, number>): Outcome {
  const total = amounts.saltpeter + amounts.sulfur + amounts.charcoal
  if (total > 13) {
    return {
      title: "炸灶台",
      detail: "轰的一声，郭芙蓉脸熏成了花猫。灶台没事，锅没了。",
      tone: "bad",
    }
  }
  if (total < 6) {
    return {
      title: "哑炮",
      detail: "点了半天没响。众人探头去看，它又响了——没响。",
      tone: "meh",
    }
  }
  if (
    amounts.saltpeter >= 5 &&
    amounts.saltpeter <= 7 &&
    amounts.sulfur >= 2 &&
    amounts.sulfur <= 3 &&
    amounts.charcoal >= 1 &&
    amounts.charcoal <= 2
  ) {
    return {
      title: "大地春雷",
      detail: "响了，而且没炸着人。郭芙蓉宣布：今年的炮仗她包了。",
      tone: "good",
    }
  }
  return {
    title: "半响",
    detail: "响了一声就哑了。佟掌柜说，省着点，年里还要用。",
    tone: "meh",
  }
}

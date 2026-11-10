import raw from "./script-data.json"

export type ScriptQuote = { speaker: string; text: string }

export type Episode = {
  n: number
  title: string
  titleA: string
  titleB: string
  quoteCount: number
  sample: ScriptQuote | null
}

export type RawPair = {
  prompt: string
  answer: string
  promptSpeaker: string
  answerSpeaker: string
  episode: number
  score: number
}

const data = raw as { episodes: Episode[]; pairs: RawPair[] }

const sampleOverrides: Record<number, ScriptQuote> = {
  1: { speaker: "郭芙蓉", text: "我不就是随便给你们玩了一招排山倒海……" },
  2: { speaker: "郭芙蓉", text: "排山倒海！白展堂你完蛋啦" },
  10: { speaker: "燕小六", text: "帮我照顾好我七舅姥爷三外甥的前一个丈母娘！" },
  14: { speaker: "吕秀才", text: "未雨绸缪挖地道。" },
  15: { speaker: "佟湘玉", text: "我知道，这是盗圣的玉牌。" },
  20: { speaker: "郭芙蓉", text: "我欠掌柜的一顿饺子，也欠大家一个新年，明天一天我全部还上。" },
  31: { speaker: "祝无双", text: "放着我来，这点小事哪能让掌柜的亲自动手。" },
  41: { speaker: "吕秀才", text: "深呼吸，世界如此美妙！" },
  50: { speaker: "邢育森", text: "我看好你。" },
  70: { speaker: "郭芙蓉", text: "飞碟！——排山倒海！" },
}

export const episodes: Episode[] = data.episodes.map((episode) => ({
  ...episode,
  sample: sampleOverrides[episode.n] ?? episode.sample,
}))
export const rawPairs: RawPair[] = data.pairs
export const episodeByNumber = new Map(episodes.map((episode) => [episode.n, episode]))

export function cleanLine(text: string | null | undefined): string | null {
  if (!text) return null
  const cleaned = text
    .replace(/（[^）]*）/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[，。！？、…\s]+|[，。！？、…\s]+$/g, "")
    .trim()
  return cleaned.length >= 3 ? cleaned : null
}

export const highlights: Record<number, string[]> = {
  1: ["郭芙蓉怒砸同福店", "白展堂葵花点穴手初登场", "佟湘玉妙点迷路人"],
  14: ["邢捕头勇破杀鸡案", "防盗八法试点", "全员后院挖地道"],
  15: ["雷老五潜入县衙门", "地道直通衙门", "盗圣玉牌"],
  20: ["佟湘玉深夜偷包饺子", "郭芙蓉浆糊饺子吐丝", "手搓大地春雷哑炮", "炮仗当柴火烧炸灶台"],
  80: ["燕小六接到调职令", "凌腾云夜袭同福店"],
}

export function episodeLinks(n: number) {
  const query = encodeURIComponent(`武林外传 第${n}集`)
  return [
    {
      label: "爱奇艺",
      note: "官方高清",
      href: `https://so.iqiyi.com/so/q_${query}`,
    },
    {
      label: "央视网",
      note: "免费 · 选集",
      href: "https://tv.cctv.com/2012/12/03/VIDA1354531513618469.shtml",
    },
    {
      label: "央视频",
      note: "80 集专辑",
      href: "https://m.yangshipin.cn/portrait_video?type=0&cid=zbl088xi88odwt8&vid=s00006439gs",
    },
  ]
}

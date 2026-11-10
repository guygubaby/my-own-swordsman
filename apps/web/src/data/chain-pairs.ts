import { cleanLine, rawPairs } from "./episodes"

export type ChainPair = {
  prompt: string
  answer: string
  promptSpeaker: string
  answerSpeaker: string
  episode: number
  source: "curated" | "script"
}

const curated: ChainPair[] = [
  {
    prompt: "此言差矣，子曾经曰过……",
    answer: "去，算你的帐去。",
    promptSpeaker: "吕秀才",
    answerSpeaker: "白展堂",
    episode: 1,
    source: "curated",
  },
  {
    prompt: "排山倒海！",
    answer: "葵花点穴手！",
    promptSpeaker: "郭芙蓉",
    answerSpeaker: "白展堂",
    episode: 1,
    source: "curated",
  },
  {
    prompt: "我跟你拼了我！葵花点穴！",
    answer: "排山倒海！",
    promptSpeaker: "白展堂",
    answerSpeaker: "郭芙蓉",
    episode: 2,
    source: "curated",
  },
  {
    prompt: "我错了，我真的错了。",
    answer: "你错哪儿了？",
    promptSpeaker: "佟湘玉",
    answerSpeaker: "白展堂",
    episode: 11,
    source: "curated",
  },
  {
    prompt: "深呼吸，世界如此美妙！",
    answer: "我却如此暴躁！",
    promptSpeaker: "吕秀才",
    answerSpeaker: "郭芙蓉",
    episode: 41,
    source: "curated",
  },
  {
    prompt: "放着我来，这点小事哪能让掌柜的亲自动手。",
    answer: "把你的爪子拿开，自己的事情自己会处理！",
    promptSpeaker: "祝无双",
    answerSpeaker: "佟湘玉",
    episode: 31,
    source: "curated",
  },
  {
    prompt: "我看好你。",
    answer: "我也看好我喔。",
    promptSpeaker: "邢育森",
    answerSpeaker: "郭芙蓉",
    episode: 50,
    source: "curated",
  },
  {
    prompt: "帮我照顾好我七舅姥爷三外甥的前一个丈母娘！",
    answer: "没那闲功夫！",
    promptSpeaker: "燕小六",
    answerSpeaker: "众人",
    episode: 10,
    source: "curated",
  },
  {
    prompt: "你是掌门呀，我是掌柜的，隔行如隔山，咱俩怎么斗呀？",
    answer: "大不了，我也当掌柜的，肯定比你强一百倍！",
    promptSpeaker: "佟湘玉",
    answerSpeaker: "莫小贝",
    episode: 38,
    source: "curated",
  },
  {
    prompt: "你接着念哪！掌柜的后面说啥了？",
    answer: "永别了我的伙计们！永别了我的同福客栈！——你们敬爱的佟掌柜",
    promptSpeaker: "李大嘴",
    answerSpeaker: "吕秀才",
    episode: 34,
    source: "curated",
  },
  {
    prompt: "展堂，你不是会点穴嘛，给他止止疼吧。",
    answer: "行，那我试试吧。葵花点穴手！",
    promptSpeaker: "佟湘玉",
    answerSpeaker: "白展堂",
    episode: 54,
    source: "curated",
  },
  {
    prompt: "为了当好这个姐姐，只好委屈你们俩一下了啊，看鞭！",
    answer: "飞碟！——排山倒海！",
    promptSpeaker: "佟湘玉",
    answerSpeaker: "郭芙蓉",
    episode: 70,
    source: "curated",
  },
  {
    prompt: "这这可是你自找的，排排排山山山——",
    answer: "葵花点穴手。",
    promptSpeaker: "郭芙蓉",
    answerSpeaker: "白展堂",
    episode: 19,
    source: "curated",
  },
  {
    prompt: "我不就是随便给你们玩了一招排山倒海……",
    answer: "你都给我排成这样了，还排啊，还有没点人性啊，啊？",
    promptSpeaker: "郭芙蓉",
    answerSpeaker: "白展堂",
    episode: 1,
    source: "curated",
  },
  {
    prompt: "少爷的身子跑堂的命——",
    answer: "客官，请接受我诚挚的祝福。",
    promptSpeaker: "白展堂",
    answerSpeaker: "白展堂",
    episode: 12,
    source: "curated",
  },
  {
    prompt: "我上面有人！",
    answer: "哎呀！",
    promptSpeaker: "范大娘",
    answerSpeaker: "白展堂",
    episode: 16,
    source: "curated",
  },
  {
    prompt: "确定一定以及肯定。",
    answer: "放了她们，她们祸害镇上的百姓怎么办？",
    promptSpeaker: "郭芙蓉",
    answerSpeaker: "佟湘玉",
    episode: 1,
    source: "curated",
  },
  {
    prompt: "葵花点穴手！",
    answer: "排山倒海！",
    promptSpeaker: "白展堂",
    answerSpeaker: "郭芙蓉",
    episode: 10,
    source: "curated",
  },
  {
    prompt: "排山倒海~",
    answer: "葵花点穴手！这回我是正当防卫。",
    promptSpeaker: "郭芙蓉",
    answerSpeaker: "白展堂",
    episode: 21,
    source: "curated",
  },
  {
    prompt: "葵花点穴手。点上了。",
    answer: "哈哈，闪开，排山再倒海。",
    promptSpeaker: "白展堂",
    answerSpeaker: "郭芙蓉",
    episode: 17,
    source: "curated",
  },
]

const fromScript: ChainPair[] = rawPairs
  .map((pair) => ({
    prompt: cleanLine(pair.prompt) ?? "",
    answer: cleanLine(pair.answer) ?? "",
    promptSpeaker: pair.promptSpeaker,
    answerSpeaker: pair.answerSpeaker,
    episode: pair.episode,
    source: "script" as const,
  }))
  .filter(
    (pair) =>
      pair.prompt.length >= 4 &&
      pair.answer.length >= 3 &&
      pair.prompt.length <= 40 &&
      pair.answer.length <= 80,
  )

function dedupe(pairs: ChainPair[]) {
  const seen = new Set<string>()
  return pairs.filter((pair) => {
    const key = `${pair.prompt}|${pair.answer}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export const chainPairs = dedupe([...curated, ...fromScript])

export function dailyPair(date = new Date()) {
  const day = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  )
  return chainPairs[day % chainPairs.length]
}

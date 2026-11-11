import { useState } from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowRight,
  Check,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  X,
} from "lucide-react"
import { AuthBar } from "@/components/auth-bar"
import {
  EmptyState,
  LoadingState,
  PaperCard,
  SectionTitle,
} from "@/components/site-chrome"
import { dailyPair } from "@/data/chain-pairs"
import { api, type ThreadSummary } from "@/lib/api"
import { authClient } from "@/lib/auth-client"
import { dayjs } from "@/lib/dayjs"

export const Route = createFileRoute("/chain/")({
  component: ChainPage,
})

const categories = [
  { value: "all", label: "全部" },
  { value: "chain", label: "接龙" },
  { value: "chat", label: "闲聊" },
  { value: "lore", label: "考据" },
] as const

type CategoryFilter = (typeof categories)[number]["value"]

const categoryLabel: Record<string, string> = {
  chain: "接龙",
  chat: "闲聊",
  lore: "考据",
}

function todayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
}

function DailyChain() {
  const pair = dailyPair()
  const [guess, setGuess] = useState("")
  const [revealed, setRevealed] = useState(false)
  const [judged, setJudged] = useState(
    () => localStorage.getItem("tongfu:last") === todayKey(),
  )
  const [streak, setStreak] = useState(() =>
    Number(localStorage.getItem("tongfu:streak") ?? 0),
  )

  function judge(ok: boolean) {
    const next = ok ? streak + 1 : 0
    setStreak(next)
    setJudged(true)
    localStorage.setItem("tongfu:streak", String(next))
    localStorage.setItem("tongfu:last", todayKey())
  }

  return (
    <PaperCard className="overflow-hidden">
      <div className="border-b border-border/60 bg-cinnabar/[0.04] px-5 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[10px] font-medium tracking-[0.22em] text-cinnabar">
            <Sparkles className="size-3.5" />
            每日一接 · 第 {pair.episode} 回
          </div>
          <div className="text-[11px] text-ink-soft">
            连对 <span className="font-heading text-sm font-bold text-cinnabar">{streak}</span> 天
          </div>
        </div>
      </div>

      <div className="p-5 md:p-6">
        <div className="text-[11px] tracking-[0.18em] text-ink-soft">{pair.promptSpeaker}</div>
        <blockquote className="mt-1.5 font-heading text-xl leading-relaxed font-bold text-ink md:text-2xl">
          「{pair.prompt}」
        </blockquote>

        {!revealed ? (
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <input
              value={guess}
              onChange={(event) => setGuess(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") setRevealed(true)
              }}
              placeholder="下一句是……"
              className="h-10 flex-1 rounded-md border border-input bg-card px-3 text-sm outline-none focus:border-cinnabar"
              aria-label="接下一句"
            />
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-cinnabar px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-cinnabar-deep"
            >
              对答案
              <ArrowRight className="size-4" />
            </button>
          </div>
        ) : (
          <div className="mt-5 rounded-md border border-gold/30 bg-paper-deep/40 p-4">
            <div className="text-[11px] tracking-[0.18em] text-ink-soft">
              {pair.answerSpeaker} 接
            </div>
            <div className="mt-1 font-heading text-base leading-relaxed font-bold text-ink md:text-lg">
              「{pair.answer}」
            </div>
            {guess.trim() ? (
              <div className="mt-3 border-t border-gold/20 pt-2 text-xs text-ink-soft">
                你接的是：「{guess.trim()}」
              </div>
            ) : null}
            {!judged ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => judge(true)}
                  className="inline-flex items-center gap-1 rounded-md bg-jade px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                >
                  <Check className="size-3.5" />
                  接上了
                </button>
                <button
                  type="button"
                  onClick={() => judge(false)}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs text-ink-soft hover:border-cinnabar/40 hover:text-cinnabar"
                >
                  <X className="size-3.5" />
                  没接上
                </button>
              </div>
            ) : (
              <p className="mt-3 text-xs text-ink-soft">
                今日已记账，明天再来。连对 {streak} 天。
              </p>
            )}
          </div>
        )}
      </div>
    </PaperCard>
  )
}

function Composer({ onDone }: { onDone: () => void }) {
  const { data: session } = authClient.useSession()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [category, setCategory] = useState("chain")
  const registered = Boolean(session?.user && !session.user.isAnonymous)

  const mutation = useMutation({
    mutationFn: (input: { title: string; body: string; category: string }) =>
      api.post("threads", { json: input }).json<{ thread: ThreadSummary }>(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["threads"] })
      setTitle("")
      setBody("")
      onDone()
    },
  })

  if (!registered) {
    return (
      <PaperCard className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-ink-soft">
        <span>注册 / 登录后才能开帖。</span>
        <Link
          to="/login"
          className="rounded-md bg-cinnabar px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-cinnabar-deep"
        >
          登录 / 注册
        </Link>
      </PaperCard>
    )
  }

  return (
    <PaperCard className="p-4 md:p-5">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate({ title: title.trim(), body: body.trim(), category })
        }}
        className="space-y-3"
      >
        <div className="flex flex-wrap gap-2">
          {(["chain", "chat", "lore"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              className={
                category === value
                  ? "rounded-md bg-cinnabar px-2.5 py-1 text-xs font-medium text-primary-foreground"
                  : "rounded-md border border-border px-2.5 py-1 text-xs text-ink-soft hover:border-cinnabar/40 hover:text-cinnabar"
              }
            >
              {categoryLabel[value]}
            </button>
          ))}
        </div>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={80}
          placeholder="帖子题目，比如「小贝到底会不会当掌柜」"
          className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus:border-cinnabar"
        />
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="正文。接龙帖就先写一句上句。"
          className="w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-sm leading-relaxed outline-none focus:border-cinnabar"
        />
        {mutation.isError ? (
          <p className="text-xs text-cinnabar">发帖没成，看看是不是 API 没起。</p>
        ) : null}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-ink-soft">以「{session?.user.name}」的名义发</span>
          <button
            type="submit"
            disabled={mutation.isPending || !title.trim() || !body.trim()}
            className="inline-flex items-center gap-1.5 rounded-md bg-cinnabar px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-cinnabar-deep disabled:opacity-50"
          >
            <Send className="size-3.5" />
            {mutation.isPending ? "写着呢……" : "发帖"}
          </button>
        </div>
      </form>
    </PaperCard>
  )
}

function ChainPage() {
  const [category, setCategory] = useState<CategoryFilter>("all")
  const [composing, setComposing] = useState(false)

  const threadsQuery = useQuery({
    queryKey: ["threads"],
    queryFn: () => api.get("threads").json<{ threads: ThreadSummary[] }>(),
  })

  const threads = threadsQuery.data?.threads ?? []
  const filtered =
    category === "all" ? threads : threads.filter((thread) => thread.category === category)

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="帖子专区"
        title="台词接龙"
        description="每日一题，楼中楼接下去。也可以自己开帖，考据、闲聊、对暗号都行。"
      />

      <AuthBar />
      <DailyChain />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {categories.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setCategory(item.value)}
              className={
                category === item.value
                  ? "shrink-0 rounded-md bg-cinnabar px-3 py-1.5 text-xs font-medium text-primary-foreground"
                  : "shrink-0 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-ink-soft hover:border-cinnabar/40 hover:text-cinnabar"
              }
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setComposing((value) => !value)}
          className="inline-flex items-center gap-1.5 rounded-md border border-cinnabar/30 bg-cinnabar/5 px-3 py-1.5 text-xs font-medium text-cinnabar hover:bg-cinnabar/10"
        >
          <Plus className="size-3.5" />
          {composing ? "收起" : "开新帖"}
        </button>
      </div>

      {composing ? <Composer onDone={() => setComposing(false)} /> : null}

      {threadsQuery.isPending ? <LoadingState /> : null}

      {threadsQuery.isError ? (
        <PaperCard className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-sm text-ink-soft">
          帖子没拉下来，许是后厨忙不过来。
          <button
            type="button"
            onClick={() => void threadsQuery.refetch()}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs text-ink hover:text-cinnabar"
          >
            <RefreshCw className="size-3" />
            再试一次
          </button>
        </PaperCard>
      ) : null}

      {!threadsQuery.isPending && !threadsQuery.isError && filtered.length === 0 ? (
        <EmptyState
          title="这栏还空着"
          description="第一篇帖子等你写。别怕，掌柜的不查账。"
        />
      ) : null}

      <div className="space-y-3">
        {filtered.map((thread) => (
          <Link
            key={thread.id}
            to="/chain/$threadId"
            params={{ threadId: thread.id }}
            className="paper-panel group block rounded-lg p-4 transition-transform duration-200 hover:-translate-y-0.5 md:p-5"
          >
            <div className="flex flex-wrap items-center gap-2 text-[10px] tracking-wider text-ink-soft">
              <span className="rounded border border-cinnabar/25 bg-cinnabar/5 px-1.5 py-0.5 text-cinnabar">
                {categoryLabel[thread.category] ?? "闲聊"}
              </span>
              <span>{thread.author.name}</span>
              <span>·</span>
              <span>{dayjs(thread.createdAt).fromNow()}</span>
            </div>
            <div className="mt-2 font-heading text-base font-bold text-ink group-hover:text-cinnabar md:text-lg">
              {thread.title}
            </div>
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-soft">
              {thread.body}
            </p>
            <div className="mt-3 flex items-center gap-1 text-[11px] text-ink-soft">
              <MessageSquare className="size-3.5" />
              {thread._count.replies} 条接龙
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { HTTPError } from "ky"
import { LogIn, Send } from "lucide-react"
import { PaperCard } from "@/components/site-chrome"
import { api } from "@/lib/api"
import { authClient } from "@/lib/auth-client"
import {
  DANMAKU_COLORS,
  DANMAKU_MODES,
  QUICK_PHRASES,
  formatTime,
  type Danmaku,
  type DanmakuMode,
} from "@/lib/danmaku"

export function DanmakuComposer({
  episode,
  currentTime,
  onSent,
}: {
  episode: number
  currentTime: number
  onSent: (item: Danmaku) => void
}) {
  const { data: session } = authClient.useSession()
  const queryClient = useQueryClient()
  const [text, setText] = useState("")
  const [color, setColor] = useState<string>(DANMAKU_COLORS[0].value)
  const [mode, setMode] = useState<DanmakuMode>("scroll")
  const [error, setError] = useState<string | null>(null)
  const registered = Boolean(session?.user && !session.user.isAnonymous)

  const mutation = useMutation({
    mutationFn: (input: {
      timeMs: number
      text: string
      color: string
      mode: DanmakuMode
    }) =>
      api
        .post(`episodes/${episode}/danmaku`, { json: input })
        .json<{ danmaku: Danmaku }>(),
    onSuccess: (data) => {
      setText("")
      setError(null)
      onSent(data.danmaku)
      void queryClient.invalidateQueries({ queryKey: ["danmaku", episode] })
    },
    onError: async (mutationError) => {
      if (mutationError instanceof HTTPError) {
        const body = await mutationError.response
          .json<{ error?: { message?: string } }>()
          .catch(() => null)
        setError(body?.error?.message ?? "弹幕没发出去，再试一次。")
      } else {
        setError("弹幕没发出去，再试一次。")
      }
    },
  })

  function send() {
    if (!text.trim() || mutation.isPending) return
    mutation.mutate({
      timeMs: Math.round(currentTime * 1000),
      text: text.trim(),
      color,
      mode,
    })
  }

  if (!registered) {
    return (
      <PaperCard className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
        <div>
          <div className="font-heading text-sm font-bold text-ink">
            发弹幕先注册
          </div>
          <p className="mt-0.5 text-[11px] text-ink-soft">
            注册 / 登录后才能发弹幕，和接龙区共用同一个账号。
          </p>
          {error ? <p className="mt-1 text-[11px] text-cinnabar">{error}</p> : null}
        </div>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 rounded-md bg-cinnabar px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-cinnabar-deep"
        >
          <LogIn className="size-3.5" />
          登录 / 注册
        </Link>
      </PaperCard>
    )
  }

  return (
    <PaperCard className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-soft">
        <span>
          以「{session?.user.name}」的名义发 · 将在 {formatTime(currentTime)} 出现
        </span>
        <span>最多 40 字 · 2 秒冷却</span>
      </div>

      <div className="mt-2 flex gap-2">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") send()
          }}
          maxLength={40}
          placeholder="发一条弹幕……"
          className="h-10 min-w-0 flex-1 rounded-md border border-input bg-card px-3 text-sm outline-none focus:border-cinnabar"
          aria-label="弹幕内容"
        />
        <button
          type="button"
          onClick={send}
          disabled={mutation.isPending || !text.trim()}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md bg-cinnabar px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-cinnabar-deep disabled:opacity-50"
        >
          <Send className="size-3.5" />
          {mutation.isPending ? "发着……" : "发"}
        </button>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5" aria-label="弹幕颜色">
          {DANMAKU_COLORS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setColor(item.value)}
              aria-label={`弹幕颜色：${item.label}`}
              className={
                color === item.value
                  ? "size-5 rounded-full border-2 border-ink ring-2 ring-cinnabar/40"
                  : "size-5 rounded-full border border-ink/20"
              }
              style={{ backgroundColor: item.value }}
            />
          ))}
        </div>

        <div className="flex items-center gap-0.5 rounded-md bg-muted/70 p-0.5">
          {DANMAKU_MODES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setMode(item.value)}
              className={
                mode === item.value
                  ? "rounded bg-card px-2 py-0.5 text-[11px] font-medium text-cinnabar shadow-sm"
                  : "rounded px-2 py-0.5 text-[11px] text-ink-soft hover:text-ink"
              }
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {QUICK_PHRASES.map((phrase) => (
          <button
            key={phrase}
            type="button"
            onClick={() => setText(phrase)}
            className="rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] text-ink-soft transition-colors hover:border-cinnabar/40 hover:text-cinnabar"
          >
            {phrase}
          </button>
        ))}
      </div>

      {error ? <p className="mt-2 text-xs text-cinnabar">{error}</p> : null}
    </PaperCard>
  )
}

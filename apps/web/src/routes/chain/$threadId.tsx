import { useState } from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, MessageSquare, Send } from "lucide-react"
import { AuthBar } from "@/components/auth-bar"
import {
  EmptyState,
  LoadingState,
  PaperCard,
  SectionTitle,
} from "@/components/site-chrome"
import { api, type ThreadDetail } from "@/lib/api"
import { authClient } from "@/lib/auth-client"
import { dayjs } from "@/lib/dayjs"

export const Route = createFileRoute("/chain/$threadId")({
  component: ThreadPage,
})

const categoryLabel: Record<string, string> = {
  chain: "接龙",
  chat: "闲聊",
  lore: "考据",
}

function ReplyForm({ threadId }: { threadId: string }) {
  const { data: session } = authClient.useSession()
  const queryClient = useQueryClient()
  const [body, setBody] = useState("")
  const registered = Boolean(session?.user && !session.user.isAnonymous)

  const mutation = useMutation({
    mutationFn: (content: string) =>
      api
        .post(`threads/${threadId}/replies`, { json: { body: content } })
        .json<{ reply: unknown }>(),
    onSuccess: () => {
      setBody("")
      void queryClient.invalidateQueries({ queryKey: ["thread", threadId] })
      void queryClient.invalidateQueries({ queryKey: ["threads"] })
    },
  })

  if (!registered) {
    return (
      <PaperCard className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-ink-soft">
        <span>注册 / 登录后才能接龙。</span>
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
    <PaperCard className="p-4">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (body.trim()) mutation.mutate(body.trim())
        }}
        className="space-y-2"
      >
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="接下一句……"
          className="w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-sm leading-relaxed outline-none focus:border-cinnabar"
        />
        {mutation.isError ? (
          <p className="text-xs text-cinnabar">没接上，看看 API 起来没有。</p>
        ) : null}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-ink-soft">以「{session?.user.name}」的名义接</span>
          <button
            type="submit"
            disabled={mutation.isPending || !body.trim()}
            className="inline-flex items-center gap-1.5 rounded-md bg-cinnabar px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-cinnabar-deep disabled:opacity-50"
          >
            <Send className="size-3.5" />
            {mutation.isPending ? "接着呢……" : "接上"}
          </button>
        </div>
      </form>
    </PaperCard>
  )
}

function ThreadPage() {
  const { threadId } = Route.useParams()
  const query = useQuery({
    queryKey: ["thread", threadId],
    queryFn: () =>
      api.get(`threads/${threadId}`).json<{ thread: ThreadDetail }>(),
  })

  if (query.isPending) {
    return (
      <div className="py-8">
        <LoadingState label="正在翻帖子……" />
      </div>
    )
  }

  if (query.isError || !query.data) {
    return (
      <div className="py-8">
        <EmptyState
          title="这帖没找着"
          description="可能被掌柜的收走了，也可能链接不对。"
          action={
            <Link to="/chain" className="mt-3 text-sm font-medium text-cinnabar">
              回接龙专区
            </Link>
          }
        />
      </div>
    )
  }

  const { thread } = query.data

  return (
    <div>
      <Link
        to="/chain"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-cinnabar"
      >
        <ArrowLeft className="size-4" />
        回接龙专区
      </Link>

      <div className="mb-5">
        <AuthBar />
      </div>

      <article className="paper-panel rounded-xl p-5 md:p-7">
        <div className="flex flex-wrap items-center gap-2 text-[10px] tracking-wider text-ink-soft">
          <span className="rounded border border-cinnabar/25 bg-cinnabar/5 px-1.5 py-0.5 text-cinnabar">
            {categoryLabel[thread.category] ?? "闲聊"}
          </span>
          <span>{thread.author.name}</span>
          <span>·</span>
          <span>{dayjs(thread.createdAt).fromNow()}</span>
        </div>
        <h1 className="mt-3 font-heading text-2xl leading-snug font-bold text-ink md:text-3xl">
          {thread.title}
        </h1>
        {thread.quotePrompt ? (
          <blockquote className="mt-3 border-l-2 border-gold/50 pl-3 font-heading text-base text-ink-soft">
            上句：「{thread.quotePrompt}」
          </blockquote>
        ) : null}
        <p className="mt-4 text-sm leading-7 whitespace-pre-wrap text-ink">{thread.body}</p>
      </article>

      <section className="mt-8">
        <SectionTitle
          kicker={`${thread.replies.length} 条接龙`}
          title="楼下接着说"
          className="mb-4"
        />

        {thread.replies.length === 0 ? (
          <PaperCard className="px-4 py-8 text-center text-sm text-ink-soft">
            还没人接。你可以起个头。
          </PaperCard>
        ) : (
          <div className="space-y-2.5">
            {thread.replies.map((reply, index) => (
              <PaperCard key={reply.id} className="px-4 py-3.5">
                <div className="flex items-center justify-between gap-2 text-[10px] tracking-wider text-ink-soft">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="grid size-5 place-items-center rounded-full bg-cinnabar/10 font-heading text-[10px] text-cinnabar">
                      {index + 1}
                    </span>
                    {reply.author.name}
                  </span>
                  <span>{dayjs(reply.createdAt).fromNow()}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-ink">
                  {reply.body}
                </p>
              </PaperCard>
            ))}
          </div>
        )}

        <div className="mt-5">
          <ReplyForm threadId={thread.id} />
        </div>
      </section>

      <p className="mt-6 flex items-center gap-1.5 text-[11px] text-ink-soft/75">
        <MessageSquare className="size-3" />
        帖子为腐竹发言，不代表版权方立场。
      </p>
    </div>
  )
}

import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { LogOut, Pencil, UserRound } from "lucide-react"
import { PaperCard } from "@/components/site-chrome"
import { authClient } from "@/lib/auth-client"
import { clearAllProgress } from "@/lib/watch-progress"

export function AuthBar() {
  const { data: session, isPending, refetch } = authClient.useSession()
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)

  const registered = Boolean(session?.user && !session.user.isAnonymous)

  async function saveName() {
    const trimmed = name.trim()
    if (!trimmed) return
    setBusy(true)
    setError(null)
    try {
      const result = await authClient.updateUser({ name: trimmed })
      if (result.error) setError(result.error.message ?? "改名失败。")
      setEditing(false)
      await refetch()
    } finally {
      setBusy(false)
    }
  }

  async function signOut() {
    setBusy(true)
    try {
      await authClient.signOut()
      clearAllProgress()
      await refetch()
    } finally {
      setBusy(false)
    }
  }

  if (isPending) {
    return (
      <PaperCard className="px-4 py-3 text-xs text-ink-soft">正在认人……</PaperCard>
    )
  }

  if (!registered) {
    return (
      <PaperCard className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
        <div>
          <div className="font-heading text-sm font-bold text-ink">先注册，再进店</div>
          <p className="mt-0.5 text-[11px] leading-relaxed text-ink-soft">
            {session?.user?.isAnonymous
              ? "你现在的游客马甲不能发帖、发弹幕，注册一个正式账号就都能用了。"
              : "发帖、接龙、发弹幕、同步观看进度，都需要注册账号。"}
          </p>
          {error ? <p className="mt-1 text-[11px] text-cinnabar">{error}</p> : null}
        </div>
        <Link
          to="/login"
          className="rounded-md bg-cinnabar px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-cinnabar-deep"
        >
          登录 / 注册
        </Link>
      </PaperCard>
    )
  }

  return (
    <PaperCard className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-cinnabar/10 text-cinnabar">
          <UserRound className="size-4" />
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-ink">{session?.user.name}</div>
          <div className="text-[10px] tracking-wider text-ink-soft">当前账号</div>
        </div>
      </div>

      {editing ? (
        <div className="flex items-center gap-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={20}
            className="h-8 w-32 rounded-md border border-input bg-card px-2.5 text-sm outline-none focus:border-cinnabar"
            aria-label="新昵称"
          />
          <button
            type="button"
            onClick={() => void saveName()}
            disabled={busy || !name.trim()}
            className="rounded-md bg-cinnabar px-2.5 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
          >
            存
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-md px-2 py-1.5 text-xs text-ink-soft hover:bg-ink/5"
          >
            算了
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setName(session?.user.name ?? "")
              setEditing(true)
            }}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-ink-soft hover:bg-ink/5 hover:text-ink"
          >
            <Pencil className="size-3" />
            改个名
          </button>
          <button
            type="button"
            onClick={() => void signOut()}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-ink-soft hover:bg-ink/5 hover:text-ink disabled:opacity-60"
          >
            <LogOut className="size-3" />
            退出
          </button>
        </div>
      )}
      {error ? <p className="w-full text-[11px] text-cinnabar">{error}</p> : null}
    </PaperCard>
  )
}

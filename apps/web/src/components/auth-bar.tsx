import { useState } from "react"
import { LogOut, Pencil, UserRound } from "lucide-react"
import { PaperCard } from "@/components/site-chrome"
import { authClient } from "@/lib/auth-client"
import { signInGuest } from "@/lib/guest"

export function AuthBar() {
  const { data: session, isPending, refetch } = authClient.useSession()
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function signIn() {
    setBusy(true)
    setError(null)
    try {
      const result = await signInGuest()
      if (result.error) {
        setError(result.error.message ?? "进店失败，再试一次。")
      }
      await refetch()
    } catch {
      setError("进店失败，看看 API 起来没有。")
    } finally {
      setBusy(false)
    }
  }

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

  if (!session) {
    return (
      <PaperCard className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
        <div>
          <div className="font-heading text-sm font-bold text-ink">先领个马甲</div>
          <p className="mt-0.5 text-[11px] leading-relaxed text-ink-soft">
            游客身份进店，不用手机号。发帖、接龙都认这个马甲。
          </p>
          {error ? <p className="mt-1 text-[11px] text-cinnabar">{error}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => void signIn()}
          disabled={busy}
          className="rounded-md bg-cinnabar px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-cinnabar-deep disabled:opacity-60"
        >
          {busy ? "进店中……" : "以游客身份进店"}
        </button>
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
          <div className="truncate text-sm font-medium text-ink">{session.user.name}</div>
          <div className="text-[10px] tracking-wider text-ink-soft">当前马甲</div>
        </div>
      </div>

      {editing ? (
        <div className="flex items-center gap-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={20}
            className="h-8 w-32 rounded-md border border-input bg-card px-2.5 text-sm outline-none focus:border-cinnabar"
            aria-label="新马甲名"
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
              setName(session.user.name)
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

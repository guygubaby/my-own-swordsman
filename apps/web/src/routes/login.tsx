import { useState, type FormEvent } from "react"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { LogIn, UserPlus } from "lucide-react"
import { SectionTitle } from "@/components/site-chrome"
import { authClient } from "@/lib/auth-client"
import { syncProgress } from "@/lib/watch-progress"

export const Route = createFileRoute("/login")({
  component: LoginPage,
})

type Mode = "signin" | "signup"

function friendlyError(message?: string) {
  if (!message) return "操作失败，再试一次。"
  const lower = message.toLowerCase()
  if (lower.includes("invalid email or password")) return "邮箱或密码不对。"
  if (lower.includes("already exists") || lower.includes("user already")) {
    return "这个邮箱已经注册过了，直接登录吧。"
  }
  if (lower.includes("password") && (lower.includes("length") || lower.includes("short"))) {
    return "密码至少 8 位。"
  }
  return message
}

function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>("signin")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    if (password.length < 8) {
      setError("密码至少 8 位。")
      return
    }
    setBusy(true)
    setError(null)

    const address = email.trim()
    const result =
      mode === "signup"
        ? await authClient.signUp.email({
            email: address,
            password,
            name: name.trim() || address.split("@")[0] || "同福客人",
          })
        : await authClient.signIn.email({ email: address, password })

    if (result.error) {
      setError(friendlyError(result.error.message))
      setBusy(false)
      return
    }

    await syncProgress()
    setBusy(false)
    await navigate({ to: "/" })
  }

  return (
    <div className="mx-auto max-w-md py-8">
      <Link
        to="/"
        className="text-sm text-ink-soft transition-colors hover:text-cinnabar"
      >
        ← 回同福客栈
      </Link>

      <div className="paper-panel mt-5 rounded-xl px-6 py-8">
        <SectionTitle
          kicker="同福客栈 · 门房"
          title={mode === "signin" ? "登录" : "注册"}
        />
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          注册后才能发弹幕、接龙、发帖、连接插件，观看进度也会跟着账号走。
        </p>

        <div className="mt-5 flex gap-1 rounded-md bg-muted/70 p-0.5">
          {(
            [
              { value: "signin", label: "登录" },
              { value: "signup", label: "注册" },
            ] as const
          ).map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                setMode(item.value)
                setError(null)
              }}
              className={
                mode === item.value
                  ? "flex-1 rounded bg-card px-3 py-1.5 text-sm font-medium text-cinnabar shadow-sm"
                  : "flex-1 rounded px-3 py-1.5 text-sm text-ink-soft hover:text-ink"
              }
            >
              {item.label}
            </button>
          ))}
        </div>

        <form className="mt-5 space-y-4" onSubmit={(event) => void submit(event)}>
          {mode === "signup" ? (
            <div>
              <label htmlFor="login-name" className="text-xs text-ink-soft">
                昵称
              </label>
              <input
                id="login-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={20}
                autoComplete="nickname"
                placeholder="别人在弹幕里看到的名字"
                className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus:border-cinnabar"
              />
            </div>
          ) : null}

          <div>
            <label htmlFor="login-email" className="text-xs text-ink-soft">
              邮箱
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus:border-cinnabar"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="text-xs text-ink-soft">
              密码
            </label>
            <input
              id="login-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder="至少 8 位"
              className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus:border-cinnabar"
            />
          </div>

          {error ? <p className="text-xs text-cinnabar">{error}</p> : null}

          <button
            type="submit"
            disabled={busy || !email.trim() || !password}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-cinnabar px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-cinnabar-deep disabled:opacity-50"
          >
            {mode === "signin" ? (
              <LogIn className="size-3.5" />
            ) : (
              <UserPlus className="size-3.5" />
            )}
            {busy ? "稍等……" : mode === "signin" ? "登录" : "注册并登录"}
          </button>
        </form>
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import { Check, Copy, Download, Loader2, Puzzle } from "lucide-react"
import { api } from "@/lib/api"
import { authClient } from "@/lib/auth-client"
import { signInGuest } from "@/lib/guest"
import { SectionTitle } from "@/components/site-chrome"

export const Route = createFileRoute("/connect-extension")({
  component: ConnectExtensionPage,
})

type TokenResponse = { token: string; user: { id: string; name: string } }

function ConnectExtensionPage() {
  const [token, setToken] = useState<string | null>(null)
  const [nickname, setNickname] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const startedRef = useRef(false)
  const tokenRef = useRef<string | null>(null)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    void (async () => {
      try {
        const session = await authClient.getSession()
        if (!session.data?.user) {
          await signInGuest()
        }
        const result = await api
          .post("extension/token")
          .json<TokenResponse>()
        setToken(result.token)
        tokenRef.current = result.token
        setNickname(result.user.name)
        // 给插件的内容脚本（注入在本站）递令牌；同源 postMessage 不会被第三方读到。
        window.postMessage(
          { type: "tongfu-extension:token", token: result.token },
          window.location.origin,
        )
      } catch {
        setError("签发失败，刷新再试一次。")
      }
    })()
  }, [])

  // 插件的内容脚本可能比页面晚就绪，等它喊 ready 再递一次。
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      if (event.data?.type !== "tongfu-extension:ready") return
      if (!tokenRef.current) return
      window.postMessage(
        { type: "tongfu-extension:token", token: tokenRef.current },
        window.location.origin,
      )
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  return (
    <div className="mx-auto max-w-2xl py-8">
      <Link
        to="/watch"
        search={{ q: undefined }}
        className="text-sm text-ink-soft transition-colors hover:text-cinnabar"
      >
        ← 回追剧指南
      </Link>

      <div className="paper-panel mt-5 rounded-xl px-6 py-8">
        <SectionTitle kicker="浏览器插件" title="连接同福账号" />

        {error ? (
          <p className="mt-4 text-sm text-cinnabar">{error}</p>
        ) : token ? (
          <>
            <p className="mt-4 flex items-center gap-2 text-sm text-ink">
              <Check className="size-4 text-cinnabar" />
              已连接{nickname ? `为「${nickname}」` : ""}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              回到央视网《武林外传》页面刷新一下，右上角就会出现「同福弹幕」。
              这个页面可以关掉了。
            </p>

            <p className="mt-6 text-[11px] tracking-widest text-ink-soft">
              自动连接失败时，把这串令牌粘到插件里：
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-md border border-border bg-card px-3 py-2 font-mono text-[11px]">
                {token}
              </code>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(token)
                  setCopied(true)
                }}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-2 text-xs transition-colors hover:border-cinnabar/40 hover:text-cinnabar"
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "已复制" : "复制"}
              </button>
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-ink-soft">
              令牌等价于你的游客身份，只存哈希在服务端，可以随时在插件里断开。
              请不要发给别人。
            </p>
          </>
        ) : (
          <p className="mt-4 flex items-center gap-2 text-sm text-ink-soft">
            <Loader2 className="size-4 animate-spin" />
            正在签发令牌……
          </p>
        )}

        <div className="mt-8 rounded-lg border border-border bg-card px-4 py-3 text-[11px] leading-relaxed text-ink-soft">
          <p className="flex items-center gap-1.5 text-ink">
            <Puzzle className="size-3.5" />
            还没装插件？
          </p>
          <p className="mt-1">
            插件只在央视网《武林外传》页面注入弹幕层，不改动视频流、不影响登录。
          </p>
          <a
            href="/tongfu-danmaku-extension.zip"
            download
            className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-cinnabar px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-cinnabar/90"
          >
            <Download className="size-3.5" />
            下载插件（zip）
          </a>
          <p className="mt-2">
            解压后打开 <code>chrome://extensions</code>，开启右上角「开发者模式」，
            点「加载已解压的扩展程序」，选解压出来的文件夹。
          </p>
        </div>
      </div>
    </div>
  )
}

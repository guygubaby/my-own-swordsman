import type { ComponentType, PropsWithChildren, ReactNode } from "react"
import { Link, useRouterState } from "@tanstack/react-router"
import {
  Gamepad2,
  Home,
  MessagesSquare,
  ShoppingBag,
  TvMinimalPlay,
  UserRound,
} from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

type NavItem = {
  to: "/" | "/watch" | "/chain" | "/games" | "/shop"
  label: string
  icon: ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { to: "/", label: "首页", icon: Home },
  { to: "/watch", label: "追剧", icon: TvMinimalPlay },
  { to: "/chain", label: "接龙", icon: MessagesSquare },
  { to: "/games", label: "小游戏", icon: Gamepad2 },
  { to: "/shop", label: "周边", icon: ShoppingBag },
]

function isActive(pathname: string, to: string) {
  return to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`)
}

export function Seal({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "seal-shadow grid size-11 shrink-0 -rotate-3 place-items-center rounded-[10px] bg-cinnabar text-primary-foreground",
        className,
      )}
      aria-hidden="true"
    >
      <span className="font-heading text-[15px] leading-[1.02] font-bold tracking-tight">
        同
        <br />
        福
      </span>
    </div>
  )
}

export function SiteHeader() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { data: session } = authClient.useSession()
  const registered = Boolean(session?.user && !session.user.isAnonymous)

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-3">
          <Seal />
          <div className="leading-tight">
            <div className="font-heading text-xl font-bold tracking-wide">同福娱乐镇</div>
            <div className="text-[10px] tracking-[0.2em] text-ink-soft">七侠镇 · 同福客栈</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="主导航">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(pathname, item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-cinnabar/10 font-medium text-cinnabar"
                    : "text-ink-soft hover:bg-ink/5 hover:text-ink",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <Link
          to={registered ? "/chain" : "/login"}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
        >
          <UserRound className="size-3.5" />
          <span className="max-w-24 truncate">
            {registered ? session?.user.name : "登录 / 注册"}
          </span>
        </Link>
      </div>
    </header>
  )
}

export function BottomNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-paper/95 backdrop-blur-md md:hidden"
      aria-label="底部导航"
    >
      <div className="grid grid-cols-5">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(pathname, item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors",
                active ? "text-cinnabar" : "text-ink-soft",
              )}
            >
              <Icon className={cn("size-5", active && "stroke-[2.4]")} />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export function SiteFooter() {
  return (
    <footer className="mt-14 border-t border-border/60 pb-24 pt-7 md:pb-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 text-[11px] leading-relaxed text-ink-soft">
        <p>
          同福娱乐镇是腐竹自制的非官方粉丝作品，与版权方无关。剧集、台词、剧照版权归原权利人，侵删。
        </p>
        <div className="flex gap-4">
          <Link to="/about" className="hover:text-cinnabar">
            关于与免责声明
          </Link>
          <Link to="/shop" className="hover:text-cinnabar">
            官方周边情报
          </Link>
        </div>
        <p className="text-ink-soft/70">餐饮洗浴一条龙，娱乐休闲一体化。美滴狠，美滴狠。</p>
      </div>
    </footer>
  )
}

export function SectionTitle({
  kicker,
  title,
  description,
  className,
}: {
  kicker?: string
  title: ReactNode
  description?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("mb-5", className)}>
      {kicker ? (
        <div className="mb-1.5 flex items-center gap-2 text-[10px] font-medium tracking-[0.24em] text-cinnabar">
          <span className="h-px w-6 bg-cinnabar/60" />
          {kicker}
        </div>
      ) : null}
      <h2 className="font-heading text-2xl font-bold tracking-wide text-ink md:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">{description}</p>
      ) : null}
    </div>
  )
}

export function PaperCard({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) {
  return <div className={cn("paper-panel rounded-lg", className)}>{children}</div>
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <PaperCard className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <div className="font-heading text-lg font-bold text-ink">{title}</div>
      {description ? <p className="text-sm text-ink-soft">{description}</p> : null}
      {action}
    </PaperCard>
  )
}

export function LoadingState({ label = "掌柜的正在翻账本……" }: { label?: string }) {
  return (
    <PaperCard className="flex items-center justify-center gap-3 px-6 py-10 text-sm text-ink-soft">
      <span className="size-3 animate-pulse rounded-full bg-cinnabar" />
      {label}
    </PaperCard>
  )
}

export function ExternalButton({
  href,
  children,
  className,
}: PropsWithChildren<{ href: string; className?: string }>) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-cinnabar/40 hover:bg-cinnabar/5 hover:text-cinnabar",
        className,
      )}
    >
      {children}
    </a>
  )
}

import { Link, Outlet, createRootRoute } from "@tanstack/react-router"
import {
  BottomNav,
  EmptyState,
  SiteFooter,
  SiteHeader,
} from "@/components/site-chrome"

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-4 pt-6 md:pt-8">
        <Outlet />
      </main>
      <SiteFooter />
      <BottomNav />
    </div>
  )
}

function NotFound() {
  return (
    <div className="py-10">
      <EmptyState
        title="这条道不通"
        description="七侠镇没这号地方，许是走岔了。"
        action={
          <Link
            to="/"
            className="mt-3 rounded-md bg-cinnabar px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            回同福客栈
          </Link>
        }
      />
    </div>
  )
}

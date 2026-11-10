import { useEffect, useRef, useState } from "react"
import { Check, ChevronDown, ExternalLink, Link2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { VideoSource } from "@/data/video-sources"

export function SourcePicker({
  sources,
  activeId,
  onSelect,
  className,
}: {
  sources: VideoSource[]
  activeId: string
  onSelect: (id: string) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("touchstart", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("touchstart", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  const playable = sources.filter((source) => source.kind === "playable")
  const links = sources.filter((source) => source.kind === "link")
  const active = playable.find((source) => source.id === activeId)

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2 py-1 text-[11px] text-white/75 transition-colors hover:border-gold/40 hover:text-gold"
      >
        <Link2 className="size-3" />
        片源 · {active?.label ?? "未选择"}
        <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-1.5 w-64 overflow-hidden rounded-lg border border-white/10 bg-[#1b140d] shadow-xl shadow-black/40"
        >
          <p className="px-3 pt-2 pb-1 text-[10px] tracking-[0.18em] text-white/35">站内播放</p>
          {playable.map((source) => (
            <button
              key={source.id}
              type="button"
              role="menuitemradio"
              aria-checked={source.id === activeId}
              onClick={() => {
                onSelect(source.id)
                setOpen(false)
              }}
              className="flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-white/5"
            >
              <Check
                className={cn(
                  "mt-0.5 size-3.5 shrink-0",
                  source.id === activeId ? "text-gold" : "text-transparent",
                )}
              />
              <span className="min-w-0">
                <span className="block truncate text-xs text-white/85">{source.label}</span>
                <span className="block truncate text-[10px] text-white/40">{source.note}</span>
              </span>
            </button>
          ))}

          {links.length ? (
            <>
              <p className="border-t border-white/10 px-3 pt-2 pb-1 text-[10px] tracking-[0.18em] text-white/35">
                官方入口
              </p>
              {links.map((source) => (
                <a
                  key={source.id}
                  href={source.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-2 px-3 py-2 transition-colors hover:bg-white/5"
                >
                  <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-white/35" />
                  <span className="min-w-0">
                    <span className="block truncate text-xs text-white/85">{source.label}</span>
                    <span className="block truncate text-[10px] text-white/40">{source.note}</span>
                  </span>
                </a>
              ))}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

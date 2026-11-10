import { PaperCard } from "@/components/site-chrome"
import { formatTime, type Danmaku } from "@/lib/danmaku"

const modeLabel: Record<string, string> = {
  scroll: "滚动",
  top: "顶部",
  bottom: "底部",
}

export function DanmakuList({
  items,
  onSeek,
}: {
  items: Danmaku[]
  onSeek: (timeMs: number) => void
}) {
  return (
    <PaperCard className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5 text-xs text-ink-soft">
        <span>弹幕列表</span>
        <span>{items.length} 条</span>
      </div>

      {items.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-ink-soft">
          还没有弹幕，来发第一条。
        </p>
      ) : (
        <div className="max-h-64 divide-y divide-border/50 overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-2 px-4 py-2 text-xs">
              <button
                type="button"
                onClick={() => onSeek(item.timeMs)}
                className="shrink-0 font-mono text-cinnabar hover:underline"
              >
                {formatTime(item.timeMs / 1000)}
              </button>
              <span
                className="mt-1 size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="min-w-0 flex-1 leading-relaxed text-ink">
                {item.text}
              </span>
              <span className="shrink-0 text-[10px] text-ink-soft">
                {modeLabel[item.mode] ?? "滚动"}
              </span>
            </div>
          ))}
        </div>
      )}
    </PaperCard>
  )
}

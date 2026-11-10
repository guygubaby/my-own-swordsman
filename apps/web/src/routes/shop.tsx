import { createFileRoute } from "@tanstack/react-router"
import { BadgeCheck, ExternalLink, Info, Store } from "lucide-react"
import {
  ExternalButton,
  PaperCard,
  SectionTitle,
} from "@/components/site-chrome"
import { merch, watchPlatforms } from "@/data/merch"

export const Route = createFileRoute("/shop")({
  component: ShopPage,
})

function ShopPage() {
  return (
    <div className="space-y-8">
      <SectionTitle
        kicker="只指路，不卖货"
        title="周边情报"
        description="官方授权周边、纪念图书和画集的情报汇总。这里没有购物车，不接支付，也不拿佣金。"
      />

      <PaperCard className="flex items-start gap-3 border-jade/30 bg-jade/[0.06] px-4 py-3.5">
        <Info className="mt-0.5 size-4 shrink-0 text-jade" />
        <p className="text-xs leading-relaxed text-ink-soft">
          本站是纯粉丝非商业项目，不销售任何商品，也不代表版权方。
          《武林外传》版权归北京联盟影业所有；购买请认准官方渠道。
        </p>
      </PaperCard>

      <section>
        <SectionTitle kicker="官方渠道" title="现在能买到的" className="mb-4" />
        <div className="grid gap-4 md:grid-cols-3">
          {merch.map((item) => (
            <PaperCard key={item.title} className="flex h-full flex-col gap-4 p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 rounded border border-jade/30 bg-jade/5 px-1.5 py-0.5 text-[10px] text-jade">
                  <BadgeCheck className="size-3" />
                  {item.badge}
                </span>
                <span className="text-[10px] tracking-wider text-ink-soft">{item.kind}</span>
              </div>
              <div className="flex-1">
                <div className="font-heading text-base leading-snug font-bold text-ink">
                  {item.title}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-ink-soft">{item.note}</p>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-heading text-sm font-bold text-cinnabar">{item.price}</span>
                <ExternalButton href={item.href} className="px-2.5 py-1.5 text-xs">
                  看详情
                  <ExternalLink className="size-3" />
                </ExternalButton>
              </div>
            </PaperCard>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle
          kicker="正版观看"
          title="看剧也走官方"
          description="本站不托管任何剧集。想看正片，从这三个官方入口走。"
          className="mb-4"
        />
        <PaperCard className="divide-y divide-border/60 overflow-hidden">
          {watchPlatforms.map((platform) => (
            <div
              key={platform.name}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 md:px-5"
            >
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-md bg-cinnabar/10 text-cinnabar">
                  <Store className="size-4" />
                </span>
                <div>
                  <div className="text-sm font-medium text-ink">{platform.name}</div>
                  <div className="text-[11px] text-ink-soft">{platform.note}</div>
                </div>
              </div>
              <ExternalButton href={platform.href} className="px-2.5 py-1.5 text-xs">
                去官方看
                <ExternalLink className="size-3" />
              </ExternalButton>
            </div>
          ))}
        </PaperCard>
      </section>

      <p className="text-[11px] leading-relaxed text-ink-soft/75">
        注：淘宝等平台存在大量非官方白牌周边，质量和授权情况不明。本站只收录公开可核实的官方授权渠道，不提供第三方商品链接。
      </p>
    </div>
  )
}

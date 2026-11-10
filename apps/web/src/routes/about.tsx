import { createFileRoute } from "@tanstack/react-router"
import { ExternalLink, Info, ShieldCheck } from "lucide-react"
import { PaperCard, SectionTitle } from "@/components/site-chrome"

export const Route = createFileRoute("/about")({
  component: AboutPage,
})

const sources = [
  {
    label: "百度百科 · 武林外传",
    href: "https://baike.baidu.com/item/武林外传/5298",
    note: "剧集基本信息、播出平台与分集资料。",
  },
  {
    label: "维基语录 · 武林外传",
    href: "https://zh.wikiquote.org/wiki/武林外傳",
    note: "经典台词摘录，CC BY-SA；本站台词短引用注明出处。",
  },
  {
    label: "GitHub · 武林外传剧本统计",
    href: "https://github.com/havefun3/my-own-swordsman-script-statistic",
    note: "章回目录与台词文本，用于整理题库；不公开分发完整剧本。",
  },
  {
    label: "央视网 · 武林外传",
    href: "https://tv.cctv.com/2014/08/08/VIDE1407449168676568.shtml",
    note: "官方正版播出平台之一，本站仅外链。",
  },
  {
    label: "腾讯新闻 · 影视搬运调研",
    href: "https://news.qq.com/rain/a/20250603A07EY900",
    note: "关于未授权视频传播与平台维权的公开报道。",
  },
  {
    label: "吾流 WUSTYLE · 20 周年收藏卡",
    href: "https://m.weibo.cn/detail/5335106610008223",
    note: "联盟影业官方授权的周边情报来源。",
  },
]

function AboutPage() {
  return (
    <div className="space-y-8">
      <SectionTitle
        kicker="关于本店"
        title="同福娱乐镇是什么"
        description="一个腐竹自制的武林外传同好站：追剧指南、站内播放器与弹幕、台词接龙、三个客栈小游戏，外加官方周边情报。"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <PaperCard className="p-5">
          <div className="font-heading text-lg font-bold text-ink">这里是</div>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-soft">
            <li>· 非官方、非商业的粉丝作品，不收费、不投广告、不卖货。</li>
            <li>· 剧集信息的整理与官方正片外链。</li>
            <li>· 台词接龙和原创小游戏。</li>
            <li>· 官方授权周边的情报汇总。</li>
          </ul>
        </PaperCard>
        <PaperCard className="p-5">
          <div className="font-heading text-lg font-bold text-ink">这里不是</div>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-soft">
            <li>· 不是影视网站：不托管、不转码、不抓流任何剧集。</li>
            <li>· 不是官方商城：不接支付、不发货、不拿佣金。</li>
            <li>· 不代表版权方或演员立场。</li>
            <li>· 不使用剧照、演员肖像、主题曲或原剧音频。</li>
          </ul>
        </PaperCard>
      </div>

      <PaperCard className="flex items-start gap-3 border-gold/35 bg-gold/[0.06] p-5">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-gold" />
        <div>
          <div className="font-heading text-base font-bold text-ink">版权与免责声明</div>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            《武林外传》版权归北京联盟影业投资有限公司及相关权利人所有。本站为粉丝自发制作，与版权方无隶属或合作关系。
            站内台词为短引用并注明角色与回目；角色美术、界面与游戏均为原创。若权利人认为内容不妥，请联系删除。
          </p>
        </div>
      </PaperCard>

      <section>
        <SectionTitle kicker="资料来源" title="站在谁的肩膀上" className="mb-4" />
        <PaperCard className="divide-y divide-border/60 overflow-hidden">
          {sources.map((source) => (
            <a
              key={source.label}
              href={source.href}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-start justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-cinnabar/[0.04] md:px-5"
            >
              <div>
                <div className="text-sm font-medium text-ink">{source.label}</div>
                <div className="mt-0.5 text-[11px] leading-relaxed text-ink-soft">{source.note}</div>
              </div>
              <ExternalLink className="mt-1 size-3.5 shrink-0 text-ink-soft" />
            </a>
          ))}
        </PaperCard>
      </section>

      <section>
        <SectionTitle kicker="技术" title="这店怎么搭的" className="mb-4" />
        <PaperCard className="flex items-start gap-3 p-5">
          <Info className="mt-0.5 size-4 shrink-0 text-cinnabar" />
          <p className="text-sm leading-relaxed text-ink-soft">
            React 19 + Vite + Tailwind CSS v4 + TanStack Router + TanStack Query；
            播放器用 ArtPlayer + 官方弹幕插件；Hono 跑在 Cloudflare Workers，Drizzle ORM +
            Cloudflare D1 存弹幕、帖子和会话，better-auth 管游客会话。界面字体使用系统宋体与黑体，不加载外部图片素材。
          </p>
        </PaperCard>
      </section>

      <p className="text-center text-[11px] text-ink-soft/70">
        美滴狠，美滴狠。二〇二六年 · 七侠镇
      </p>
    </div>
  )
}

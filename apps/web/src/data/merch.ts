export type MerchItem = {
  title: string
  kind: string
  price: string
  note: string
  href: string
  badge: string
}

export const merch: MerchItem[] = [
  {
    title: "《武林外传》江湖月报 · 七侠镇特刊收藏卡",
    kind: "吾流 WUSTYLE",
    price: "198 元 / 盒",
    note: "联盟影业官方授权，20 周年纪念卡。含瑞金卡、祥银卡、尚敬导演亲签卡与戏服余料卡。",
    href: "https://m.weibo.cn/detail/5335106610008223",
    badge: "官方授权",
  },
  {
    title: "《武林外传》20 周年官方纪念图书",
    kind: "摩点众筹",
    price: "199 元起",
    note: "特装版含立体雕刻书口、复刻《江湖月报》、剧照明信片、纪念章与主创亲签档位。",
    href: "https://m.modian.com/project/152802.html",
    badge: "官方纪念",
  },
  {
    title: "《同福客栈：官方纪念画集》",
    kind: "中信出版社",
    price: "以官方售价为准",
    note: "呼葱觅蒜手绘，收录名场面、经典台词、人物小像、七侠镇地形图与同福客栈平面图。",
    href: "https://www.yystv.cn/n/996387",
    badge: "官方授权",
  },
]

export type WatchPlatform = {
  name: string
  note: string
  href: string
}

export const watchPlatforms: WatchPlatform[] = [
  {
    name: "爱奇艺",
    note: "官方高清版，以页面权益为准",
    href: "https://so.iqiyi.com/so/q_%E6%AD%A6%E6%9E%97%E5%A4%96%E4%BC%A0",
  },
  {
    name: "央视网",
    note: "免费正版，分集播放",
    href: "https://tv.cctv.com/2012/12/03/VIDA1354531513618469.shtml",
  },
  {
    name: "央视频",
    note: "80 集专辑 / 轮播",
    href: "https://m.yangshipin.cn/portrait_video?type=0&cid=zbl088xi88odwt8&vid=s00006439gs",
  },
]

export const SITE_URL = "https://tongfu.guygubaby.top"

/** 页面级 title / description / canonical / OG，交给 TanStack Router 的 HeadContent 更新。 */
export function seo({
  title,
  description,
  path,
  noindex = false,
}: {
  title: string
  description: string
  path: string
  noindex?: boolean
}) {
  const url = `${SITE_URL}${path}`
  return {
    meta: [
      { title },
      { name: "description", content: description },
      {
        name: "robots",
        content: noindex
          ? "noindex, nofollow"
          : "index, follow, max-image-preview:large",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "同福娱乐镇" },
      { property: "og:locale", content: "zh_CN" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:image", content: `${SITE_URL}/og.png` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: `${SITE_URL}/og.png` },
    ],
    links: [{ rel: "canonical", href: url }],
  }
}

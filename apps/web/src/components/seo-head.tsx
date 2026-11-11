import { useEffect } from "react"
import { useRouterState } from "@tanstack/react-router"

type Tag = Record<string, unknown>

/**
 * 把路由的 head 数据写进 index.html 里已有的 meta / title。
 * 不用 <HeadContent /> 是因为它会往静态标签旁边再插一份，客户端出现重复的
 * title / description / canonical；这里只更新原地标签。
 */
export function SeoHead() {
  const matches = useRouterState({ select: (state) => state.matches })

  useEffect(() => {
    for (const match of matches) {
      const meta = Array.isArray(match.meta) ? (match.meta as Tag[]) : []
      const links = Array.isArray(match.links) ? (match.links as Tag[]) : []
      for (const tag of [...meta, ...links]) applyTag(tag)
    }
  }, [matches])

  return null
}

function applyTag(tag: Tag) {
  if (typeof tag.title === "string") {
    document.title = tag.title
    return
  }

  if (typeof tag.rel === "string") {
    const link = ensureLink(tag.rel)
    if (typeof tag.href === "string") link.href = tag.href
    return
  }

  const name = typeof tag.name === "string" ? tag.name : null
  const property = typeof tag.property === "string" ? tag.property : null
  if (!name && !property) return

  const meta = ensureMeta(name, property)
  if (typeof tag.content === "string") meta.content = tag.content
}

function ensureMeta(name: string | null, property: string | null) {
  const selector = name
    ? `meta[name="${CSS.escape(name)}"]`
    : `meta[property="${CSS.escape(property ?? "")}"]`
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = document.createElement("meta")
    if (name) element.setAttribute("name", name)
    if (property) element.setAttribute("property", property)
    document.head.appendChild(element)
  }
  return element
}

function ensureLink(rel: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${CSS.escape(rel)}"]`)
  if (!element) {
    element = document.createElement("link")
    element.rel = rel
    document.head.appendChild(element)
  }
  return element
}

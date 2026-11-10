import ky from "ky"

export const api = ky.create({
  prefix: "/api/",
  credentials: "include",
  timeout: 10_000,
})

export type ThreadSummary = {
  id: string
  title: string
  body: string
  category: string
  quotePrompt: string | null
  createdAt: string
  author: { name: string }
  _count: { replies: number }
}

export type ThreadReply = {
  id: string
  body: string
  createdAt: string
  author: { name: string }
}

export type ThreadDetail = {
  id: string
  title: string
  body: string
  category: string
  quotePrompt: string | null
  createdAt: string
  author: { name: string }
  replies: ThreadReply[]
}

export type ApiError = {
  error?: { code?: string; message?: string }
}

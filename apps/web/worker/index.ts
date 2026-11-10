import { Hono, type Context } from "hono"
import { bodyLimit } from "hono/body-limit"
import { logger as requestLogger } from "hono/logger"
import { and, asc, desc, eq, gt, sql } from "drizzle-orm"
import { z } from "zod"
import { createAuth } from "./auth"
import { createDb, type Db } from "./db"
import type { Env } from "./env"
import { danmaku, reply, thread, user } from "./schema"

type AppEnv = {
  Bindings: Env
  Variables: {
    db: Db
    auth: ReturnType<typeof createAuth>
  }
}

const app = new Hono<AppEnv>()

app.use("*", requestLogger())
app.use(
  "/api/*",
  bodyLimit({
    maxSize: 32 * 1024,
    onError: (c) =>
      c.json({ error: { code: "PAYLOAD_TOO_LARGE", message: "内容太长了。" } }, 413),
  }),
)
app.use("/api/*", async (c, next) => {
  const db = createDb(c.env.DB)
  const auth = createAuth(db, c.env, new URL(c.req.url).origin)
  c.set("db", db)
  c.set("auth", auth)
  await next()
})

app.on(["GET", "POST"], "/api/auth/*", (c) => c.get("auth").handler(c.req.raw))

app.get("/api/health", (c) => c.json({ ok: true }))

async function sessionOf(c: Context<AppEnv>) {
  return c.get("auth").api.getSession({ headers: c.req.raw.headers })
}

const threadInput = z.object({
  title: z.string().trim().min(1).max(80),
  body: z.string().trim().min(1).max(2000),
  category: z.enum(["chain", "chat", "lore"]).default("chain"),
  quotePrompt: z.string().trim().max(200).optional(),
})

const replyInput = z.object({
  body: z.string().trim().min(1).max(1000),
})

const danmakuInput = z.object({
  timeMs: z.number().int().min(0).max(3 * 60 * 60 * 1000),
  text: z.string().trim().min(1).max(40),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  mode: z.enum(["scroll", "top", "bottom"]).default("scroll"),
})

function episodeNumber(c: Context<AppEnv>) {
  const n = Number(c.req.param("n"))
  return Number.isInteger(n) && n >= 1 && n <= 81 ? n : null
}

const threadListSelect = {
  id: thread.id,
  title: thread.title,
  body: thread.body,
  category: thread.category,
  quotePrompt: thread.quotePrompt,
  createdAt: thread.createdAt,
  authorName: user.name,
  replyCount: sql<number>`(select count(*) from ${reply} where ${reply.threadId} = ${thread.id})`,
}

app.get("/api/threads", async (c) => {
  const rows = await c
    .get("db")
    .select(threadListSelect)
    .from(thread)
    .innerJoin(user, eq(thread.authorId, user.id))
    .orderBy(desc(thread.createdAt))
    .limit(50)

  return c.json({
    threads: rows.map(({ authorName, replyCount, ...row }) => ({
      ...row,
      author: { name: authorName },
      _count: { replies: Number(replyCount) },
    })),
  })
})

app.post("/api/threads", async (c) => {
  const session = await sessionOf(c)
  if (!session) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "先以游客身份进店，再发帖。" } },
      401,
    )
  }
  const parsed = threadInput.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return c.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "帖子内容不合法。",
          details: parsed.error.flatten(),
        },
      },
      400,
    )
  }

  const db = c.get("db")
  const now = new Date()
  const id = crypto.randomUUID()

  await db.insert(thread).values({
    id,
    title: parsed.data.title,
    body: parsed.data.body,
    category: parsed.data.category,
    quotePrompt: parsed.data.quotePrompt ?? null,
    authorId: session.user.id,
    createdAt: now,
    updatedAt: now,
  })

  const [created] = await db
    .select(threadListSelect)
    .from(thread)
    .innerJoin(user, eq(thread.authorId, user.id))
    .where(eq(thread.id, id))
    .limit(1)

  if (!created) {
    return c.json({ error: { code: "INTERNAL", message: "帖子没存上。" } }, 500)
  }

  const { authorName, replyCount, ...row } = created
  return c.json(
    {
      thread: {
        ...row,
        author: { name: authorName },
        _count: { replies: Number(replyCount) },
      },
    },
    201,
  )
})

app.get("/api/threads/:id", async (c) => {
  const db = c.get("db")
  const [row] = await db
    .select(threadListSelect)
    .from(thread)
    .innerJoin(user, eq(thread.authorId, user.id))
    .where(eq(thread.id, c.req.param("id")))
    .limit(1)

  if (!row) {
    return c.json(
      { error: { code: "NOT_FOUND", message: "这帖不存在，可能被掌柜的收走了。" } },
      404,
    )
  }

  const replies = await db
    .select({
      id: reply.id,
      body: reply.body,
      createdAt: reply.createdAt,
      authorName: user.name,
    })
    .from(reply)
    .innerJoin(user, eq(reply.authorId, user.id))
    .where(eq(reply.threadId, row.id))
    .orderBy(asc(reply.createdAt))

  const { authorName, replyCount, ...detail } = row
  return c.json({
    thread: {
      ...detail,
      author: { name: authorName },
      replies: replies.map(({ authorName: replyAuthor, ...item }) => ({
        ...item,
        author: { name: replyAuthor },
      })),
    },
  })
})

app.post("/api/threads/:id/replies", async (c) => {
  const session = await sessionOf(c)
  if (!session) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "先以游客身份进店，再接龙。" } },
      401,
    )
  }
  const parsed = replyInput.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return c.json({ error: { code: "BAD_REQUEST", message: "回复内容不合法。" } }, 400)
  }

  const db = c.get("db")
  const threadId = c.req.param("id")
  const [existing] = await db
    .select({ id: thread.id })
    .from(thread)
    .where(eq(thread.id, threadId))
    .limit(1)

  if (!existing) {
    return c.json({ error: { code: "NOT_FOUND", message: "这帖不存在。" } }, 404)
  }

  const now = new Date()
  const id = crypto.randomUUID()
  await db.insert(reply).values({
    id,
    threadId,
    authorId: session.user.id,
    body: parsed.data.body,
    createdAt: now,
  })

  return c.json(
    {
      reply: {
        id,
        body: parsed.data.body,
        createdAt: now,
        author: { name: session.user.name },
      },
    },
    201,
  )
})

app.get("/api/episodes/:n/danmaku", async (c) => {
  const n = episodeNumber(c)
  if (!n) {
    return c.json({ error: { code: "BAD_REQUEST", message: "回目不对。" } }, 400)
  }

  const rows = await c
    .get("db")
    .select({
      id: danmaku.id,
      episode: danmaku.episode,
      timeMs: danmaku.timeMs,
      text: danmaku.text,
      color: danmaku.color,
      mode: danmaku.mode,
      createdAt: danmaku.createdAt,
    })
    .from(danmaku)
    .where(eq(danmaku.episode, n))
    .orderBy(asc(danmaku.timeMs))
    .limit(500)

  return c.json({ danmaku: rows, total: rows.length })
})

app.post("/api/episodes/:n/danmaku", async (c) => {
  const n = episodeNumber(c)
  if (!n) {
    return c.json({ error: { code: "BAD_REQUEST", message: "回目不对。" } }, 400)
  }
  const session = await sessionOf(c)
  if (!session) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "先以游客身份登录，再发弹幕。" } },
      401,
    )
  }
  const parsed = danmakuInput.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return c.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "弹幕内容不合法。",
          details: parsed.error.flatten(),
        },
      },
      400,
    )
  }

  const db = c.get("db")
  const [recent] = await db
    .select({ id: danmaku.id })
    .from(danmaku)
    .where(
      and(
        eq(danmaku.userId, session.user.id),
        gt(danmaku.createdAt, new Date(Date.now() - 2000)),
      ),
    )
    .limit(1)

  if (recent) {
    return c.json(
      { error: { code: "TOO_FAST", message: "发太快了，歇两秒。" } },
      429,
    )
  }

  const now = new Date()
  const id = crypto.randomUUID()
  const color = parsed.data.color ?? "#fff8ec"

  await db.insert(danmaku).values({
    id,
    episode: n,
    timeMs: parsed.data.timeMs,
    text: parsed.data.text,
    color,
    mode: parsed.data.mode,
    userId: session.user.id,
    createdAt: now,
  })

  return c.json(
    {
      danmaku: {
        id,
        episode: n,
        timeMs: parsed.data.timeMs,
        text: parsed.data.text,
        color,
        mode: parsed.data.mode,
        createdAt: now,
      },
    },
    201,
  )
})

app.notFound((c) =>
  c.json({ error: { code: "NOT_FOUND", message: "没找到这条道。" } }, 404),
)

app.onError((error, c) => {
  console.error(error)
  return c.json({ error: { code: "INTERNAL", message: "客栈后厨出岔子了。" } }, 500)
})

export default app

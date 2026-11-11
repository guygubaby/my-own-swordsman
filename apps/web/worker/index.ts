import { Hono, type Context } from "hono"
import { bodyLimit } from "hono/body-limit"
import { logger as requestLogger } from "hono/logger"
import { and, asc, desc, eq, gt, sql } from "drizzle-orm"
import { z } from "zod"
import { createAuth } from "./auth"
import { createDb, type Db } from "./db"
import type { Env } from "./env"
import { danmaku, extensionToken, reply, thread, user, watchProgress } from "./schema"

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

/** 发帖、弹幕、进度、插件只认注册用户，游客会话不算。 */
async function registeredSessionOf(c: Context<AppEnv>) {
  const session = await sessionOf(c)
  if (!session || session.user.isAnonymous) return null
  return session
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  )
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

function bearerToken(c: Context<AppEnv>) {
  const header = c.req.header("authorization") ?? ""
  return header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : ""
}

/** 插件令牌 -> 用户 id；顺带刷新 lastUsedAt。 */
async function extensionUserId(c: Context<AppEnv>) {
  const token = bearerToken(c)
  if (!token) return null
  const tokenHash = await sha256Hex(token)
  const db = c.get("db")
  const [row] = await db
    .select({ userId: extensionToken.userId, lastUsedAt: extensionToken.lastUsedAt })
    .from(extensionToken)
    .where(eq(extensionToken.tokenHash, tokenHash))
    .limit(1)
  if (!row) return null

  // 别把每次请求都变成一次写；一小时刷新一次足够。
  const now = Date.now()
  if (!row.lastUsedAt || now - row.lastUsedAt.getTime() > 60 * 60 * 1000) {
    await db
      .update(extensionToken)
      .set({ lastUsedAt: new Date(now) })
      .where(eq(extensionToken.tokenHash, tokenHash))
  }
  return row.userId
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
  const session = await registeredSessionOf(c)
  if (!session) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "注册 / 登录后才能发帖。" } },
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
  const session = await registeredSessionOf(c)
  if (!session) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "注册 / 登录后才能接龙。" } },
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

/** 发弹幕的共用逻辑：站内用 cookie 会话，插件用 Bearer 令牌。 */
async function addDanmaku(c: Context<AppEnv>, n: number, userId: string) {
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
        eq(danmaku.userId, userId),
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
    userId,
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
}

app.post("/api/episodes/:n/danmaku", async (c) => {
  const n = episodeNumber(c)
  if (!n) {
    return c.json({ error: { code: "BAD_REQUEST", message: "回目不对。" } }, 400)
  }
  const session = await registeredSessionOf(c)
  if (!session) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "注册 / 登录后才能发弹幕。" } },
      401,
    )
  }
  return addDanmaku(c, n, session.user.id)
})

/* ---------- 浏览器插件（央视网弹幕） ---------- */

function newExtensionToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  return `tf_${Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`
}

/** 站内（cookie 会话）签发插件令牌，明文只返回这一次。 */
app.post("/api/extension/token", async (c) => {
  const session = await registeredSessionOf(c)
  if (!session) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "注册 / 登录后才能连接插件。" } },
      401,
    )
  }

  const token = newExtensionToken()
  const db = c.get("db")
  // 一人一枚：重新配对就把旧令牌作废，避免令牌表无限增长、旧令牌永久有效。
  await db.delete(extensionToken).where(eq(extensionToken.userId, session.user.id))
  await db.insert(extensionToken).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    tokenHash: await sha256Hex(token),
    label: (c.req.header("user-agent") ?? "").slice(0, 120) || null,
    createdAt: new Date(),
  })

  return c.json({
    token,
    user: { id: session.user.id, name: session.user.name },
  })
})

/** 插件自检：令牌是否还有效，返回昵称用于角标。 */
app.get("/api/extension/me", async (c) => {
  const userId = await extensionUserId(c)
  if (!userId) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "插件未连接。" } }, 401)
  }
  const [row] = await c
    .get("db")
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)
  return c.json({ connected: true, user: { id: userId, name: row?.name ?? "腐竹" } })
})

/** 断开：带 Bearer 只删这一枚，带 cookie 删该用户全部。 */
app.delete("/api/extension/token", async (c) => {
  const db = c.get("db")
  const token = bearerToken(c)
  if (token) {
    await db
      .delete(extensionToken)
      .where(eq(extensionToken.tokenHash, await sha256Hex(token)))
    return c.json({ ok: true })
  }
  const session = await registeredSessionOf(c)
  if (!session) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "未登录。" } }, 401)
  }
  await db.delete(extensionToken).where(eq(extensionToken.userId, session.user.id))
  return c.json({ ok: true })
})

/** 插件发弹幕（Bearer 鉴权，跨站不带 cookie）。 */
app.post("/api/ext/episodes/:n/danmaku", async (c) => {
  const n = episodeNumber(c)
  if (!n) {
    return c.json({ error: { code: "BAD_REQUEST", message: "回目不对。" } }, 400)
  }
  const userId = await extensionUserId(c)
  if (!userId) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "插件未连接，请到同福娱乐镇连接账号。" } },
      401,
    )
  }
  return addDanmaku(c, n, userId)
})

/* ---------- 观看进度（注册用户） ---------- */

const progressInput = z.object({
  timeMs: z.number().int().min(0).max(4 * 60 * 60 * 1000),
  durationMs: z.number().int().min(0).max(4 * 60 * 60 * 1000),
})

app.get("/api/me/progress", async (c) => {
  const session = await registeredSessionOf(c)
  if (!session) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "注册 / 登录后才能同步进度。" } },
      401,
    )
  }
  const rows = await c
    .get("db")
    .select()
    .from(watchProgress)
    .where(eq(watchProgress.userId, session.user.id))

  return c.json({
    progress: rows.map((row) => ({
      episode: row.episode,
      timeMs: row.timeMs,
      durationMs: row.durationMs,
      updatedAt: row.updatedAt.getTime(),
    })),
  })
})

app.put("/api/me/progress/:n", async (c) => {
  const n = episodeNumber(c)
  if (!n) {
    return c.json({ error: { code: "BAD_REQUEST", message: "回目不对。" } }, 400)
  }
  const session = await registeredSessionOf(c)
  if (!session) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "注册 / 登录后才能同步进度。" } },
      401,
    )
  }
  const parsed = progressInput.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return c.json({ error: { code: "BAD_REQUEST", message: "进度不合法。" } }, 400)
  }

  const now = new Date()
  await c
    .get("db")
    .insert(watchProgress)
    .values({
      userId: session.user.id,
      episode: n,
      timeMs: parsed.data.timeMs,
      durationMs: parsed.data.durationMs,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [watchProgress.userId, watchProgress.episode],
      set: {
        timeMs: parsed.data.timeMs,
        durationMs: parsed.data.durationMs,
        updatedAt: now,
      },
    })

  return c.json({ ok: true })
})

app.delete("/api/me/progress/:n", async (c) => {
  const n = episodeNumber(c)
  if (!n) {
    return c.json({ error: { code: "BAD_REQUEST", message: "回目不对。" } }, 400)
  }
  const session = await registeredSessionOf(c)
  if (!session) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "注册 / 登录后才能同步进度。" } },
      401,
    )
  }
  await c
    .get("db")
    .delete(watchProgress)
    .where(and(eq(watchProgress.userId, session.user.id), eq(watchProgress.episode, n)))
  return c.json({ ok: true })
})

app.notFound((c) =>
  c.json({ error: { code: "NOT_FOUND", message: "没找到这条道。" } }, 404),
)

app.onError((error, c) => {
  console.error(error)
  return c.json({ error: { code: "INTERNAL", message: "客栈后厨出岔子了。" } }, 500)
})

export default app

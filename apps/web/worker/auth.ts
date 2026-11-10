import { betterAuth } from "better-auth"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { anonymous } from "better-auth/plugins"
import type { Db } from "./db"
import type { Env } from "./env"
import { authSchema } from "./schema"

export function createAuth(db: Db, env: Env, origin: string) {
  return betterAuth({
    baseURL: origin,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: authSchema,
    }),
    emailAndPassword: { enabled: true },
    plugins: [anonymous()],
    trustedOrigins: [origin, env.WEB_ORIGIN].filter((value): value is string =>
      Boolean(value),
    ),
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
  })
}

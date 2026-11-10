import { bindings, defineConfig } from "cf/config"

export default defineConfig({
  worker: {
    name: "tongfu-entertainment",
    entrypoint: "./worker/index.ts",
    compatibilityDate: "2026-11-10",
    compatibilityFlags: ["nodejs_compat"],
    observability: { enabled: true },
    domains: ["tongfu.guygubaby.top"],
    assets: {
      notFoundHandling: "single-page-application",
      runWorkerFirst: ["/api/*"],
    },
    env: {
      DB: bindings.d1({
        id: "33c17fba-0b19-4a10-8f6b-2142af118738",
        name: "tongfu-entertainment",
      }),
      BETTER_AUTH_SECRET: bindings.secret(),
      WEB_ORIGIN: bindings.text("https://tongfu.guygubaby.top"),
    },
  },
})

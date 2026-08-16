# FetchSave — TikTok & Pinterest Public Downloader

Free web app to browse and download **public** TikTok Liked posts (videos + photo carousels) and Pinterest boards/pins at original quality. No login to TikTok or Pinterest — ever. Only public content visible without logging in.

> This is a **combined Next.js 14 project** — frontend (React + Tailwind) and backend (Next.js API Routes) live in the same repo/app. There is no separate Python backend.

## Features

- **TikTok module** (`/tiktok`): enter username → parse `SIGI_STATE`/`UNIVERSAL_DATA` JSON embedded in the public profile HTML → gallery of videos + photo carousels (carousel mini-viewer), per-item download (video `.mp4` / photo `.jpg` or `.zip` of all images), in-gallery search (filters loaded results client-side by creator/caption), select-multiple → bulk ZIP, private/not-found/empty states, pagination-ready.
- **Pinterest module** (`/pinterest`): username or `https://pinterest.com/username` → public boards → pins (image/video at original resolution) → real file downloads + bulk ZIP.
- **Auth (optional)**: `Sign in with Google` in header — demo implementation using `localStorage`; stores only `email/name/avatar` + site search history. App works fully signed-out. No TikTok/Pinterest OAuth.
- Legal pages: `/about`, `/privacy-policy`, `/terms`, `/contact` + sitewide footer disclaimer.

## Tech Stack

- Next.js 14 (App Router, TypeScript), React 18
- Tailwind CSS 3.4, lucide-react icons
- JSZip 3.10 for server-side ZIP streaming
- **Playwright (Chromium)** — headless browser for TikTok/Pinterest rendering (see Hosting note below)
- No DB required for demo (history in `localStorage`; swap for Prisma/Postgres if needed)

## Hosting / Infra Note — Headless Browser

This project uses **Playwright + Chromium** (not plain `fetch`) for TikTok and Pinterest:

- `GET /api/tiktok/liked`, `GET /api/pinterest/profile`, `GET /api/pinterest/board` each **launch a headless Chromium instance**, `page.goto(url, { waitUntil: 'networkidle' })`, wait for `script#SIGI_STATE` / `script#__PWS_DATA__` to confirm hydration, `page.content()` → parse embedded JSON, then **close the browser** (`browser.close()` in `finally`).
- Why: TikTok blocks non-browser UAs and Pinterest hydrates boards/pins via JS after load — plain `fetch()` never sees real content. Playwright sees the fully-rendered DOM.
- **No login, no credentials** — still only public content.

> ⚠️ This needs more CPU/RAM than plain fetch. **Adjust your hosting plan:**
> - Vercel: use at least **1024 MB** function memory and increase `maxDuration` (e.g. 30 s) for the three routes; or deploy to a container/VM.
> - Docker / VM / Fly.io / Railway: give the container **≥1 GB RAM, 1 vCPU**; install Playwright deps with `npx playwright install --with-deps chromium` in your Dockerfile.
> - Each request spawns and closes its own browser — memory is freed after `browser.close()`, but burst usage is higher. Consider caching (already 12-min) to reduce launches.

**First-run setup after `npm install`:**

```bash
npx playwright install --with-deps chromium
# or if deps already on the host:
npx playwright install chromium
```

## Project Structure

```
app/                          # Single combined project (this folder)
├── src/
│   ├── app/
│   │   ├── page.tsx          # Home — hero + How it works
│   │   ├── tiktok/page.tsx   # TikTok module (search + photo support)
│   │   ├── pinterest/page.tsx
│   │   ├── about/page.tsx
│   │   ├── privacy-policy/page.tsx
│   │   ├── terms/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       ├── tiktok/liked/route.ts      # Fetches + parses TikTok public HTML
│   │       ├── tiktok/download/route.ts   # Proxies video with Content-Disposition: attachment
│   │       ├── pinterest/profile/route.ts
│   │       ├── pinterest/board/route.ts
│   │       ├── pinterest/download/route.ts
│   │       └── bulk-zip/route.ts          # POST {files:[{url,name}]} → application/zip
│   ├── components/Header.tsx  # Google Sign-In (mock) + Recent searches
│   ├── components/Footer.tsx
│   └── lib/utils.ts
├── public/                    # favicon etc.
├── package.json
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── .env.example
```

If you prefer an explicit `frontend/` + `backend/` split, duplicate this folder as `frontend/` and `backend/` — both run the same Next.js app (it is already full-stack). See `.env.example` notes.

## Quick Start

```bash
# 1) Node 20+ required
node -v  # v20.20.2 tested

# 2) Install
npm install

# 3) Env (optional — see .env.example)
cp .env.example .env.local   # fill values if you enable real Google OAuth

# 4) Dev (http://localhost:3000)
npm run dev

# 5) Production build
npm run build
npm run start -- --port 3000 --hostname 0.0.0.0

# Lint
npm run lint
```

## Environment Variables

Copy `.env.example` → `.env.local`. All are optional for the mock demo:

| Var | Purpose | Required |
|-----|---------|----------|
| `GOOGLE_CLIENT_ID` | Real Google OAuth (if replacing mock `localStorage` auth) | No — mock works without it |
| `GOOGLE_CLIENT_SECRET` | OAuth secret | No |
| `NEXTAUTH_URL` | e.g. `http://localhost:3000` if using NextAuth | No |
| `NEXTAUTH_SECRET` | Session signing | No |
| `TIKTOK_SESSION_COOKIE` | If you proxy through a logged-in TikTok session (not used — public fetch only) | No |
| `PINTEREST_COOKIE` | Same for Pinterest | No |

> **No TikTok/Pinterest username or password is ever requested or stored.** The `.env.example` keys are only for the optional Google Sign-In on *this* site.

## How Downloads Work

- Direct CDN URLs expire in minutes → backend **re-resolves fresh at download time** and streams with `Content-Disposition: attachment`.
- `GET /api/tiktok/download?url=...&id=...` and `GET /api/pinterest/download?url=...&id=...&ext=...` proxy the upstream media.
- `POST /api/bulk-zip` fetches each URL server-side, adds to JSZip, returns `application/zip`. Falls back to sequential individual downloads client-side if ZIP fails.

## TikTok Photo Posts

Detection in `api/tiktok/liked/route.ts`: if `item.imagePost` exists or `video.id` is missing, treat as `type:'photo'`. Photo thumbnails + `images[]` (full-res) are extracted from `imagePost.images[].imageURL.urlList[0]`. Frontend shows a mini-carousel with dots/thumbnails and downloads all images as a ZIP.

## In-Gallery Search (TikTok)

Client-side filter over `items[]` by `author + authorDisplayName + desc` (case-insensitive, as-you-type). Shows `No results for "[q]"` + `Clear search`. Note displayed: *“Searching loaded results — scroll to load more if paginated.”*

## Deployment — Cloudflare Pages/Workers (Browser Rendering) ⭐

This project is **already adapted for Cloudflare** — `src/lib/renderedFetch.ts` now uses Cloudflare's **Browser Rendering API** (managed Chromium) instead of `playwright`'s local `chromium.launch()` on Cloudflare. Local Playwright is still used for `npm run dev` / Vercel / Docker.

### What changed for Cloudflare

- `src/lib/renderedFetch.ts` now checks for `env.BROWSER` (the Browser Rendering binding). If present → `import('@cloudflare/puppeteer').launch(env.BROWSER)` → `page.goto(..., {waitUntil:'networkidle0'})` → `page.content()` → `browser.close()`. If no binding (local dev) → falls back to `playwright` Chromium, then plain `fetch`.
- `wrangler.toml` — adds:
  ```toml
  compatibility_flags = ["nodejs_compat"]
  [browser]
  binding = "BROWSER"
  ```
- `package.json` — adds `@cloudflare/puppeteer`, `@cloudflare/next-on-pages`, `wrangler`, `@cloudflare/workers-types` and scripts `pages:build` / `deploy` / `preview`.
- `src/lib/renderedFetch.ts` uses `getRequestContext().env.BROWSER` via `@cloudflare/next-on-pages` so Next.js API routes get the binding on Pages.

### Step-by-step Cloudflare deployment

**Prereqs:** Node 20+, `npm install`, a Cloudflare account (free tier works).

1. **Install & login**
   ```bash
   npm install
   npx wrangler login
   ```

2. **Create a Pages project (once) — or reuse an existing one**
   ```bash
   # Option A: via dashboard — Create → Pages → Connect to Git → pick this repo
   # Option B: via wrangler
   npx wrangler pages project create fetchsave --production-branch main
   ```

3. **Enable Browser Rendering on your account**
   - Dashboard → **Workers & Pages** → **Browser Rendering** → **Enable** (one click, no code). It provisions the `BROWSER` binding.

4. **Configure binding (already in `wrangler.toml` — just verify)**
   ```toml
   # wrangler.toml (at repo root, next to package.json)
   name = "fetchsave"
   compatibility_date = "2024-08-16"
   compatibility_flags = ["nodejs_compat"]
   [browser]
   binding = "BROWSER"
   ```

5. **Build for Cloudflare (not plain `next build`)**
   ```bash
   npm run pages:build
   # → runs `npx @cloudflare/next-on-pages`, outputs to .vercel/output/static
   # Equivalent: npx @cloudflare/next-on-pages@1 --compatibility-date=2024-08-16
   ```

6. **Preview locally with the binding**
   ```bash
   npx wrangler pages dev .vercel/output/static --compatibility-date=2024-08-16 --browser
   # open http://localhost:8788
   ```

7. **Deploy**
   ```bash
   # If connected to Git: just `git push` — Cloudflare builds automatically with `pages:build`
   # Or manual:
   npx wrangler pages deploy .vercel/output/static --project-name=fetchsave
   # or
   npm run deploy
   ```

8. **Set env vars in dashboard (if using real Google OAuth)**
   - Pages → your project → **Settings** → **Variables and Secrets** → add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, etc. (see `.env.example`). Redeploy after.

9. **Verify**
   - Open `https://fetchsave.pages.dev/tiktok` → enter any public username → check Network tab: `/api/tiktok/liked` should return `via:"cloudflare"` in `meta`.
   - Check **Workers & Pages → Logs** for `[renderedFetch:cloudflare]` errors.

### Free-tier limits (Cloudflare Browser Rendering — as of 2024-08)

| Resource | Free | Paid (Pay-as-you-go) |
|----------|------|----------------------|
| Browser Rendering requests | **~1,000 browser sessions / month** on free Workers/Pages (bundled, check dashboard for current quota) | Then $0.05 per additional browser session minute, or via Workers Paid ($5/mo includes more) |
| Workers requests | 100k / day | Unlimited with Paid |
| Workers CPU | 10 ms (free) / 30 s with `nodejs_compat` on Pages Functions | 30 s (Paid) |
| Pages Functions | 500 builds / month | More on Pro |
| Always use caching (already 12-min `CACHE` in `route.ts`) to avoid burning browser minutes on repeat usernames. Each username fetch = 1 browser session (~5-10 s). Bulk downloads do **not** use browser — they proxy CDN URLs. |  |  |

> If you see `Error: No such binding: BROWSER`, you forgot to enable Browser Rendering or your `wrangler.toml` isn't picked up — ensure `compatibility_flags = ["nodejs_compat"]` and `[browser] binding = "BROWSER"` are at the root `wrangler.toml` and you deployed via `next-on-pages`.

### Alternative deploys (non-Cloudflare)

- **Vercel**: `vercel --prod` from `app/` — uses Playwright locally (install Chrys: `npx playwright install --with-deps chromium`, give function ≥1024 MB, `maxDuration: 30s`).
- **Docker**: `docker build -t fetchsave .` (add Dockerfile that runs `npm run build && npm run start` + `playwright install`).
- **Any Node host**: `npm run build && npm run start`.

## Legal

Only public content is fetched/downloaded. All media belongs to original creators. Not affiliated with TikTok/ByteDance or Pinterest, Inc. See `/terms` and `/privacy-policy` inside the app.

## License

MIT — do whatever you want, but respect creators' rights and platform ToS.

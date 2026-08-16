// Rendered HTML helper — supports two runtimes:
// 1) Cloudflare Pages/Workers with Browser Rendering binding (production)
//    → uses @cloudflare/puppeteer + env.BROWSER (managed Chromium, no binary)
// 2) Local dev / Node / Vercel — falls back to Playwright Chromium or plain fetch
//
// Workers can't launch a local Chromium binary — they must use Cloudflare's
// managed Browser Rendering service via the BROWSER binding. See wrangler.toml.

type RenderOpts = { waitUntil?: 'load'|'domcontentloaded'|'networkidle', timeoutMs?: number, waitSelector?: string };
type RenderResult = { html: string; status: number; rendered: boolean; via: 'cloudflare'|'playwright'|'fetch' };

function getCloudflareEnv(): any {
  // Works with @cloudflare/next-on-pages (getRequestContext) or Workers `env`
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getRequestContext } = require('@cloudflare/next-on-pages');
    const ctx = getRequestContext();
    if (ctx?.env?.BROWSER) return ctx.env;
  } catch {}
  try {
    // @ts-ignore — injected by wrangler in Workers runtime
    if (typeof globalThis !== 'undefined' && (globalThis as any).BROWSER) return { BROWSER: (globalThis as any).BROWSER };
    // Some runtimes expose `env` globally
    // @ts-ignore
    if (typeof env !== 'undefined' && (env as any)?.BROWSER) return env as any;
  } catch {}
  return null;
}

export async function getRenderedHtml(url: string, opts?: RenderOpts): Promise<RenderResult> {
  const timeoutMs = opts?.timeoutMs ?? 30000;
  const waitUntil = (opts?.waitUntil ?? 'networkidle') as any;

  // 1) Try Cloudflare Browser Rendering binding first (production on Pages/Workers)
  const cfEnv = getCloudflareEnv();
  if (cfEnv?.BROWSER) {
    let browser: any = null;
    try {
      const puppeteer: any = await import('@cloudflare/puppeteer');
      // Cloudflare API: puppeteer.launch(env.BROWSER)
      browser = await puppeteer.launch(cfEnv.BROWSER);
      const page = await browser.newPage();
      // Speed up: block images/fonts/media
      await page.setRequestInterception?.(true).catch(()=>{});
      page.on('request', (req: any) => {
        const rt = req.resourceType?.();
        if (['image','media','font','stylesheet'].includes(rt)) return req.abort?.();
        return req.continue?.();
      });

      const response = await page.goto(url, { waitUntil: waitUntil === 'networkidle' ? 'networkidle0' : waitUntil, timeout: timeoutMs });
      const status = response?.status?.() ?? 200;
      if (status === 404) {
        const html = await page.content();
        return { html, status, rendered: true, via: 'cloudflare' };
      }
      if (opts?.waitSelector) {
        try { await page.waitForSelector(opts.waitSelector, { timeout: 8000 }); } catch {}
      } else {
        try { await page.waitForSelector('script#SIGI_STATE, script#UNIVERSAL_DATA, script#initial-state, script#__PWS_DATA__', { timeout: 8000 }); } catch {}
      }
      await new Promise(r=>setTimeout(r, 800));
      const html = await page.content();
      return { html, status, rendered: true, via: 'cloudflare' };
    } catch (e) {
      console.error('[renderedFetch:cloudflare] failed, falling back', e);
      // fall through to fallbackFetch
    } finally {
      if (browser) try { await browser.close(); } catch {}
    }
  }

  // 2) Local / Node: try Playwright Chromium (dev, Vercel, Docker)
  try {
    const mod: any = await import('playwright');
    const chromium = mod.chromium;
    if (chromium) {
      let browser: any = null;
      try {
        browser = await chromium.launch({
          headless: true,
          args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-first-run','--no-zygote','--single-process'],
        });
        const context = await browser.newContext({
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          viewport: { width: 1280, height: 800 },
          locale: 'en-US',
        });
        await context.route('**/*', (route: any) => {
          const t = route.request().resourceType();
          if (['image','media','font'].includes(t)) return route.abort();
          return route.continue();
        }).catch(()=>{});
        const page = await context.newPage();
        const response = await page.goto(url, { waitUntil, timeout: timeoutMs });
        const status = response?.status() ?? 200;
        if (status === 404) {
          const html = await page.content();
          return { html, status, rendered: true, via: 'playwright' };
        }
        if (opts?.waitSelector) {
          try { await page.waitForSelector(opts.waitSelector, { timeout: 8000 }); } catch {}
        } else {
          try { await page.waitForSelector('script#SIGI_STATE, script#UNIVERSAL_DATA, script#initial-state, script#__PWS_DATA__', { timeout: 8000 }); } catch {}
        }
        await page.waitForTimeout(800).catch(()=>{});
        const html = await page.content();
        return { html, status, rendered: true, via: 'playwright' };
      } finally {
        if (browser) try { await browser.close(); } catch {}
      }
    }
  } catch (e) {
    console.warn('[renderedFetch] playwright not available, falling back to fetch', e);
  }

  // 3) Ultimate fallback: plain fetch (never sees JS-rendered content — last resort)
  return { ...(await fallbackFetch(url)), via: 'fetch' as const };
}

async function fallbackFetch(url: string): Promise<{ html: string; status: number; rendered: boolean }> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'text/html', 'Referer': 'https://www.tiktok.com/' },
    cache: 'no-store' as any,
  });
  const html = await res.text().catch(()=> '');
  return { html, status: res.status, rendered: false };
}

// Deterministic frame-stepped capture for co.
// Drives the clock via window.__coSetT(t) and writes a PNG per frame.
//
// Usage:
//   node scripts/render.mjs --url 'http://127.0.0.1:4173/?mode=capture' \
//     --out /tmp/co-frames --fps 30 --duration 120 \
//     --width 1920 --height 1080

import puppeteer from 'puppeteer';
import { mkdirSync, existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

function parseArgs(argv) {
  const a = { url: null, out: null, fps: 30, duration: 120, width: 1920, height: 1080, warmup: 1.0 };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--url') a.url = argv[++i];
    else if (k === '--out') a.out = argv[++i];
    else if (k === '--fps') a.fps = parseInt(argv[++i]);
    else if (k === '--duration') a.duration = parseFloat(argv[++i]);
    else if (k === '--width') a.width = parseInt(argv[++i]);
    else if (k === '--height') a.height = parseInt(argv[++i]);
    else if (k === '--warmup') a.warmup = parseFloat(argv[++i]);
  }
  if (!a.url || !a.out) throw new Error('need --url and --out');
  return a;
}

async function main() {
  const args = parseArgs(process.argv);
  if (existsSync(args.out)) rmSync(args.out, { recursive: true, force: true });
  mkdirSync(args.out, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--use-gl=angle',
      '--use-angle=metal',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--disable-frame-rate-limit',
      '--disable-gpu-vsync'
    ]
  });

  try {
    const page = await browser.newPage();
    page.on('pageerror', (e) => console.error('[pageerror]', e.message));
    page.on('console', (m) => {
      const t = m.type();
      if (t === 'error' || t === 'warning') console.error(`[${t}]`, m.text());
    });

    await page.setViewport({ width: args.width, height: args.height, deviceScaleFactor: 1 });
    await page.goto(args.url, { waitUntil: 'networkidle0', timeout: 60000 });

    // wait for co ready hook
    await page.waitForFunction(() => window.__coReady === true, { timeout: 15000 });

    // warmup: let the system run a moment so all uniforms settle
    await new Promise(r => setTimeout(r, args.warmup * 1000));

    const totalFrames = Math.round(args.fps * args.duration);
    const dt = 1 / args.fps;
    const t0 = Date.now();
    let lastReport = t0;

    for (let f = 0; f < totalFrames; f++) {
      const t = f * dt;
      await page.evaluate((tt) => window.__coSetT(tt), t);
      // give the browser one frame to render the new t
      await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      const out = resolve(args.out, `frame_${String(f).padStart(5, '0')}.png`);
      await page.screenshot({ path: out, type: 'png', omitBackground: false });

      if (Date.now() - lastReport > 5000) {
        const pct = ((f / totalFrames) * 100).toFixed(1);
        const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
        console.log(`frame ${f}/${totalFrames}  ${pct}%  elapsed ${elapsed}s`);
        lastReport = Date.now();
      }
    }
    const total = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`done: ${totalFrames} frames in ${total}s`);
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

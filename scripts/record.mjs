// Real-time canvas recording via Puppeteer's page.screencast (CDP-based).
// The page runs at full speed; we let it render naturally for 120s.
//
// Usage:
//   node scripts/record.mjs --url 'http://127.0.0.1:4173/?seed=co-v1.0.0' \
//     --out /tmp/co.webm --duration 120 --width 1920 --height 1080

import puppeteer from 'puppeteer';
import { existsSync, unlinkSync } from 'node:fs';

function parseArgs(argv) {
  const a = { url: null, out: null, duration: 120, width: 1920, height: 1080, warmup: 1.0 };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--url') a.url = argv[++i];
    else if (k === '--out') a.out = argv[++i];
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
  if (existsSync(args.out)) unlinkSync(args.out);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--use-gl=angle',
      '--use-angle=metal',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--disable-frame-rate-limit',
      '--force-color-profile=srgb',
      '--enable-features=Vulkan'
    ]
  });

  try {
    const page = await browser.newPage();
    page.on('pageerror', (e) => console.error('[pageerror]', e.message));

    await page.setViewport({ width: args.width, height: args.height, deviceScaleFactor: 1 });
    await page.goto(args.url, { waitUntil: 'networkidle0', timeout: 60000 });

    console.log(`warming up ${args.warmup}s...`);
    await new Promise(r => setTimeout(r, args.warmup * 1000));

    console.log(`recording ${args.duration}s -> ${args.out}`);
    const recorder = await page.screencast({
      path: args.out,
      fps: 30
    });

    await new Promise(r => setTimeout(r, args.duration * 1000));

    console.log('stopping recorder...');
    await recorder.stop();
    console.log('done.');
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

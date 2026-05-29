// Headless WebGL capture for verification + final stills.
// Usage:
//   node scripts/capture.mjs --url 'http://127.0.0.1:5173/?mode=capture&t=25' --out /tmp/co-still.png
// or:
//   node scripts/capture.mjs --frames --out-dir ./stills --base 'http://127.0.0.1:5173'
import puppeteer from 'puppeteer';
import { mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function parseArgs(argv) {
  const out = { url: null, out: null, outDir: null, base: null, frames: false, width: 1920, height: 1080, waitMs: 2500 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--url') out.url = argv[++i];
    else if (a === '--out') out.out = argv[++i];
    else if (a === '--out-dir') out.outDir = argv[++i];
    else if (a === '--base') out.base = argv[++i];
    else if (a === '--frames') out.frames = true;
    else if (a === '--width') out.width = parseInt(argv[++i]);
    else if (a === '--height') out.height = parseInt(argv[++i]);
    else if (a === '--wait') out.waitMs = parseInt(argv[++i]);
  }
  return out;
}

const STILL_FRAMES = [
  { name: '01_dispersed-attention', t: 10  },
  { name: '02_routing-appears',     t: 35  },
  { name: '03_co-presence-thickens',t: 65  },
  { name: '04_rare-synchronization',t: 82  },
  { name: '05_denouement',          t: 110 }
];

async function captureOne(browser, url, outPath, width, height, waitMs) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, waitMs));
  await page.screenshot({ path: outPath, type: 'png', omitBackground: false });
  await page.close();
  console.log(`captured ${outPath}`);
}

async function main() {
  const args = parseArgs(process.argv);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--use-gl=angle',
      '--use-angle=metal',
      '--enable-webgl',
      '--enable-accelerated-2d-canvas',
      '--ignore-gpu-blocklist',
      '--enable-features=Vulkan'
    ]
  });

  try {
    if (args.frames) {
      if (!args.outDir) throw new Error('--frames requires --out-dir');
      if (!args.base) throw new Error('--frames requires --base');
      if (!existsSync(args.outDir)) mkdirSync(args.outDir, { recursive: true });
      for (const f of STILL_FRAMES) {
        const u = `${args.base}/?mode=capture&t=${f.t}&seed=co-v1.0.0`;
        const out = resolve(args.outDir, `co_v1.0.0_${f.name}.png`);
        await captureOne(browser, u, out, args.width, args.height, args.waitMs);
      }
    } else {
      if (!args.url || !args.out) throw new Error('Need --url and --out');
      await captureOne(browser, args.url, args.out, args.width, args.height, args.waitMs);
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: 'new',
  args: [
    '--no-sandbox',
    '--use-gl=angle',
    '--use-angle=metal',
    '--enable-webgl',
    '--ignore-gpu-blocklist'
  ]
});
const page = await browser.newPage();
const msgs = [];
page.on('console', (m) => msgs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => msgs.push(`[pageerror] ${e.message}`));
page.on('requestfailed', (r) => msgs.push(`[reqfail] ${r.url()} :: ${r.failure()?.errorText}`));
await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:5173/?mode=debug&t=50', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 3500));

// Probe scene info
const info = await page.evaluate(() => {
  const canvas = document.querySelector('canvas');
  if (!canvas) return { error: 'no canvas' };
  const gl = canvas.getContext('webgl2');
  if (!gl) return { error: 'no webgl2 context', canvasW: canvas.width, canvasH: canvas.height };
  const renderer = gl.getParameter(gl.RENDERER);
  const vendor = gl.getParameter(gl.VENDOR);
  const version = gl.getParameter(gl.VERSION);
  return {
    canvasW: canvas.width, canvasH: canvas.height,
    cssW: canvas.style.width, cssH: canvas.style.height,
    clientW: canvas.clientWidth, clientH: canvas.clientHeight,
    renderer, vendor, version
  };
});
console.log('info:', info);
console.log('---console---');
for (const m of msgs) console.log(m);
await page.screenshot({ path: '/tmp/co-dbg.png', omitBackground: false });
await browser.close();
console.log('saved /tmp/co-dbg.png');

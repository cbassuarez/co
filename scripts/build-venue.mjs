// build-venue.mjs — build a self-contained, pinned deliverable for one venue.
//
// The public web build resolves place at runtime (?place= / timezone). A venue
// install instead bakes a single place/venue id at compile time via CO_VENUE, so
// the tarball is pinned to that place regardless of the host machine's timezone —
// deterministic, offline, curator-approved.
//
// Usage:
//   node scripts/build-venue.mjs --venue nyc
//   node scripts/build-venue.mjs --venue la --with-video
//   node scripts/build-venue.mjs --venue nyc --out /tmp/co-deliverables
//
// Produces:  <out>/co-<venue>-<version>/   (dist + VENUE.json + README-install.md)
//        and <out>/co-<venue>-<version>.tar.gz

import { execSync, spawn } from 'node:child_process';
import { readFileSync, writeFileSync, cpSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  const a = { venue: null, out: resolve(ROOT, 'deliverables'), withVideo: false, port: 4178 };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--venue') a.venue = argv[++i];
    else if (k === '--out') a.out = resolve(argv[++i]);
    else if (k === '--with-video') a.withVideo = true;
    else if (k === '--port') a.port = parseInt(argv[++i]);
  }
  if (!a.venue) throw new Error('need --venue <id> (e.g. nyc, la, or a registered venue id)');
  return a;
}

// Validate the venue id is a real place in the registry, so we never silently
// ship a build that falls back to web-default at runtime.
function knownPlaceIds() {
  const src = readFileSync(resolve(ROOT, 'src/place/place.ts'), 'utf8');
  return [...src.matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1]);
}

function placeLabel(venue) {
  const src = readFileSync(resolve(ROOT, 'src/place/place.ts'), 'utf8');
  // crude: find the `id: '<venue>'` block and read the following label.
  const re = new RegExp(`id:\\s*'${venue}'[\\s\\S]{0,80}?label:\\s*'([^']+)'`);
  return src.match(re)?.[1] ?? venue;
}

function waitForHttp(url, timeoutMs = 20000) {
  const start = Date.now();
  return new Promise((res, rej) => {
    const tick = async () => {
      try {
        const r = await fetch(url);
        if (r.ok) return res(true);
      } catch { /* not up yet */ }
      if (Date.now() - start > timeoutMs) return rej(new Error(`timeout waiting for ${url}`));
      setTimeout(tick, 300);
    };
    tick();
  });
}

async function main() {
  const args = parseArgs(process.argv);
  const ids = knownPlaceIds();
  if (!ids.includes(args.venue)) {
    throw new Error(`unknown venue '${args.venue}'. Registered places: ${ids.join(', ')}`);
  }

  const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
  const version = pkg.version;
  const label = placeLabel(args.venue);
  const name = `co-${args.venue}-${version}`;
  const stage = resolve(args.out, name);

  // 1. Build with the venue baked in.
  console.log(`building venue '${args.venue}' (${label}) …`);
  execSync('npm run build', {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, CO_VENUE: args.venue }
  });

  // 2. Stage dist/.
  rmSync(stage, { recursive: true, force: true });
  mkdirSync(stage, { recursive: true });
  cpSync(resolve(ROOT, 'dist'), stage, { recursive: true });

  // 3. Stamp a manifest.
  const manifest = {
    work: 'co',
    version,
    venue: args.venue,
    venueLabel: label,
    builtAt: new Date().toISOString(),
    pinned: true,
    network: 'not required after installation',
    runtime: 'WebGL2 browser, fullscreen, looping'
  };
  writeFileSync(resolve(stage, 'VENUE.json'), JSON.stringify(manifest, null, 2) + '\n');

  // 4. Install README.
  writeFileSync(resolve(stage, 'README-install.md'), installReadme(label, args.venue, version));

  // 5. Optional pre-rendered video fallback (for non-WebGL failure modes).
  if (args.withVideo) {
    await renderFallbackVideo(stage, args.venue, args.port);
  }

  // 6. Tarball.
  console.log('packaging tarball …');
  execSync(`tar -czf ${name}.tar.gz ${name}`, { cwd: args.out, stdio: 'inherit' });

  console.log(`\n✓ ${resolve(args.out, name)}`);
  console.log(`✓ ${resolve(args.out, name + '.tar.gz')}`);
  console.log(`\nPinned to: ${label} (${args.venue}). Runs offline from index.html.`);
}

async function renderFallbackVideo(stage, venue, port) {
  console.log('recording fallback video …');
  const preview = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], {
    cwd: ROOT,
    stdio: 'ignore',
    env: process.env
  });
  try {
    await waitForHttp(`http://127.0.0.1:${port}/`);
    // The baked build is pinned, so no ?place needed; seed kept canonical.
    execSync(
      `node scripts/record.mjs --url 'http://127.0.0.1:${port}/?seed=co-v1.0.0' ` +
      `--out '${resolve(stage, 'co-' + venue + '-fallback_1080p.webm')}' ` +
      `--duration 120 --width 1920 --height 1080`,
      { cwd: ROOT, stdio: 'inherit' }
    );
  } finally {
    preview.kill('SIGTERM');
  }
}

function installReadme(label, venue, version) {
  return `# co — install (${label})

This is a pinned build of **co** for **${label}** (\`${venue}\`), version ${version}.
It is a single self-contained WebGL artwork. No network is required after copying.

## What it is
A silent generative system in which bodies, routes, signals, and shared attention
temporarily produce place. Fixed 120-second loop, continuous. No audio, no input.

This build is **pinned** to ${label}: it always renders this place's character,
regardless of the machine's timezone or location. (The public web build at
cbassuarez.com/co instead adapts to the viewer's place automatically.)

## Run it
- Open \`index.html\` in any current browser with WebGL2 (Chrome, Safari, Firefox, Edge).
- It runs directly from disk/USB (\`file://\`) or from any static web server.
- For an exhibition surface: open fullscreen, hide the cursor, and let it loop.

A static server, if preferred:
\`\`\`
cd <this folder>
python3 -m http.server 4173 --bind 127.0.0.1
# open http://127.0.0.1:4173/
\`\`\`

## Display
- Any 16:9, ultrawide, or vertical surface; adapts to aspect ratio.
- 1920×1080 minimum, 3840×2160 preferred.
- Sound: none. Cursor + browser chrome: hidden. Fullscreen preferred.
- Network: not required after installation.

## Contents
- \`index.html\` + \`assets/\` — the work.
- \`VENUE.json\` — build manifest (venue, version, build time).
- \`*-fallback_1080p.webm\` — a recorded loop, if included, for machines without WebGL2.

## Optional URL parameters
- \`?quality=high|med|low\` — agent count + pixel-ratio cap for the display's GPU.
- \`?mode=debug\` — diagnostic overlay (phase, t, density, sync).
`;
}

main().catch((e) => { console.error(e); process.exit(1); });

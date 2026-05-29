# co

**A silent live generative net artwork.**
A two-minute browser-native public apparatus in which ambiguous bodies, routes, windows of time, and signals temporarily produce place.

— Sebastian Suarez-Solis

---

## Identity

| | |
|---|---|
| **Title** | `co` |
| **Medium** | Live generative net artwork; browser-native public apparatus; silent moving image system |
| **Duration** | 120-second loop |
| **Sound** | none |
| **Interaction** | none |
| **Stack** | TypeScript · Vite · Three.js · WebGL2 · custom shaders |
| **Network at runtime** | not required |

## What it is

`co` is a public machine making place visible.

Across a fixed two-minute cycle, autonomous luminous agents drift through routed fields, accumulate into temporary co-presence, briefly synchronize into a collective form, and dissolve back into circulation. The work treats place not as a stable site but as a *temporary agreement* produced by bodies, signals, delays, and shared attention.

It is silent by design. It requires no viewer input. It is not a video.

## Two-minute score

| Phase | Time | Read |
|---|---|---|
| 00 — dispersed attention | 0:00–0:20 | Many things are present, but they have not yet become public. |
| 01 — routing appears | 0:20–0:45 | The system is beginning to route attention. |
| 02 — co-presence thickens | 0:45–1:15 | Place is being produced by relation, not by architecture alone. |
| 03 — rare synchronization | 1:15–1:40 | A public system briefly becomes collective. |
| 04 — dénouement | 1:40–2:00 | Place was temporary, but not imaginary. |

## Run locally

```bash
npm install
npm run dev          # development server, http://127.0.0.1:5173/
npm run build        # static build into dist/
npm run preview      # preview the built bundle
```

After `npm run build`, the contents of `dist/` are a fully static, network-free bundle. You can serve them from any local HTTP server.

```bash
cd dist
python3 -m http.server 4173 --bind 127.0.0.1
# open http://127.0.0.1:4173/
```

Enter fullscreen with the browser's standard fullscreen shortcut. The work has no audio. It expects no input. It loops every 120 seconds.

## URL parameters

| flag | default | effect |
|---|---|---|
| `?mode=exhibition` | exhibition | default presentation mode, no HUD, no cursor |
| `?mode=debug` | — | shows the diagnostic HUD (phase, t, density, sync, signals) |
| `?mode=capture` | — | exposes the deterministic time-scrubbing API for offline capture |
| `?seed=co-v1.0.0` | `co-v1.0.0` | seeds the deterministic generator |
| `?duration=120` | 120 | cycle length in seconds |
| `?quality=high\|med\|low` | high | agent count + DPR cap |
| `?t=NN` | 0 | start the cycle N seconds in (useful for stills) |

Example: `http://127.0.0.1:4173/?mode=debug&t=68&seed=co-v1.0.0` jumps directly to the moment of the major synchronization event.

## Browser requirements

- WebGL2 (any current Chrome, Safari, Firefox, Edge)
- 1080p display recommended; the visual grammar adapts to any aspect ratio
- No audio output required
- No keyboard or pointer input required after launch

## Determinism

`co` runs on a seeded deterministic macrostructure. Each cycle takes exactly 120 seconds. Each seed produces the same dramaturgical arc and the same agent population, while preserving small per-frame jitter so the system remains "alive." The default seed `co-v1.0.0` is the canonical reference cycle.

## Capture / offline rendering

```bash
# Render a 1920×1080 webm of one full cycle:
node scripts/record.mjs \
  --url 'http://127.0.0.1:4173/?seed=co-v1.0.0' \
  --out ./out/co_v1.0.0.webm \
  --duration 120 --width 1920 --height 1080
```

The recording uses Puppeteer's CDP screencast against a real headless WebGL2 context, so the captured artifact reflects the work's actual frame pacing — not a pre-baked animation.

## Project structure

```
co/
├── index.html
├── package.json
├── vite.config.ts
├── README.md
├── src/
│   ├── main.ts
│   ├── engine/        # clock, seed, params, renderer
│   ├── scene/         # camera, scene, post
│   ├── systems/       # agents, routes, windows, signals, placeFields, dramaturgy
│   ├── shaders/       # agent / route / window vert+frag
│   └── styles/
└── scripts/
    ├── record.mjs     # one-shot WebM capture
    ├── render.mjs     # frame-stepped PNG sequence (slower, deterministic)
    └── debug.mjs      # single diagnostic screenshot
```

## What `co` is *not*

`co` is *not* a subway map. It is *not* a transit diagram. It is *not* a commuter scene. It is *not* a control dashboard. It is *not* a generic particle screensaver. It is *not* an AI-fantasy of a station.

It is a public apparatus producing place, not a picture of public space.

## Credits

`co` by Sebastian Suarez-Solis · 2026
Built with Three.js, Vite, TypeScript, and a lot of black.

# co

## Work identity

**Title:** `co`
**Medium:** live generative net artwork; browser-native public apparatus; silent moving image system
**Duration:** fixed 120-second loop
**Sound:** none
**Input:** none
**Primary form:** live generative system rendered in real time
**Output forms:** browser-native live work, two-minute screen recording, still images, offline runnable bundle

`co` is a silent live generative system in which ambiguous bodies, vehicles, air currents, routes, windows of time, and signals attempt to become a place together.

The work is not about transit as image. It is about the condition underneath transit: circulation becoming place, attention becoming shared, routing becoming social, infrastructure becoming atmosphere.

The title names the behavior of the system: co-presence, co-routing, co-attention, co-location, co-regulation, co-arrival.

## Core sentence

Place is not the site. Place is the temporary agreement produced by bodies, signals, routes, delays, and shared attention.

Everything in the work serves this sentence.

## Artistic frame

`co` is a public apparatus that happens to be browser-native.

It should not read as a small web sketch, a data visualization, a transit diagram, a map, or a decorative animation. It should feel like an infrastructural moving image system: beautiful first, system second, explanation third.

The work produces a generative tableaux vivant: an ecosystem of moving bodies and signals that opens, thickens, briefly synchronizes, and formally dissolves. Its central drama is not interaction, but relation. The viewer does not control the work. The viewer witnesses a public machine trying to produce place.

## Conceptual commitments

`co` is grounded in the following conditions:

* place as an event rather than a container
* publicness as shared attention rather than audience participation
* circulation as a compositional material
* co-presence without intimacy
* routing without destination
* signal control without command narrative
* collectivity without portraiture
* infrastructure without literal representation
* synchronization as rare and earned
* beauty as an entrance into systems thinking

The work should feel collective, civic, luminous, and alive. It should not feel didactic.

## Non-goals

The work must avoid:

* literal subway maps
* train-line diagrams
* transit bullets
* station typography
* arrival-board aesthetics
* pictorial commuters
* explicit urban wayfinding
* generic glitch aesthetics
* AI-city hallucination
* screensaver abstraction
* interface nostalgia as the main subject
* interaction
* user phones
* sound
* explanatory text
* theory-forward framing
* dependence on backstory

The work may suggest transit, civic space, crowds, routing, vehicles, air, and signal systems, but only through ambiguity.

## Visual world

The image world should be composed of ambiguous moving bodies in space.

A single form might read simultaneously as:

* a person
* a train
* a packet
* a vehicle
* an air current
* a memory trace
* a signal
* a small public event

No individual agent should be over-described. The ambiguity is the work.

The image should operate between diagram and cinema: formal enough to read as a system, beautiful enough to hold public attention, and unstable enough to remain alive.

## Visual language

The preferred language is WebGL / Three.js / shader-driven generative tableaux.

The work should use:

* instanced agents
* route fields
* luminous windows
* soft bloom
* spatial depth
* parallax
* mild chromatic atmosphere
* frame-to-frame jitter
* signal pulses
* density fields
* fading trails
* formal openings and closings
* large-scale compositional breathing

The image should avoid looking like p5 sketch aesthetics, flat SVG animation, pure DOM choreography, or default particle systems.

The atmosphere should sit near the artist’s existing cybernetic score language: black, white, hard structure, primary accents, public-machine clarity, and Godard-like graphic intelligence without quotation.

## Color

The base palette should be restrained and civic:

* black / near-black ground
* white or warm-white agents
* pale gray spatial structures
* occasional primary-color signal events
* controlled red, yellow, and blue accents
* no rainbow spectacle
* no transit-map color coding
* no decorative gradients unless structurally motivated

Color should indicate state, tension, windowing, or synchronization. It should not function as ornament alone.

## Text

The primary work should contain no readable text.

If text-like matter appears, it should remain residual and non-linguistic: ticks, coordinates, fragments, marks, measuring bars, unreadable labels, or almost-signage. It should feel like public systems language without becoming caption or instruction.

## Motion

Motion should be jittery/browser-like but refined.

The movement should avoid both cinematic smoothness and crude glitch. It should feel computed, clocked, and infrastructural: agents correcting, waiting, rerouting, drifting, hesitating, compressing, and releasing.

Motion qualities:

* small local jitter
* larger collective drift
* sudden but controlled signal changes
* queue-like compression
* soft flow-field routing
* rare alignment events
* visible delay
* visible near-miss
* formal reset through dissolution, not snapping

## Time structure

The work runs on a deterministic 120-second clock.

It is live-generated, but the macro-arc is fixed. Each run should produce the same formal dramaturgy while allowing local variation through seeded generative behavior.

The loop should feel complete, but not closed. It should imply that other places will continue to form after the current cycle ends.

## Two-minute score

### 0:00–0:20 — dispersed attention

Small autonomous bodies enter from unrelated edges and depths.

There is motion, but not yet place. The image should feel open, sparse, and unsettled. Agents do not yet know each other. They pass through possible routes without committing to them.

System behavior:

* low density
* weak route attraction
* small independent motion
* minimal trails
* faint window fields
* no synchronization
* no stable center

Viewer read:

Many things are present, but they have not yet become public.

### 0:20–0:45 — routing appears

Paths, windows, and signal fields begin to suggest relation.

Agents start responding to shared constraints. The work becomes legible in short glances: many independent things are trying to coordinate.

System behavior:

* routes become faintly visible
* agents begin grouping by temporary signal fields
* windows open and close
* some agents accelerate through corridors
* others pause or drift
* near-alignments occur but do not resolve

Viewer read:

The system is beginning to route attention.

### 0:45–1:15 — co-presence thickens

The system becomes placeFULL.

Agents cluster, pass through, overlap, nearly align, interrupt, and absorb one another into larger motion fields. The image becomes dense enough to feel spectacular, but the spectacle should reveal structure rather than hide it.

System behavior:

* increased density
* more visible trails
* stronger flow fields
* agent clusters form and disperse
* signal windows overlap
* route conflicts become visible
* the field begins to breathe as one system

Viewer read:

Place is being produced by relation, not by architecture alone.

### 1:15–1:40 — rare synchronization

One or two large-scale alignments occur.

Synchronization should feel earned. It should not be decorative, constant, or too perfect. It should feel as if the whole public machine briefly inhaled together.

System behavior:

* global pulse event
* many agents briefly share direction, brightness, or timing
* routes clarify without becoming maps
* luminous place-fields briefly stabilize
* signal colors become more decisive
* density reaches maximum legibility
* some agents remain out of phase

Viewer read:

A public system briefly becomes collective.

### 1:40–2:00 — formal dénouement

The system opens and closes like a flower.

The ending is a civic reset, not a hard reset. Place dissolves back into circulation. The work should release density, dim its signals, open the field, and return to a state that can begin again.

System behavior:

* route visibility fades
* agents drift outward or downward
* signals decouple
* clusters loosen
* trails evaporate
* central fields open
* motion softens but does not stop

Viewer read:

Place was temporary, but not imaginary.

## System architecture

The work should be built as a browser-native real-time graphics system.

Recommended stack:

* Vite
* Three.js
* TypeScript
* WebGL2
* instanced rendering
* custom shaders where useful
* postprocessing bloom
* deterministic seeded random
* fixed 120-second clock
* high-resolution capture mode
* offline build support

The system should not require a server to run. It should be able to run from a static build.

## Runtime modes

The work should support at least three modes:

### Live mode

Default browser presentation.

* runs fullscreen
* no visible controls
* deterministic 120-second loop
* responsive to viewport
* no audio
* no user input required

### Capture mode

A URL flag or keyboard-free configuration for clean recording.

Possible examples:

* `?capture=1`
* `?seed=co`
* `?hud=0`
* `?quality=high`
* `?duration=120`

Capture mode should prioritize visual stability, high resolution, and repeatability.

### Debug mode

A hidden development mode.

Possible examples:

* `?debug=1`
* `?hud=1`

Debug mode may show:

* elapsed time
* phase name
* agent count
* seed
* frame rate
* route field state
* synchronization strength
* window density

Debug information must never appear in the primary work.

## Generative model

The system consists of the following primary entities:

### Agents

Agents are the ambiguous bodies of the work.

Each agent has:

* position
* velocity
* acceleration
* scale
* brightness
* phase
* route affinity
* window affinity
* signal state
* memory trail
* jitter amount
* synchronization susceptibility
* lifespan
* depth layer

Agents should not be individualized as characters. They are bodies in public space: almost anonymous, but not identical.

### Routes

Routes are invisible or semi-visible paths through the field.

They should never resemble transit maps. They are not lines to be read as infrastructure. They are tendencies: corridors, airflows, lanes, pressure zones, or collective habits.

Routes may be implemented as:

* spline fields
* vector fields
* attractor curves
* noise-guided corridors
* invisible gravitational paths
* temporary luminous traces

Routes should become most visible when agents collectively activate them.

### Windows

Windows are temporal fields.

A window opens a possibility for co-presence. It does not command agents directly; it changes local probability.

Windows may affect:

* agent speed
* brightness
* grouping
* route affinity
* trail persistence
* jitter
* signal color
* synchronization susceptibility

A window should feel like a public condition: a moment when many bodies could share a place.

### Signals

Signals are state changes that move through the system.

Signals should be visible but not textual. They may appear as pulses, color shifts, shutters, scans, flickers, or field inversions.

Signals may:

* open routes
* close windows
* align agent phases
* increase jitter
* produce temporary place-fields
* trigger near-synchronizations
* dissolve clusters

Signal control should be embedded, not theatrical. The work should not feel like a command center. It should feel like a living public apparatus.

### Place-fields

Place-fields are temporary collective formations.

They occur when agents, routes, windows, and signals overlap strongly enough to produce a shared visual event.

A place-field is not a destination. It is a temporary agreement.

Place-fields should:

* emerge gradually
* glow or thicken
* hold briefly
* remain porous
* dissolve without collapse

They are the central image of the work.

## Spatial composition

The image should support both single-channel and multi-channel readings.

Even when shown on one screen, it should feel distributed. The composition should have multiple active zones rather than one theatrical center.

Possible spatial organization:

* left / center / right fields
* near / middle / far depth layers
* diagonal route pressures
* soft architectural voids
* luminous thresholds
* edge-originating motion
* central temporary co-presence zones
* off-center synchronization events

The work should reward both brief glances and full-duration viewing.

## Responsiveness

The work should adapt to aspect ratio without redesigning the composition.

Preferred behavior:

* 16:9 works as primary capture format
* ultrawide formats reveal additional lateral space
* vertical formats preserve the central system but crop peripheral routes
* square formats retain the place-field logic
* agent counts and field scales adapt to screen area

The visual grammar should not depend on a single exact aspect ratio.

## Multi-channel potential

The system should be conceived as distributable across multiple screens.

Multi-channel behavior may be implemented conceptually or technically through:

* shared seeded clock
* per-screen offsets
* route continuation across displays
* agents exiting one display and entering another
* staggered signal windows
* delayed synchronization between screens
* local place-fields inside a larger global cycle

The single-channel version should already imply this distributed architecture.

## Rendering details

Recommended rendering components:

* instanced geometry for agents
* alpha-blended trails
* offscreen render target for persistence
* bloom pass for luminous fields
* depth-based scale and opacity
* route-field shader or CPU-generated splines
* subtle film grain or browser-noise texture
* frame-quantized jitter
* high-DPI capture option
* optional motion blur through accumulation buffer

Avoid default Three.js material aesthetics. The image should be designed, not merely rendered.

## Agent appearance

Agents may appear as:

* small luminous bodies
* elongated capsules
* soft rectangles
* thin bars
* particulate clusters
* blurred moving marks
* tiny windows
* ambiguous silhouettes

Agents should never become literal humans, trains, cars, or icons.

A good agent should look like it could be a body, a vehicle, a packet, or a breath.

## Route appearance

Routes may appear as:

* faint luminous traces
* accumulated paths
* pressure contours
* barely visible splines
* ghost corridors
* parallax bands
* temporary rails of attention

Routes should emerge from use. The more bodies travel through them, the more visible they become.

## Window appearance

Windows may appear as:

* translucent rectangular fields
* breathing apertures
* soft shutters
* temporal zones
* light wells
* vertical or horizontal openings
* areas of reduced jitter
* areas of intensified brightness

Windows should open and close formally, like a flower or aperture.

## Synchronization

Synchronization must be rare.

The work should contain one or two major synchronization events in the 120-second cycle. These events should feel like collective arrival without becoming triumphalist.

Synchronization can be expressed through:

* shared direction
* shared pulse
* shared brightness
* shared deceleration
* temporary stillness
* collective blooming
* field-wide phase alignment
* route clarification

Some agents should remain out of phase. Perfect unity would be too simple.

## Reset logic

The loop should reset through dénouement.

The final twenty seconds should gradually loosen the system:

* clusters open
* routes fade
* windows close
* agents disperse
* brightness lowers
* signals soften
* trails evaporate

The work may loop seamlessly, but it should not hide the fact that a cycle has completed. The return should feel formal, not mechanical.

## Implementation phases

### Phase 1 — foundation

Build:

* fullscreen Three.js scene
* deterministic clock
* seeded random generator
* resize handling
* render loop
* postprocessing pipeline
* capture-friendly URL parameters

Goal: establish a stable visual engine.

### Phase 2 — agents

Build:

* instanced agent system
* per-agent attributes
* depth layers
* jitter
* velocity
* lifespan
* brightness
* trail persistence

Goal: make the field feel alive before adding explicit routes.

### Phase 3 — routes

Build:

* route field
* spline or flow-field attraction
* agent route affinity
* accumulated route visibility
* route fading

Goal: produce circulation without drawing a map.

### Phase 4 — windows and signals

Build:

* timed window fields
* signal pulses
* phase-based behavior changes
* co-presence zones
* color accents

Goal: make the system feel publicly regulated without literal signage.

### Phase 5 — two-minute dramaturgy

Shape:

* density curve
* synchronization curve
* route visibility curve
* brightness curve
* jitter curve
* trail persistence curve
* signal intensity curve
* final dénouement

Goal: make the work legible as a complete 120-second form.

### Phase 6 — polish

Refine:

* bloom
* contrast
* agent geometry
* trails
* color
* depth
* camera movement
* frame pacing
* anti-aliasing
* still-image moments
* capture reliability

Goal: make the work beautiful enough to stand without explanation.

## Suggested global curves

Use normalized time `t`, where `t = 0` at the beginning and `t = 1` at 120 seconds.

### Density

* low at `0.00`
* gradually increases through `0.35`
* thickens strongly from `0.35` to `0.65`
* peaks near `0.72`
* dissolves from `0.82` to `1.00`

### Route visibility

* nearly invisible at `0.00`
* faint at `0.20`
* clear but ambiguous at `0.45`
* strongest during synchronization
* fades during dénouement

### Synchronization strength

* almost none before `0.45`
* small near-alignments from `0.45` to `0.62`
* major event around `0.68`
* possible second softer event around `0.78`
* declining after `0.84`

### Jitter

* moderate at start
* increases during routing
* becomes more structured during co-presence
* decreases during synchronization
* returns softly during dénouement

### Bloom

* restrained early
* grows with density
* peaks during place-fields
* softens during reset

## Quality criteria

The work succeeds if:

* it reads immediately in a five-second glance
* it rewards a full two-minute viewing
* it feels silent by design, not muted
* it feels public without showing a public
* it suggests transit without illustrating transit
* it produces place without depicting a place
* it is beautiful before it is legible
* it feels generated but not generic
* it feels browser-native but not desktop-bound
* synchronization feels rare and earned
* the ending feels formal rather than abrupt
* the live system remains stronger than the recording of it

## Description

`co` is a silent live generative net artwork in which ambiguous bodies, vehicles, air currents, routes, windows of time, and signals attempt to become a place together. Across a fixed two-minute cycle, autonomous agents drift through routed fields, gather into temporary co-presence, briefly synchronize, and dissolve back into circulation. The work treats place not as a stable site, but as a temporary agreement produced by bodies, signals, delays, and shared attention.

## Short description

`co` is a silent live generative system about co-presence, routing, and place. Ambiguous bodies move through signal fields, briefly synchronize into a collective public form, and dissolve back into circulation.

## One-line description

A silent live generative system in which bodies, routes, signals, and shared attention temporarily produce place.

## Technical summary

`co` is built as a browser-native real-time graphics system using WebGL / Three.js. It uses instanced agents, route fields, timed signal windows, deterministic seeded generation, and a fixed 120-second clock to produce a repeatable but live-generated moving image. The work runs without server infrastructure and can be presented as a live URL, local static build, or high-resolution two-minute recording.

## File structure

Recommended project structure:

```txt
co/
  index.html
  package.json
  vite.config.ts
  README.md
  public/
    preview.jpg
  src/
    main.ts
    engine/
      clock.ts
      seed.ts
      params.ts
      renderer.ts
      resize.ts
    scene/
      scene.ts
      camera.ts
      post.ts
    systems/
      agents.ts
      routes.ts
      windows.ts
      signals.ts
      placeFields.ts
      dramaturgy.ts
    shaders/
      agent.vert
      agent.frag
      trail.vert
      trail.frag
      field.vert
      field.frag
    styles/
      base.css
```

## README requirements

The runnable bundle should include a short `README.md` with:

* title
* medium
* duration
* browser requirements
* how to run locally
* how to build
* how to enter fullscreen
* capture URL parameters
* recommended resolution
* note that the work has no sound
* note that the work requires no network after build

## Local running

Recommended commands:

```bash
npm install
npm run dev
npm run build
npm run preview
```

The built version should be static and runnable from the `dist/` directory.

## Capture recommendations

Recommended capture:

* 1920×1080 minimum
* 3840×2160 preferred if performance allows
* 60 fps if stable
* 30 fps acceptable if the visual rhythm remains strong
* no cursor
* no browser UI
* fullscreen
* no visible debug HUD
* capture from deterministic seed
* record exactly one 120-second cycle

## Final artifact checklist

The completed work should include:

* live browser-native version
* static build
* offline runnable bundle
* two-minute video capture
* 3–5 stills
* short description
* technical summary
* README
* preview image

## North star

The work is not a picture of public space.

It is a public machine making place visible.


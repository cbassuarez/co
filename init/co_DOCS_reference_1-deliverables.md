---

document_id: co-deliverables-design-doc
title: co — Exhibition Deliverables Design Doc
artwork_title: co
version: 1.0.0
release_name: co_v1.0.0_exhibition-gold_2026-05-28
document_version: 1.0.0
date: 2026-05-28
author: Sebastian Suarez-Solis
contact: [seb@cbassuarez.com](mailto:seb@cbassuarez.com)
status: design-spec
primary_runtime: electron-kiosk-linux-x64
secondary_runtime: static-offline-web-build
tertiary_runtime: local-docker-static-server
fallback_runtime: rendered-video-playback
network_required: false
sound_required: false
interaction_required: false
duration_seconds: 120
looping: true
seeded: true
deterministic_macrostructure: true
----------------------------------

# `co` — Exhibition Deliverables Design Doc

## 0. Purpose

This document defines the complete exhibition deliverables package for `co`, a silent live generative browser-native artwork.

The goal is to deliver `co` as an installable, version-locked exhibition appliance rather than as a website. The work must be capable of running locally on a PC/server/Linux machine without dependency on the artist’s public website, DNS, CI/CD state, GitHub Pages, external CDNs, npm registries, remote package resolution, or any live web service.

The exhibition copy of `co` is a frozen, local, repeatable release.

The website version may exist for public access, preview, documentation, or archival reference, but it is not the exhibition runtime.

## 1. Artwork identity

```yaml
artwork:
  title: "co"
  medium:
    - live generative net artwork
    - browser-native public apparatus
    - silent moving image system
  duration_seconds: 120
  sound: false
  interaction: false
  primary_form: "live real-time generative system"
  fallback_form: "rendered video playback"
  primary_runtime: "Electron kiosk application"
  secondary_runtime: "static offline web build"
  tertiary_runtime: "Docker/OCI local static server"
  network_dependency: false
  website_dependency: false
```

`co` is a silent live generative system in which ambiguous bodies, vehicles, air currents, routes, windows of time, and signals attempt to become a place together.

The deliverables must preserve this identity. `co` is not a video file first. It is a live generative public apparatus whose behavior is captured, documented, and made operationally safe through fallback media.

## 2. Deliverables philosophy

`co` should be delivered as an exhibition appliance.

That means the package includes:

1. A primary runtime that can be installed and launched directly.
2. A static offline build that can be served locally by the institution.
3. A source/reproducibility package for future migration.
4. A fallback media package for emergency playback.
5. Documentation sufficient for installation, troubleshooting, conservation, and acceptable migration.
6. Checksums and machine-readable manifests for validation.

The central principle is:

> The exhibition team should be able to install, verify, run, troubleshoot, and preserve `co` without relying on the artist’s production website or guessing the intended behavior of the work.

## 3. Deliverable hierarchy

```yaml
deliverable_hierarchy:
  primary:
    name: "Electron kiosk application for Linux x64"
    purpose: "Preferred exhibition runtime"
    concept_status: "primary artwork form"
  secondary:
    name: "Static offline web build"
    purpose: "Institutional backup path"
    concept_status: "acceptable alternate runtime"
  tertiary:
    name: "Docker/OCI local static server"
    purpose: "Optional IT-friendly serving layer"
    concept_status: "support layer, not primary artwork form"
  emergency:
    name: "Rendered video master"
    purpose: "Operational fallback"
    concept_status: "fallback/documentation, not primary artwork form"
  archival:
    name: "Source, lockfiles, docs, checksums, environment metadata"
    purpose: "Preservation, migration, verification"
    concept_status: "conservation layer"
```

## 4. Release package name

Preferred release package name:

```txt
co_v1.0.0_exhibition-gold_2026-05-28/
```

Naming rules:

```yaml
release_naming:
  pattern: "{artwork}_v{semver}_{release-type}_{date}"
  artwork: "co"
  semver: "1.0.0"
  release_type: "exhibition-gold"
  date_format: "YYYY-MM-DD"
  example: "co_v1.0.0_exhibition-gold_2026-05-28"
```

Use `exhibition-gold` only for a tested, frozen, installable release. Do not use this label for drafts, source-only packages, development builds, or website deployments.

## 5. Top-level package structure

```txt
co_v1.0.0_exhibition-gold_2026-05-28/
  README_FIRST.md
  ARTWORK_MANIFEST.json
  RELEASE_NOTES.md
  runtime/
    electron-linux-x64/
    static-dist/
    docker/
  docs/
    00_read_first.md
    01_artwork_spec.md
    02_installation_manual.md
    03_tech_rider.md
    04_runbook.md
    05_troubleshooting.md
    06_preservation_notes.md
    07_artist_intent.md
    08_acceptable_variability.md
    09_changelog.md
  fallback/
    video/
    stills/
  source/
    co-source-v1.0.0.tar.gz
    source-manifest.json
  environment/
    node-version.txt
    npm-version.txt
    electron-version.txt
    chromium-version.txt
    build-os.txt
    gpu-tested.txt
    browser-tested.txt
  checksums/
    SHA256SUMS.txt
    SHA256SUMS.txt.sig
  licenses/
    LICENSE
    THIRD_PARTY_LICENSES.md
```

## 6. Machine-readable artwork manifest

The package must include a top-level `ARTWORK_MANIFEST.json`.

This file should describe the work, runtime priorities, technical requirements, checksum references, and acceptable installation modes.

```json
{
  "schema": "https://cbassuarez.com/schemas/artwork-manifest/v1",
  "artwork": {
    "title": "co",
    "artist": "Sebastian Suarez-Solis",
    "contact": "seb@cbassuarez.com",
    "version": "1.0.0",
    "releaseName": "co_v1.0.0_exhibition-gold_2026-05-28",
    "date": "2026-05-28",
    "medium": [
      "live generative net artwork",
      "browser-native public apparatus",
      "silent moving image system"
    ],
    "durationSeconds": 120,
    "hasSound": false,
    "requiresInteraction": false,
    "requiresNetwork": false,
    "primaryArtworkForm": "live generative runtime",
    "fallbackArtworkForm": "rendered video playback"
  },
  "runtimePriority": [
    {
      "rank": 1,
      "name": "electron-linux-x64",
      "path": "runtime/electron-linux-x64/",
      "status": "preferred",
      "description": "Pinned Electron kiosk runtime. Preferred exhibition installation method."
    },
    {
      "rank": 2,
      "name": "static-dist",
      "path": "runtime/static-dist/",
      "status": "approved-alternative",
      "description": "Fully compiled offline static web build."
    },
    {
      "rank": 3,
      "name": "docker-static-server",
      "path": "runtime/docker/",
      "status": "optional-support",
      "description": "Optional local Docker/OCI container for serving the static build."
    },
    {
      "rank": 4,
      "name": "fallback-video",
      "path": "fallback/video/",
      "status": "emergency-only",
      "description": "Rendered fallback media for emergency playback or documentation."
    }
  ],
  "technicalRequirements": {
    "os": ["Linux x64"],
    "recommendedOs": "Ubuntu 24.04 LTS or institution-approved Linux distribution",
    "gpu": "Dedicated or integrated GPU with stable WebGL2 support",
    "display": "Fullscreen digital display or video wall pipeline",
    "network": "Not required after installation",
    "audio": "Not used",
    "inputDevices": "Not required after launch",
    "webgl": "WebGL2 required",
    "targetFrameRate": 60,
    "minimumAcceptableFrameRate": 30
  },
  "timing": {
    "looping": true,
    "loopDurationSeconds": 120,
    "deterministicMacrostructure": true,
    "seeded": true,
    "defaultSeed": "co-v1.0.0"
  },
  "integrity": {
    "checksumFile": "checksums/SHA256SUMS.txt",
    "signatureFile": "checksums/SHA256SUMS.txt.sig"
  },
  "documentation": {
    "installationManual": "docs/02_installation_manual.md",
    "techRider": "docs/03_tech_rider.md",
    "runbook": "docs/04_runbook.md",
    "troubleshooting": "docs/05_troubleshooting.md",
    "preservationNotes": "docs/06_preservation_notes.md",
    "artistIntent": "docs/07_artist_intent.md",
    "acceptableVariability": "docs/08_acceptable_variability.md"
  }
}
```

## 7. Primary runtime: Electron kiosk application

### 7.1 Purpose

The Electron kiosk application is the preferred exhibition runtime.

It provides a pinned Chromium environment, fullscreen kiosk behavior, hidden cursor, no browser chrome, no visible controls, and a known WebGL execution context.

This is the best primary runtime because `co` is browser-native, but not website-dependent. The visual behavior of a WebGL artwork can vary across browser versions. Pinning Electron reduces that risk.

### 7.2 Required behavior

The Electron app must:

```yaml
electron_runtime_requirements:
  opens_fullscreen: true
  hides_cursor: true
  hides_menu_bar: true
  has_browser_chrome: false
  starts_automatically: true
  starts_at_beginning_of_cycle: true
  uses_default_seed: true
  loops_after_120_seconds: true
  requires_network: false
  requires_audio: false
  requires_keyboard_after_launch: false
  exits_only_by_admin_command: true
  disables_text_selection: true
  disables_context_menu: true
  disables_devtools_by_default: true
```

### 7.3 Directory structure

```txt
runtime/electron-linux-x64/
  co.AppImage
  co-linux-x64/
    co
    resources/
    locales/
    chrome-sandbox
    libEGL.so
    libGLESv2.so
  launch-co.sh
  launch-co-debug.sh
  README.md
```

### 7.4 Launch scripts

`launch-co.sh` should be the standard launch path.

Example:

```bash
#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

export CO_MODE="exhibition"
export CO_SEED="co-v1.0.0"
export CO_DURATION_SECONDS="120"
export CO_FULLSCREEN="1"
export CO_HIDE_CURSOR="1"

./co-linux-x64/co
```

`launch-co-debug.sh` may expose development diagnostics, but must not be used for exhibition playback.

### 7.5 AppImage

Include `co.AppImage` if possible.

The AppImage is useful because it allows the institution to run the application without unpacking a full application folder manually. However, the unpacked `co-linux-x64/` folder should also be included as a backup.

### 7.6 Autostart compatibility

The package should include optional autostart examples, but should not assume permission to install them.

```txt
runtime/electron-linux-x64/autostart/
  co.desktop
  co.service.example
  README.md
```

Recommended autostart modes:

```yaml
autostart_options:
  desktop_entry:
    status: optional
    best_for: "gallery PC with user login"
  systemd_user_service:
    status: optional
    best_for: "managed Linux playback machine"
  systemd_system_service:
    status: optional
    best_for: "institution-controlled dedicated appliance"
```

## 8. Secondary runtime: static offline build

### 8.1 Purpose

The static build is the approved alternate runtime.

It allows the exhibition team to serve `co` locally using their own infrastructure if Electron is not acceptable.

The static build must already be compiled. It must not require `npm install`, `npm run build`, internet access, CDN access, or remote package downloads.

### 8.2 Directory structure

```txt
runtime/static-dist/
  index.html
  assets/
  manifest.json
  README.md
```

### 8.3 Requirements

```yaml
static_build_requirements:
  compiled: true
  requires_npm_install: false
  requires_network: false
  uses_relative_paths: true
  uses_external_cdns: false
  contains_all_assets: true
  supports_localhost_serving: true
  supports_file_protocol: false
  preferred_serving_method: "local HTTP server"
```

The build does not need to support `file://` execution. A local HTTP server is acceptable and more reliable for WebGL asset loading.

## 9. Optional local static server

### 9.1 Purpose

Include a simple local server script for the static build.

This gives the institution a minimal way to serve `runtime/static-dist/` without writing their own server configuration.

### 9.2 Directory structure

```txt
runtime/static-dist/scripts/
  serve-local.sh
  serve-local-python.sh
  serve-local-node.sh
```

### 9.3 Requirements

The default local server must bind only to `127.0.0.1` unless explicitly configured otherwise.

Example:

```bash
#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

HOST="${CO_HOST:-127.0.0.1}"
PORT="${CO_PORT:-8080}"

python3 -m http.server "$PORT" --bind "$HOST"
```

Default URL:

```txt
http://127.0.0.1:8080/
```

## 10. Tertiary runtime: Docker/OCI static server

### 10.1 Purpose

Docker is an optional support layer, not the primary artwork runtime.

A container can serve the static build consistently, but it does not solve the browser/GPU/display layer. Therefore, Docker should never be described as the main artwork. It is only an IT-friendly way to serve `runtime/static-dist/`.

### 10.2 Directory structure

```txt
runtime/docker/
  Dockerfile
  compose.yaml
  nginx.conf
  README.md
```

### 10.3 Docker requirements

```yaml
docker_runtime:
  purpose: "serve static build locally"
  primary_artwork_runtime: false
  binds_default: "127.0.0.1:8080"
  serves_directory: "/usr/share/nginx/html"
  network_required_after_image_build: false
  gpu_required_inside_container: false
```

### 10.4 Dockerfile example

```dockerfile
FROM nginx:1.27-alpine

COPY ../static-dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
```

### 10.5 Compose example

```yaml
services:
  co-static:
    build: .
    ports:
      - "127.0.0.1:8080:8080"
    restart: unless-stopped
```

## 11. Emergency fallback: rendered video

### 11.1 Purpose

The fallback video exists so the exhibition can continue if the live runtime fails or if institutional playback infrastructure requires a rendered media file.

The fallback video is not the primary artwork form.

Documentation must describe it as:

> fallback documentation / emergency playback version, not the primary live generative runtime.

### 11.2 Directory structure

```txt
fallback/video/
  co_v1.0.0_2160p_60fps_master.mov
  co_v1.0.0_1080p_60fps_h264.mp4
  co_v1.0.0_1080p_30fps_h264.mp4
  README.md

fallback/stills/
  co_v1.0.0_still_001_dispersed-attention.png
  co_v1.0.0_still_002_routing-appears.png
  co_v1.0.0_still_003_co-presence-thickens.png
  co_v1.0.0_still_004_rare-synchronization.png
  co_v1.0.0_still_005_denouement.png
```

### 11.3 Video specifications

```yaml
fallback_video:
  master:
    filename: "co_v1.0.0_2160p_60fps_master.mov"
    resolution: "3840x2160"
    frame_rate: 60
    codec: "ProRes 422 HQ or institution-preferred mezzanine codec"
    audio: false
    duration_seconds: 120
  delivery_h264:
    filename: "co_v1.0.0_1080p_60fps_h264.mp4"
    resolution: "1920x1080"
    frame_rate: 60
    codec: "H.264"
    audio: false
    duration_seconds: 120
  delivery_30fps:
    filename: "co_v1.0.0_1080p_30fps_h264.mp4"
    resolution: "1920x1080"
    frame_rate: 30
    codec: "H.264"
    audio: false
    duration_seconds: 120
```

### 11.4 Fallback use policy

```yaml
fallback_use_policy:
  normal_use: false
  emergency_use: true
  documentation_use: true
  preview_use: true
  requires_artist_notification_for_long_term_replacement: true
```

The fallback video may be used for:

* emergency playback
* preview
* documentation
* institutional review
* temporary troubleshooting

It should not permanently replace the live runtime without artist approval.

## 12. Source and reproducibility package

### 12.1 Purpose

The source package supports preservation, migration, verification, and future rebuilding.

The institution should not need to build from source to install the artwork, but the source must be included.

### 12.2 Directory structure

```txt
source/
  co-source-v1.0.0.tar.gz
  source-manifest.json
```

The source archive should expand to:

```txt
co-source-v1.0.0/
  package.json
  package-lock.json
  vite.config.ts
  electron/
  src/
  shaders/
  public/
  README.md
  LICENSE
  RELEASE_NOTES.md
```

### 12.3 Requirements

```yaml
source_requirements:
  lockfile_required: true
  floating_dependencies_allowed: false
  cdn_imports_allowed: false
  remote_asset_dependencies_allowed: false
  build_required_for_installation: false
  build_supported_for_preservation: true
```

### 12.4 Dependency policy

No dependency should use:

```txt
latest
*
^
```

Preferred dependency pinning:

```json
{
  "dependencies": {
    "three": "0.XXX.X",
    "@vitejs/plugin-react": "X.X.X"
  },
  "devDependencies": {
    "electron": "X.X.X",
    "vite": "X.X.X",
    "typescript": "X.X.X"
  }
}
```

If caret ranges are used during development, the exhibition release should still include a lockfile and a built runtime.

## 13. Environment metadata

### 13.1 Purpose

The environment folder documents the technical conditions under which the release was built and tested.

### 13.2 Directory structure

```txt
environment/
  node-version.txt
  npm-version.txt
  electron-version.txt
  chromium-version.txt
  vite-version.txt
  three-version.txt
  typescript-version.txt
  build-os.txt
  gpu-tested.txt
  browser-tested.txt
  display-tested.txt
```

### 13.3 Example contents

`electron-version.txt`

```txt
Electron: 31.0.0
Chromium: 126.x
Node: 20.x
```

`gpu-tested.txt`

```txt
Tested GPU environments:
- Apple M-series integrated GPU / development preview
- Intel integrated graphics with WebGL2
- NVIDIA discrete GPU with proprietary Linux driver
```

`display-tested.txt`

```txt
Tested display formats:
- 1920x1080 fullscreen
- 3840x2160 fullscreen
- browser windowed development preview
```

## 14. Documentation package

### 14.1 Required documents

```txt
docs/
  00_read_first.md
  01_artwork_spec.md
  02_installation_manual.md
  03_tech_rider.md
  04_runbook.md
  05_troubleshooting.md
  06_preservation_notes.md
  07_artist_intent.md
  08_acceptable_variability.md
  09_changelog.md
```

### 14.2 `00_read_first.md`

Purpose:

* Identify the artwork.
* State the preferred runtime.
* State that the work is offline.
* Explain the runtime hierarchy.
* Point to installation instructions.
* Clarify that video is fallback only.

Required summary:

```md
# Read First

`co` is delivered as a local exhibition appliance.

Preferred runtime:
1. `runtime/electron-linux-x64/`

Approved alternatives:
2. `runtime/static-dist/`
3. `runtime/docker/`

Emergency fallback:
4. `fallback/video/`

The work does not require internet access, audio, or viewer interaction. The exhibition runtime should not depend on the artist’s public website.
```

### 14.3 `01_artwork_spec.md`

Purpose:

* Define the artwork’s identity, behavior, visual language, and conceptual commitments.
* Preserve what the work is.
* Distinguish live runtime from fallback media.

Must include:

* title
* medium
* duration
* no sound
* no interaction
* live generative identity
* fixed 120-second loop
* seeded deterministic macrostructure
* visual language
* non-goals
* two-minute score
* acceptable display conditions

### 14.4 `02_installation_manual.md`

Purpose:

* Tell the exhibition team exactly how to install and run the work.

Must include:

* hardware requirements
* software requirements
* preferred install path
* how to launch Electron runtime
* how to run static build
* how to use Docker option
* how to enter fullscreen
* how to verify correct playback
* how to enable autostart
* how to disable screen sleep
* how to hide cursor
* how to reboot and relaunch
* how to use fallback video

### 14.5 `03_tech_rider.md`

Purpose:

* Define technical needs in a concise operational format.

Must include:

```yaml
tech_rider:
  os: "Linux x64 preferred"
  gpu: "WebGL2-capable GPU"
  display: "fullscreen digital display or video wall"
  sound: "none"
  interaction: "none"
  network: "not required"
  runtime: "Electron kiosk application preferred"
  fallback: "silent 120-second video file"
  duration_seconds: 120
  loop: true
```

### 14.6 `04_runbook.md`

Purpose:

* Give daily operators a simple operational checklist.

Must include:

* startup procedure
* shutdown procedure
* daily verification
* what normal behavior looks like
* what failure looks like
* when to use fallback video
* who to contact

### 14.7 `05_troubleshooting.md`

Purpose:

* Help non-developer staff identify and fix common issues.

Must include:

| Symptom               | Likely cause                 | Fix                                                    |
| --------------------- | ---------------------------- | ------------------------------------------------------ |
| black screen          | WebGL/GPU issue              | restart app, verify GPU acceleration, try static build |
| low frame rate        | weak GPU / high resolution   | reduce resolution, try fallback, contact artist        |
| cursor visible        | kiosk setting failed         | relaunch with `launch-co.sh`                           |
| app not fullscreen    | window manager issue         | use fullscreen shortcut or relaunch                    |
| network error         | incorrect runtime path       | use local runtime, not website                         |
| visible browser UI    | static build opened manually | use Electron runtime                                   |
| video has sound track | wrong export                 | use silent fallback file                               |

### 14.8 `06_preservation_notes.md`

Purpose:

* Support future reinstallation, migration, or conservation.

Must include:

* artwork identity
* runtime hierarchy
* source archive location
* lockfile policy
* Electron/Chromium version
* WebGL requirement
* checksum instructions
* acceptable migration paths
* unacceptable substitutions
* fallback video status
* notes on future browser migration

### 14.9 `07_artist_intent.md`

Purpose:

* Preserve the conceptual and experiential identity of the work.

Must include:

* the work is silent by design
* no interaction should be added
* the live system is primary
* the rendered video is secondary
* transit iconography should not be added
* synchronization should remain rare
* duration should remain 120 seconds
* visual ambiguity is essential
* the work produces place rather than depicting place

### 14.10 `08_acceptable_variability.md`

Purpose:

* Define what can and cannot change without damaging the artwork.

This is one of the most important documents in the package.

See Section 18.

### 14.11 `09_changelog.md`

Purpose:

* Track release versions and changes.

Must include:

```md
# Changelog

## v1.0.0 — exhibition-gold — 2026-05-28

- Initial frozen exhibition release.
- Includes Electron kiosk runtime.
- Includes static offline build.
- Includes optional Docker local static server.
- Includes fallback video and stills.
- Includes source archive, lockfiles, checksums, and documentation.
```

## 15. Installation manual design

The installation manual should be written for a technically competent exhibition/media technician, not a software developer.

### 15.1 Preferred install path

Recommended install directory:

```txt
/opt/co/
```

Alternative user-local path:

```txt
~/co/
```

### 15.2 Installation steps

```md
# Installation

1. Copy `co_v1.0.0_exhibition-gold_2026-05-28/` to the playback machine.
2. Verify checksums using `checksums/SHA256SUMS.txt`.
3. Open `runtime/electron-linux-x64/`.
4. Run `./launch-co.sh`.
5. Confirm fullscreen playback.
6. Confirm no sound is present.
7. Confirm no cursor or browser chrome is visible.
8. Confirm the work loops every 120 seconds.
9. Configure autostart if needed.
10. Reboot the machine and confirm the work relaunches.
```

### 15.3 Checksum verification

```bash
cd co_v1.0.0_exhibition-gold_2026-05-28
sha256sum -c checksums/SHA256SUMS.txt
```

Expected result:

```txt
OK
```

### 15.4 Launch command

```bash
cd runtime/electron-linux-x64
chmod +x launch-co.sh
./launch-co.sh
```

### 15.5 Static build command

```bash
cd runtime/static-dist/scripts
chmod +x serve-local.sh
./serve-local.sh
```

Then open:

```txt
http://127.0.0.1:8080/
```

### 15.6 Docker command

```bash
cd runtime/docker
docker compose up -d
```

Then open:

```txt
http://127.0.0.1:8080/
```

## 16. Runtime modes

```yaml
runtime_modes:
  exhibition:
    description: "Default live presentation mode"
    debug_visible: false
    controls_visible: false
    cursor_visible: false
    duration_seconds: 120
    seed: "co-v1.0.0"
  debug:
    description: "Hidden diagnostic mode"
    debug_visible: true
    controls_visible: false
    cursor_visible: true
    intended_for_public_display: false
  capture:
    description: "Clean recording mode"
    debug_visible: false
    controls_visible: false
    cursor_visible: false
    fixed_resolution_supported: true
```

Suggested URL flags for static/runtime debugging:

```txt
?mode=exhibition
?mode=debug
?mode=capture
?seed=co-v1.0.0
?duration=120
?hud=0
```

The public/exhibition default should require no URL flags.

## 17. Technical requirements

### 17.1 Minimum

```yaml
minimum_requirements:
  os: "Linux x64"
  cpu: "modern Intel/AMD x64 CPU"
  memory: "8 GB RAM"
  gpu: "WebGL2-capable GPU"
  display_resolution: "1920x1080"
  frame_rate: "30 fps minimum acceptable"
  storage: "2 GB available"
  network: "not required after install"
  audio: "not required"
  input: "keyboard/mouse only for installation"
```

### 17.2 Recommended

```yaml
recommended_requirements:
  os: "Ubuntu 24.04 LTS or institution-standard Linux image"
  cpu: "Intel i5/i7 or AMD Ryzen equivalent"
  memory: "16 GB RAM"
  gpu: "dedicated GPU or strong integrated GPU with stable WebGL2 support"
  display_resolution: "3840x2160 where available"
  frame_rate: "60 fps"
  storage: "10 GB available"
  network: "available for installation only, not runtime"
```

### 17.3 Display

```yaml
display_requirements:
  fullscreen: true
  browser_chrome_visible: false
  cursor_visible: false
  audio_output_required: false
  brightness_calibration_required: "recommended"
  aspect_ratio_flexible: true
  primary_capture_aspect_ratio: "16:9"
```

## 18. Acceptable variability

### 18.1 Acceptable without artist approval

```yaml
acceptable_variability:
  display_size: true
  display_resolution: true
  aspect_ratio_within_defined_limits: true
  gpu_model_if_performance_stable: true
  linux_distribution_if_runtime_operates_correctly: true
  local_server_method: true
  brightness_calibration_within_reason: true
  minor_runtime_migration_for_preservation: true
  installation_path: true
  autostart_method: true
```

Examples:

* Using a different Linux distribution if the Electron app runs correctly.
* Serving the static build through Nginx instead of the included script.
* Running at 1080p instead of 4K if performance requires it.
* Adjusting display brightness so the image is visible in the site conditions.
* Using institution-standard autostart tools.

### 18.2 Requires artist approval

```yaml
requires_artist_approval:
  changing_duration: true
  changing_seed_behavior: true
  changing_color_logic: true
  changing_agent_behavior: true
  changing_synchronization_timing: true
  changing_visual_language: true
  using_video_as_long_term_primary_runtime: true
  migrating_to_non_browser_runtime: true
```

### 18.3 Not acceptable

```yaml
not_acceptable:
  adding_sound: true
  adding_interaction: true
  adding_user_phone_component: true
  adding transit iconography: true
  adding readable explanatory text: true
  adding station typography: true
  replacing live runtime with website dependency: true
  depending_on_artist_website_for_exhibition: true
  using_external_cdns: true
  using_unpinned_dependencies_for_exhibition: true
  modifying_duration_without_approval: true
  modifying_seed_or_clock_without_approval: true
```

The following changes damage the artwork’s identity:

* adding sound
* adding interaction
* adding user participation
* adding literal train imagery
* adding transit maps or bullets
* changing the work into a data visualization
* making the work depend on a live website
* replacing the live runtime with fallback video as the normal presentation
* changing the 120-second dramaturgy
* making synchronization frequent instead of rare

## 19. Artist intent preservation

The following principles must be preserved in any installation or migration.

```yaml
artist_intent:
  silent_by_design: true
  live_runtime_primary: true
  no_interaction: true
  no_literal_transit_imagery: true
  visual_ambiguity_essential: true
  synchronization_rare: true
  duration_seconds: 120
  place_produced_not_depicted: true
  browser_native_identity: true
  public_apparatus_identity: true
```

Interpretive summary:

`co` should feel like a public machine making place visible. It should not become a cinematic video, transit visualization, interactive kiosk, or decorative ambient animation.

## 20. Checksums and integrity

### 20.1 Required checksum file

Include:

```txt
checksums/SHA256SUMS.txt
```

Generate with:

```bash
find . -type f \
  ! -path "./checksums/SHA256SUMS.txt" \
  ! -path "./checksums/SHA256SUMS.txt.sig" \
  -print0 | sort -z | xargs -0 sha256sum > checksums/SHA256SUMS.txt
```

Verify with:

```bash
sha256sum -c checksums/SHA256SUMS.txt
```

### 20.2 Optional signature

Include:

```txt
checksums/SHA256SUMS.txt.sig
```

This may be generated with GPG or another agreed signing method.

## 21. Versioning policy

Use semantic versioning for artwork releases.

```yaml
versioning:
  major:
    meaning: "material change to artwork identity, duration, behavior, or visual language"
  minor:
    meaning: "approved runtime, compatibility, or installation improvement without changing artwork identity"
  patch:
    meaning: "bugfix, packaging fix, documentation correction, checksum update"
```

Examples:

```txt
v1.0.0  initial exhibition-gold release
v1.0.1  documentation/checksum correction
v1.1.0  approved runtime compatibility update
v2.0.0  material artwork revision
```

## 22. Build policy

The exhibition package should be built once and frozen.

### 22.1 Build requirements

```yaml
build_policy:
  no_remote_runtime_dependencies: true
  no_external_cdns: true
  lockfile_required: true
  source_included: true
  built_runtime_included: true
  build_not_required_for_installation: true
```

### 22.2 Build commands

Recommended source build commands:

```bash
npm ci
npm run build
npm run package:electron
npm run package:static
npm run package:docker
npm run checksums
```

The release package should include built artifacts, not just source.

## 23. Security and network posture

### 23.1 Runtime network behavior

```yaml
network_posture:
  outbound_network_required: false
  inbound_network_required: false
  local_server_optional: true
  website_dependency: false
  external_cdn_dependency: false
  package_registry_dependency_at_runtime: false
```

### 23.2 Recommended firewall posture

The artwork can run with no public network exposure.

If the static server or Docker server is used, bind only to:

```txt
127.0.0.1
```

unless an institution specifically needs LAN access.

### 23.3 Data collection

```yaml
data_collection:
  collects_user_data: false
  stores_user_data: false
  sends_telemetry: false
  uses_analytics: false
  requires_cookies: false
  requires_login: false
```

## 24. Runbook

### 24.1 Daily startup

```md
1. Power on playback machine.
2. Confirm display/video wall is active.
3. Launch `co` through the configured autostart or `launch-co.sh`.
4. Confirm fullscreen playback.
5. Confirm no cursor is visible.
6. Confirm no browser chrome is visible.
7. Observe at least one minute of playback.
8. Confirm motion is smooth and the image is not frozen.
```

### 24.2 Daily shutdown

```md
1. Exit the runtime using the agreed admin method.
2. Shut down playback machine through standard OS procedure.
3. Do not unplug during active filesystem writes.
```

### 24.3 Normal behavior

Normal behavior includes:

* silent playback
* looping every 120 seconds
* no visible controls
* no visible cursor
* no browser chrome
* generative motion
* variable density over time
* rare synchronization event
* formal dissolution/reset near the end of the cycle

### 24.4 Abnormal behavior

Abnormal behavior includes:

* black screen
* frozen image
* visible browser UI
* visible mouse cursor
* obvious low frame rate
* audible sound
* runtime error text
* missing visual elements
* work loading from public website
* loop not resetting around 120 seconds

## 25. Troubleshooting matrix

| Symptom                | Likely cause                     | First action                 | Escalation                             |
| ---------------------- | -------------------------------- | ---------------------------- | -------------------------------------- |
| Black screen           | GPU/WebGL issue                  | Restart Electron runtime     | Try static build; verify WebGL2        |
| App does not open      | Permission issue                 | `chmod +x launch-co.sh`      | Try AppImage or unpacked app           |
| Visible browser chrome | Wrong runtime path               | Use Electron kiosk runtime   | Configure browser kiosk mode           |
| Cursor visible         | Kiosk launch failed              | Relaunch with `launch-co.sh` | Install cursor-hiding utility          |
| Low frame rate         | GPU/resolution limit             | Lower resolution             | Use fallback video temporarily         |
| Work freezes           | GPU/browser crash                | Restart app                  | Reboot machine                         |
| Network error          | Wrong URL or external dependency | Use local runtime            | Verify static assets are present       |
| Sound present          | Wrong media file                 | Use silent fallback          | Remove audio track                     |
| Loop too short/long    | Wrong build or modified params   | Verify manifest/version      | Contact artist                         |
| Visuals look wrong     | Browser/runtime mismatch         | Use Electron runtime         | Compare against reference video/stills |

## 26. Reference playback verification

The package should include reference stills and a reference video so the exhibition team can verify that the live runtime looks correct.

Verification checklist:

```yaml
verification:
  duration_is_120_seconds: true
  no_sound: true
  fullscreen: true
  no_cursor: true
  no_browser_chrome: true
  starts_with_dispersed_attention: true
  routing_appears_by_45_seconds: true
  co_presence_thickens_by_75_seconds: true
  rare_synchronization_between_75_and_100_seconds: true
  denouement_between_100_and_120_seconds: true
  loops_cleanly: true
```

## 27. Multi-channel readiness

The single-machine package should be compatible with future multi-channel adaptation.

Potential future multi-channel strategies:

```yaml
multi_channel_options:
  shared_seed_clock:
    description: "All machines/screens share the same 120-second clock."
  per_screen_offset:
    description: "Each display uses a deterministic offset."
  route_continuation:
    description: "Agents appear to exit one display and enter another."
  local_place_fields:
    description: "Each screen forms local place-fields within a global cycle."
```

The current release does not require network synchronization unless a specific multi-channel presentation later demands it.

If multi-channel sync is needed in a future version, it should be implemented as an approved minor or major release, not as an ad hoc installation patch.

## 28. Display calibration

The work relies on contrast, darkness, luminous fields, and controlled primary accents.

Recommended calibration:

```yaml
display_calibration:
  brightness: "high enough for public visibility without washing out blacks"
  contrast: "preserve near-black ground and luminous agents"
  color_temperature: "neutral or institution-standard"
  overscan: "disabled"
  motion_smoothing: "disabled where possible"
  audio: "muted or not routed"
```

Avoid display modes that introduce:

* aggressive motion interpolation
* oversaturation
* crushed blacks
* automatic brightness changes
* visible sharpening artifacts
* UI overlays

## 29. Public presentation constraints

`co` requires no public interaction.

Do not add:

* keyboard
* mouse
* touchscreen
* QR code
* phone participation
* web form
* live audience tracking
* microphone
* camera
* sensor input

The public condition of the work is attention, not control.

## 30. Migration plan

Future migration is acceptable when needed to preserve the work, but migration should preserve the following:

* browser-native identity
* live generative runtime
* 120-second loop
* no sound
* no interaction
* rare synchronization
* visual ambiguity
* no literal transit iconography
* deterministic macrostructure
* local/offline exhibition posture

Migration examples:

```yaml
migration_paths:
  electron_update:
    acceptable: true
    approval_needed: "minor if visual behavior changes"
  chromium_update:
    acceptable: true
    approval_needed: "minor if rendering changes"
  static_server_change:
    acceptable: true
    approval_needed: false
  rewrite_in_non_browser_engine:
    acceptable: "only with artist approval"
    approval_needed: "major"
  video_only_version:
    acceptable: "emergency only"
    approval_needed: "required for long-term substitution"
```

## 31. Release acceptance checklist

A release is exhibition-ready only when all items are complete.

```yaml
release_acceptance:
  package_named_correctly: false
  artwork_manifest_present: false
  electron_runtime_present: false
  electron_runtime_tested: false
  static_dist_present: false
  static_dist_tested: false
  docker_option_present: false
  fallback_video_present: false
  fallback_stills_present: false
  source_archive_present: false
  lockfile_present: false
  environment_metadata_present: false
  docs_complete: false
  checksums_generated: false
  checksums_verified: false
  no_external_runtime_dependencies: false
  no_audio_track_in_video: false
  no_visible_debug_hud: false
  fullscreen_launch_verified: false
  120_second_loop_verified: false
```

For final release, every value above should be `true`.

## 32. Final deliverables checklist

```yaml
final_deliverables:
  top_level:
    - README_FIRST.md
    - ARTWORK_MANIFEST.json
    - RELEASE_NOTES.md
  runtime:
    - runtime/electron-linux-x64/
    - runtime/static-dist/
    - runtime/docker/
  docs:
    - docs/00_read_first.md
    - docs/01_artwork_spec.md
    - docs/02_installation_manual.md
    - docs/03_tech_rider.md
    - docs/04_runbook.md
    - docs/05_troubleshooting.md
    - docs/06_preservation_notes.md
    - docs/07_artist_intent.md
    - docs/08_acceptable_variability.md
    - docs/09_changelog.md
  fallback:
    - fallback/video/co_v1.0.0_2160p_60fps_master.mov
    - fallback/video/co_v1.0.0_1080p_60fps_h264.mp4
    - fallback/stills/
  source:
    - source/co-source-v1.0.0.tar.gz
    - source/source-manifest.json
  environment:
    - environment/node-version.txt
    - environment/npm-version.txt
    - environment/electron-version.txt
    - environment/chromium-version.txt
    - environment/build-os.txt
    - environment/gpu-tested.txt
  checksums:
    - checksums/SHA256SUMS.txt
  licenses:
    - licenses/LICENSE
    - licenses/THIRD_PARTY_LICENSES.md
```

## 33. Summary

`co` should be delivered as a frozen local exhibition release with a clear runtime hierarchy:

1. **Electron kiosk application** — primary live artwork runtime.
2. **Static offline build** — approved institutional backup.
3. **Docker local static server** — optional IT support layer.
4. **Rendered video** — emergency fallback and documentation.
5. **Source, lockfiles, environment metadata, documentation, and checksums** — preservation layer.

The exhibition copy should be installable, verifiable, repeatable, and independent from the artist’s public website.

The correct deliverable is not a link.

The correct deliverable is a versioned artwork appliance.


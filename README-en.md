<div align="center">

# Auto-Video

**One idea → 165 visual pipelines → a film you can actually publish.**

Original voice-over script · local voice cloning · deterministic, code-rendered frames · subtitles on real speech · delivery checks.
No cloud image or video generation API, no per-render billing. Same script, same version, same pixels.

[![stars](https://img.shields.io/github/stars/DaBaoAgent/Auto-Video?style=flat-square)](https://github.com/DaBaoAgent/Auto-Video/stargazers)
[![last commit](https://img.shields.io/github/last-commit/DaBaoAgent/Auto-Video?style=flat-square)](https://github.com/DaBaoAgent/Auto-Video/commits/main)
[![license](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![release](https://img.shields.io/github/v/release/DaBaoAgent/Auto-Video?style=flat-square)](https://github.com/DaBaoAgent/Auto-Video/releases/latest)
![pipelines](https://img.shields.io/badge/pipelines-165%20films%20%2B%201%20frontend-111111?style=flat-square)
![stations](https://img.shields.io/badge/stations-11-111111?style=flat-square)
![samples](https://img.shields.io/badge/samples-165%20clips-e9b47c?style=flat-square)

**[简体中文](README.md) | English**

**[▶ Watch the samples](https://dabaoagent.github.io/Auto-Video/)** · **[Pipeline catalogue](docs/pipelines.md)** · [Changelog](CHANGELOG.md) · [Contributing](CONTRIBUTING.md)

<a href="https://dabaoagent.github.io/Auto-Video/media/showreel.mp4"><img src="site/media/teaser.gif" width="80%" alt="21 pipelines in one reel: shadow-puppet cards, Chinese ink, Bayeux tapestry, ukiyo-e, impasto oil, giallo, up to map stickers"></a>

<sub>27 seconds / 4.1 MB — 4 craft, 4 painterly, 8 pen-and-pencil, 3 digital-note and 2 caption/map pipelines, 21 shots back to back; open the [full 45-second cut](https://dabaoagent.github.io/Auto-Video/media/showreel.mp4) (1440×810). Every frame rendered by this repo's own code.</sub>

</div>

## What this is

Most "AI video" tools retrieve stock footage and stitch it together, or call a cloud model per second.
Auto-Video does the opposite: **the picture is written as code**. Each pipeline is a *drawing method + camera grammar + delivery gate*, with its parameters frozen in `pipeline.json` so the output is reproducible.

That buys three things:

- **Determinism** — no `Date.now`, no `Math.random`; grids and jitter are seeded by pipeline id, so a re-render produces the same frame, not "something similar".
- **Craft over stock** — 165 distinct visual lineages: paper-cut, shadow puppetry, cel animation, wet watercolor, colored-pencil hatching, index-color pixel art, isometric dioramas, blueprint schematics, real terrain maps, giallo silhouettes.
- **Gates, not vibes** — every pipeline documents what must pass before delivery: full-coverage subtitles, zero-flicker budget, beat-aligned cuts, loudness normalization, a fixed output folder layout.

165 films break down honestly: **41** are hand-built pipelines with their own project and runtime, **77** share the in-repo style kernel [`vendor/runtime/stylekit.js`](vendor/runtime/stylekit.js) (14 style families), and **47** are self-contained local-runtime packages (31 MIT-ported drawing scripts + 10 self-written Canvas renderers + 6 vendored runtimes). Plus **1** voice-over frontend.

<div align="center">

<a href="https://dabaoagent.github.io/Auto-Video/"><img src="site/media/piying.jpg" width="31%" alt="Shadow puppetry"></a> <a href="https://dabaoagent.github.io/Auto-Video/"><img src="site/media/caiqian.jpg" width="31%" alt="Colored pencil"></a> <a href="https://dabaoagent.github.io/Auto-Video/"><img src="site/media/manga.jpg" width="31%" alt="Manga panels"></a>

<a href="https://dabaoagent.github.io/Auto-Video/"><img src="site/media/chengshi.jpg" width="31%" alt="3D city"></a> <a href="https://dabaoagent.github.io/Auto-Video/"><img src="site/media/hero-qianhuang.jpg" width="31%" alt="Giallo silhouette"></a> <a href="https://dabaoagent.github.io/Auto-Video/"><img src="site/media/oupu.jpg" width="31%" alt="Op art"></a>

<sub>Shadow puppetry · colored pencil · manga · 3D city · giallo silhouette · op art — click any card to play it on the sample site.</sub>

</div>

## Quick start (30 seconds)

```bash
git clone --depth 1 https://github.com/DaBaoAgent/Auto-Video.git
cd Auto-Video
python demo/run.py            # 15 s, 720p: no voice-over, no downloads, no cloud API
```

No Python / Node / Chrome on your machine? Use Docker — chromium, ffmpeg and Chinese fonts are baked in:

```bash
docker compose run --rm demo
```

Output: `demo/out/demo.mp4`. The demo runs a template with **any number of script lines** (scenes grow from `timeline.json`), so 5 lines or 12 lines both render.

Then move to a real pipeline — `check` tells you what this machine is missing, `plan` shows the exact commands:

```bash
python pipelines/pencil/scripts/pencil.py check
python pipelines/pencil/scripts/pencil.py new projects/demo --title "pilot"
python pipelines/pencil/scripts/pencil.py render projects/demo
```

| You need | When |
| --- | --- |
| Python 3.10+ (stdlib only) | Everything |
| Node 18+ | The Canvas / Remotion frame-render pipelines |
| Chrome / Edge / Chromium | Frame capture (`CHROME_PATH` optional, auto-detected) |
| ffmpeg / ffprobe | Muxing, loudness normalization, frame extraction |
| edge-tts (free) or GPT-SoVITS | Voice-over; the latter only for cloned voices |
| Local ComfyUI + Wan2.2 | Only the `tianshu` pipeline |

`python tools/validate.py` reports whether the 166 pipelines, 11 stations and 146 samples line up on your machine.

## How a film gets made

```mermaid
flowchart LR
    A[Topic / reference link] --> B[Original script]
    B --> C[Local voice-over]
    C --> D[Shot plan & assets]
    D --> E[Frame assembly]
    E --> F[Render]
    F --> G[QC gates]
    G --> H[Covers & publish pack]
```

| Stage | In | Out | Must pass |
| --- | --- | --- | --- |
| Script | Topic, content rules | Original voice-over script | AI-tone audit; pronunciation of names, digits and ambiguous characters |
| Voice-over | Script, cloned voice | Per-line audio, timeline | Breath, inter-scene pauses, mispronunciation gate |
| Alignment | Script, audio | Word- or line-level timeline | Subtitle cuts sit on real speech |
| Assembly | Timeline, shot plan, template, fonts | Segment video | Shot/scene/duration counts agree; parameters reproducible |
| QC | Film, timeline, render data | Pass/fail report | Subtitles, flicker, tweening, frame drops, loudness |
| Delivery | Film, covers, publish copy | Publishable folder | `out/<no_title>/` with its four artifacts |

## The contract

Pipelines used to each invent their own `pipeline.json` — 13 keys here, 19 keys there, sometimes no file at all.
It is now one **additive** contract: every legacy key stays untouched, and two blocks are added — `schema` (contract version) and `meta` (registry fields, byte-for-byte equal to the catalogue).

| File | Role |
| --- | --- |
| [`catalog/pipelines.json`](catalog/pipelines.json) | Registry of all 166 pipelines: id, station, names, one-liner, engine, aspect, fps, entry, status, sample. The website is generated from it |
| [`catalog/stations.json`](catalog/stations.json) | The 11 stations: number, names, blurb, closing line |
| [`schema/pipeline.schema.json`](schema/pipeline.schema.json) | JSON Schema (draft 2020-12): `schema` + `meta` required, legacy keys allowed |
| `pipelines/*/pipeline.json` | Frozen parameters per pipeline |

```bash
python tools/validate.py          # ids unique, stations exist, frontmatter matches dir, meta == catalogue, entries exist, no drift
python tools/normalize_pipelines.py
python tools/build_samples.py && python tools/build_site.py
python tools/check_links.py       # dead links fail the build
```

### Adding a pipeline in four steps

1. Create `pipelines/<id>/` with `SKILL.md` (frontmatter `name` must equal the folder) and `pipeline.json`.
2. Register it in `catalog/pipelines.json` with a `station`.
3. Run `python tools/normalize_pipelines.py` to align `meta`.
4. Run `python tools/validate.py`; drop the sample in and rebuild samples + site.

Every pipeline has a single entry: `python pipelines/<id>/scripts/<id>.py <stage>` (`check` / `plan` / `render` / `qa` / `deliver` vary per pipeline).

## Optional frontend

`frontend/` is optional and does not gate any pipeline. It chains topic → script → free TTS → a style pipeline → covers and publish copy:

```bash
python frontend/frontend.py run --pipeline laolang --topic "why Xuanzang went west" --title "Xuanzang"
```

Honest caveat: **10 of 166** pipelines can currently run end-to-end from a topic (`pencil` `shadow` `tapestry` `laolang` `goldenage` `manga` `isometric` `map` `blueprint` `parable`). The other 156 are registered in [`frontend/targets.json`](frontend/targets.json) with the reason they cannot take the last step — real footage, elevation data, local models, in-pipeline TTS timelines, or non-script inputs. Each job stops at the failing step and keeps everything produced before it.

## Samples

**[The sample site](https://dabaoagent.github.io/Auto-Video/)** holds 166 pipeline cards and **165 playable clips**: 163 are 10-second style sections (mostly rendered by this repo, a few taken from upstream public samples), two are 22 s / 30 s openings cut from full films. Grouped by station, hover-to-play, filterable by orientation and length, with audio in a lightbox.

- A clip is a **style section**, not a trailer — it demonstrates one or two camera behaviours so you can judge whether the lane fits your topic;
- **Posters are not frame-2 screenshots**: frames are scored by motion and edge density, white/black/empty frames are rejected, and hand-picked timestamps win via [`tools/poster_overrides.json`](tools/poster_overrides.json);
- Only one card has no video: `peiyin` is the voice-over frontend and never produces a film, so its card points straight at its docs.

Full films are archived locally under `out/<no_title>/` (film, subtitles, 3:4 and 4:3 covers, publish copy) and are not committed.

## Repository layout

```text
Auto-Video/
├── demo/                # 15 s zero-dependency demo
├── docker/              # demo image: chromium + ffmpeg + CJK fonts
├── pipelines/           # 166 folders: SKILL.md + pipeline.json + scripts/ + runtime/ or template/
├── catalog/             # pipelines.json (single source of truth) + stations.json
├── schema/              # JSON Schema for pipeline.json
├── vendor/runtime/      # shared drawing kernel for the 77 style pipelines
├── frontend/            # optional: topic → script → TTS → pipeline → covers
├── fengmian/            # covers + publish copy + delivery gate (MIT import, rules unchanged)
├── site/                # static sample site (GitHub Pages)
├── tools/               # validate / normalize / build_samples / build_site / check_links …
├── docs/                # pipeline catalogue, delivery spec, multi-machine sync, audit notes
├── out/                 # local archive of finished films (mp4 not committed)
└── .github/workflows/   # contract gate + Pages deploy
```

## FAQ

<details>
<summary>Where does the voice come from?</summary>
Local **GPT-SoVITS** (bring your own weights), or **edge-tts** (free, no key). Weights are never committed.
</details>

<details><summary>Why aren't models, fonts or films in the repo?</summary>
Code and config are versioned; heavy assets are downloaded. It keeps `git clone --depth 1` fast and keeps non-reproducible binaries out of history.</details>

<details><summary>Is it commercially usable?</summary>
The code is MIT. Third-party engines, drawing scripts and fonts keep their own licenses (MIT / SIL OFL), listed in each pipeline's `CREDITS.md`; footage sources keep theirs (Pixabay, Natural Earth, OSM).</details>

<details><summary>Some pipelines look alike — what's the difference?</summary>
They share deterministic rendering but differ in medium and camera grammar — e.g. `isometric` is a tile/route continuous-camera runtime while `dengju` is a tiled-wave dolly; `shadow` is translucent leather with control rods while `piying` is silhouette plus chapter cards. Each `SKILL.md` opens with the trade-off.</details>

## Status and next steps

**Now:** 166 pipelines · 11 stations · 165 playable clips · contract check green on every push (syntax, contract, shared-runtime consistency, dead links).

**Next:** widen one-command production beyond 10 pipelines; give lanes that show only one 10-second shot a second clip so camera differences become visible; collapse the shared kernel and local runtimes into installable packages so "165 pipelines" becomes "165 callable capabilities"; grow the English docs.

## Contributing

The most welcome contribution is not a new feature — it is **turning a pipeline from "works on the author's machine" into "works on yours"**: add a sample, delete hard-coded drive letters, make Chrome detection cross-platform, implement the gate a `SKILL.md` promised.

See [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) and [SECURITY.md](SECURITY.md). Before pushing:

```bash
python tools/validate.py && python tools/check_links.py
```

## Credits & license

- **styles** (synthwave / flat vector / HUD / isometric MG engine): [Vincentwei1021/styles](https://github.com/Vincentwei1021/styles), MIT
- **huashu-art-motion** (drawing scripts behind 31 pipelines): [alchaincyf/huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion), MIT
- **MoneyPrinterTurbo** (base footage for `shipai`): [harry0703/MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo)
- **GPT-SoVITS** (local voice cloning): [RVC-Boss/GPT-SoVITS](https://github.com/RVC-Boss/GPT-SoVITS)
- **battlefield-editor** (3D battle renderer for `tuiyan`)
- **Style template project** (runtime and render chain behind goldenage / manga / tapestry / pencil / isometric / parable / shadow / blueprint / laolang), MIT — per-pipeline provenance in `CREDITS.md`
- Fonts such as **AlibabaPuHuiTi-3**: free for commercial use / SIL OFL

Code is released under the [MIT License](LICENSE); third-party notices are collected in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

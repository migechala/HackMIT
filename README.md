# HackMIT Project

## The Problem
\HRESHOLD

Compute more. Disturb less.

Active noise control for data centers, with visibility into every decibel reduced and every watt used.

Built for HackMIT’s sustainability track.



The idea

The environmental footprint of a data center extends beyond its electricity bill. Cooling equipment and power infrastructure also introduce persistent sound into the places around them.

THRESHOLD is a hardware-and-software project designed to reduce tonal noise at its source. Active noise cancellation nodes target controlled spaces such as ducts and equipment enclosures, while a connected dashboard helps operators understand cancellation performance, energy consumption, and noise thresholds.

Our goal is simple: make quieter infrastructure measurable, manageable, and part of the design from the beginning.

This repository contains the website and interactive monitoring interface.

How THRESHOLD works

Listen. A microphone captures the local sound and identifies dominant tonal frequencies.

Counter. The controller drives a speaker with a signal whose phase and amplitude are adjusted to reduce the targeted noise within the controlled acoustic zone. Passive lining complements active cancellation.

Measure. Compare the residual sound with an ANC-off baseline, and track the electrical power consumed by mitigation.

Respond. Display performance over time and evaluate readings against the facility’s configured noise profile.

The time-critical cancellation loop belongs on the hardware. The website provides monitoring, configuration, and operator controls.

Explore the platform

A landing page that tells the story

A scroll-controlled film transforms a bare data-center landscape into a greener setting with trees and wildlife. It illustrates the project’s ambition: infrastructure that leaves more room for the environment around it.

The public site also introduces the technology and proposed access plans for residents, businesses, and government agencies. Mobile and reduced-motion visitors can play the film manually.

01 · Operations

Understand what the cancellation system is doing right now.

Performance cards: ANC status, noise reduction, residual noise, system power, and threshold status.

Frequency spectrum: compare the captured baseline with the current signal and highlight the dominant tone.

ANC controls: switch cancellation on or off and capture a new baseline.

Noise over time: inspect residual levels, baseline, the active threshold, and alert markers in 1-, 5-, or 15-minute windows.

Cancellation details: dominant frequency, cancellation frequency, phase adjustment, and attenuation.

Energy transparency: power draw, energy use, estimated operating cost, and watts per decibel reduced.

Exports: download readings as CSV for further analysis.

02 · Costs & thresholds

See the cost of quiet operation and the conditions that require attention.

The dashboard calculates hourly, daily, and monthly operating estimates from power draw and an editable electricity tariff. It also displays the selected threshold profile, facility local time, noise margin, event history, and recipient settings for alerts.

Alert thresholds depend on where the data center is located. The intended deployment uses the facility’s saved address to identify the applicable jurisdiction and noise rules, then selects the appropriate limit for local time and measurement conditions. It uses the facility’s location—not the visitor’s location.

The current interface supports manual profile selection and editable day/night limits. Automatic address-to-jurisdiction lookup is a next integration step.

For the operational alert demonstration:

The reading must stay above the selected threshold for a configurable duration, initially 10 seconds.

Each sustained episode creates at most one SMS preview when alerts are enabled.

The rule re-arms when the reading falls at least 1 dB below the threshold.

The enclosure microphone measures cancellation performance. Community-noise monitoring needs a separate boundary or receptor measurement channel with the location and measurement method required by the applicable rules. The example profiles and timing settings are not verified legal limits or procedures.

03 · Site intelligence

Explore where a future facility could cause less disruption.

Operators enter capacity, footprint, region, power requirements, cooling method, water demand, distance to a city, fiber proximity, expansion plans, and community/ecological priorities. The interface filters candidates, ranks eligible areas, and presents the top three with a regional map and score breakdown.

The default suitability score uses transparent, adjustable weights:

Factor

Weight

Residential separation

25%

Existing land use / brownfield status

20%

Grid and power availability

15%

Water stress

15%

Wildlife and habitat sensitivity

10%

Existing ambient noise

10%

Fiber proximity

5%

Weights normalize to 100%. Higher suitability means lower modeled disruption; the displayed disruption score is 100 − suitability.

Run locally

The website uses HTML, CSS, and vanilla JavaScript. There is no npm installation or build step.

From the repository root, start a local server with Python 3:

python -m http.server 8765

On Windows, py -m http.server 8765 also works if Python is installed through the launcher.

Open localhost:8765, select Log in, and choose Use the example account.

You can also open index.html directly. The example account uses a local browser session; production authentication is not included.

Try the demo

Scroll through the landing-page transformation, then enter the business workspace.

In Operations, toggle ANC and compare the tonal peak and noise reduction.

In Costs & thresholds, edit the profile and electricity tariff.

Enable automatic alert previews, select Simulate exceedance, and watch the noise graph until the configured duration elapses. Open the SMS previews to inspect the resulting message.

In Site intelligence, change facility requirements or scoring weights and compare the recommended areas.

Open Connections to inspect the telemetry format or import a hardware snapshot.

Technology and integration

Layer

Current implementation / intended connection

Website

HTML5, CSS3, vanilla JavaScript, hash-based navigation

Charts

Custom SVG spectrum, time-series, and power charts

Motion

Scroll-controlled HTML5 video with mobile and reduced-motion support

Browser state

Local storage for workspace session and settings

Hardware interface

Validated JSON snapshot import and sample payload export

Hardware target

ESP32-S3 controller and INA219 power telemetry

Live monitoring path

Device → authenticated backend → database → website / Grafana

Notification path

Server-side alert evaluation → SMS provider → configured recipient

The current charts are Grafana-inspired, not embedded Grafana panels. A real Grafana deployment would connect to the telemetry database alongside the website. Firmware, a live ingestion service, a Grafana instance, and SMS delivery are not bundled in this repository.

See Integration notes for the telemetry contract and connection plan.

Repository guide

Path

Purpose

index.html

Application entry point

assets/app.js

Pages, simulator, charts, alerts, scoring, and snapshot import

assets/style.css

Visual design and responsive layouts

assets/hero-config.js

Landing film and poster configuration

assets/hero-scrub.mp4

Scroll-controlled landscape film

assets/hero-poster.jpg

Opening landscape image

assets/hero-ending.jpg

Restored landscape concept and mobile still

docs/INTEGRATION.md

Hardware, backend, Grafana, and alert integration notes

Build status

The frontend includes an interactive simulator, configurable alert previews, sample site rankings, and read-only telemetry imports. The interface distinguishes demo data from imported snapshots. Site candidates and their attributes are illustrative; they are not live parcel, satellite, or utility assessments.

Browser checks cover the alert delay, incident deduplication, recovery, snapshot handling, and responsive noise graph. Hardware attenuation and end-to-end live delivery still require validation with the connected system.

Next steps are live telemetry and command acknowledgments, business authentication, jurisdiction lookup with verified profiles, boundary monitoring, actual Grafana dashboards, and SMS delivery.

Why sustainability?

THRESHOLD treats sound as part of a facility’s environmental footprint. The project aims to reduce persistent acoustic disturbance while making the energy cost of mitigation visible.

That means reporting the electricity used to create quiet—not assuming noise cancellation saves facility power—and measuring acoustic improvement rather than treating the landscape animation as evidence of ecological recovery.

Quieter infrastructure. Measurable impact. Room for life.


---

# THRESHOLD website (`web/`)

The primary site: Laura's **frontend-2.0** (a standalone, no-build website with a scroll-scrubbed video hero, fake business login, and Operations, Costs & thresholds, and Site intelligence pages), plus real public data from the Voloridge challenge and interaction polish.

## Run

```bash
npx serve web          # then open the printed URL (the hero video needs http, not file://)
# or:  cd web && python -m http.server 8765
```

No build step and no Python needed to run it. The site works from a plain file open too, except the hero video streaming.

## What we added on top of frontend-2.0

- **Facilities page** (from Laura's earlier dashboard): after login you land on the four monitored facilities (Manassas VA, Crosby ND, Scranton PA, Ypsilanti MI) with status, capacity, ANC units, dominant tone and any litigation note, plus their real still-air and price figures. Opening one applies its jurisdiction profile and limits, timezone, baseline and tone, state electricity price, and weather site across Operations, Costs and Weather exposure. "All facilities" returns to the list.
- **Public nav** is the earlier floating pill nav (How It Works, Pricing, Site Intelligence, Log in). The pricing page shows two plans (Business, Government); the Residents plan was removed. The "simulated data" banner is hidden for simulated readings (it still appears for an imported snapshot, which is not live), and the hardware-connection link moved into the context row. The "simulated / synthetic / conceptual" wording was also removed from the footer, landing labels, Operations and Costs captions and the landscape caption, and "SMS simulation" became "SMS preview" (the preview message still says no text was sent). The pricing cards were redesigned (gradient Business card, check icons, pill buttons). Kept on purpose: the not-certified compliance disclaimer (required), the "illustrative dataset" note on Site intelligence (those candidate sites are fictional), the FAQ answers about savings and compliance, the "Business demo" badge, and the limits documented here. Note that the app's readings are still generated by a simulator, so this README is where that is stated.
- **Weather exposure page** (real NOAA data): still-air nights, a night wind rose with an adjustable direction to the nearest homes, monthly chart, cross-facility comparison, and the data provenance. It is a weather *exposure* estimate, not a noise measurement.
- **Real electricity prices** (PUDL / EIA): the Costs tab defaults to the state's industrial retail price for the selected jurisdiction profile (Prince William VA, Divide ND, PennFuture PA, Washtenaw MI), editable, with a "Use state average" reset. A new panel shows the in-state generation mix (nuclear, hydro, wind, solar share) behind the mitigation's electricity.
- **Landing "real data" band** in frosted glass with the actual numbers.
- **Hover and scroll polish** in `assets/effects.js`: letter-by-letter text roll on nav links and buttons, cursor spotlight on panels, and a progressive blur under the sticky header. CSS-gated to real hover pointers and disabled under `prefers-reduced-motion`. Ideas adapted from Skiper UI `skiper58` (text roll) and `skiper41` (progressive blur), free with attribution (skiper-ui.com); the spotlight is original.

## Voloridge "Signal in the Noise": real public data

Two reproducible pipelines in `voloridge/` reduce large public datasets to small summaries the site loads (`web/assets/isd-data.js`, `pudl-data.js`, plus JSON copies). Python 3.12 via `uv`; raw downloads go to `voloridge/data/` (gitignored).

**NOAA ISD** (`voloridge/isd_pipeline.py`, standard library only):
1. Reads the ISD station catalogue (~35k stations) and per-year inventory.
2. For each of four facilities, picks the nearest station that is still reporting and has enough hourly observations every year (a coverage check, not just "nearest").
3. Downloads six years (2019-2024) of gzipped fixed-width observations, drops flagged or missing values, keeps one reading per hour, converts to local time.
4. Reduces to still-air share at night, night wind rose, mean night wind, hours at 25 C+, and a monthly view. Wind directions are spread across the sectors they overlap because ISD reports 10-degree steps (binning them straight aliases into false spikes).

Run: `uv run --no-project --python 3.12 --with tzdata python voloridge/isd_pipeline.py`

Result: the same 120 Hz hum has very different weather exposure. At night the air is still (wind under 2 m/s) about 61% of the time in Manassas VA, 46% in Scranton PA, 30% in Ypsilanti MI, and 10% in Crosby ND.

**PUDL / EIA** (`voloridge/pudl_pipeline.py`): reads `core_eia861__yearly_sales`, `out_eia923__yearly_generation_fuel_combined` and `core_eia__entity_plants` from `s3://pudl.catalyst.coop` (Parquet, about 18 MB) and writes state industrial prices and generation mix.

Run: `uv run --no-project --python 3.12 --with pyarrow python voloridge/pudl_pipeline.py`

Data-cleaning fix worth knowing about: in restructured markets (PA, MI) sales are split into a supplier "energy" row and a wires "delivery" row. Averaging every row double counts megawatt-hours and gives about 4.0 c/kWh for Pennsylvania; the correct all-in price is (revenue of bundled + energy + delivery) / (MWh of bundled + energy) = 7.9 c/kWh. The pipeline prints the naive figure next to the corrected one as a check. 2024 state industrial averages: VA 9.0, ND 7.3, PA 7.9, MI 8.3 c/kWh; carbon-free share of in-state generation: VA 36%, ND 40%, PA 34%, MI 32%.

**Limits:** ISD has no acoustic data and wind is measured at the nearest airport (2 to 10 km away); the still-air threshold and night hours are stated assumptions. Prices are state averages, not a tariff for any facility, and the generation mix is in-state, not what a specific utility delivers, so no emissions figure is claimed.


---

# Previous React version (`front-end/`)

> Kept for reference. The primary site is now `web/` (above). This React app has the 3D data center scroll story, its own dashboard (Laura's, restyled) and the same NOAA weather and PUDL price features, and still builds with `npm run build`.

The front-end app now hosts **THRESHOLD**, a cinematic scroll-driven 3D landing page for a data-center noise platform, plus two demo shells. The original placeholder landing page from this repo is preserved at `/civic-asset`.

| Route | What it is |
|---|---|
| `/` | Pinned scroll story (rotation → deer entry → disintegration → reassembly → grass/coexistence), then product sections |
| `/dashboard/*` | Laura's dashboard (from `origin/laura-frontend`): demo login, monitored-facility list, and a 3-tab sidebar view (Overview, Financial Impact, Site Intelligence) |
| `/site-intelligence` | Demo shell: company inputs, top-3 candidates, live-adjustable disruption-score weights |
| `/civic-asset` | The pre-existing landing page, unchanged |

## Setup

```bash
cd front-end
npm install --legacy-peer-deps   # see note below
npm run dev                      # http://localhost:3000
npm run build                    # production build to dist/
npm run lint                     # tsc --noEmit
```

`--legacy-peer-deps` is needed because `@react-three/fiber` declares *optional* React Native peers (expo, etc.) that npm otherwise tries to resolve. They are not used on the web.

Stack: React 19 + TypeScript + Vite, Tailwind v4, three.js via React Three Fiber, GSAP ScrollTrigger, React Router.

## How the scroll story works

- `src/threshold/landing/HeroStory.tsx` pins a full-screen stage for four extra screens (the section spans 5 viewport heights) and drives a single number, `story.progress` (0–1), from a GSAP ScrollTrigger with `scrub`. Nothing in the scene has its own timer for story motion: **every visual is a pure function of that number**, so scrolling backward reverses the scene exactly. Verified: progress rail readings match the target at 15/45/70/95% both forward and back.
- `src/threshold/scene/story.ts` holds the timeline: model yaw (integrated angular-velocity profile, under one full turn in total (about 340°, most of it in the intro), so rotation is 1:1 with scroll and never runs on a clock), deer path and gait distance, camera keyframes, vibration and light-tone envelopes.
- `pieces.ts` procedurally builds the data center as ~1,000 pieces (racks with server faces and indicator lights, floor tiles and grilles, blue cable trays, cooling pipes, cooling/power cabinets, partial walls). `DataCenter.tsx` renders them as three `InstancedMesh`es. The same pieces are the disintegration fragments: seeded scatter targets, spin and swirl are generated once, and fragments move in the *rotating* frame with an added swirl in the same direction, so they inherit the model's rotation.
- `ParticleSwirl.tsx` is the dark particle stage: ~120k stippled points (40k on mobile) whose positions are computed analytically in the vertex shader from a per-particle seed and the scroll progress (no simulation state, so it reverses with scroll). Sequence: the building dissolves into dust that arcs up and to the left, then drops into a tilted elliptical orbit around the site (40–56%); the dust orbits (56–62%); most of it falls back into the rebuilt structure (62–80%); about a fifth stays as a faint ring around the grass and animals. **Move the pointer to steer the orbit plane and part the cloud; double-click or double-tap switches the orbit focus between the building and the deer.** Fragment chunks scatter onto the same orbit and shrink toward dust.
- `Deer.tsx` is an articulated low-poly buck (body, neck, head, ears, antlers, two-segment legs). `Grass.tsx` grows instanced blades in the vertex shader with staggered per-blade delays. `Trees.tsx`, `Critters.tsx` (rabbits, birds fade in) and `Environment.tsx` (ground, faint noise rings) complete the diorama.

## Replacing models with GLB files

Everything ships procedural, so the page runs with no external files. `src/threshold/scene/assets.tsx` exposes `MODEL_URLS` slots (`deer`, `rabbit`, `bird`, `tree`). Put a licensed GLB in `public/models/`, uncomment the URL, and it replaces the procedural version. A missing or invalid file logs one console warning and falls back to the procedural model (tested).

## Accessibility, performance, fallbacks

- `prefers-reduced-motion`: no pin or scrub; a static final-frame canvas renders on demand and the five story beats appear as normal document flow.
- No WebGL (or a scene crash): an illustration plus the full story text in flow; the rest of the site works.
- Loading state while the scene chunk/first frame prepares. The 3D code is its own lazily loaded chunk.
- Mobile (≤820px): 900 grass blades instead of 2,800, fewer trees and animals, no shadow map, capped pixel ratio, camera pulled back and shifted for portrait.
- The canvas stops rendering when the story scrolls off-screen. No audio. Triggers are reverted on unmount.

## Design system notes

- **Skills used:** `design-taste-frontend` (taste-skill) and Emil Kowalski's `animate` / `review-animations`, installed with `npx skills add` into `.claude/skills`. From them: Geist sans display type (Instrument Serif is a listed AI default), one 28px card radius with pill buttons, a bento grid whose four tiles each have a different surface, real brand SVGs (Simple Icons) in the single marquee, no section numbering or eyebrow labels, and scroll reveals that are transform/opacity only with the strong ease-out `cubic-bezier(0.23, 1, 0.32, 1)`.
- **Watermelon UI (registry.watermelon.sh):** the story-chapter island (`landing/StoryIsland.tsx`) is adapted from the `scroll-island` component (a progress ring that expands into a chapter list), and the primary button's hover sweep is adapted from `shimmer-button`. At the time of writing the *block* registry files (hero, navigation, footer, bento...) returned 404, so only animated components were usable; most of those are app widgets (finance cards, inbox toolbars) rather than marketing sections.
- **Skiper UI (skiper-ui.com), attribution:** the free registry items `skiper41` (progressive blur), `skiper58` (text roll) and `skiper28` (perspective scroll text) inspired `ui/ProgressiveBlur.tsx` (fixed blur strip under the nav), `ui/TextRoll.tsx` (letter roll on nav, footer and button labels, rebuilt as CSS and gated to real hover pointers) and the perspective tilt on the sustainability headline (rebuilt with `motion`, without `lenis`, which would fight the pinned scroll). `skiper88`, `skiper104`, `skiper11` and `skiper27` require a Skiper UI Pro license key and were not added. `ui/Spotlight.tsx` (cursor spotlight on tiles) is original.
- **Deliberate exceptions to the skill:** the required "Scroll to explore" cue (now inside the island) and the clarifying line that contains an em-dash are kept because the brief specifies them verbatim.

## Demo shells

`/site-intelligence` and the dashboard use **simulated, illustrative data** only. Nothing is connected to a sensor or real site. The dashboard is Laura's (`origin/laura-frontend`, `src/threshold/dashboard/`), mounted under `/dashboard/*` (her original `/app/*` routes) with its theme scoped to `.dash-root` so it cannot affect the rest of the site. Sign-in is fake: any credentials log in as the demo operator account; `/dashboard` redirects to `/dashboard/login` when signed out, and the session is in memory only. Her Site Intelligence tab is separate from the standalone `/site-intelligence` page. Its look was restyled to a frosted-glass light theme (cool grey gradient, translucent cards with a 1px light border and inset highlight, a navy icon-rail active tile, a large light greeting, label/value pills above charts, an analog clock in the compliance section); the tokens and glass classes live in `dashboard/dashboard.css` (solid fallback under `prefers-reduced-transparency`), and her decorative `GrassField` is no longer rendered. The earlier dark dashboard is kept, unrouted, in `src/threshold/dashboard-v1/` (it also had a mission/pricing sign-in page). The standalone `/site-intelligence` scores reproduce 87 / 81 / 62 by default and re-rank live as weights change.

## Known limitations

- The `skills` named in the original build brief (`taste-skill`, `emilkowalski/skills`) were not installed in this environment, so the motion/visual tuning was done by hand and checked with headless screenshots. Running the `review-animations` skill on the scroll sequence is still a worthwhile follow-up.
- Verified in headless Edge with a software renderer (SwiftShader), so real-GPU frame rates were not measured. Shadows use a 2048 map on desktop; check performance on low-end GPUs.
- The data center is procedural low-poly, not a licensed model. It can't be swapped for a GLB without giving up the fragment effect (the intact building *is* its fragments).
- Only the desktop and 390px-wide mobile layouts were checked visually; tablet widths were not reviewed individually.
- The Site Intelligence brief form is recorded but does not change the sample candidates; only the weights do. Candidate data and dashboard values are illustrative.
- The dev server's SPA fallback returns HTML for missing files, which the GLB loader treats as a parse failure and falls back (same outcome as a 404 in production).
- The main JS chunk is ~290 KB, with three.js (~790 KB) split into its own chunk.



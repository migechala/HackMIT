# HackMIT Project

## The Problem

Across major cities in the United States, there is a growing number of underutilized or completely unused urban spaces. These can include abandoned or nearly empty shopping malls, vacant office buildings, unused parking lots, undeveloped parcels of land, abandoned industrial properties, and other spaces that no longer serve their original purpose.

At the same time, cities continue to face increasing demand for housing, commercial development, public spaces, renewable-energy infrastructure, urban agriculture, community facilities, and other forms of development. In many cases, potentially useful spaces already exist, but discovering them and determining whether they are suitable for a particular project can be extremely difficult.

The information needed to evaluate a property is often scattered across many different sources. A developer may need to look at zoning information, property records, environmental conditions, weather patterns, land value, historical usage, building condition, surrounding infrastructure, pedestrian traffic, and other factors before determining whether a location is viable.

This creates an opportunity to build a system that automatically identifies and evaluates underutilized urban spaces.

Our HackMIT project will focus on creating a scalable platform that allows users to search an area of a city and discover spaces that could potentially be reused or redeveloped based on their specific needs.

For example, a user could ask the system to identify locations suitable for:

* Urban gardens or green spaces
* Solar installations
* Small businesses
* Community centers
* Housing projects
* Pop-up stores
* Warehouses or logistics facilities
* Public infrastructure
* Environmental restoration projects
* Recreational spaces

Instead of manually researching dozens or hundreds of properties, the user would describe what they are looking for and select a geographic area. Our system would then aggregate available information about the surrounding land and buildings, analyze that information using an AI model, and return the locations that appear to best satisfy the user's requirements.

If time permits during HackMIT, we would also like to extend the project beyond discovery. The platform could help users determine who owns a property, estimate its value, and potentially generate an initial offer or proposal for acquiring, leasing, or redeveloping the space.

The broader goal is to transform unused urban space into a searchable and actionable resource.

We are specifically interested in designing the project around the **ASUS HackMIT track, Voltage HackMIT track, SpaceX track, Cognition track, and Arduino track**, with different parts of our architecture demonstrating how hardware, edge computing, artificial intelligence, geographic data, and agentic systems can work together.

## Our Plan

The platform would operate as a multi-stage system combining a web-based frontend, backend infrastructure, edge hardware, external data sources, and an AI model running on local high-performance computing hardware.

### 1. User Selects an Area and Describes Their Needs

From the frontend, the user will interact with a map and select a geographic region they want the system to analyze.

This could be a relatively small area, such as a city block or approximately **10 m²**, or a significantly larger region depending on the use case and available computing resources.

The user would also describe what they are trying to build or find.

For example, a user might request:

> "Find unused land suitable for an urban community garden."

Another user might request:

> "Find an abandoned commercial property with high pedestrian traffic that could be converted into a small retail space."

The frontend would convert the selected geographic area and the user's requirements into a structured request that can be processed by the backend.

### 2. Request Is Sent to the Backend

The request will be sent to our backend infrastructure.

As part of our hardware architecture, we plan to incorporate an **Arduino UNO Q 4GB** into the system. The Arduino could act as part of the request-routing or load-management layer, helping coordinate incoming requests and demonstrating how lightweight edge hardware can participate in a larger distributed AI system.

The backend will maintain a queue of analysis requests and determine when each request should be sent to the main AI computing system.

### 3. ASUS Ascent GX10 Performs the Main Analysis

Once the request is ready to be processed, it will be sent to our **ASUS Ascent GX10 AI Supercomputer**.

The GX10 will act as the main local AI inference and data-processing system.

The system will query multiple APIs, public datasets, geographic databases, and potentially satellite or mapping services to collect information about properties within the selected region.

Rather than relying on a single source of information, the system will attempt to build a combined profile for each candidate property.

The AI model will then compare each location against the user's requirements.

For example, if someone is looking for land suitable for a community garden, the model might prioritize:

* High sunlight exposure
* Suitable soil conditions
* Low property cost
* Minimal existing development
* Good pedestrian accessibility
* Appropriate zoning
* Available water infrastructure

However, if the user is searching for a retail location, the model might instead prioritize:

* Foot traffic
* Visibility
* Road access
* Nearby businesses
* Population density
* Building condition
* Renovation cost

This allows the same platform to support many different urban-development use cases.

### 4. Candidate Locations Are Ranked

After gathering and analyzing the available data, the AI model will generate a set of candidate locations.

Each location could receive a suitability score based on how closely it matches the user's requirements.

The system could also explain why a particular location was selected.

For example:

> **Candidate Property A — 87% Match**

> High pedestrian traffic, strong street visibility, relatively low estimated renovation cost, and currently underutilized commercial zoning.

This explainability component would make the system more useful than a simple property-search engine because users would be able to understand the reasoning behind each recommendation.

### 5. Results Are Displayed on an Interactive Map

The results will then be sent back to the frontend.

The user will see an interactive map containing markers for each property or piece of land identified by the system.

Selecting a marker would display additional information about that location, potentially including:

* Property type
* Estimated property value
* Current usage
* Historical usage
* Ownership information
* Zoning information
* Environmental conditions
* Repair requirements
* Estimated redevelopment cost
* Foot traffic
* Weather conditions
* Sunlight exposure
* Soil conditions
* Model suitability score
* Explanation of why the property matches the user's request

The goal is to give the user enough information to quickly determine whether a particular property deserves further investigation.

### 6. Optional Property Acquisition Feature

If time permits, we would like to add an additional feature that helps move the user from **discovery to action**.

Once a user identifies an interesting property, the system could retrieve available ownership and valuation information and help generate an initial proposal.

For example, the system could produce:

* An estimated property value
* Estimated redevelopment costs
* A suggested offer range
* A draft acquisition or leasing proposal
* Contact information for the owner, when publicly available

This would make the platform not only a tool for discovering underutilized spaces but potentially a complete starting point for urban redevelopment projects.

## Data Required for the Model

To accurately evaluate whether a location is suitable for reuse, our system will need to collect and combine several different categories of data.

### Sunlight

Sunlight exposure can be extremely important for applications such as solar power generation, urban agriculture, public parks, and residential development.

Potential data could include:

* Average daily sunlight
* Seasonal sunlight variation
* Building shadows
* Nearby structures
* Solar exposure

### Soil Quality

For vacant land, especially land being considered for agriculture, parks, or environmental restoration, soil conditions may significantly affect the viability of a project.

Relevant information could include:

* Soil composition
* Drainage
* Contamination
* pH
* Previous industrial use

### Historical Usage

Understanding how a property was previously used could reveal both opportunities and potential risks.

For example, a former industrial site may require environmental remediation, while an abandoned retail property may already contain useful infrastructure.

The model could attempt to determine:

* Previous businesses
* Previous building types
* Historical zoning
* Duration of vacancy
* Previous industrial activity

### Property Value

The system should estimate the financial cost associated with acquiring or leasing the property.

Possible data could include:

* Assessed property value
* Recent sale prices
* Nearby comparable properties
* Property taxes
* Estimated market value

### Current State of the Property

The physical condition of the property is another important factor.

The system could attempt to identify whether the location is:

* Vacant
* Abandoned
* Partially occupied
* Structurally damaged
* Overgrown
* Demolished
* Under construction
* Currently operating

### Land or Property Type

The system will need to classify each candidate location.

Possible classifications include:

* Residential
* Commercial
* Industrial
* Agricultural
* Public
* Parking
* Vacant land
* Mixed-use
* Warehouse
* Office
* Retail

### Location

Geographic information will form the foundation of the system.

Important location data could include:

* Latitude and longitude
* Neighborhood
* Nearby roads
* Public transportation
* Distance from population centers
* Nearby businesses
* Schools
* Parks
* Utilities
* Infrastructure

### Weather

Weather information can affect many potential uses of a property.

The system could consider:

* Average temperature
* Rainfall
* Snowfall
* Wind
* Extreme weather events
* Flooding risk
* Heat exposure

### Damage

For existing structures, the system should estimate the condition of the property and identify visible or documented damage.

Potential damage categories could include:

* Roof damage
* Structural damage
* Fire damage
* Water damage
* Broken windows
* Foundation problems
* Exterior deterioration
* Environmental contamination

### Foot Traffic

Foot traffic is particularly important when evaluating commercial, retail, community, or public-use properties.

Potential signals could include:

* Pedestrian density
* Nearby attractions
* Public transportation usage
* Nearby businesses
* Event activity
* Population density

### Visibility

Some projects depend heavily on how visible a location is from surrounding roads and pedestrian areas.

For example, retail stores may benefit from highly visible street frontage, while warehouses may not require significant visibility.

Possible measurements could include:

* Road frontage
* Nearby intersections
* Street visibility
* Traffic volume
* Pedestrian visibility

### Cost to Repair or Redevelop

Finally, the system should attempt to estimate how much investment would be required before the property could be reused.

This could include:

* Structural repairs
* Demolition
* Construction
* Environmental cleanup
* Electrical work
* Plumbing
* Roofing
* Landscaping
* Code compliance
* Accessibility upgrades

By combining these factors, our model could create a much more complete picture of a property's redevelopment potential than any single dataset could provide.

## Overall Vision

The ultimate goal of the project is to create an **AI-powered search engine for underutilized urban space**.

Instead of asking:

> "What vacant properties exist in this city?"

we want users to be able to ask:

> "Where in this city could I realistically build this idea?"

The platform would then combine geographic data, public records, environmental information, property information, and AI reasoning to identify the most promising locations.

If successful, the system could potentially be useful for real-estate developers, entrepreneurs, urban planners, environmental organizations, local governments, architects, researchers, and community organizations.

By making unused urban spaces easier to discover and evaluate, we hope to demonstrate how AI and modern computing infrastructure can help cities make better use of the land and buildings they already have.

---

# THRESHOLD front-end (`front-end/`)

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


## Voloridge: real public data (NOAA ISD)

For the Voloridge "Signal in the Noise" challenge, the dashboard's **Weather Exposure** tab is built from real NOAA Integrated Surface Database observations (`s3://noaa-isd-pds`), not mock numbers.

**Pipeline** (`voloridge/isd_pipeline.py`, Python 3.12, standard library only):
1. Reads the ISD station catalogue (~35k stations) and per-year inventory (~15 MB).
2. For each of the four dashboard facilities, picks the nearest station that is still reporting *and* has enough hourly observations in every study year (a coverage check, not just "nearest").
3. Downloads one gzipped fixed-width file per station per year (2019-2024, anonymous HTTPS, cached), parses the mandatory section, drops flagged or missing values, keeps one observation per hour, and converts to local time.
4. Reduces it to sound-relevant weather statistics (share of still-air nights, night wind rose, mean night wind, hours at 25 C+, monthly still-night share) and writes `front-end/src/threshold/dashboard/lib/isdSummary.json` (about 6 KB), which the web app loads. Wind directions are spread across the sectors they overlap because ISD reports 10-degree steps.

Run it: `uv run --no-project --python 3.12 --with tzdata python voloridge/isd_pipeline.py` (raw downloads go to `voloridge/data/`, which is gitignored).

**What it shows:** the same 120 Hz hum has very different weather exposure by site. At night the air is still (wind under 2 m/s) about 61% of the time in Manassas VA, 46% in Scranton PA, 30% in Ypsilanti MI, and 10% in Crosby ND. The tab also lets you set the direction to the nearest homes and see how often the wind carries sound that way.

**Limits:** ISD has no acoustic data. These are weather *exposure* statistics, not noise measurements or decibel predictions. Wind is measured at the nearest airport station (2 to 10 km away), not at the facility, and the still-air threshold and night hours are stated assumptions.

### PUDL: real electricity prices and grid mix

The Financial Impact tab no longer uses the made-up $0.14/kWh. `voloridge/pudl_pipeline.py` reads the PUDL/EIA tables `core_eia861__yearly_sales`, `out_eia923__yearly_generation_fuel_combined` and `core_eia__entity_plants` (public bucket `s3://pudl.catalyst.coop`, Parquet, about 18 MB total) and writes `front-end/src/threshold/dashboard/lib/pudlSummary.json` (about 6 KB) with each facility's state industrial retail price (2019-2024) and in-state generation mix.

**Data-cleaning fix worth knowing about:** in restructured markets (PA, MI) sales are split into a supplier "energy" row and a wires "delivery" row. Averaging every row double counts megawatt-hours and gives about 4.0 c/kWh for Pennsylvania; the correct all-in price is (revenue of bundled + energy + delivery) / (MWh of bundled + energy) = 7.9 c/kWh. The pipeline prints the naive figure next to the corrected one as a check.

Results (2024 state industrial average): VA 9.0, ND 7.3, PA 7.9, MI 8.3 c/kWh. Carbon-free share of in-state generation (nuclear, hydro, wind, solar): VA 36%, ND 40%, PA 34%, MI 32%.

Run it: `uv run --no-project --python 3.12 --with pyarrow python voloridge/pudl_pipeline.py`.

**Limits:** state averages, not a tariff for any facility. The generation mix is in-state generation, not what a specific utility delivers, so no emissions figure is claimed.

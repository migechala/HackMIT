# THRESHOLD

HackMIT sustainability prototype. A standalone website with a marketing page, fake business login, and three functional dashboard pages. The source uses HTML, CSS, and JavaScript without a build step.

## Run

Open `index.html` directly for the static prototype, or run this from the extracted folder:

```sh
python -m http.server 8765
```

Open `http://localhost:8765`. The dashboard uses hash routes so static hosting needs no routing configuration. Fonts load from Google Fonts, with local system fallbacks. The generated opening image is included locally.

## Login

Click **Use the example account**, or provide an example email and any nonempty password. This is expressly a fake login. The password is neither transmitted nor saved. A local demo-session flag and example email persist in localStorage. Do not use this as an authentication boundary for hardware or customer data.

## Implemented

- Green editorial landing page, technology, pricing for residents/business/government, FAQ, and interactive waveform comparison.
- Three top-level application tabs: Operations, Costs & thresholds, Site intelligence.
- Shared simulator with ANC on/off, relative frequency spectrum, baseline capture, attenuation, power draw, and session readings export.
- Hour/day/week illustrative historical power views. Today's synthetic history is seeded at 5.2 W and explicitly labeled.
- Editable electricity tariff, current hourly cost, daily/monthly projections, cost per attenuation-hour.
- Configurable illustrative jurisdiction profiles and timezone. Named numerical profiles have NOT been independently verified as law. They must never be used for legal determination.
- Threshold episodes and simulated SMS previews, recipient-role selection, incident simulation. No texts are sent.
- Six fictional location candidates, hard filters, normalized weighted suitability and disruption scores, preference weighting, comparisons, CSV export, and schematic map. Google Maps links open representative regional coordinates, not offered parcels.
- Import of validated telemetry snapshots. Imported snapshots are read-only, not live; controls cannot change hardware.
- Mobile layout, reduced-motion behavior, accessible forms and keyboard navigation.

## Cinematic hero

The generated six-second barren-to-green landscape film is included and connected to scroll progress. The same facility is surrounded by growing grass and trees, with distant deer and birds. Scrolling backward reverses the sequence. A Watch the transformation button opens a playable video. The film is a conceptual illustration, not evidence of ecological restoration.

`assets/hero-config.js` configures the local video, its byte size, and the start/end stills. The film is H.264, 1600 × 906, silent, 6.04 seconds, 8,272,827 bytes, with short keyframes and faststart. A streamed Blob loader shows progress and coalesces seeks. Mobile and reduced-motion views show the green ending still and offer manual video playback. No video asset is fetched automatically in those modes in the source build. The standalone HTML embeds assets for offline use, so its file includes video bytes regardless of viewport.

The artwork is a conceptual, generic hyperscale facility, not an AWS-endorsed installation. Ecological improvements are a visual ambition, not validated outcomes of this prototype.

## Future hardware bridge

Keep ANC DSP on the hardware. Add an authenticated backend for:

1. Device-authenticated telemetry ingestion and validation.
2. Persisted readings, timestamps, sequence IDs, and calibration/location metadata.
3. Authorized website subscriptions via SSE or WebSocket.
4. Commands with IDs, expiry, idempotency, and device acknowledgments.
5. Offline/stale status. Never fill gaps with synthetic data labeled live.

The app's **Hardware connection** dialog exports an example payload and can import a snapshot. Suggested contract:

```json
{
  "schema_version": 1,
  "device_id": "esp32-zone-01",
  "sequence": 1,
  "timestamp": "2026-09-20T12:00:00Z",
  "anc_enabled": true,
  "baseline_level": 66.6,
  "residual_level": 54.2,
  "dominant_hz": 120,
  "cancellation_hz": 120,
  "phase_deg": 180,
  "power_w": 5.2,
  "voltage_v": 5,
  "current_a": 1.04,
  "measurement": {
    "unit": "dB relative",
    "calibrated": false,
    "weighting": "Z",
    "location": "duct",
    "averaging": "RMS_1s"
  }
}
```

Optional `spectrum`: `frequency_hz`, `baseline_db`, `current_db`, arrays with equal length up to 2048 bins. Levels are relative to the declared signal reference. Scalar overall sound level and spectral bins are different measurements. A real implementation must also attach a stable baseline ID and comparable instrument/settings metadata, not just matching numbers.

Never put API secrets or device master credentials in browser JavaScript. The current site does not implement a production backend, authenticated devices, live ANC control, or certified acoustic measurement.

## Future SMS delivery

Replace simulated outbox creation with an authenticated server-side provider adapter. Configure explicit consenting recipients, deduplicate by incident, use cooldowns, expire stale alerts, retain delivery receipts, and keep provider secrets on the server. Sending to an official is not enabled or attempted by this build.

## Maps and scoring

The map is authored SVG, not Google Maps or satellite analysis. Scores are computed entirely from transparent synthetic factors. Solar irradiance is illustrative context only and not scored. High community/ecological preferences multiply the related weight by 1.5 and then normalize. Capacity, land, utility capacity, region, distance, water, fiber distance, and cooling compatibility are hard filters. Expansion applies to capacity, land, and utility capacity.

Real deployment needs licensed maps and sourced, dated environmental/utility/parcel data. A nearby power line does not establish grid capacity. Do not infer node counts from IT MW alone.

## Hosting

This is an unhosted review build. Upload the contents to an approved static host after the 10k skill's preview and hosting gates. No public deployment was made. Add absolute Open Graph URLs only after the final address exists.

## Verification performed

JavaScript syntax checks and local DOM-based interaction checks passed for protected demo routes, fake sign-in/out, ANC transitions, baseline capture/restoration, tariff calculations, incident deduplication, SMS preview creation, site-score reweighting, capacity filtering/no-results, invalid snapshot rejection, read-only imported snapshots, measurement comparability, and suppression of fabricated live spectra/history.

Update: a local Chromium binary was obtained through an npm package, allowing browser checks without transferring source to an external sandbox. The landing video decoded successfully, advanced with scrolling, and the mobile Watch button played it. Site candidate progress tracks and their fills measured 4px and remained inside their cards. The site-intelligence page had no horizontal overflow at 375px. Desktop and mobile screenshots were inspected. Earlier external testing was blocked; no source was transferred there. Physical hardware and SMS-provider integration remain untested and unconfigured.

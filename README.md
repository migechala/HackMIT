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

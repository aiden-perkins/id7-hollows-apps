# Trip Data

> Custom graphical dashboards and views, with Settings as the only native screen.
> Version 1.4 adds GPS-distance recording, engine-session automation and history records.

## Goal

Record trips and show driving, elevation and gear statistics, with GPS-derived
distance and coverage-aware graphs. Fuel use and MPG remain unavailable without a
validated consumption source. Units and presentation are tailored to the M850i.

## Pages, screens and navigation

The app ID is `trip_data` and display name is **Trip Data**. All pages below,
including history, dialogs and text editing, are drawn inside the main canvas.
Only Settings opens a native iDrive screen.

### How to move around

The app opens on **Current trip**. A page menu provides Current trip, Trip history,
History records and Settings. Elevation, Fuel and Gears are views of a particular
trip: open them from the current trip or a saved trip's summary. History records
is also accessible from Trip history.

```text
Page menu
  Current trip (opens when the app starts)
    Elevation
    Fuel
    Gears
  Trip history
    Saved trip summary
      Elevation
      Fuel
      Gears
  History records
  Settings
```

Use the iDrive controller to select pages, actions and list entries. Back from a
trip's Elevation, Fuel or Gears returns to that trip's summary. Back from a
saved summary returns to history; Back from a main page returns to the page menu.
Touch and swipe behavior remains optional until input support is established.

Always show which trip is being viewed: **Current trip** or the saved trip's name
and date. Opening history or another view does not itself pause or finish recording.
Whether recording can continue while another app is open or the head unit sleeps
still needs lifecycle research.

All trip views distinguish missing or partial data from valid zero readings.
Show data coverage alongside derived results, and gaps in graphs when samples are
missing. A requested metric remains unavailable until its source is understood.

### Current trip: recording controls and live summary

**Layout and data:** show recording state at the top (not started, recording,
finished or interrupted). The left live panel contains speed, gear, distance,
elapsed timer, altitude, top speed, fuel used and moving time. The remaining width
holds a wide speed graph above side-by-side MPG and elevation graphs, all against
elapsed time. The speed graph title includes GPS-covered average speed and
moving-covered average speed; the MPG graph title includes average MPG when
available. There is no separate averages panel.

**Actions and navigation:** Start begins a trip manually; Finish saves and closes
it. Optional automatic recording uses sustained engine RPM, not ignition state;
see Trip lifecycle for thresholds and restart behavior. There is no manual Pause
or Resume. Stationary periods at or below 1 mph remain part of the trip. Links
open this trip's Elevation, Fuel and Gears. History and Settings are available
through the page menu.

Before a start, show that no trip is active rather than invented totals. After
manual Finish, open the saved trip summary. After an interruption, show the missing
interval and offer recovery for version-2 recordings. Version-1 recordings can be
closed and viewed, but cannot resume under the new distance policy.

Recording time does not require optional measurements. Missing GPS, speed, gear,
RPM or altitude creates gaps in the affected statistics rather than stopping the
whole recording. Missing RPM is unknown, not an automatic engine-off event.

### Embedded trip graphs

The main trip page includes a wide speed graph with rolling fuel economy and
elevation graphs side by side below it. All three use elapsed time on the
horizontal axis. GPS-covered and moving-covered average speeds appear in the speed
graph title; legacy trips retain speed-covered averages. Average MPG appears when
available. Label axes and units, preserve gaps for
missing samples and extend current-trip plots as samples arrive. Saved-trip plots
use stored samples. There is no separate Graphs tab.

Fuel economy requires validated consumption and matching distance. Show an
unavailable explanation when suitable samples are absent. Display smoothing and
downsampling must not change calculated trip totals.

### Elevation: altitude and climbing summary

**Layout and data:** elevation graph, starting and ending valid altitude, net
altitude change, total ascent, total descent, minimum / maximum altitude and
vertical speed where supported. Include altitude coverage so missing parts of the
trip are visible. For a current trip, also show the latest valid altitude.

**Actions and navigation:** Back or Trip summary returns to this trip's summary.

Altitude requires an independently valid 3D fix and height field; a valid position
alone does not establish valid altitude. The existing altitude calculations are
unchanged: ascent/descent use the recorded deadband, defaulting to 10 ft with 5,
10 or 20 ft settings. Vertical speed uses adjacent valid altitude samples without
additional smoothing. The height reference and actual vehicle response still
need validation; display smoothing does not change calculated totals.

### Fuel: consumption and efficiency

**Layout and data:** separate panels hold the fuel-used / average-economy summary,
rolling MPG graph and speed-band list. New trips use 10-mph bands from 10 through
200 mph, with under-10, 200+ and unknown buckets. Each row shows duration, distance,
fuel used and MPG. Saved and recovered trips retain their recorded band policies;
existing recordings keep their original bucket totals.
Label the graph's averaging window and each result's data coverage. Use US MPG and US
gallons, with numeric measurements displayed to three decimal places.

**Actions and navigation:** Slower speed bands and Faster speed bands page through
eight rows at a time. Switch between Totals and Coverage columns. Back or Trip
summary returns to this trip's summary.

**Needed:** validated cumulative fuel consumption or fuel flow, plus time-aligned
distance. Tank-level changes are insufficient for accurate short-trip consumption.
If consumption is unavailable, show that explicitly and keep the other trip views
usable. Average MPG uses total matched distance and fuel, not averaged MPG samples.

Version 1.4 has no validated consumption source. Fuel-used, MPG and economy
records therefore remain explicitly unavailable; tank-level changes are not a
substitute. Speed-band duration and covered GPS distance remain usable.

### Gears: time, shifts and engine-speed statistics

**Layout and data:** show supported forward gear states 1–10 together in a table
of duration, distance, shift count and coverage, without scrolling. This is the
source's supported range, not a claim that the M850i has ten gears. Add fuel used and MPG per
gear only when matching consumption data exists. One summary card combines RPM
minimum, maximum, time-weighted average and total engine revolutions when supported,
along with RPM coverage and time in Park, Reverse, Neutral, combined N/P and unknown
states. An optional gear-by-speed table can combine the gear and speed-band breakdowns.

**Actions and navigation:** open from the selected trip's summary; Back returns to
that summary. This page describes recorded behavior and does not control the gearbox.

Actual gear comes first from `VehicleInformation.statusGearboxDrive`, with
`DataPowerTrain2` as an explicit fallback. These change-driven states are retained
while their provider remains connected; disconnects and retries break continuity.
Park and Neutral remain combined N/P unless an explicit state distinguishes them.
Do not infer a forward gear from speed or RPM. Count forward-gear transitions only
across continuous samples from the same provider, connection epoch and source.
RPM statistics use decoded engine-speed samples. Missing fuel does not prevent
time-in-gear statistics.

### Trip history and saved trip summary: revisit a recording

**History layout and data:** a list showing trip name or date, start time, duration,
distance and finished / interrupted status. Selecting an entry opens its summary.

**Summary layout and data:** the selected trip's totals for time, distance, speed
and available fuel data, plus recording status and coverage. Links open that saved
trip's Elevation, Fuel and Gears, using the same layouts as the current trip.
Saved summaries do not show current vehicle readings as part of the old trip.

**Actions and navigation:** rename or annotate a trip; require explicit confirmation
before deleting saved data. Back from a saved summary returns to history, preserving
the selected entry. Back from history returns to the page menu.

**Needed:** a saved trip index, summaries, sample chunks and source / quality metadata.
Interrupted trips must remain identifiable and recoverable without fabricated data.

### History records

Seven records summarize finished, non-demo trips: top speed, highest elevation,
lowest elevation, longest distance, shortest distance, best average MPG and worst
average MPG. Each requires at least 95% coverage for its metric, counting missing
wall-clock intervals against coverage. Distance and economy records additionally
exclude interrupted or recovered trips and trips with recording gaps.

Each available record identifies its trip, date, coverage and calculation source.
Selecting it opens the saved trip; Back returns to history. Ties select the
earliest trip start, then trip ID. Legacy distances remain labelled as
speed-derived instead of being silently compared as GPS measurements. Economy
records remain unavailable without validated fuel consumption.

### Settings: recording, presentation and storage preferences

**Layout and data:** settings cover optional automatic recording, date/time
presentation, graph smoothing and recording detail. Automatic engine-session
recording defaults to off and is disabled in Demo and preview mode. Moving means
speed above 1 mph; no manual pause. Record coordinates and altitude independently.
Keep trips where storage permits; do not automatically delete old recordings.

**Actions and navigation:** open from the page menu; Back returns to that menu.
Source status separates GPS fix age from receipt age: repeated delivery of an old
fix does not make it fresh, and frequent receipts do not establish GPS fix rate.
Retry sources reconnects providers and clears the recorder's source-error hold.

Preferences and the automatic restart hold are persisted. Automatic recording
requires the app process to be running and is blocked by unresolved interrupted
trips. Preserve each trip's calculation policy so saved results stay interpretable.

## Implementation details

### Units, precision and date/time

Use US units throughout: miles, mph, US gallons / MPG, Fahrenheit, feet for altitude
and psi for pressure; USD if currency is displayed. Numeric measurements use three
decimal places. IDs, counters, gear labels and clock fields retain natural formats.
Display date/time as `h:mm:ss AM/PM M-D-YYYY`, for example `3:04:05 PM 2-7-2026`:
12-hour clock, two-digit minutes / seconds and no leading zeros on hour, month or day.
Store timestamps and calculation precision independently of display formatting.

### How the app gets data

The flow is: head-unit sources -> subscriptions or bounded reads ->
timestamped, decoded and validated samples -> trip recorder and calculations ->
current summary, graphs and saved trip files. History reads those saved files.

Use existing MGU Lab research and the local SOME/IP catalog to identify candidate
sources. Confirm actual availability on the M850i, source meanings, units, scaling,
validity and update rates before using readings in trip calculations. Prefer
subscriptions where supported and bounded polling where needed. The recorder must
collect the selected trip signals independently of which trip view is open.

Preserve source timestamps where available and monotonic receive times for interval
calculations. Missing samples must create explicit coverage gaps, not invented
movement, fuel use or gear states. Optional sources can fail independently without
making all trip statistics unavailable.

### GPS distance and source timing

New trips calculate distance between accepted GPS positions, not by integrating
vehicle speed. Coordinates are interpreted as WGS84 degrees; the catalog does
not confirm that interpretation or expose horizontal accuracy. These assumptions
and real vehicle fix cadence still need validation.

Only valid 2D/3D positions with calendar-valid, advancing UTC fix timestamps can
extend a GPS segment. Duplicate fixes do not add distance or refresh fix age.
Backward/reset timestamps, invalid fixes, stale data and gaps over five seconds
break continuity rather than bridging missing travel. Geodesic distance handles
crossing the antimeridian.

Fresh vehicle speed gates movement and rejects implausible position jumps; it is
not a distance fallback. Stationary intervals contribute zero GPS drift distance.
Missing speed leaves distance coverage gaps. Accepted segments are allocated to
recorded gear and speed-band intervals by their above-1-mph moving duration; this
is allocation of a GPS segment, not a measured path for each recorder tick.

GPS UTC is mapped onto recorder intervals using the wall/monotonic clock offset.
That mapping assumes the source UTC and head-unit clock agree. Recorder cadence,
subscription receipts and new GPS fix cadence are separate measurements. Rejection
limits protect calculations from obvious bad segments; they do not prove GPS
accuracy or recover unobserved turns.

### Implementation areas

| Area | Responsibility |
| --- | --- |
| App definition and entry point under `apps/trip_data/` | App metadata, startup, shutdown and interruption recovery |
| Screens and navigation | Current trip, history, saved summary, graphs, breakdowns and settings |
| Source definitions and access | Signal mappings, subscriptions / reads, decoding, units and validity |
| Trip recorder | Manual / engine-session start and finish, timing, sample batches and checkpoints; no manual pause |
| Calculations | Distance, speed, fuel, altitude, gear and RPM statistics with coverage |
| Storage and history | Trip index, summaries, sample chunks, annotations and retention |
| Preferences | Units, thresholds, recording policy and presentation options |
| Wrapper integration | App routing and packaging through the existing wrapper |

The app uses the upstream runtime and SDK through the wrapper. The manifest
defines a canvas MAIN and one native SETTINGS screen; recording is independent
of the selected graphical view.

### Metrics and calculation rules

| Metric | Definition / requirement |
| --- | --- |
| Duration | Monotonic elapsed time while recording, including stationary periods; no manual pause |
| Moving duration | Recorded intervals above 1 mph; speed <= 1 mph is stationary |
| Distance | Accepted GPS geodesic segments only for new trips; no vehicle-speed fallback; legacy totals retain their original policy |
| Average speed | GPS distance / GPS-distance-covered duration, not total trip duration; legacy trips retain speed-covered duration |
| Average moving speed | GPS distance allocated to moving intervals / moving-distance-covered duration |
| Top speed | Highest valid decoded vehicle-speed sample; record source quality and coverage |
| Elevation graph | Valid altitude samples with gaps and optional display smoothing |
| Net altitude | Last valid altitude minus first valid altitude; show coverage limitations |
| Total ascent / descent | Sum accepted altitude changes using the recorded deadband, default 10 ft |
| Minimum / maximum altitude | Extrema from accepted valid altitude samples |
| Vertical speed | Altitude change / time between adjacent valid samples; no additional calculation smoothing |
| Fuel used | Unavailable until a cumulative-consumption or fuel-flow source is validated |
| Average MPG | Total valid distance / corresponding valid fuel used; never average individual MPG readings |
| Fuel-economy graph | Fuel economy over defined rolling windows; label window and data gaps |
| Time in each gear | Accumulate valid gear-state intervals; keep unknown intervals separate |
| Gear shifts | Forward-gear transitions within one continuous provider / connection epoch / source; exclude unknown and non-forward transitions |
| RPM statistics | Minimum, maximum and time-weighted average of valid engine-speed samples |
| Total engine revolutions | Integral of RPM over time divided by 60, with time measured in seconds |

"Total RPMs" means total engine revolutions, not a sum of RPM readings.

#### Fuel and efficiency details

- Use US MPG and US gallons, displaying numeric measurements to three decimal places.
- Show unavailable when reliable consumption data is absent.
- Do not treat fuel-tank level changes as accurate short-trip fuel consumption.
- At zero fuel use, show a suitable coasting state rather than an arbitrary MPG number.
- At a stop, distance-per-fuel may be zero; fuel-per-distance is undefined.
- Store enough source and quality information to explain derived results.

#### Gear and speed breakdowns

- Per gear: duration, distance, fuel used, MPG and shift count where available.
- Per 10-mph speed band: duration, distance, fuel and MPG.
- Optional gear-by-speed table after the basic summaries are useful.
- Attribute distance and fuel to time-aligned valid intervals; exclude mismatched
  or unknown intervals from that bucket's efficiency calculation.
- Show data coverage, so a partial result does not look like a full-trip result.

### Data availability and research

- Validate the decoded vehicle speed, engine RPM and explicit gear sources on the car.
- Confirm GPS coordinate units, UTC alignment, accuracy and actual advancing-fix rate.
- Research a fuel-consumption source; Lab's tank and range data do not prove one exists.
- True ignition transitions remain unvalidated. RPM-based automation is an engine-session proxy; automatic engine stop/start can split recordings.
- MGU Lab already investigates GPS height and validity. A valid position does not
  imply valid altitude, and the catalog does not specify the altitude reference.
- Preserve source timestamps where available and capture monotonic receive times.
- Reject sentinel values, stale data and impossible time deltas before calculations.

Collect what is exposed and validated. Do not assume every desired metric is
available through the current SDK or SOME/IP catalog.

### Trip lifecycle

Implemented lifecycle:

1. Start manually, or enable automatic engine-session recording. Automatic start needs at least two seconds of fresh RPM at or above 400, with advancing deliveries in the same connection epoch. Never start a second active trip.
2. Record bounded sample batches and periodically checkpoint the active trip.
3. Keep recording through stationary periods (speed <= 1 mph); no manual Pause or Resume. Mark missing measurements and intervals as gaps.
4. Manual Finish saves the trip. Automatic finish needs at least three seconds of confirmed live zero RPM. Missing/stale RPM or RPM between zero and 400 is unknown, not confirmed engine-off.
5. After manual Finish with automation enabled, persist a restart hold. A sustained confirmed engine-off period clears the hold; a subsequent sustained running state can start another trip. Manual Start remains available.
6. On restart, identify interrupted trips. Version-2 trips can resume with the missing wall-clock interval recorded as a gap; version-1 trips are close/view only and retain their original totals.

This is not ignition detection. Automatic engine stop/start may split a session.
The app process must be running to observe transitions; recording while another
app is open or the head unit sleeps still needs vehicle lifecycle validation.

### Saved data and downloads

- `data/settings.json`: schema-1 preferences, thresholds, units and automatic restart hold.
- `data/trips/index.json`: trip list with recording / finished / interrupted status.
- `data/trips/<trip-id>/summary.json`: totals, coverage, sources and calculation policy.
- `data/trips/<trip-id>/samples-000000001.jsonl`, then increasing nine-digit sequences: bounded sample chunks.

New indexes, summaries and sample chunks use schema 2. Schema-1 recordings remain
readable with their original speed-derived totals and policy; they are not
recomputed as GPS trips and cannot resume. Existing settings retain schema 1.

Storage uses unique trip IDs, bounded writes and recoverable checkpoints.
Graph downsampling remains separate from calculation data.
Retain all trips and samples where storage permits; do not automatically delete old trips.
Show low storage clearly and preserve existing saved data if new recording cannot continue.
No maximum recording duration is desired. If a technical limit is unavoidable,
24 hours is the fallback target; make the limit visible and never silently truncate.

Once installed, `download trip_data` can collect the app's saved storage.
A future CSV export is a separate feature; the downloader copies raw files.
Record both GPS coordinates and altitude history. Preserve their independent validity;
missing altitude must not invalidate otherwise valid coordinates.

## Confirmed choices

- Support manual Start / Finish and optional RPM-based engine-session recording, with explicit stop/start and lifecycle limits rather than claimed ignition detection.
- Moving means speed > 1 mph; speed <= 1 mph is stationary and remains part of trip duration.
- No manual Pause or Resume.
- Use US units and three-decimal measurement display, with the date/time format specified above.
- "Total RPMs" means total engine revolutions.
- Keep both coordinates and altitude history.
- Retain everything where storage permits, without automatic deletion.
- No maximum recording duration unless technically necessary; 24 hours is the fallback target.

## Recording interval

The recorder offers 500, 1,000 or 2,000 ms intervals, defaulting to 1,000 ms.
The selected detail is captured in each trip's policy and does not silently
decrease during recording. A faster recorder interval does not create new GPS
fixes or increase the source's measurement rate.

## Graphical implementation

Version 1.4 adds GPS-distance coverage, engine-session recording, explicit
change-driven gear states, decoded speed/RPM and history records. Version 1.2
revised the graphical layout and navigation. Version 1.1 replaced the native-screen
implementation using the original design recovered from commit `4783f6a`.

- `MAIN` is a 1600 x 520 canvas using the same `ctx.canvas`, renderer and
  `kit/gauges.frame` path as upstream dashboards. The layout uses large trip
  readouts, M-color accents, coverage bars and custom chart/table/card views.
- Trip, Elevation, Fuel, Gears, History, History records and the page menu are logical
  views inside that canvas. Recovery actions, delete confirmation and the
  name/annotation keyboard are graphical too. `SETTINGS` is the sole native
  screen; it returns to the same graphical view.
- The controller changes focus and selects actions. On the GPU/input-gate path,
  rotation moves graphical focus, press selects, left tilt goes Back and right
  tilt changes views. The upstream-style bar provides Next view, Previous,
  Select, Next, Back and Settings controls for software rendering and previews.
- Next view cycles Trip -> Elevation -> Fuel -> Gears -> History -> Trip.
  The Trip page has a wide speed graph above MPG and elevation graphs; averages
  are shown in graph titles and moving time is in the live vehicle panel.
- Fuel has paged speed-band rows and a Totals/Coverage column switch. Gears shows
  supported forward states 1–10 at once, with a Totals/Coverage switch and one summary
  card. Saved-trip identity is retained across views. History keeps its selected
  trip when returning from a summary. Recording remains independent of view changes.
- The graphical keyboard supports case, spaces, punctuation, caret movement,
  erase, name/annotation selection, Save and Cancel. Delete defaults to Cancel
  and requires a separate confirmation.
- New recordings use schema 2 and retain their GPS-distance calculation policy.
  Legacy recordings remain readable and closeable without rewriting their totals;
  only version-2 recordings can resume. Plot projections remain bounded, and
  presentation smoothing does not alter recordings or totals.

### Packaging and preview

Repackage the app to replace any older native-screen build in `dist/`:

```powershell
./out/mgu preview trip_data --build --out out/trip-data.png
./out/mgu preview trip_data --out out/trip-elevation.png --click BTN_PAGE
./out/mgu preview trip_data --out out/trip-fuel.png --click BTN_PAGE --click BTN_PAGE
./out/mgu preview trip_data --out out/trip-gears.png --click BTN_PAGE --click BTN_PAGE --click BTN_PAGE
./out/mgu preview trip_data --out out/trip-settings.png --click BTN_SETTINGS
```

These commands are instructions; they were not run during implementation.

### Data limits

Vehicle speed and RPM now use decoded BMW fields, and gear uses explicit
change-driven states with documented fallback precedence. Their source meanings
and physical response still need vehicle validation. GPS coordinate units,
horizontal accuracy, UTC alignment and actual fix cadence remain unconfirmed;
altitude validity is independent of position and its reference remains unknown.

True ignition transitions and calibrated fuel consumption remain unavailable.
Optional RPM-based automation therefore records engine sessions, not proven
ignition journeys. Fuel-used and MPG results remain unavailable. Demo is
explicitly labelled, memory-only and excluded from real history records; missing
vehicle measurements are never filled with demo data in real recordings.

Source review only. Tests, linters, formatters, builds, compilation and preview
execution were not run. No generated bundles or executable files were modified.

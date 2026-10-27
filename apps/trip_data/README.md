# Trip Data

> Planning outline only. No app implementation or manifest exists yet.
> The choices below define intended behavior; source availability still needs research.

## Goal

Record trips and show useful driving, fuel, elevation and gear statistics, with
speed, MPG and elevation graphs. Tailor units and presentation to the M850i.

## Pages, screens and navigation

This is a proposed layout, not an implemented app. The future app ID is `trip_data`
and the proposed display name is **Trip Data**.

### How to move around

The app opens on **Current trip**. A page menu provides Current trip, Trip history
and Settings. Graphs, Elevation, Fuel and Gears are views of a particular trip:
open them from the current trip or a saved trip's summary.

```text
Page menu
  Current trip (opens when the app starts)
    Graphs
    Elevation
    Fuel
    Gears
  Trip history
    Saved trip summary
      Graphs
      Elevation
      Fuel
      Gears
  Settings
```

Use the iDrive controller to select pages, actions and list entries. Back from a
trip's Graphs, Elevation, Fuel or Gears returns to that trip's summary. Back from a
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

**Layout and data:** recording state at the top (not started, recording,
finished or interrupted), followed by elapsed recording time, distance, moving
time, average speed, average moving speed, current speed and top speed. Show fuel
used and average MPG when reliable consumption data is available.

**Actions and navigation:** support both manual and automatic recording. Start begins
a trip manually; ignition-on starts one automatically if none is active. Finish or
ignition-off saves and closes it. There is no manual Pause or Resume. Stationary
periods at or below 1 mph remain part of the trip. Links open this trip's Graphs, Elevation,
Fuel and Gears. History and Settings are available through the page menu.

Before manual Start or ignition-on, show that no trip is active rather than invented totals.
After Finish, open the saved trip summary. After an interruption, offer recovery
and clearly identify the missing interval.

**Needed:** trip state, timing, valid speed or distance data and periodic storage
checkpoints. Fuel readings are optional; their absence must not prevent recording
speed, time and distance.

### Graphs: see how readings changed during the trip

**Layout and data:** one graph at a time, with a selector for speed, elevation or
fuel economy. Choose elapsed time or distance for the horizontal axis. Label both
axes and units, show gaps for missing data and show a cursor with the selected
point's time, distance and value. Current-trip graphs extend as samples arrive;
saved-trip graphs use stored samples.

**Actions and navigation:** controller rotation moves the cursor. Explicit controls
select the graph, axis and zoom; when zoom is selected, rotation changes its range.
Back returns to the originating trip summary.

**Needed:** timestamped samples and distance alignment for a distance axis. Elevation
requires valid altitude; fuel economy requires validated consumption and matching
distance. Show an unavailable explanation for a graph without suitable samples.
Graph smoothing and downsampling must not change calculated trip totals.

### Elevation: altitude and climbing summary

**Layout and data:** elevation graph, starting and ending valid altitude, net
altitude change, total ascent, total descent, minimum / maximum altitude and
vertical speed where supported. Include altitude coverage so missing parts of the
trip are visible. For a current trip, also show the latest valid altitude.

**Actions and navigation:** open the elevation graph in Graphs for cursor and zoom
controls; Back returns to this trip's summary.

**Needed:** altitude samples with their own validity, timestamps and documented
reference. A valid GPS position alone does not establish valid altitude. Ascent,
descent and vertical speed need documented filtering and noise thresholds.

### Fuel: consumption and efficiency

**Layout and data:** fuel used, average MPG and a rolling fuel-economy graph, plus
a table by configurable speed band showing duration, distance, fuel used and MPG.
Label the graph's averaging window and each result's data coverage. Use US MPG and US
gallons, with numeric measurements displayed to three decimal places.

**Actions and navigation:** open the fuel-economy graph in Graphs for cursor and zoom
controls; Back returns to this trip's summary.

**Needed:** validated cumulative fuel consumption or fuel flow, plus time-aligned
distance. Tank-level changes are insufficient for accurate short-trip consumption.
If consumption is unavailable, show that explicitly and keep the other trip views
usable. Average MPG uses total matched distance and fuel, not averaged MPG samples.

### Gears: time, shifts and engine-speed statistics

**Layout and data:** a per-gear table of duration, distance and shift count. Add
fuel used and MPG per gear only when matching consumption data exists. Show RPM
minimum, maximum, time-weighted average and total engine revolutions when supported.
Keep unknown gear intervals separate and identify Park, Reverse and Neutral.
An optional gear-by-speed table can combine the gear and speed-band breakdowns.

**Actions and navigation:** open from the selected trip's summary; Back returns to
that summary. This page describes recorded behavior and does not control the gearbox.

**Needed:** timestamped gear states and a defined transition-counting rule. RPM
statistics require engine-speed samples; efficiency per gear additionally needs
aligned distance and fuel. Missing fuel does not prevent time-in-gear statistics.

### Trip history and saved trip summary: revisit a recording

**History layout and data:** a list showing trip name or date, start time, duration,
distance and finished / interrupted status. Selecting an entry opens its summary.

**Summary layout and data:** the selected trip's totals for time, distance, speed
and available fuel data, plus recording status and coverage. Links open that saved
trip's Graphs, Elevation, Fuel and Gears, using the same layouts as the current trip.
Saved summaries do not show current vehicle readings as part of the old trip.

**Actions and navigation:** rename or annotate a trip; require explicit confirmation
before deleting saved data. Back from a saved summary returns to history, preserving
the selected entry. Back from history returns to the page menu.

**Needed:** a saved trip index, summaries, sample chunks and source / quality metadata.
Interrupted trips must remain identifiable and recoverable without fabricated data.

### Settings: recording, presentation and storage preferences

**Layout and data:** grouped settings for manual and automatic recording, US units,
date/time presentation, graph smoothing and recording detail. Moving means speed
above 1 mph; no manual pause. Record both coordinates and altitude history. Keep
all trips where storage permits, show storage usage and do not automatically delete.

**Actions and navigation:** open from the page menu; Back returns to that menu.
Explain that stationary time remains in total duration and that ignition-off ends
the trip. Preserve calculation policies with saved trips so results stay interpretable.

**Needed:** persisted preferences and documented defaults. Automatic recording needs
a validated ignition-state source and reliable app lifecycle behavior;
automatic recording is required, using ignition-on to start and ignition-off to finish.

## Implementation details

### Units, precision and date/time

Use US units throughout: miles, mph, US gallons / MPG, Fahrenheit, feet for altitude
and psi for pressure; USD if currency is displayed. Numeric measurements use three
decimal places. IDs, counters, gear labels and clock fields retain natural formats.
Display date/time as `h:mm:ss AM/PM M-D-YYYY`, for example `3:04:05 PM 2-7-2026`:
12-hour clock, two-digit minutes / seconds and no leading zeros on hour, month or day.
Store timestamps and calculation precision independently of display formatting.

### How the app gets data

The proposed flow is: head-unit sources -> subscriptions or bounded reads ->
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

### Proposed implementation areas

| Area | Responsibility |
| --- | --- |
| App definition and entry point under `apps/trip_data/` | App metadata, startup, shutdown and interruption recovery |
| Screens and navigation | Current trip, history, saved summary, graphs, breakdowns and settings |
| Source definitions and access | Signal mappings, subscriptions / reads, decoding, units and validity |
| Trip recorder | Manual / ignition start and finish, timing, sample batches and checkpoints; no manual pause |
| Calculations | Distance, speed, fuel, altitude, gear and RPM statistics with coverage |
| Storage and history | Trip index, summaries, sample chunks, annotations and retention |
| Preferences | Units, thresholds, recording policy and presentation options |
| Wrapper integration | Future app routing and packaging through the existing wrapper |

These are proposed responsibilities, not a fixed file structure. Use the upstream
runtime and SDK through the wrapper; share suitable local research deliberately.
No manifest or installable app exists in this planning folder yet.

### Metrics and calculation rules

| Metric | Proposed definition / requirement |
| --- | --- |
| Duration | Monotonic elapsed time while recording, including stationary periods; no manual pause |
| Moving duration | Recorded intervals above 1 mph; speed <= 1 mph is stationary |
| Distance | Valid vehicle distance delta where available; otherwise integrate valid speed over time |
| Average speed | Recorded distance / recorded duration |
| Average moving speed | Distance accumulated while moving / moving duration |
| Top speed | Highest valid speed; record sample quality and avoid invalid spikes |
| Elevation graph | Valid altitude samples with gaps and optional display smoothing |
| Net altitude | Last valid altitude minus first valid altitude; show coverage limitations |
| Total ascent / descent | Sum filtered positive / negative altitude changes using a documented noise threshold |
| Minimum / maximum altitude | Extrema from accepted valid altitude samples |
| Vertical speed | Altitude change / time over a defined interval, with smoothing |
| Fuel used | Valid cumulative consumption delta or integration of a validated fuel-flow signal |
| Average MPG | Total valid distance / corresponding valid fuel used; never average individual MPG readings |
| Fuel-economy graph | Fuel economy over defined rolling windows; label window and data gaps |
| Time in each gear | Accumulate valid gear-state intervals; keep unknown intervals separate |
| Gear shifts | Count validated transitions; define handling of Park, Reverse, Neutral and missing samples |
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
- Per configurable speed band: duration, distance, fuel and MPG.
- Optional gear-by-speed table after the basic summaries are useful.
- Attribute distance and fuel to time-aligned valid intervals; exclude mismatched
  or unknown intervals from that bucket's efficiency calculation.
- Show data coverage, so a partial result does not look like a full-trip result.

### Data availability and research

- Confirm actual speed, distance, gear and engine-speed fields and their units.
- Research a fuel-consumption source; Lab's tank and range data do not prove one exists.
- Identify and validate ignition-on / ignition-off events for automatic recording, independently of automatic engine stop/start.
- MGU Lab already investigates GPS height and validity. A valid position does not
  imply valid altitude, and the catalog does not specify the altitude reference.
- Preserve source timestamps where available and capture monotonic receive times.
- Reject sentinel values, stale data and impossible time deltas before calculations.

Collect what is exposed and validated. Do not assume every desired metric is
available through the current SDK or SOME/IP catalog.

### Trip lifecycle

Required lifecycle:

1. Start manually or automatically at ignition-on; capture start time and available source baselines. Do not start a second trip if one is already active.
2. Record bounded batches and periodically checkpoint the active trip.
3. Keep recording through stationary periods (speed <= 1 mph); no manual Pause or Resume. Mark missing samples as gaps.
4. Manual Finish or ignition-off closes the trip and saves its summary and samples. After manual Finish, wait for another manual Start or the next ignition-on event.
5. On restart, offer recovery of an interrupted trip without inventing missing data.

Ignition-off ends the trip; the next ignition-on starts a new trip, including after a brief shutdown.
Recording while another app is open or the head unit sleeps needs lifecycle research.

### Proposed saved data and downloads

- `data/settings.json`: preferences, thresholds, units and schema version.
- `data/trips/index.json`: small trip list with recording / finished / interrupted status.
- `data/trips/<trip-id>/summary.json`: totals, coverage, sources and calculation version.
- `data/trips/<trip-id>/samples-<sequence>.jsonl`: bounded sample chunks.
- Optional events file for ignition / manual start and finish, gear changes and source availability changes.

These are proposed formats, not existing files. Use unique trip IDs, bounded writes
and recoverable checkpoints. Keep graph downsampling separate from calculation data.
Retain all trips and samples where storage permits; do not automatically delete old trips.
Show low storage clearly and preserve existing saved data if new recording cannot continue.
No maximum recording duration is desired. If a technical limit is unavoidable,
24 hours is the fallback target; make the limit visible and never silently truncate.

Once implemented and installed, `download trip_data` can collect the app's saved
storage. A future CSV export is a separate feature; the downloader copies raw files.
Record both GPS coordinates and altitude history. Preserve their independent validity;
missing altitude must not invalidate otherwise valid coordinates.

## Confirmed choices

- Support manual Start / Finish and automatic ignition-on / ignition-off recording. A brief ignition shutdown ends the trip; the next ignition-on starts another.
- Moving means speed > 1 mph; speed <= 1 mph is stationary and remains part of trip duration.
- No manual Pause or Resume.
- Use US units and three-decimal measurement display, with the date/time format specified above.
- "Total RPMs" means total engine revolutions.
- Keep both coordinates and altitude history.
- Retain everything where storage permits, without automatic deletion.
- No maximum recording duration unless technically necessary; 24 hours is the fallback target.

## Remaining preference

- Sample frequency / recording detail is still undecided; retain the selected detail throughout the trip rather than silently reducing it.

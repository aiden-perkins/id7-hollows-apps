# Live Data Viewer

## Implemented app and current limits

The app uses the upstream 1600 x 520 canvas / theme / frame / display loop, following
the updated Trip Data dashboard. Settings is the only native screen. The design
below records the current presentation and the remaining research requirements.

- Three primary dashboards, in the default order **Driving, Temperatures, Engine
  health**. Existing saved category ordering is preserved.
- Driving prioritizes three large boost/power/torque dials with current fills,
  held min/max markers and inner observed-range arcs. A compact coupe/TPMS area
  has larger wheels relative to its body; pedals and steering remain graphical.
  Speed/RPM, gear/mode/traction, G-meter and electrical instruments are retained.
  Separate total/left/right fuel fields now sit on Driving, not Engine health.
  There is no altitude graph on Driving.
- Temperatures keeps its four grouped rolling plots: engine oil/coolant, the
  distinct transmission leads/converter, air locations and wheel temperatures.
  Observation min/max brackets and hollow rolling-window extrema markers augment
  the existing current/extrema/freshness legend without rearranging the groups.
- Engine health pairs three compact oil/fuel-pressure plots with an eight-cylinder
  comparison. Each cylinder has timing-correction, knock and misfire peak/current
  graphics. The old chamber artwork and aggregate timing/knock/misfire readings
  are removed. Missing readings never imply a healthy engine.
- The dashboard has one compact navigation row, in this order: **Previous page,
  Next page, Settings**. Turn or tilt the iDrive controller to select one of these
  three actions; press to activate it. Selection uses a thin underline, not a box.
  Previous/Next wrap through the saved category order and retain the selected action.
- Readings are display-only. The selectable gauges, signal-details screen,
  page menu, separate TPMS screen, reconnect action, snapshot action and manual
  observation-reset action have been removed from navigation.
- The oversized runtime button bar and dashboard help/source-note footer are
  removed. Storage and controller errors remain visible when present.
  Controller input follows Trip Data's relay plus FrontCCU fallback, gated by
  visibility, focus and active display; Settings releases the grab.
  The compact row requires the active GPU display/controller grab; it does not
  provide native-button or touchscreen navigation.
- Wheel-specific Driving readings use reported FL/FR/RL/RR field identities.
  Tire temperatures also appear in Temperatures using the same shared readings.
- Both upstream transmission-temperature leads remain identifiable:
  BasicDataSet transmission oil and EGS ECU 0x18 / DID 0xDA12. The latter is
  explicitly unavailable; this app issues no diagnostic requests.
- Source collection follows the visible category.
  Getters have bounded deadlines, no overlapping reads per field, and a
  five-second failure backoff. TPMS polling has a five-second minimum.
  Leaving data pages closes their proxies. Reconnects preserve graph gaps.
- Waiting, live, stale, invalid, unavailable and error are separate states.
  Retained last-valid values are labeled; no missing value becomes zero.
  Catalog defaults and observed TPMS codes 65534/65533 are rejected.
- Graphs and extrema use only validated numeric measurements. The rolling plots
  have explicit empty states until suitable sources and physical scales are
  confirmed. Mode/gear/traction enums and sensor IDs remain categorical.
  Historical gaps are not joined; graphs do not extend stale samples to "now".
  `OBS` rulers span the observation session, including extrema older than the
  selected rolling window. Hollow circles mark actual window extrema.
  No synthetic sample is added at an old session limit.
- Engine/RPM/speed, steering/pedal/braking, battery, fuel-tank and thermal
  conversions remain unconfirmed by the saved M850i evidence. The app does not
  display guessed physical values, graph raw codes, derive horsepower from
  unconfirmed inputs, or fill missing pedals with a fake zero.
- Traction uses the catalog-defined FES `statusDSCSwitchHMI.displayStatusDSC2`,
  accepting numeric and named DSC on/off, start-assist and traction enums;
  reserved/invalid codes are rejected. Provider availability on this car is
  unconfirmed. It is independent of driving mode and transmission program.
- The gear display combines a confirmed D/S/M program with a reported gear as
  M3, S8 or D2. There is currently no validated program source, so a gear alone
  remains a gear alone; Sport does not imply S. `SPORT EXPERT` is presented as
  Sport Plus with the original reported name beneath it.
- Dashboard numbers use instrument-appropriate rounding (e.g. whole speed/RPM,
  one-decimal tire pressure, two-decimal voltage/G). US units remain unchanged.
  Refresh (500/1000/2000 ms), graph duration (60/180/600 seconds) and category
  ordering are persisted.
- Trend buffers retain at most 1,201 points and ten minutes per numeric reading,
  with gaps for invalid data, service errors and collection pauses. Extrema
  cover valid observed samples only.
- The catalog's infotainment power modes do not establish ignition on/off.
  Extrema therefore cover the **observation session**, starting when the app
  starts, and are not reused after app restart. There is no manual reset action.
  Automatic ignition reset and reliable same-drive restart retention remain
  blocked by missing ignition evidence; app startup is not called ignition-on.
  There is no dashboard snapshot action or continuous disk recording.
  Previously saved snapshots are not deleted.
- Preferences use schema version 1 in `data/settings.json`. Unsupported schemas
  and malformed saved settings are reported and preserved rather than overwritten.
  Presentation does not round stored samples or calculation precision.
- Wrapper routing and packaging recognize `live_data_viewer` as local and apply
  the existing runtime getter patches. Normal app downloads can collect its
  stored settings and snapshots. No upstream source was vendored.

Implementation files: `app.json`, `main.js`, `definitions.js`, `services.js`,
`model.js`, `storage.js`, `view.js`, `instruments.js`, `driving.js`,
`temperatures.js`, `health.js` and `meters.js`.

Historical verification for version 1.3.0, before the compact-navigation change:
it was packaged and exercised with the software preview renderer.
Driving, Temperatures and Engine health were visually inspected with an explicitly
simulated physical-value fixture; unavailable Driving/Health and last-cylinder
details were also exercised. Smoke scenarios covered signed/overflow meter bounds,
unit-safe dials, zero/coincident/held extrema, max absolute timing correction,
per-cylinder misfire peaks, session versus window extrema, graph gaps/motion/expiry,
compact pressure plots, all dashboard focus targets and observation reset.
That historical preview did not validate vehicle cylinder sources. The supplied
in-car photo shows the earlier dashboard installed; the compact-navigation
change has not been exercised in a preview or on the car. Tests, linters,
formatters, builds and compilation were not run for this change.


## Goal

Provide an organized viewer for all useful data accessible on the M850i, including
temperatures, driver inputs, drivetrain state, tire data and engine-health signals.

"All possible data" means accessible signals organized into the category pages. It does
not mean all ECU diagnostics are available through the existing head-unit interfaces.
Unavailable fields should remain identifiable without invented values.

## Pages, screens and navigation

All data views use one custom canvas with fixed layouts and no scrolling. Only
Settings opens a native list. Source availability and conversion limits are
described above. The saved MGU Lab findings and raw Oct. 25-26 exports in out were
read before this rewrite; none of their historical values are used as live data.

### How to move around

The app opens on the **Driving dashboard**. Its only selectable controls are
**Previous page → Next page → Settings**, centered below the instruments.
Turning or tilting changes the selected control; pressing activates it.
Previous/Next wrap through Driving, Temperatures and Engine health in the saved
order. Gauges and plot legends cannot be selected and have no controller focus
boxes or focus-dependent guides.

Settings is a native list and returns to the same dashboard and selected action.
The duplicated runtime button bar, instructional footer and focused-signal note
are not drawn. Touch and swipe navigation are not implemented.

Every data page shows a friendly name, value, unit and availability state for each
reading. All suitable numeric readings show trip minimum / maximum and recent graphs. Missing
values remain labeled as waiting, stale, invalid, unavailable or error; never
substitute zero. The exact state rules are in Implementation details below.

Every data item below is a requirement or research target, not a promise that the
head unit exposes it.

### Temperatures: compare thermal readings

**Layout and data:** four rolling plots in two rows, with distinct series colors
and per-reading current value and observation minimum/maximum. Groups are
engine oil/coolant, transmission oil 1 (BasicDataSet)/oil 2 (EGS)/converter, four
air locations, and four reported wheel positions. The current unvalidated
temperature candidates show availability states and an empty time grid rather
than guessed physical temperatures.

**Needed:** identify each sensor and confirm its units, scale, validity and update
behavior before treating it as a live temperature.

| Desired value | Questions before displaying |
| --- | --- |
| Upstream transmission temperature 1 | Use the first upstream signal; confirm its sensor identity, units and scale |
| Upstream transmission temperature 2 | Use the second upstream signal; confirm its sensor identity, units and scale |
| Torque converter temperature | Include where available; establish whether either upstream transmission signal already measures this component |
| Engine oil | Confirm source, scale, validity and update rate |
| Coolant / water | Determine whether these names refer to one measurement or multiple sensors |
| IAT (intake air temperature) | Explicitly label as IAT; confirm sensor location, units and scale |
| Other air temperatures | List charge-air, ambient / outside and internal / cabin air temperatures separately where exposed; confirm each sensor location and distinguish them from IAT |
| Other relevant temperatures | Inventory supported engine, drivetrain and tire measurements |

Show trip minimum / maximum and recent graphs for all suitable validated numeric
readings. Keep ambiguous sensor names and unconfirmed scales explicit.

### Driving and drivetrain: inputs and vehicle response

**Layout and data:** speed/RPM, gear, independent program, mode and traction stay
on the left. Three large boost/power/torque arc meters dominate the middle, with
fuel total/left/right, transmission pressure and electrical instruments below.
Pedals, a compact coupe with proportionally larger wheels and concise TPMS
callouts occupy the upper right; the G-meter and signed-axis range rulers sit
below. Wheel pressure and temperature remain visible on Driving.

**Needed:** confirmed meanings and scales for driver inputs, explicit gear states
and identified sources for performance readings. Derived values need compatible
inputs and an explicit estimated / derived label.

| Desired value | Proposed presentation / limitation |
| --- | --- |
| Brake pedal | Travel / pressure only if identified; driver-braking status is a separate value |
| Steering wheel | Angle with direction and units once verified |
| Accelerator pedal | Position or angle with confirmed scale; no guessed percentage |
| Gear | Gear number plus D/S when independently available; explicit P/R/N/unknown states |
| Car mode | Show the reported driving mode by name: Sport, Comfort, Comfort Plus, Sport Plus, Eco Pro, Individual, etc., where supported; confirm source enum mappings and keep this separate from transmission D/S |
| Speed | Vehicle speed with source and units |
| RPM | Engine speed with trip min/max and recent graph |
| Boost | Distinguish absolute manifold pressure from gauge boost and verify reference pressure |
| Horsepower | Measured / reported / estimated label; derive only from validated compatible inputs |
| Torque | Preserve whether reported value is actual, requested or a limit |
| G-forces | Axes and sign convention; identify gravity / filtering behavior |
| Battery voltage | Identify the relevant electrical system and units |
| Transmission oil pressure | Include where available; confirm source, units, scale and validity |

If power is derived from torque and RPM, use matched timestamps and the correct
unit conversion. Do not present an estimate as a measured value or a dyno result.

#### Tires / TPMS section: readings for each wheel or sensor

**Layout and data:** compact wheel pressure and temperature callouts on Driving;
wheel temperatures also appear on Temperatures. There is no separate TPMS
screen. Wheel labels come from wheel-specific fields and never imply a
radio-slot mapping. Sensor IDs, target pressure and reported state remain
research targets rather than additional controller selections.

**Needed:** TPMS readings, sensor identity and reliable wheel-position information.
A missing field stays unavailable even if other readings from that sensor work.

- Pressure, temperature, target pressure and reported state per identified wheel.
- Sensor serial / ID, where exposed; retain decimal / hexadecimal forms if useful.
- Show whether wheel position is reported, inferred or unknown.
- Do not assume radio slots correspond to fixed wheel positions.
- Treat sensor IDs as IDs; do not call them UUIDs unless their format establishes that.
- Optional details: reception age, sensor status and other meaningful exposed fields.

### Engine health: oil pressure, fuel, ignition, knock and misfire readings

**Layout and data:** three compact plots on the left show oil pressure and paired
actual/target high-/low-pressure fuel. The main area compares C1-C8: maximum
absolute timing-correction magnitude, knock maximum and misfire counter maximum.
Each cell distinguishes the signed current reading, graphical current magnitude
and held observation peak; the largest positive peak in each row is outlined.
Fuel tanks are on Driving. No chamber artwork, aggregate timing or summed counts.

**Needed:** documented sources and meanings for each measurement or counter.
Clearly distinguish actual and target values. Additional diagnostic interface work is deferred; unsupported readings remain visible.

| Desired value | Research needed |
| --- | --- |
| Oil pressure | Confirm actual pressure source, sensor location, units, scale and validity; distinguish it from a pressure warning / switch state or target pressure |
| High-pressure fuel system | Actual versus target pressure, bank / rail and units |
| Low-pressure fuel system | Actual versus target pressure and units |
| Timing correction, C1-C8 | Actual signed correction in degrees, not generic timing advance. Establish both-DME mapping and sign/scale before use; peak is max absolute observation magnitude |
| Knock, C1-C8 | Per-cylinder detector quantity versus event counter, units and period remain unconfirmed; do not claim a count |
| Misfires, C1-C8 | Actual counter source, both-DME cylinder mapping, counter period/reset behavior and update interval; display observation max, not a sum or inferred trip total |
| Other useful values | Add only after documenting source, meaning and quality |

Additional diagnostic interface work is deferred. Keep requested readings visible as
unavailable until suitable sources exist. Do not infer engine condition from missing
data or an undocumented raw counter.

### Settings: choose presentation and data preferences

**Layout and data:** grouped settings for units, decimal precision, date format,
category ordering, trend duration and update-rate preferences. Unsupported signals
remain visible and labeled unavailable. No normal-use raw-data / research view is needed.

**Navigation:** open using the third dashboard control; Back returns to the same
dashboard. Settings is the only native screen.

**Needed:** saved preferences and ignition state. Reset all extrema together at
ignition-on for each drive / trip, and retain the current drive baseline across app
restarts where supported. Editing presentation settings does not need a live feed.

## Implementation details

### Units, precision and date/time

Use US units throughout: miles, mph, US gallons / MPG, Fahrenheit, feet for altitude
and psi for pressure; USD if currency is displayed. Dashboard measurements use
compact instrument rounding. IDs, counters and gear labels retain natural formats.
Display date/time as `h:mm:ss AM/PM M-D-YYYY`, for example `3:04:05 PM 2-7-2026`:
12-hour clock, two-digit minutes / seconds and no leading zeros on hour, month or day.
Store timestamps and calculation precision independently of display formatting.

### How the app gets data

The proposed flow is: head-unit service -> subscription or bounded read -> source
decoding and validity checks -> shared current-value state -> visible screens,
trip minimum / maximum and recent graphs. Screens use the same value state so
a reading has the same meaning everywhere.

Start with existing MGU Lab research and the local SOME/IP signal catalog to
identify candidate interfaces. A catalog match is only a lead: confirm that the
service and field actually work on this M850i, then document units, scaling and
quality before displaying a decoded measurement. Work on additional diagnostic interfaces for engine-health fields is deferred.

### Proposed implementation areas

| Area | Responsibility |
| --- | --- |
| App definition and entry point under `apps/live_data_viewer/` | App metadata, startup and lifecycle; implemented; see files listed above |
| Screens and navigation | Three shared-canvas dashboards, compact Previous/Next/Settings row, native Settings |
| Signal definitions | Friendly names, categories, exact source mappings, units, decoding and validity rules |
| Data access and shared state | Subscriptions, bounded polling, timestamps, availability and reconnect handling |
| Observation history in memory | Minimum / maximum and bounded recent-graph buffers, starting at app startup; ignition reset is unconfirmed |
| Preferences | US units, compact instrument precision, category ordering and trend duration |
| Wrapper integration | App routing and packaging support through the existing wrapper |

These are responsibility areas, not a fixed file structure. The implementation
has been packaged and previewed locally, but not installed by this redesign.

### Availability and value states

Use distinct states throughout the UI:

- **Live:** recent valid reading.
- **Waiting:** source selected but no sample received yet.
- **Stale:** last valid reading retained with its age.
- **Invalid:** source reports an invalid / unfilled value.
- **Unavailable:** service or field is absent or unsupported.
- **Error:** a read or subscription failed; include useful details.

Zero is a legitimate value for many signals, not a replacement for missing data.
Freshness thresholds should depend on each source's expected rate.

### Minimum / maximum and trends

- Track only valid, sufficiently fresh numeric samples.
- Extrema currently start at app startup. Changing pages does not reset them. Ignition-based reset remains a research target.
- Show when a value has no valid samples yet. Extrema cover observed valid samples only; identify gaps and periods when a source was not collected.
- Exclude invalid sentinels and documented source errors.
- Use bounded in-memory trend buffers and show gaps during missing data.
- Keep display smoothing separate from samples used for extrema.
- Ignition-based reset and same-drive restart retention require confirmed ignition data; neither is currently implemented.

### Data discovery and project integration

MGU Lab is the existing research app. It already investigates fuel levels, TPMS,
GPS, accelerator input, steering and braking status, alongside basic vehicle data.
Its comments identify unresolved scaling and validity questions that should carry
forward into this app's research notes.

For each adopted signal, document:

1. Exact interface, field / event and instance.
2. Read / subscription access and actual behavior on this vehicle.
3. Data shape, units, scaling, sentinel values and quality flags.
4. Expected update rate, stale threshold and reconnect behavior.
5. Friendly name, category and whether it is measured or derived.

Prefer subscriptions where supported and bounded polling where needed. Subscribe
to active pages rather than polling every catalog entry continuously.
A catalog entry alone does not establish availability.

Use upstream runtime and SDK through the wrapper. Reuse local research through a
deliberate shared implementation if appropriate; avoid copying upstream source or
creating another full copy of Lab inside this app.

### Saved data and downloads

`data/settings.json` stores presentation preferences. Previously saved snapshots
remain untouched, but the simplified interface has no snapshot action.
Continuous recording is outside the current scope. `download live_data_viewer`
can copy stored app data; downloading does not request samples or expose unsaved
live values.


## Confirmed choices

- Keep both upstream transmission-temperature signals. Also include torque converter temperature and transmission oil pressure where available; confirm actual sensor identities.
- Use US units and compact dashboard rounding.
- Show minimum / maximum and recent graphs for all suitable numeric readings; the selection can be revised later.
- Treat extrema as app observation-session values until ignition-on/off is validated.
- Leave unsupported readings visible. No normal-use research / raw-data view.
- Keep the dashboard display-only apart from Previous page, Next page and Settings.
- Defer work on additional engine-health interfaces.

## Instrument colors

Colors are visual reference bands, not calibrated vehicle limits or diagnosis.
They apply only to validated physical values with the expected units; current
unconfirmed sources do not activate them. Missing is dim; retained/stale/error
is amber and labeled `LAST VALID` or `HELD`.

- Battery voltage: below 12 V or above 15 V red; 12–12.4 V and above 14.8–15 V
  amber; 12.4–14.8 V green. Segments represent the 10–15 V span, not state of charge.
- Tire pressure: compare fresh actual against a fresh target in matching units.
  Below 80% or above 125% of target is red; below 90% or above 115% amber.
  Without a valid target there is no inferred placard-pressure warning.
- G-meter: both axes need validated g units. The dot is limited to the outer 1 g
  circle; numeric values remain unclamped. Combined magnitude of 0.8 g or more
  changes the live dot to red. A missing axis suppresses the dot.
- Engine oil: cold below 158 °F, amber from 248 °F, red from 266 °F.
  Coolant: cold below 140 °F, amber from 221 °F, red from 233.6 °F.
- Transmission/converter: cold below 122 °F, amber from 230 °F, red from 248 °F.
  Intake/charge air: amber from 122 °F, red from 149 °F.
  Equivalent Celsius values are supported without treating raw codes as degrees.
- Cylinder comparison colors identify channels, not diagnostic severity. An
  outline means the row's largest observed positive peak; amber means retained
  data. There is no invented acceptable correction, knock or misfire allowance.

## Meter bounds and visual extrema

Default US display ranges, **not engine/tune limits**:

| Meter | Initial range |
| --- | --- |
| Boost | 0–40 psi |
| Crank power | 0–1,000 hp |
| Crank torque | −200–1,000 lb-ft |
| RPM strip | 0–7,000 RPM |
| Speed ruler | 0–180 mph |
| Transmission pressure | 0–150 psi |

Power leaves display headroom above the owner's reported 800–850 crank hp in
[`BMW_M850I_LIMITS.md`](../../BMW_M850I_LIMITS.md). No stock or tuned torque peak
is inferred. Dials support their explicitly identified hp/kW/PS, psi/bar/kPa and
lb-ft/Nm source units; an unrecognized/missing physical unit cannot fill a dial.
Every measured overflow, including session extrema and negative torque, extends
the relevant scale in labeled steps with headroom rather than clipping the value.
The display range is not a redline, limiter, boost target or safe operating band.

A dot marks observation minimum, a diamond marks maximum, the thin inner dial
arc spans their range, and the filled outer arc follows current value. Linear
instruments use the same min/max range with a separate current tick. Fuel fields
use an observation-range ruler, not a guessed tank capacity; left/right are never
summed into the independently reported total. Battery segments remain a 10–15 V
voltage reference, not a state-of-charge estimate.

Plots keep session extrema visible using color-keyed `OBS` brackets at the right.
There are no focus-dependent dashed guides; instruments are not selectable.
Hollow circles identify actual samples at min/max inside the rolling window.
An empty window can retain session brackets, explicitly labeled as older
observations, without inventing a current or historical trace.

## Cylinder data availability

The requested physical scope is C1-C8 on the dual-DME V8. The local catalog and
saved vehicle evidence do not establish live per-cylinder timing-correction,
knock or misfire mappings. Upstream PID `0E` / DID `F40E` is timing **advance**
for cylinder 1, not correction. Its misfire monitor probing uses one configured
ECU and can fall back from the requested TID `0C`; that does not prove both-bank
coverage, physical cylinder numbering or counter period.

All 24 requested cylinder channels therefore remain individually unavailable
until those prerequisites are established. No speculative ECU/DID requests are
issued. The definitions retain the specific missing-source explanations.

Timing peak is `max(abs(session min), abs(session max))`, not the largest signed
number; current values retain their sign. Knock remains a quantity with unknown
units, not an invented event counter. Misfire peak is the largest observed
counter reading since app start, not a summed total or a claim about
this ECU driving cycle. Row scales use 15% headroom above observed peaks, with
no tuner-safe band. Missing and true zero remain distinct. Restarting the app
begins a new observation session; changing pages does not reset held peaks.

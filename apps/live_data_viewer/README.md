# Live Data Viewer

## Goal

Provide an organized viewer for all useful data accessible on the M850i, including
temperatures, driver inputs, drivetrain state, tire data and engine-health signals.

"All possible data" means accessible signals organized into the category pages. It does
not mean all ECU diagnostics are available through the existing head-unit interfaces.
Unavailable fields should remain identifiable without invented values.

## Pages, screens and navigation

This is the proposed layout. This folder currently contains only this README;
the screens and their data sources still need implementation.

### How to move around

The app opens on the **page menu**, where you choose Temperatures, Driving and
drivetrain, Engine health or Settings. Tires / TPMS is a section within Driving
and drivetrain. Category pages group readings by topic; Signal details opens one
selected reading.

```text
Page menu (opens when the app starts)
  Temperatures
  Driving and drivetrain
    Tires / TPMS section
  Engine health
  Settings

Select a reading on any data page -> Signal details
Back from Signal details -> the page and reading you came from
```

Use the iDrive controller to move focus and select pages, readings and actions.
Back from a main page returns to the page menu. Preserve the selected row when
returning from details. Touch and swipe interactions remain optional until the
relevant events and screen behavior are understood.

Every data page shows a friendly name, value, unit and availability state for each
reading. All suitable numeric readings show trip minimum / maximum and recent graphs. Missing
values remain labeled as waiting, stale, invalid, unavailable or error; never
substitute zero. The exact state rules are in Implementation details below.

Every data item below is a requirement or research target, not a promise that the
head unit exposes it.

### Temperatures: compare thermal readings

**Layout and data:** a list of temperatures with US units and trip
minimum / maximum beside each reading. Select any row to open Signal details and its recent graph.

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

Show trip minimum / maximum and recent graphs for all suitable validated numeric readings. Keep exact
sensor names available in details rather than labeling ambiguous values confidently.

### Driving and drivetrain: inputs and vehicle response

**Layout and data:** driver inputs, motion and drivetrain readings, followed by a
Tires / TPMS section on the same page.
Show current values with units or explicit state labels, plus trip minimum / maximum
and recent graphs for all suitable numeric readings. Select any row to open Signal details.

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

**Layout and data:** within Driving and drivetrain, four labeled wheel groups
when positions are known, showing
pressure, temperature, target pressure and reported state where available. Keep
sensors with unknown positions in a separate labeled list on this page. Select a
reading to open its details, including its sensor identity and source.

**Needed:** TPMS readings, sensor identity and reliable wheel-position information.
A missing field stays unavailable even if other readings from that sensor work.

- Pressure, temperature, target pressure and reported state per identified wheel.
- Sensor serial / ID, where exposed; retain decimal / hexadecimal forms if useful.
- Show whether wheel position is reported, inferred or unknown.
- Do not assume radio slots correspond to fixed wheel positions.
- Treat sensor IDs as IDs; do not call them UUIDs unless their format establishes that.
- Optional details: reception age, sensor status and other meaningful exposed fields.

### Engine health: oil pressure, fuel, ignition, knock and misfire readings

**Layout and data:** readings grouped into oil pressure, fuel system, ignition / knock and
misfires. Use rail, bank or cylinder labels when the source identifies them.
Select any reading to open Signal details.

**Needed:** documented sources and meanings for each measurement or counter.
Clearly distinguish actual and target values. Additional diagnostic interface work is deferred; unsupported readings remain visible.

| Desired value | Research needed |
| --- | --- |
| Oil pressure | Confirm actual pressure source, sensor location, units, scale and validity; distinguish it from a pressure warning / switch state or target pressure |
| High-pressure fuel system | Actual versus target pressure, bank / rail and units |
| Low-pressure fuel system | Actual versus target pressure and units |
| Ignition timing | Actual timing versus correction; per-cylinder identity if available |
| Knock information | Counter, event or timing correction; avoid conflating different meanings |
| Misfires | Per-cylinder / total counters, reset behavior and update interval |
| Other useful values | Add only after documenting source, meaning and quality |

Additional diagnostic interface work is deferred. Keep requested readings visible as
unavailable until suitable sources exist. Do not infer engine condition from missing
data or an undocumented raw counter.

### Signal details: understand one reading

**Layout and data:** one reading at a time, with:

- Friendly name, current decoded value and units.
- Source identity, units and relevant validation notes; no normal-use raw-data / research view.
- Last update age, observed update rate, validity flags and availability state.
- Trip minimum / maximum for all suitable numeric readings.
- Recent graph for all suitable numeric readings, with gaps for missing samples.
- Whether the value is measured, reported or derived, plus unresolved source notes.

**Actions:** manually save a data snapshot of the selected reading. A snapshot is
a saved data file, not a screenshot. Back returns to the originating page and
selected reading. Continuous recording is outside the current scope.

**Needed:** the signal's definition, samples, quality information and bounded
history. Unknown units or scaling remain identified as unknown.

### Settings: choose presentation and data preferences

**Layout and data:** grouped settings for units, decimal precision, date format,
category ordering, trend duration and update-rate preferences. Unsupported signals
remain visible and labeled unavailable. No normal-use raw-data / research view is needed.

**Navigation:** open from the page menu; Back returns to that menu.

**Needed:** saved preferences and ignition state. Reset all extrema together at
ignition-on for each drive / trip, and retain the current drive baseline across app
restarts where supported. Editing presentation settings does not need a live feed.

## Implementation details

### Units, precision and date/time

Use US units throughout: miles, mph, US gallons / MPG, Fahrenheit, feet for altitude
and psi for pressure; USD if currency is displayed. Numeric measurements use three
decimal places. IDs, counters, gear labels and clock fields retain natural formats.
Display date/time as `h:mm:ss AM/PM M-D-YYYY`, for example `3:04:05 PM 2-7-2026`:
12-hour clock, two-digit minutes / seconds and no leading zeros on hour, month or day.
Store timestamps and calculation precision independently of display formatting.

### How the app gets data

The proposed flow is: head-unit service -> subscription or bounded read -> source
decoding and validity checks -> shared current-value state -> visible screens,
trip minimum / maximum, recent graphs and manually saved data snapshots. Screens use the same value
state so a reading has the same meaning everywhere.

Start with existing MGU Lab research and the local SOME/IP signal catalog to
identify candidate interfaces. A catalog match is only a lead: confirm that the
service and field actually work on this M850i, then document units, scaling and
quality before displaying a decoded measurement. Work on additional diagnostic interfaces for engine-health fields is deferred.

### Proposed implementation areas

| Area | Responsibility |
| --- | --- |
| App definition and entry point under `apps/live_data_viewer/` | App metadata, startup and lifecycle; files still need to be created |
| Screens and navigation | Page menu, category lists with TPMS under Driving and drivetrain, details and settings |
| Signal definitions | Friendly names, categories, exact source mappings, units, decoding and validity rules |
| Data access and shared state | Subscriptions, bounded polling, timestamps, availability and reconnect handling |
| Trip history in memory | Minimum / maximum and bounded recent-graph buffers, reset at ignition-on |
| Preferences and snapshots | US units, precision, date/time format, category ordering and manually saved data snapshots |
| Wrapper integration | App routing and packaging support through the existing wrapper |

These are responsibility areas, not a fixed file structure. This documentation-only
folder is not an installable app; routing and packaging support still need adding.

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
- Reset extrema across all readings at ignition-on, once per drive / trip. Changing pages does not reset them.
- Show when a value has no valid samples yet. Extrema cover observed valid samples only; identify gaps and periods when a source was not collected.
- Exclude invalid sentinels and documented source errors.
- Use bounded in-memory trend buffers and show gaps during missing data.
- Keep display smoothing separate from samples used for extrema and saved snapshots.
- Follow ignition state rather than app restarts; retain the current drive baseline if the app restarts during that drive where lifecycle support permits.

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
to active pages and explicitly requested snapshots rather than polling every
catalog entry continuously. A catalog entry alone does not establish availability.

Use upstream runtime and SDK through the wrapper. Reuse local research through a
deliberate shared implementation if appropriate; avoid copying upstream source or
creating another full copy of Lab inside this app.

### Proposed saved data and downloads

- `data/settings.json`: US units, three-decimal precision, date/time format and category ordering.
- `data/signal-definitions.json`: versioned local labels / validated definitions, if needed.
- `data/snapshots/<snapshot-id>.json`: selected readings, timestamps, raw values and quality.

Continuous data recording is outside the current scope.

These files are proposals. Ordinary viewing need not write every live update to disk.
A snapshot should preserve each reading's age; it is not necessarily a simultaneous
measurement across all services. Save snapshots only on an explicit user action;
no screenshots or continuous recording are required.

Once implemented and installed, `download live_data_viewer` can copy saved app data.
The download command does not request a new snapshot or expose unsaved live values.

## Confirmed choices

- Keep both upstream transmission-temperature signals. Also include torque converter temperature and transmission oil pressure where available; confirm actual sensor identities.
- Use US units and three-decimal measurement display, with the date/time format specified above.
- Show minimum / maximum and recent graphs for all suitable numeric readings; the selection can be revised later.
- Reset extrema at ignition-on for each drive / trip; ignition-off ends that drive.
- Leave unsupported readings visible. No normal-use research / raw-data view.
- Allow manually saved data snapshots, not screenshots. Continuous recording is outside the current scope.
- Defer work on additional engine-health interfaces.

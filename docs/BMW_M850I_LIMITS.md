# 2019 BMW M850i G15: app limits reference and audit

Reviewed: 2026-10-27 (America/Los_Angeles). Source inspection and public documentation only.

## Vehicle and scope

Owner's configuration: 2019 M850i xDrive Coupe (G15), Stage 2, E50, catless, custom tune; reported **800-850 crank hp** and **700-750 wheel hp**. Owner expects stock rev limiting and shift behavior; neither was confirmed from the calibration. Tuned peak torque is unknown.

**The bundled defaults do not all match this car.** This file records findings; no app settings, app code, vehicle settings, or sibling `../idrive7-apps` files were changed. Only this Markdown file was added.

The wrapper loads four local apps and also packages apps from the sibling checkout, as described in [README.md](README.md) and [cmd/mgu/upstream.go](cmd/mgu/upstream.go). Paths beginning `../idrive7-apps/` below are read-only audit references. Values are source defaults, not a readback of settings saved on the head unit.

Status meanings: **confirmed** = supported factory specification; **owner-reported** = supplied in this conversation; **mismatch** = inappropriate default or scale; **provisional** = useful reference with incomplete evidence; **unconfirmed** = cannot certify for this car/tune.

## Vehicle reference

| Item | Reference | Status / interpretation |
| --- | --- | --- |
| Engine | N63B44T3 / N63TU3, 4,395 cc twin-turbo V8 | Confirmed for this model. |
| Forward gears | **8**, plus P/R/N selector states | Confirmed. Generic protocol entries for gears 9/10 do not imply this car has them. |
| Misfire cylinder coverage | **Cylinders 1-8** | Confirmed cylinder count; diagnostic coverage and cylinder mapping need separate evidence. |
| Engine management | Two DMEs, one per bank | Confirmed architecture. One diagnostic address must not automatically be assumed to cover both banks. |
| Factory crank power | 390 kW / approximately 523 SAE hp / 530 PS, at 5,500-6,000 RPM | Factory baseline only; PS and SAE hp are different units. |
| Factory crank torque | 750 Nm / approximately 553 lb-ft, at 1,800-4,600 RPM | Factory output, not the tuned torque or a proven mechanical safety ceiling. |
| Current crank power | **800-850 hp**, approximately **596.6-633.8 kW** | Owner-reported; assumed mechanical/SAE hp rather than PS. |
| Current wheel power | **700-750 whp**, approximately **522.0-559.3 wheel kW** | Owner-reported; keep separate from crank power. |
| Current peak crank torque | **Unknown** | Do not reuse 750 Nm as a tuned peak. Horsepower alone does not establish peak torque. |
| Stock-intended RPM reference | Approximately **6,500 RPM**, provisional | Firsthand owner observations on a 2019 M850i convertible with the same engine support this reference; exact G15 DME fuel-cut calibration remains unconfirmed. |
| Full-throttle shift point | No single confirmed target for this car | A stock automatic shift schedule and a manual shift-light cue are different settings. The app's default 6,700 RPM cue is not established as stock-correct. |

Factory engine/output/gear-count references: [BMW 2019 US launch specifications](https://www.press.bmwgroup.com/usa/article/detail/T0282198EN_US/the-all-new-2019-bmw-8-series-coupe), [BMW MY19 product guide](https://www.press.bmwgroup.com/canada/article/attachment/T0289546EN/421637). Dual-DME architecture: [BMW N63TU3 training manual, printed p. 39](https://g30.bimmerpost.com/forums/attachment.php?attachmentid=1979747&d=1548603301). The RPM reference comes from [Ken Rockwell's firsthand M850i ownership report, Engine and gauge observations](https://www.kenrockwell.com/bmw/m850.htm); this is observational evidence, not a BMW calibration specification.

## Gears and ratios

Car Vitals uses the following ratios for its fallback xDrive split estimate. The lower gears differ materially from the MY19 M850i specifications.

| Gear | Car Vitals configured ratio | MY19 M850i ratio | Finding |
| --- | ---: | ---: | --- |
| 1 | 5.000 | **5.500** | Mismatch |
| 2 | 3.200 | **3.520** | Mismatch |
| 3 | 2.143 | **2.200** | Mismatch |
| 4 | 1.720 | **1.720** | Match |
| 5 | 1.313 | **1.317** | Small mismatch |
| 6 | 1.000 | **1.000** | Match |
| 7 | 0.823 | **0.823** | Match |
| 8 | 0.640 | **0.640** | Match |

Source: [Car Vitals manifest, config.xdrive.gearRatios](../idrive7-apps/apps/car_vitals/app.json); factory ratios: [BMW MY19 product guide, technical specifications](https://www.press.bmwgroup.com/canada/article/attachment/T0289546EN/421637). [BMW G15 training manual, printed pp. 23-24](https://gershon.ucoz.com/BMW/2018_bmw_8_series_g15_powertrainchassis.pdf) independently distinguishes the new transmission's lower ratios from the predecessor.

The fallback divides transfer-case front torque by engine torque times gear ratio. These mismatches affect that estimate; they do not change the physical transmission or the gear reported by the car. Even corrected ratios would leave an estimate that omits converter multiplication and losses.

Local [Live Data Viewer definitions](apps/live_data_viewer/definitions.js) and [Trip Data sources](apps/trip_data/sources.js) accept the catalog's ninth-gear enum. Upstream [shared Car runtime](../idrive7-apps/kit/runtime/car.js) and Car Vitals accept generic gear enums through 10, and the learned-gear fallback has no eight-gear cap. These are generic decoders, not an M850i gear-count configuration. A reported/inferred 9 or 10 would be anomalous for this car; current code does not enforce that vehicle-specific check.

## RPM, shift cues, and cold-engine advice

| App / setting | Current default or behavior | Assessment |
| --- | --- | --- |
| Redline: redline | **7,000 RPM** | Not confirmed for the stock-intended M850i setup; above the provisional 6,500 RPM reference. |
| Redline: shiftBefore | **300 RPM** | Warm cue = redline minus margin: **6,700 RPM** with defaults. At a provisional 6,500 setting the same margin produces **6,200 RPM**, an early cue rather than a factory shift target. |
| Redline: coldGuard / coldLimit | Enabled / **4,500 RPM** | Generic visual advice. More permissive than Warm-Up's 3,500 RPM default. |
| Redline: warmOil | **80 C / 176 F** | App warm-up threshold; not proof that full load is appropriate for the E50 tune. |
| Warm-Up: redline | **7,000 RPM** | Same unconfirmed default. |
| Warm-Up: coldLimit | **3,500 RPM** | Generic advisory value; not an ECU limit. |
| Warm-Up: warmOil / warmCoolant | **80 C / 176 F** each | App readiness thresholds, not verified BMW/tuner release conditions for full load. |
| Car Vitals: redline | **7,000 RPM** | Gauge warning setting, not read from the DME. |
| Virtual Dyno: maxRpm | **7,500 RPM** | Plot axis only; not a permitted operating speed or shift target. |

Sources: [Redline manifest](../idrive7-apps/apps/redline/app.json), [Redline logic](../idrive7-apps/apps/redline/main.js), [Warm-Up manifest](../idrive7-apps/apps/warmup/app.json), [Warm-Up logic](../idrive7-apps/apps/warmup/main.js), [Car Vitals manifest](../idrive7-apps/apps/car_vitals/app.json), [Dyno manifest](../idrive7-apps/apps/dyno/app.json).

Both cold-advice algorithms interpolate from the cold setting at **30 C / 86 F oil** to their warm setting at 80 C. Redline interpolates to the shift cue; Warm-Up interpolates to redline. They only display advice and do not restrict engine speed or throttle. Missing oil temperature causes Redline to use its normal shift cue, so that cue does not prove the engine is warm.

Redline labels RPM at or above `configured redline - 60` as a limiter event: **6,940 RPM** by default. This counts proximity to a configured number, not confirmed ECU fuel cuts. Its scoring window is target minus 250 to target plus 200 RPM; these are app scoring tolerances.

Use approximately 6,500 RPM only as a provisional stock reference until the car's original calibration or tuner confirms the limiter and intended shift schedule. This audit does not establish a new performance-optimal shift point.

## Temperature warnings currently implemented

**These are UI thresholds, not confirmed BMW protection limits or tuner-approved hot/cold recommendations.** No replacement thermal limits were invented. Sensor identity and scaling must be established before judging any threshold.

| App / reading | Current cold or ready behavior | Current hot behavior |
| --- | --- | --- |
| Car Vitals coolant | Cold below **60 C / 140 F** | Critical zone starts at **112 C / 233.6 F** |
| Car Vitals engine oil | Cold tint below **70 C / 158 F** | Configurable warning defaults to **125 C / 257 F**; choices 110-135 C |
| Car Vitals gearbox / EGS oil | Cold below **50 C / 122 F** | Warning starts at **120 C / 248 F** |
| Car Vitals outside air | Cold below **3 C / 37.4 F** | No vehicle-specific hot limit |
| Car Vitals IAT | No cold readiness threshold | Warning **50-65 C / 122-149 F**; critical from **65 C / 149 F** |
| Car Vitals IAT above outside | No cold readiness threshold | Warning rise **25-40 C / 45-72 F**; critical rise from **40 C / 72 F** |
| Redline engine oil | Blue below **60 C / 140 F**; cold indication below configured warmOil (80 C default) | Critical color above **130 C / 266 F** |
| Warm-Up oil and coolant bars | Separate readiness targets, both **80 C / 176 F** by default | Both bars use 120 C / 248 F ramp threshold, 120-135 C warning zone, and 135 C / 275 F critical-zone start |
| Warm-Up status message | READY based on oil reaching warmOil | OIL HOT above **125 C / 257 F** |

Source: [Car Vitals thermal/fuel rendering](../idrive7-apps/apps/car_vitals/main.js), [Redline rendering](../idrive7-apps/apps/redline/main.js), [Warm-Up rendering](../idrive7-apps/apps/warmup/main.js).

The apps disagree: oil can be hot in Warm-Up while Redline still uses its ordinary warm color, and coolant's critical coloring differs between Car Vitals and Warm-Up. These differences cannot be described as a consistent M850i thermal profile. BMW describes map-controlled cooling and separate engine/charge-air circuits; a universal temperature color alone does not establish a fault or permission for full load. [BMW N63TU3 training manual, cooling comparison and chapter 5](https://g30.bimmerpost.com/forums/attachment.php?attachmentid=1979747&d=1548603301)

Warm-Up's turbo cooldown is also a heuristic: hard use means **RPM >3,800 OR power >90 kW**; gentle means **RPM <2,800 AND power <40 kW**. After over eight seconds accumulated hard use it requests `clamp(30 + hardSeconds * 3, 30, 180)` seconds. It does not measure turbo temperature. Its initial warm-up rates are oil 4 C/min driving or 1.5 idling, coolant 7 or 3 C/min; these are assumed estimates, not M850i measurements.

The existing [MGU Lab findings](apps/mgu_lab/FINDINGS.md) explicitly leave thermal scaling unconfirmed. [MGU Lab](apps/mgu_lab/lab.js) applies raw-minus-48 C for engine temperatures, but that is a conversion assumption rather than a safety threshold. The local viewer deliberately withholds unconfirmed physical readings.

## Power, torque, boost, and fuel

| Item | Current implementation | Assessment for this build |
| --- | --- | --- |
| Car Vitals maxPower | **215 kW**, approximately **288 hp** default | Clear mismatch with both factory and reported tuned output. |
| Highest selectable maxPower | **600 kW**, approximately **805 hp** | Covers about the lower end of the reported crank range; does not cover **850 hp / 633.8 kW**. A future gauge range around 650 kW would provide room, but percentage calibration remains separate. |
| Sport-display power calculation | `sportPercent / 100 * maxPower` | The car's actual 100% reference must be established. Entering a dyno peak does not prove the percentage signal uses that reference. |
| Torque bar | Fixed **900 Nm**, approximately **664 lb-ft**, passed to a rounded display scale | Generic display range; tuned peak unknown. Not a torque limiter or gearbox rating. |
| Torque wire decoding | `raw * 0.5 - 1023.5 Nm`; raw >=4095 invalid | Maximum accepted integer raw 4094 gives **1,023.5 Nm**. This signal may be insufficient if actual torque exceeds its representation; changing the scale without evidence would misdecode it. |
| Calculated power fallback | `torque Nm * RPM / 9549` kW | ECU-reported torque estimate, not measured wheel/dyno power; tune reporting and signal saturation can distort it. |
| Boost bar | **2.5 bar** in bar mode or **36 psi** in psi mode; warning at 85% | Generic range; warnings at **2.125 bar** or **30.6 psi**. Not a tune-specific boost limit. |
| Fuel warnings, engine >500 RPM | HPFP critical below **20 bar**; LPFP critical below **3 bar**, warning 3-4 bar | Too little information to certify E50 fuel delivery. There is no actual-versus-target pressure check here. |
| Fuel plausibility filters | HPFP candidates accept **0-500 bar**; LPFP candidates use 0.5-8 or 0.5-15 bar | Decoder acceptance ranges, not recommended operating ranges. |

Sources: [Car Vitals manifest/configuration](../idrive7-apps/apps/car_vitals/app.json), [Car Vitals calculations/rendering](../idrive7-apps/apps/car_vitals/main.js), [shared Car scaling](../idrive7-apps/kit/runtime/car.js). The local [Live Data Viewer](apps/live_data_viewer/definitions.js) keeps torque/power unavailable pending validated inputs.

Torque cannot safely be assumed stock from the horsepower report. For illustration, **800-850 crank hp at 6,000 RPM implies approximately 949-1,009 Nm at that RPM**, using `Nm = hp * 7120.9 / RPM`. This is a conditional calculation, not a measurement of peak torque. A future display ceiling needs the actual tuned curve and headroom.

BMW's stock N63TU3 training information describes **350 bar high-pressure injection**, a **5.9 bar low-pressure feed**, and removal of the low-pressure sensor. Those hardware descriptions do not validate the generic LPFP PID or a custom E50 target. Both bank readings and actual-versus-commanded behavior remain unconfirmed. [BMW N63TU3 training manual, printed pp. 34-35](https://g30.bimmerpost.com/forums/attachment.php?attachmentid=1979747&d=1548603301)

Boost from diagnostics subtracts barometric pressure from absolute pressure. Car Vitals falls back to **101.3 kPa** barometric pressure; its 8-bit MAP candidate accepts at most **255 kPa absolute**, about 1.54 bar / 22.3 psi gauge at that fallback atmosphere. A higher-range candidate exists but support is unconfirmed. The FES boost scale is separately labeled a guess in the manifest. None establishes a safe Stage 2 boost ceiling.

E50 and catless hardware are recorded as owner configuration. No ethanol-content measurement, E50 tolerance window, lambda target, ignition-correction limit, oil-pressure threshold, or catless-specific health rule was found in these gauges. These values remain unknown rather than borrowed from a different engine or tune.

## Misfires and bank coverage

The correct physical scope is **eight cylinders**. Car Vitals' live implementation is **not hardcoded to six**: it queries one configured ECU (default **18 decimal / 0x12**), discovers contiguous monitors from MID A2, and can iterate up to **12**. Its synthetic demo contains six counts; that does not set the live cylinder count.

Important limitations in [Car Vitals main.js](../idrive7-apps/apps/car_vitals/main.js):

- It does not explicitly query and merge both DMEs. Eight-cylinder coverage and cylinder numbering on this dual-DME car remain unconfirmed.
- Requested TID is **0x0C**, intended as this driving cycle. If absent, the code uses the first returned result while retaining the "this drive" label; the counter period is therefore not guaranteed.
- Raw count >=65535 becomes missing. The displayed total nevertheless adds missing entries as zero, so a green zero can represent incomplete counts.
- Zero totals are green, **1-19** amber, and **20 or more** red; any positive cylinder count is highlighted. These are generic presentation cutoffs, not established BMW diagnostic thresholds or acceptable misfire allowances.

The local [Live Data Viewer definitions](apps/live_data_viewer/definitions.js) have an unavailable misfire row rather than a working eight-cylinder monitor. Neither local app evidence nor this source review confirms a functioning all-cylinder misfire display.

## Dyno, tires, and other apps

- **Virtual Dyno:** default mass **1,750 kg** is below BMW's published stock coupe curb reference of **2,031 kg / 4,478 lb**, even before adding the driver. Use actual running mass rather than treating curb weight as driver-plus-fuel mass. Default drivetrain loss **15%** is an assumption; the output is an estimated crank figure. Default coupe CdA **0.62 m2** is generic; BMW's MY19 coupe guide lists **0.69 m2**. Power/torque axes otherwise grow with the data rather than imposing stock output ceilings. Sources: [Dyno manifest](../idrive7-apps/apps/dyno/app.json), [Dyno implementation](../idrive7-apps/apps/dyno/main.js), [BMW MY19 product guide](https://www.press.bmwgroup.com/canada/article/attachment/T0289546EN/421637).
- **Car Vitals tires:** temperature colors are cold <20 C / 68 F, warning >90 C / 194 F, critical >105 C / 221 F. Pressure colors use actual/target ratio: critical <85%, warning <93% or >115%. These are generic UI rules. Follow the installed tire/load-specific placard or validated vehicle targets; no fixed PSI recommendation was established here. Its pressure plausibility range 0.5-6 bar and temperature range -40 to 150 C are decoder filters, not safe operating limits.
- **Trip Data:** accepts generic gear enums through nine; its shift-count regex also accepts 1-9. No redline, tuned-power ceiling, or thermal readiness thresholds. Speed bands [15,30,45,60,80] mph are reporting buckets, not driving recommendations. RPM/speed conversions remain unavailable pending vehicle evidence.
- **Live Data Viewer:** no configured redline, hot/cold bands, tuned power scale, or per-cylinder misfire limit. Rejects invalid raw values and leaves unconfirmed physical readings unavailable.
- **MGU Lab:** experimental RPM/temperature conversions, no M850i-specific warning profile. Refer to its findings before relying on readings.
- **Ambient Lighting:** no relevant engine/drivetrain limits.
- **G-Force:** default 1.5 g circle is a display scale, not a grip/safety limit.
- **Draggy / Brake Test:** timing intervals and event triggers are measurement definitions, not M850i engine specifications.
- **DTC Scanner / Service:** diagnostic/service tooling, not a configurable engine-limit profile.
- **eDrive:** high-voltage EV/PHEV battery model; its 12 kWh default and battery thresholds do not describe this gasoline M850i.
- **Doom:** no relevant vehicle limits.
- **Demo data:** upstream shared simulator uses six generic gear ratios and its own RPM/mass/power values; Car Vitals demo has six misfire entries. Neither demo represents this vehicle.

## Items still needing vehicle/tuner evidence

1. Exact stock-intended DME rev cut and relevant EGS full-throttle shift schedule; 6,500 RPM remains provisional.
2. Tuned peak crank torque, power curve, sport-display percentage reference, and whether broadcast torque is rescaled or saturated.
3. Confirmed oil/coolant/transmission/IAT sensor meanings, physical conversions, normal behavior, and tuner-approved thermal warning/readiness values.
4. Both-bank fuel pressure targets/measurements, lambda and ignition correction criteria for this E50 calibration.
5. Eight-cylinder misfire coverage, physical-cylinder mapping, and counter period from the relevant DME responses.
6. Actual running mass and any hardware changes affecting the stock reference.

No app changes were made to resolve these findings. No runtime or on-car validation was performed. **Tests, linters, formatters, builds, compilation, type checks, and static-analysis tools were not run; project code was not executed.** Existing user changes, including `ideas.md`, were left untouched.

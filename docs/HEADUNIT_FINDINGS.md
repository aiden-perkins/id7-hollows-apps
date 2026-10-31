# MGU headunit findings and cluster/HUD assessment

Inspected: 2026-10-29. Read-only, offline investigation of the downloaded headunit, selected local upstream source, and public repository material. This consolidates the earlier headunit findings and the subsequent focused cluster/HUD inspection.

## Conclusions

- The most approachable customization surfaces are installed OAP JavaScript applications, Smart Interior scene configuration, native HMI Lua/resources, and navigation/projection configuration.
- **[INFERENCE] Custom cluster/HUD content looks technically plausible, but the inspected renderer does not make the high instrument cluster simply another selectable local screen.** A remote-rendering integration is the more relevant lead for this captured variant.
- The snapshot has `high_4_1` and `high_4_1_with_hud` markers. The factory video-grabber units require `basis_4_5` and `basis_4_5_with_hud` instead. Their presence is not proof that their output reaches this car's cluster/HUD.
- The current sibling upstream checkout already incorporates Robert Nisipeanu/IterioDev's `mgu-render`. The remaining question is cluster backend support, not merely whether to merge two MGU-screen renderers.
- **[INFERENCE] Editing headunit-originated cluster content should be investigated before replacing cluster firmware.** It offers a narrower change boundary, but is not demonstrated safe or functional here.
- Headunit filesystem access does not establish arbitrary coding, flashing, or execution rights on other ECUs. E-Sys recovery is not guaranteed after every failure.

### Evidence labels

- **Observed:** present in the inspected file, source implementation, archive listing, schema, or tool output.
- **Reported:** an external author's claim, not independently exercised here.
- **[INFERENCE]:** feasibility, difficulty, architectural interpretation, or recommended investigation order—not demonstrated runtime behavior.

No vehicle connection, diagnostic request, application execution, flashing, tests, builds, linters, formatters, or type checks were performed. `ideas.md` was not read or modified. The only new files from this investigation are this requested report and the previously exported REA evidence JSON.

## Source locations and scope

Abbreviations used below:

- `D/` = `out/downloads/head-unit-5e14f35a4092/files/`.
- `U/` = sibling checkout `../idrive7-apps/`.
- `P/` = `C:/Data/psdzdata/mainseries/S18A/S18A_25_03_571_V_004_000_001/odx/src/odx-d/`.
- Vehicle paths use their original names. On-disk downloaded names encode uppercase characters literally, for example `%4715.zip` corresponds to `G15.zip`.

The download manifest records `30,932,945,499` bytes and `110,964` files for the run, with one error. The recorded error concerns the changing transient custom file `/run/mgu-renderd/inputgate`, not a demonstrated missing factory image. `/proc`, `/sys`, `/dev`, and related virtual filesystems were excluded; `D/boot/` was empty. This is not a flash image of every processor or other ECU.

Platform identity:

| Fact | Observed value | Evidence |
|---|---|---|
| OS identity | BMW MGU, `O18_22w40.3-1-9` | `D/usr/lib/os-release:1-5` |
| Application image | `mgu-high`, `image-high-appl` | Same file |
| Runtime variant | `MGUVAR=high`, `HWGEN=18`, `HWREV=D1` | `D/run/etc/variant.env:1-3` |
| HMI native format | ELF64, x86-64; `166,659,784` bytes | REA ELF-note inspection of `D/usr/bin/%48mi%4Dain3%44` |
| Instrument-cluster marker | `high_4_1` | Complete listing of `D/run/variant/kombi/` |
| HUD marker | `high_4_1_with_hud` | Complete listing of `D/run/variant/kombi_hud/` |
| Hardware marker | `high` | Complete listing of `D/run/variant/hwvariant/` |

The dump includes user-installed custom applications/services. Their presence does not establish that inspected factory-named HMI resources were modified. SWE manifests were used as packaged inventory associations, not proof of authenticity or current enforcement. Raw-file/manifest hash semantics were not established; differences must not be treated as evidence of tampering or a bypass.

## 1. Focused cluster/HUD inspection

### 1.1 What upstream issue #17 establishes

Primary reference: [idrive7-apps issue #17](https://github.com/cauliflowermossgrape/idrive7-apps/issues/17).

The issue author reports robertni's separate-GPU cluster/HUD rendering, good 2D/3D performance, and full-cluster overlays. The maintainer explicitly says they have not investigated it and qualifies the separate-screen suggestion with “I believe.” Closing the issue is not implementation evidence.

The original Bimmerpost demonstration was not independently located or reproduced in this pass. Treat the detailed performance/full-overlay description as a report relayed by the issue author, not a measured result on this car.

Public material inspected:

- [mgu-store](https://github.com/robertnisipeanu/mgu-store).
- [Public renderer README pinned to inspected commit](https://github.com/robertnisipeanu/mgu-store/blob/5017aa96bd3c0864bd9733f6579d7ef4178a0298/native/mgu-render/README.md).
- [Repository tree at that commit](https://api.github.com/repos/robertnisipeanu/mgu-store/git/trees/5017aa96bd3c0864bd9733f6579d7ef4178a0298?recursive=1).

The public renderer README describes MGU-local `layer` and `embed` placements. It does not establish the cluster backend described in the issue. The store README also states that iDrive 8 store support was tested in an emulator only, not yet a real car; store compatibility is not cluster compatibility.

### 1.2 The renderer is already integrated, but its inspected targets are local

`U/README.md:859-865` identifies `kit/renderd` as Robert Nisipeanu and IterioDev's `mgu-render`, with GPL-3.0-or-later renderer licensing and retained MIT portions. This is newer integration context than the issue's original question implies. Reuse/distribution of native changes must account for the renderer's license; the project's application/socket separation is documented there.

Observed output modes:

| Mode | Target | Relevant source |
|---|---|---|
| `layer` | A local IVI layer on Winston, normally `wayland-0` | `U/kit/renderd/src/main.c:1-14,423-465` |
| `embed` | An app-page surface sampled by `HmiMain3D`'s embedded compositor, normally `wayland-1` | `U/kit/renderd/mgu-render.conf:30-42`; `U/kit/renderd/src/embed.h:1-14` |

`screen_id` selects among screens advertised by the connected local IVI compositor. It is not a vehicle-wide display address. In `centre_screen()`, an unmatched nonzero ID falls back to the lowest advertised screen ID—the centre-display assumption—instead of failing closed. A guessed ID therefore is not a reliable way to establish cluster targeting.

`surface_create()` creates a Wayland surface/EGL window and attaches its layer with `ivi_controller_screen_add_layer()`. `wl_display_connect()` connects to the configured local Wayland display. Embed mode separately uses a page template and IVI surface `0x500`; `screen_id` is not a generic remote-cluster switch for that mode.

Evidence: `U/kit/renderd/src/main.c:423-465,1482-1486`; `U/kit/renderd/mgu-render.conf:19-42`.

**[INFERENCE] Reusable pieces include app drawing APIs, layout logic, command generation, and potentially portions of rendering code. The delivery, scene lifecycle, visibility/focus policy, and remote display ownership need their own integration.** The existing foreground gate is centre-app-oriented; copying it unchanged could tie cluster visibility to the centre display's active app.

### 1.3 Two different cluster-related paths must not be conflated

#### A. MGU-rendered virtual screens and video transport

`D/lib/systemd/system/winston.service:12-17` defines local `ic1`, `ic2`, `hud1`, and `hud2` null outputs. Default IC/HUD virtual dimensions are `360 x 208`; these declarations are not evidence of full-panel cluster resolution or complete gauge ownership.

The grabber units encode those screens as H.264 over RTP/AVB, but are conditional:

| Unit | Required marker | Named output | AVB stream role |
|---|---|---|---|
| `virtual-ic1.service` | `kombi/basis_4_5` | `ic1` | `.12` |
| `virtual-ic2.service` | `kombi/basis_4_5` | `ic2` | `.14` |
| `virtual-hud1.service` | `kombi_hud/basis_4_5_with_hud` | `hud1` | `.11` |
| `virtual-hud2.service` | `kombi_hud/basis_4_5_with_hud` | `hud2` | `.13` |

All also exclude the `hwvariant/ncap` marker and specify a 30 FPS grabber cap. Evidence: the corresponding files under `D/lib/systemd/system/`, particularly lines 3-4 and 12.

**Correction to the earlier broad overview:** these services prove a supported configuration exists, not that this captured `high_4_1` vehicle is using it. Under the captured marker set, the configured conditions do not select these units. No live service-state observation was made. Do not create misleading variant markers or force the units merely to bypass their conditions.

#### B. Remote scene/resource interfaces

The downloaded interface catalogue declares `de.bmw.infotainment.ramsesservice.RamsesService` with:

- `participantInfo`, `keepAlive`.
- `sceneAvailabilityChange`, `sceneSubscriptionChange`.
- `requestResources`, `resourceTransfer`, `resourcesNotAvailable`.
- `sceneActions`, `rendererEvent`.

Its instance mapping explicitly names `IC_HMI`, `HU_HMI`, navigation participants, and test participants. This is substantially more relevant to the separate-renderer report than a local screen ID alone.

There is also a dedicated process:

`HmiDisplayClusterScenes -ro=/mnt/dataro/data/hmi -nfsrw=/mnt/share/hmi`

It runs as `hmi_5000`, with coding and SOME/IP dependencies. Evidence: `D/lib/systemd/system/hmi-dcrs.service:1-16`.

**[INFERENCE] These declarations are consistent with distributed scene/resource rendering.** They do not prove the exact production route on this vehicle, the cluster's OS/GPU model, accepted scene identifiers, or permission to publish arbitrary custom scenes. `sceneActions` and resource payloads include opaque byte arrays, so a list of method names is not a complete scene serializer.

### 1.4 Cluster-specific assets include signature sidecars

A particularly concrete discovery:

`D/mnt/dataro/dataro1/hmi/common/kombi_model/%4715/%54rim%41.zip`

Archive members:

- `Vehicle.ramres`
- `Vehicle.ramres.signature`
- `Vehicle.ramscene`
- `Vehicle.ramscene.signature`

Other G15 archives are named `TrimB`, `TrimE`, and `TrimF`.

**[INFERENCE] These are a promising source of cluster-side model/scene structure, but not an established easy-edit path.** Signature sidecars are an explicit acceptance-boundary lead; their presence alone does not establish where or whether signatures are enforced. Do not assume that editing a file and retaining its old sidecar will work, or that deleting the sidecar is a valid fallback.

### 1.5 RIC is a resource/model API, not an unrestricted framebuffer

The same catalogue declares:

- `remoteinstrumentcluster.RICService2018`: `ric_create`, `ric_initialize`, `ric_checkResource`, `ric_setResource`, `ric_setPadData`, `ric_setPadCtrl`, and disposal methods.
- Resource types including SVG/bitmap images, text, image/text databases, and AVB streams.
- Model types for navigation maneuvers, media, lists, notifications, and other structured UI content.
- Error codes including `E_RESOURCE_PROHIBITED`, `E_META_INFO_MISMATCH`, `E_OBJECTTYPE_NOT_SUPPORTED`, and `E_INVALID_HANDLE`.
- `DisplaySink`: a `requestSinkSwitch` event carrying aspect ratio/resolution/display selection, and `sinkSwitchCompleted`.

A method named `requestSinkSwitch` must not be described as an arbitrary client command: the declaration is an event. The HMI user's captured SOME/IP policy includes a request allowance for RIC service `0xb068`; that is not permission for every service, resource, or scene.

Evidence: `D/etc/oap/someip/someip-interfaces.json`, exact `interfaces`, `datatypes`, and `instanceIDs` entries above; `D/etc/vsomeip/5000_5000/vsomeip_security.json`.

### 1.6 Relative difficulty and sensible boundary

The following are **[INFERENCE]**, not measured implementation estimates:

| Goal | Assessment | Main obstacle |
|---|---|---|
| Change existing headunit-authored model/layout content | Moderate to high; best initial offline lead | Resource loading, format/schema, acceptance, ownership |
| Add custom content through RIC/Ramses on the high cluster | Medium-high to high; not a configuration-only change | Serialization, lifecycle, scene/resource policy, remote receiver |
| Reuse local video surfaces on a matching basis-cluster configuration | Potentially narrower, but not established for this snapshot | Actual variant, routing, active stream, viewport |
| Replace the high cluster's whole UI or safety-critical gauges | Very high; not demonstrated by this dump | Separate firmware/runtime, protected layers, warning behavior, recovery |

**Decision:** coordinate on the cluster transport/scene entry point and supported hardware variant. Keep a reusable app/drawing frontend where practical, but treat the target-specific rendering backend as distinct until proven compatible. A separate GPU does not force a separate app ecosystem; it does prevent assuming local buffer handles and local IVI screen IDs automatically cross the vehicle network.

No basis was established for claiming ownership of stock speed, warning/telltale, or HUD safety layers. A full-panel overlay report is not proof that removing/replacing those layers is safe.

### 1.7 Recovery is conditional, not “always E-Sys”

**[INFERENCE] E-Sys/ISTA may recover compatible software when the ECU's bootloader, diagnostic communication, power, and accepted programming path remain available.** A headunit root filesystem dump is not a complete cluster recovery image. File-level corruption, an HMI crash, an unbootable application image, and a damaged/unreachable bootloader are different failure classes.

The laptop has separate `DKOMBI2` through `DKOMBI8` ODX definitions in `P/`. Their presence does not identify the currently fitted cluster or establish the correct target payload. Controller identification and compatible software mapping must precede any programming decision. No recovery was attempted or demonstrated.

Useful unanswered questions for Robert's work: exact cluster/HUD variant, whether the implementation is an MGU-hosted Ramses publisher or cluster-resident process, serialization/API entry point, accepted scene/layer IDs, required credentials, and preservation of stock warnings. The public store/renderer material inspected does not answer all of these.

## 2. General headunit architecture

The captured application side is x86-64 Linux with systemd and many separate service users—not a single monolithic application. `HmiMain3D` handles the native resource-driven HMI; OAP Node.js applications use the app/RHMI platform; navigation, media/audio, phone/projection, and vehicle communication have separate services.

SOME/IP/CommonAPI and Joynr provide distinct IPC/service layers. `SignalGateway` and AUTOSAR-on-Linux are vehicle-facing components. `CodingShmApp` supplies shared coding data and has a keystore dependency. The IOC lifecycle proxy communicates through an HDLC/serial service; its configuration names `/dev/ttyS0` and a 1.5 Mbps link. This does not reveal all IOC firmware internals.

Evidence: `D/lib/systemd/system/{hmi,signalgateway,autosaronlinux,codingshm,ioclcproxy,hdlc_ipc4}.service`; `D/etc/ipc4_b1.cfg`; `D/etc/joynr/`.

### Filesystem roles

| Original path | Role and caveat |
|---|---|
| `/usr/bin`, `/usr/lib` | Programs, native libraries/addons, OAP platform |
| `/mnt/dataro` | Bulk HMI/navigation/media resources; read-only mount declaration |
| `/var/opt` | Installed applications and persistent application data |
| `/var/sys` | System data, including display configuration; read-only mount declaration |
| `/run`, `/tmp` | Generated configuration and transient state; not demonstrated durable overrides |
| `/mnt/iba` | Onboard-manual resource mount area |

`D/etc/fstab:3-16` declares the root read-only, `/mnt/dataro` read-only, `/var/opt` without `ro`, and `/var/sys` read-only. Mount declarations describe configuration, not a live mount-state observation.

A whole-tree extension census found particularly large `.cml`/`.mml` resource populations:

| Extension | Captured file count |
|---|---:|
| `.cml` | 49,376 |
| `.mml` | 13,568 |
| `.json` | 5,109 |
| `.pbw` | 2,429 |
| `.res` | 2,204 |
| `.spb` | 1,714 |
| `.xar` | 1,290 |
| `.js` | 437 |

These are filename-extension counts, not decoded-format coverage or a count of independently modifiable applications.

## 3. Application modifiability and trust boundaries

### 3.1 Installed source and cached bytecode

The installed OAP layer includes readable JavaScript, JSON configuration, RHMI resources, manifests, and generated SOME/IP interfaces. Bundling/minification complicates reading but does not make all application logic opaque native code.

The inspected runner reads JavaScript plus optional V8 cached data, regenerates rejected cache, and contains source-only fallbacks. It provides `require` and `process` to its VM context. The cache is not source encryption; the VM context is not proof of root authority.

Evidence: `D/var/opt/public/oap/oap_12217/source/javascript/runner.js:127-203,283-346`.

### 3.2 Package verification and per-app permissions

The normal package verification implementation handles CMS/PKCS#7, requires RSA-PSS, checks a signer certificate and certificate chain, and compares a package hash to the authenticated digest. Configuration declares `.sig` files and `ignoreSignatureFailure: false`.

The platform lists native addons for coding, personalization, logging, ECU access, certificate management, and SOME/IP. It also defines app identity ranges, quotas, access groups, and privileged helper allowlists. A readable API binding is not proof that every app may invoke every operation.

Evidence:

- `D/usr/lib/oap-mainapp/src/%41pp%4Danagement/%41pp%4Danagement.js:3332` (`SignatureChecker`).
- `D/usr/lib/oap-mainapp/config/base.json:326-358,387-426`.
- `D/etc/uidrun.conf:16-46` and subsequent identity/helper entries.
- `D/etc/vsomeip/vsomeip_security.json:1-21`: credential checking is configured.

**[INFERENCE] JavaScript/configuration changes are generally more approachable than native executable changes, given suitable existing filesystem access. Stock package installation, persistence, and vehicle-service authority remain separate problems.** Do not interpret a configured development-CA name as possession of a signing private key.

## 4. Interesting customization surfaces

### 4.1 Smart Interior scenes and triggers

Installed `smartinterior` version `6.3.11` has a configuration-driven scene framework. `general.json` selects `scenes_V6.3.4`; `CC_Relax_Full` combines steering-wheel heating, climate, seats, shading, scent, ambient lighting, and media.

The feature registry includes climate, seat heating/ventilation/massage, ambient light, shading, scent, media, and steering-wheel heating. The trigger registry includes timers, speech intents, navigation ETA/state, doors, user changes, and other states. Some capabilities depend on fitted equipment and availability logic.

The bundled `AmbientlightManagerService` reads a timed sequence, saves prior brightness/menu/mode, applies changes, and restores them. A window-lifter proxy calls `moveWindow` and checks a returned completion status; it is not merely a status-only API. Neither was invoked here.

Evidence:

- `D/var/opt/public/oap/oap_12220/source/package.json:1-29,64-75`.
- `.../source/config/si.scenes/general.json:1-11`.
- `.../source/config/si.scenes/scenes_%566.3.4.json:1-103`.
- `.../source/config/si.scenes/%46eature%4Dap.js:10-36`.
- `.../source/config/si.scenes/%54rigger%4Dap.js:17-63`.
- `.../source/bundle.js:7749` (timed lighting), `:9224` (window proxy).

**[INFERENCE] This is a strong starting point for personalized routines using existing functions. It does not establish arbitrary control of unsupported equipment or a safe window-actuation policy.**

### 4.2 Native HMI engineering templates

Common Lua generates “Widget Viewer Remote Control,” scene settings, upload forms, touch debugging, animation slowdown, widget triggers, variant forms, and “Reload RO / Reload Res” resource controls. A WebSocket widget-data exchange template is also present.

Evidence: `D/mnt/dataro/dataro1/hmi/common/script/hmi_script.lua:2365-2420,6397-6425,6782-6847,7191-7206`.

**[INFERENCE] Potentially useful for native layout/resource experimentation.** Only template/source presence was established; enabled handlers, listeners, authentication, and runtime usability were not. The viewer's “Camera” denotes scene/view camera controls, not demonstrated vehicle-camera access.

### 4.3 Centre-HMI G15 vehicle model and trim logic

`D/mnt/dataro/dataro1/hmi/common/ego_model/%4715.zip` contains meshes, textures/shaders, binary assets, and readable `widget.ptw`/`scene.ptx`. Properties include `G15_ICAM2`, `ShadowOpacity`, wheel rotation/steering, mirrors, and door opening.

ID7 Lua maps G15 base to `0`, luxury to `1`, M Sport to `4`, and carbon exterior to `5`, and contains M-View-specific widget positioning. This is distinct from the signed `kombi_model` archives described in section 1.4.

Evidence: archive members `widget.ptw:1-90`, `scene.ptx:1-78`; `D/mnt/dataro/dataro1/hmi/bmw/id7/script/hmi_script.lua:259-330,5382-5400,5982-5991`.

**[INFERENCE] Vehicle illustration and animation changes are plausible resource/logic work.** The exact compiler/schema and production loader's choice between text and binary representations remain unknown. Cosmetic trim mappings do not create physical equipment or ECU functionality.

`bmw/id7/res_hierarchy.config:1-3` layers `bmw`, `bmw/id6l`, then `bmw/id7`. Older-generation resources can be dependencies, not a fully selectable alternative skin. ID8-labelled navigation assets likewise do not demonstrate an ID7-to-ID8 conversion.

### 4.4 Navigation styles, rendering, and SQLite assets

Generated navigation coding selects BMW/USA style databases. Installed resources include BMW/BMW-M, ECE/USA, and multiple variants. Semantic style mappings separately identify guided/alternative/parking/charging routes, avoid areas, range indicators, and weather markers.

`navigation.ini` exposes MSAA, VSync/compositor behavior, scenery/tree generation, cloud coverage, focus mode, and animation-related parameters. It explicitly warns about map VRAM changes and documents rendering memory costs.

REA inspected `D/mnt/dataro/dataro1/navcore-euusrow/%50arking%53pot%53tyle.db` as unencrypted SQLite. Schema includes icons/image blobs, font sizes/colors, line widths/colors, polygon fills, scale ranges, priority, and Z order. Other `.xar` style assets are binary, not automatically ordinary XML.

Evidence:

- `D/run/navcoding/navigationcoding.ini:28-48`.
- `D/etc/navcore-euusrow/style_uri_mapping.cfg:8-56`.
- `D/etc/navcore-euusrow/navigation.ini:224-328`.
- `D/etc/navcore-euusrow/onoff.ini:20-23` layers base/generated/public configuration.
- REA SQLite schema records in the evidence bundle.

**[INFERENCE] Existing style remapping and some data-driven appearance edits are more approachable than producing new proprietary style archives.** No edits were loaded. Generated `/run` coding is not a proven persistent manual override; styling does not change map coverage, subscriptions, or licensing.

### 4.5 Android Auto density, crop, and viewport

`D/etc/aapd.conf:20-79,153-182` separates physical screen geometry from codec geometry, reported density, margins, frame rate, scaling, and target viewport. It contains multiple screen/profile definitions.

`D/var/sys/os/graphics/displayenv:1-11` independently defines the captured panel as `1920 x 720`, with APIX mode `2`. Winston and the display-driver startup consume display configuration.

**[INFERENCE] Projection UI scale/crop is a concrete configuration investigation surface.** Phone negotiation and selected runtime profiles were not observed. Larger-screen entries do not establish panel, GPU, cable/link, or entitlement compatibility. Physical transport changes are a different and riskier scope.

### 4.6 Startup/exit presentation and brand audio

The animation service selects a hardware-generation-dependent media directory. Resources include raw H.264 hello/goodbye sequences, loops, and PNG splashes for different generations. Ringtones have a plain BMW/BBA/RR/BMWi/MINI-to-WAV mapping. Separate brand-specific signal/chime banks are also packaged.

Evidence:

- `D/lib/systemd/system/animationplayer.service:2-15`.
- `D/usr/share/swe/00005687/00f14000.manifest:5-24,60-107`.
- `D/etc/ringtones.conf:1-8`.
- `D/usr/share/swe/00005cc7/00f88000.manifest:4-20,38-66`.

**[INFERENCE] Branding/media replacement may avoid native executable patches, but raw H.264 requires correct encoding, selection, dimensions, and timing.** Numeric resource IDs were not mapped to brands. Warning/PDC/chime assets should not be treated as interchangeable entertainment sounds.

### 4.7 Non-menu CPU/GPU profiles

Shipped scripts support `normal`, `kpi`, and hardware-qualification modes, backed by CPU governor/performance/turbo controls and GPU frequency caps. The persistent special-mode file is `/var/opt/public/os/SOC_CONFIGURATION_MODE`; its declared software version is checked before configuration use.

| High profile | CPU governor | CPU maximum percentage | Turbo disabled | GPU maximum MHz |
|---|---|---:|---:|---:|
| normal | powersave | 100 | 1 | 450 |
| kpi | performance | 100 | 1 | 600 |
| hwq | performance | 100 | 1 | 600 |

Evidence: `D/usr/share/soc-configuration/high/{normal,kpi,hwq}.cfg`; `D/usr/bin/soc-configuration.sh:40-51`; `D/usr/bin/apply-soc-configuration.sh:24-77`.

**[INFERENCE] This is a real platform tuning mechanism, not proof of safe extra performance.** Thermal limits, sustained behavior, and stability were not exercised. A qualification/measurement profile is not a recommendation for normal operation.

### 4.8 Premium/per-seat audio and picture metadata

The audio persistence schema includes enhanced surround, per-seat `LUM_4D_*`/`LUM_TrueSurround_*`, theater mode, image brightness/contrast/saturation, gong/PDC offsets, and entertainment/navigation level differences. The inspected settings are mostly integers marked `sync: false`, without value enumerations there.

The ID7 resource index also names Bowers & Wilkins Cinema/Studio/OnStage/Lounge/Concert artwork. An inspected public audio KVS uses a Qt-style `@ByteArray(...)` for `EqDataRam`, not simple named JSON.

Evidence: `D/usr/share/persistency.d/ent/ent_audio/audio-manager_default_1.2.json:66-149`; `D/mnt/dataro/dataro1/hmi/bmw/id7/asset%44%42/resources.ptr.res.txt`; `D/var/opt/public/ent/ent_audio/kvs/kvsdb-default`.

**[INFERENCE] Useful mapping material, but not a demonstrated premium-audio unlock.** No amplifier/DSP implementation, usable value ranges, required hardware, or licensing was established.

### 4.9 Main-menu layout and profile portability

The main-menu schema stores cell IDs, StartWidget UUIDs, layout types, and custom string pairs, with menu cells marked for synchronization. A UUID field does not prove arbitrary widgets can be instantiated.

The PIA Portingmaster configuration imports/exports functions marked portable, subject to explicit exclusions. Its comments identify parking settings incorrectly marked portable in an ECU, seat/memory/entry-assistance functions, and BDC mirror/steering-column positions.

Evidence: `D/usr/share/persistency.d/hmi/hmi_5000/hmi_mainmenu_1.0.json:4-51`; `D/etc/persod/pomd.ini:1-34`; `D/etc/persod/persistency.conf`.

**[INFERENCE] Personalization and synchronization are separate customization surfaces.** The cross-ECU exclusions are intentional compatibility boundaries, not an unlock list to remove blindly.

### 4.10 Engineering capture/logging exists, but network policy matters

Winston-grabber defines JPEG, raw RGB, H.264, MP4, UDP/RTP, and AVB pipelines. Log/trace configuration names screenshot-transfer and crash/trace web roots. However, the inspected release firewall explicitly drops trace HTTP ports `8081`/`8082`; a server configuration alone does not prove network reachability.

Evidence: `D/etc/winston-grabber/pipeline.conf:1-10`; `D/etc/dlt-system.conf:104-108`; `D/etc/lighttpd-log-trace.conf:41-43,148`; `D/etc/nftables/firewall-mgu-hw-appl-release.nft:35-41`.

An `EnhancedTestabilityService` unit and SOME/IP configuration are also packaged. Their presence does not establish an open or authorized engineering-control endpoint. No logs containing personal vehicle use were exported into this report.

## 5. Other ECUs: requests, coding, and firmware are different

The downloaded catalogue contains `689` interface declarations and `7,411` data types. This is declaration coverage, not a list of active services or universal permissions.

Concrete examples:

- `de.bmw.body.Light` declares status notifications and a `LowBeam` getter, but no setters.
- `de.bmw.powertrain.enginesound.EngineSoundConfiguration` declares a setter-capable `operationIndividualizationEngineSound` field, with separate startup/current settings. Its enum includes silent/minimal/balanced/prominent/maximal-like choices and unavailable/error/unfilled values. It is not a custom sound-synthesis API; availability and authorization on this vehicle were not proved.
- The window proxy in section 4.1 is an example of an actual command API, unlike status-only interfaces.

Security-related observations:

- SOME/IP credential checking and per-UID/GID policies are configured.
- Firewall/IPsec configuration includes policies for rejecting traffic without required protection.
- `CodingShmApp` and AUTOSAR-on-Linux have keystore dependencies.
- REA export-table inspection found manifest verification APIs in `libmguintegrity` and signature-verification APIs in `libSWESignatureVerify`; the package description explicitly says the latter verifies SWE signatures. Symbols alone do not prove enforcement on every path.
- `P/COD_UDS.odx-d:287-316` defines `AUTH_ECU_FOR_CODING`; `:396-436` defines `PERFORM_ECU_CODING` with signature-block/signature-data/NCD entries.
- `P/HU_MGU.odx-d:224-238,273-314` includes IPsec/RSU declarations and distinct coding, certificate, and other diagnostic layers.

**[INFERENCE] Requesting an already-supported function is generally a narrower problem than ECU coding; coding existing firmware is narrower than arbitrary custom firmware replacement.** Each still depends on target-specific acceptance and state. No authentication bypass, coding write, actuator request, or firmware modification was attempted.

## 6. Supporting laptop data

Observed supporting installations/data:

- E-Sys at `C:/EC-Apps/ESG/E-Sys`; `lib/esysCore.jar:META-INF/MANIFEST.MF` reports `3.35.3`.
- S18A `25_03_571` ODX material in the `C:/Data/psdzdata` tree used above.
- ISTA at `C:/Program Files/BMW/ISPI/TRIC/ISTA`, including substantial SQLite documentation/diagnostic databases.
- ISTA's fuller programming tree at `.../PSdZ/data_swi/psdzdata`, marked `SDP 4.60.11.ver`, includes bootloader, SWFL, CAFD, and other families. Example observed families include `btld_00003f36` and `cafd_00003e52`; no compatibility conclusion follows from those filenames alone.

The local trees are not interchangeable. Newer programming/diagnostic definitions must be matched to the actual hardware and installed software; they are reference material, not automatic authorization or guaranteed recovery.

## 7. Verification record and remaining unknowns

Successful REA work in the original pass:

- Passive ELF notes/identity inspection of `HmiMain3D` and `libmguintegrity`.
- Native export-table inspection of integrity/signature and development-coding libraries.
- Inert JavaScript analysis of the certificate-manager module and an installed app runner.
- SQLite schema inspection of `ParkingSpotStyle.db`.

Retained output: [REA evidence bundle](out/headunit-rea-evidence-20261029.json), `19,647,633` bytes and 15 records. This contains the retained REA subset, not every ordinary file read or the public-web investigation. Graph-specific unknowns remain even though no separate residual-unknown registry records were created.

Native function decompilation was not available in the configured setup: Ghidra was not configured and the selected GNU objdump could not be launched. No target code was executed as an alternative. The cluster conclusions rely on source/configuration/contracts/archive contents, not decompiled cluster firmware or a runtime demonstration.

Most important remaining unknowns:

1. Exact installed cluster/HUD hardware and firmware identity beyond the captured variant labels.
2. Which remote graphics path is active on this car, and which compositor/scene owns each visible area.
3. Whether Robert's reported full-cluster implementation is published elsewhere, and its precise backend/entry point.
4. Resource signature enforcement, accepted scene/model IDs, serialization details, and remote publishing permissions.
5. Whether custom content coexists correctly with stock warnings, gauges, camera priority, and HUD information.
6. A demonstrated restoration path for the particular modification and target ECU.

The useful next boundary is **identifying the high-cluster rendering backend and its allowed scene lifecycle**, not guessing a screen ID, forcing another vehicle's variant flags, or assuming E-Sys makes experimentation risk-free.

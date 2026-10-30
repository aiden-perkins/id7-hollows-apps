'use strict';
const mgu = require('./kit/mgu');
const { Model, catalog, now, hex } = require('./model');
const { Services } = require('./services');
const evidence = require('./evidence');
mgu.run({
    async start(ctx) {
        const ui = ctx.ui, cache = {}, counts = {}, visible = {};
        let closed = false, timer = null, renderTimer = null, hideTimer = null, actionBusy = false;
        let topic = catalog.topics[0], probe = catalog.requests[0], channel = catalog.native[0];
        let rawTitle = '', rawText = '', rawPage = 0, rawBack = 'MAIN', history = [], probeRows = [], nativeRows = [];
        const changed = () => {
            if (closed || renderTimer) return;
            renderTimer = setTimeout(() => { renderTimer = null; render(); }, 100);
        };
        const model = new Model(ctx, changed), services = new Services(ctx, model);
        ctx.otherDataLab = model;
        const json = (value) => JSON.stringify(value === undefined ? null : value, null, 2);
        const brief = (value, max) => { const text = typeof value === 'string' ? value : JSON.stringify(value); return text.length > (max || 140) ? text.slice(0, max || 140) + '...' : text; };
        const text = (id, value, row) => {
            const key = id + ':' + (row || 0), label = String(value);
            if (cache[key] === label) return;
            cache[key] = label; ui.text(id, label, row || 0);
        };
        const rows = (id, labels) => {
            const values = labels.length ? labels : ['No entries for this channel'];
            if (counts[id] !== values.length) {
                counts[id] = values.length; ui.rows(id, values.length);
                Object.keys(cache).filter((key) => key.startsWith(id + ':')).forEach((key) => delete cache[key]);
            }
            values.forEach((label, row) => text(id, label, row));
        };
        const fail = (error) => { model.notice = String(error.message || error); model.record('action-error', { detail: model.notice }); };
        const bind = (id, fn) => ui.onClick(id, async (event) => {
            if (closed || actionBusy) return;
            actionBusy = true;
            try { await fn(event || {}); } catch (error) { fail(error); }
            finally { actionBusy = false; render(); }
        });
        const show = (name) => { render(); return ui.open(name); };
        const raw = (title, value, back) => { rawTitle = title; rawText = json(value); rawPage = 0; rawBack = back; return show('RAW'); };
        const age = (sample) => sample ? (Math.max(0, now() - sample.monoMs) / 1000).toFixed(1) + 's old / ' +
            (now() - sample.monoMs <= 3000 ? 'recent' : 'STALE') : 'No sample';
        const shortName = (field) => field.name.replace(/^STAT_/, '').replace(/_WERT$/, '').replace(/_/g, ' ');
        const fieldLabel = (field) => {
            const shown = field.enumLabel !== null ? field.enumLabel : field.value !== null ?
                Number(field.value.toFixed(5)) + (field.unit === '-' ? '' : ' ' + field.unit) : 'raw ' + field.rawHex;
            return shortName(field) + ': ' + shown + ' | ' + field.state;
        };
        function render() {
            if (closed) return;
            const state = services.status(), last = model.latest[probe.id];
            text('HOME_STATE', (model.preview ? 'PREVIEW / NO VEHICLE DATA' : 'READ ONLY / no actuator commands') + '\nDiagnostics ' +
                (state.quarantine ? 'QUARANTINED until restart' : state.enabled ? 'ENABLED / manual reads only' : 'OFF') +
                ' | ' + (state.busy || state.inflight ? 'BUSY' : 'idle') + '\n30 fixed probes / 7 historical ECU targets');
            text('HOME_NOTICE', model.notice);
            text('HOME_ENABLE', state.enabled ? 'Disable diagnostic reads' : state.quarantine ? 'Diagnostics quarantined (see history)' : 'Enable read-only diagnostics');
            rows('HOME_TOPICS', catalog.topics.map((entry) => entry.title));
            text('TOPIC_FINDING', topic.title + '\n' + topic.finding);
            probeRows = catalog.requests.filter((p) => p.topic === topic.id);
            rows('TOPIC_PROBES', probeRows.map((p) => '0x' + hex(p.target) + ' / ' + hex(p.did, 4) + ' ' + p.label +
                ' | ' + (model.latest[p.id] ? (model.latest[p.id].synthetic ? 'SYNTHETIC ' : '') + model.latest[p.id].status : 'not read')));
            nativeRows = catalog.native.filter((c) => c.topic === topic.id);
            rows('TOPIC_NATIVE', nativeRows.map((c) => c.field + ' | ' + age(model.native[c.id])));
            const identity = state.identities[probe.target];
            text('PROBE_NAME', probe.variant + ' / ECU 0x' + hex(probe.target) + ' / 22 ' + hex(probe.did, 4) + '\n' + probe.label +
                '\nExpected payload: ' + probe.payloadBytes + ' bytes after 62 + DID');
            text('PROBE_STATE', (state.quarantine ? 'QUARANTINED: restart after old work / other diagnostic clients have stopped.' :
                model.preview ? 'PREVIEW: real F150 and measurement requests blocked.' : !state.enabled ? 'Diagnostics OFF: enable from Home.' :
                    !identity ? 'Read F150 first: no current family match.' : identity.matched ? 'F150 family matched (not software/layout validation).' : 'F150 MISMATCH: measurement reads blocked.') +
                '\n' + (last ? (last.synthetic ? 'SYNTHETIC / ' : '') + last.status + ' / ' + age(last) +
                    ' / ' + (last.decoded ? last.decoded.state : last.detail || 'inspect raw outcome') : 'No reply captured for this probe.'));
            rows('PROBE_FIELDS', last && last.decoded && last.decoded.fields.length ? last.decoded.fields.map(fieldLabel) : ['No decoded fields; inspect raw outcome / layout.']);
            const sample = model.native[channel.id], provider = model.providers[channel.iface];
            const sameEpoch = sample && provider && sample.epoch === provider.epoch;
            text('NATIVE_STATE', channel.field + '\n' + (provider && provider.available ? 'Provider offered' : 'Provider unavailable / unknown') +
                ' | ' + age(sample) + (sample && !sameEpoch ? ' | OLD PROVIDER EPOCH' : '') + '\nRaw notification only. Catalog defaults / qualifiers are not measured zero.');
            text('HISTORY_STATE', model.events.length + ' / 256 retained events | ' + model.evicted + ' evicted\nNo continuous disk recording. Save replaces prior host-local snapshot.\n' + model.notice);
            history = model.events.slice().reverse();
            rows('HISTORY_EVENTS', history.map((event) => '#' + event.sequence + ' ' + event.kind + ' | ' + brief(event.data, 125)));
            if (visible.RAW || ui.isVisible('RAW')) {
                const pageSize = 800, pages = Math.max(1, Math.ceil(rawText.length / pageSize));
                rawPage = Math.max(0, Math.min(rawPage, pages - 1));
                text('RAW_POSITION', rawTitle + '\nPage ' + (rawPage + 1) + '/' + pages + ' | ' + rawText.length + ' total characters | fixed view');
                const lines = [];
                rawText.slice(rawPage * pageSize, (rawPage + 1) * pageSize).split('\n').forEach((line) => {
                    if (!line.length) lines.push(' ');
                    for (let at = 0; at < line.length; at += 60) lines.push(line.slice(at, at + 60));
                });
                rows('RAW_BODY', lines);
            }
        }
        bind('HOME_TOPICS', (event) => {
            if (!catalog.topics[event.row]) return;
            topic = catalog.topics[event.row]; probe = catalog.requests.find((p) => p.topic === topic.id);
            channel = catalog.native.find((c) => c.topic === topic.id) || catalog.native[0];
            return show('TOPIC');
        });
        bind('HOME_ENABLE', () => services.enabled ? services.disable() : services.enable());
        bind('HOME_HISTORY', () => show('HISTORY'));
        bind('HOME_SAVE', () => model.save(services)); bind('HISTORY_SAVE', () => model.save(services));
        bind('HOME_HELP', () => raw('Scope / operation / retention', {
            scope: catalog.evidenceLevel, diagnostics: 'Manual SID22 fixed allowlist only. Read F150 first and require exact saved family-index match. No sessions/unlocks/writes/retries/background diagnostic polls.',
            safety: 'Do not operate while driving or run another diagnostic client concurrently. Start stationary. No wheel-spin / stability intervention experiment is requested.',
            source: 'See OTHER_DATA_FINDINGS.md and per-probe original ISTA tables. Artifact decoding is not live-vehicle or physical validation.',
            quarantine: 'A timeout/provider failure or unknown verdict blocks reads for this session. Stop old diagnostic work before restarting. No automatic reconnect.',
            retention: 'Last 256 events in memory with evictions counted. Save writes other-data-evidence.json in app dataDir and replaces the previous snapshot. No automatic upload. Shutdown does not save.',
            interpretation: 'No exhaust-position gauge, clutch/front-power percentage, or anti-roll engagement percentage. Known invalid qualifiers suppress numeric measurements; unresolved qualifiers/states remain raw.',
            preview: 'Never opens real proxies or sends diagnostics. Host-supplied bytes are labelled SYNTHETIC and cannot become ECU identity or live evidence.'
        }, 'MAIN'));
        bind('TOPIC_PROBES', (event) => { if (probeRows[event.row]) { probe = probeRows[event.row]; return show('PROBE'); } });
        bind('TOPIC_NATIVE', (event) => { if (nativeRows[event.row]) { channel = nativeRows[event.row]; return show('NATIVE'); } });
        bind('TOPIC_PROTOCOL', () => raw(topic.title + ' / observation protocol', topic, 'TOPIC'));
        bind('TOPIC_BACK', () => show('MAIN'));
        bind('PROBE_IDENTIFY', async () => {
            const result = await services.read(null, probe.target);
            model.notice = result.status + ': ' + (result.identity ? json(result.identity) : result.detail);
            return raw('Complete F150 identity outcome', result, 'PROBE');
        });
        bind('PROBE_READ', async () => {
            const result = await services.read(probe);
            model.notice = probe.id + ': ' + result.status + '. Transport, decoding and physical validity are separate.';
        });
        bind('PROBE_FIELDS', (event) => {
            const result = model.latest[probe.id], field = result && result.decoded && result.decoded.fields[event.row];
            return raw(field ? field.name : 'No decoded measurement', field ? { at: result.at, age: age(result), synthetic: result.synthetic,
                field, schema: probe.fields[event.row] } : result || { state: 'not-read' }, 'PROBE');
        });
        bind('PROBE_RAW', () => raw('Complete probe outcome', model.latest[probe.id] || { state: 'not-read' }, 'PROBE'));
        bind('PROBE_SCHEMA', () => raw('Exact artifact layout / constraints', probe, 'PROBE'));
        bind('PROBE_SOURCE', () => raw('Original selected ISTA tables / hash', evidence.sources[probe.source], 'PROBE'));
        bind('PROBE_BACK', () => show('TOPIC'));
        bind('NATIVE_RAW', () => raw('Full latest native notification', model.native[channel.id] || { state: 'not-received' }, 'NATIVE'));
        bind('NATIVE_SCHEMA', () => raw('Native field / full datatype closure', { channel, datatypes: catalog.datatypes, sourceSha256: catalog.catalogSha256 }, 'NATIVE'));
        bind('NATIVE_BACK', () => show('TOPIC'));
        bind('HISTORY_MARK', () => {
            model.record('operator-marker', { topic: topic.id, probe: probe.id, reportedBy: 'operator', note: 'Comparison marker only; no physical outcome is inferred.' });
            model.notice = 'Operator marker recorded for ' + topic.title + ' / ' + probe.id;
        });
        bind('HISTORY_EVENTS', (event) => { if (history[event.row]) return raw('Complete retained event', history[event.row], 'HISTORY'); });
        bind('HISTORY_BACK', () => show('MAIN'));
        bind('RAW_PREV', () => { rawPage = Math.max(0, rawPage - 1); }); bind('RAW_NEXT', () => { rawPage++; });
        bind('RAW_BACK', () => show(rawBack));
        ui.onVisible((name, on) => {
            visible[name] = !!on; clearTimeout(hideTimer);
            if (!Object.values(visible).some(Boolean)) hideTimer = setTimeout(() => {
                if (!closed && !Object.values(visible).some(Boolean)) { services.disable(); model.notice = 'App hidden: diagnostic reads disabled; no automatic resume.'; }
            }, 100);
            changed();
        });
        const close = () => {
            if (closed) return;
            closed = true; clearInterval(timer); clearTimeout(renderTimer); clearTimeout(hideTimer); services.close();
        };
        if (ctx.app && ctx.app.on) ctx.app.on('shutdown', close);
        process.once('exit', close);
        timer = setInterval(changed, 500);
        render(); services.start().then(changed, fail);
    }
});

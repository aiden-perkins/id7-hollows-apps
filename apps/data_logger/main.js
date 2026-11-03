'use strict';
const fs = require('fs');
const path = require('path');
const mgu = require('./kit/mgu');
const D = require('./definitions');
const Trip = require('./trip_data/sources');
const { Collector } = require('./collector');
const { Recorder } = require('./recorder');
const { Download } = require('./download');

mgu.run({
    async start(ctx) {
        const ui = ctx.ui, cache = {};
        let collector = null, recorder, closed = false, busy = false, sharing = false;
        let notice = '', exported = null, timer = null;
        const catalog = { scope: 'All Live Data Viewer definitions and Trip Data measurement sources, not all vehicle interfaces',
            interfaces: D.IF, definitions: D.definitions,
            decoderSource: fs.readFileSync(path.join(__dirname, 'definitions.js'), 'utf8'),
            tripRecorder: { definitions: Trip.DEFINITIONS, notes: Trip.NOTES,
                sourceCode: fs.readFileSync(path.join(__dirname, 'trip_data', 'sources.js'), 'utf8'),
                calculationCode: fs.readFileSync(path.join(__dirname, 'trip_data', 'calculations.js'), 'utf8') },
            timing: 'Local arrival timestamps in Unix milliseconds; no synchronized ECU clock. Getter replies count as deliveries. Shared diagnostic queue limits actual sampling rates.',
            schema: 'catalog/session records describe each session; delivery records contain complete raw payloads and decoded readings; diagnostic-frame records also preserve rejected replies; path-status records include unsupported and never-delivered paths. trip-catalog describes Trip Data sources and calculation policy; trip-delivery and trip-transport preserve its raw inputs and provider states; trip-sample contains decoded values, GPS distance intervals and accumulated trip statistics for this logger session.' };
        const text = (name, value) => {
            if (cache[name] === value || closed) return;
            cache[name] = value;
            Promise.resolve(ui.text(name, value)).catch((error) => ctx.log.warn(error));
        };
        const sharingServer = new Download(() => { if (recorder) render(); });
        const stop = () => {
            if (collector) { collector.summary(); collector.close(); collector = null; }
            recorder.stop();
        };
        recorder = new Recorder(ctx.dataDir, catalog, (error) => {
            notice = 'Recording stopped: ' + (error.message || error);
            ctx.log.warn(error);
            // Do not dispose the vehicle reader reentrantly inside a delivery callback.
            setImmediate(() => { if (!closed) { stop(); render(); } });
        });
        function render() {
            if (closed) return;
            const stats = recorder.stats();
            text('RECORD', stats.recording ? 'Stop recording' : 'Start recording');
            text('STATUS', stats.recording ? 'Recording all paths — continues in the background while running' : 'Stopped — saved sessions stay on the car');
            text('COUNTS', stats.sessions + ' saved sessions | ' + (stats.bytes / 1048576).toFixed(1) + ' MiB / 256 MiB | ' + stats.records + ' records this run');
            text('COMBINE', busy ? 'Combining saved data…' : 'Combine all saved data');
            text('EXPORT', exported ? exported.name + ' | ' + (exported.bytes / 1048576).toFixed(1) + ' MiB\nSnapshot at combine time — combine again to include newer recordings' : 'No combined file yet');
            text('SHARE', sharing ? 'Disable phone download' : 'Enable phone download');
            text('LINK', sharing ? sharingServer.status() + '\n' + sharingServer.urls().join('\n') : 'Phone download is off');
            text('NOTICE', notice || stats.error || '');
        }
        const bind = (name, fn) => ui.onClick(name, async () => {
            if (closed) return;
            try { await fn(); }
            catch (error) { notice = error.message || String(error); ctx.log.warn(error); }
            render();
        });
        bind('RECORD', () => {
            notice = '';
            if (recorder.stats().recording) { stop(); return; }
            recorder.start();
            if (!recorder.stats().recording) return;
            try { collector = new Collector(ctx, recorder); }
            catch (error) { stop(); throw error; }
        });
        bind('COMBINE', async () => {
            if (busy) return;
            busy = true; notice = ''; render();
            try {
                if (collector) collector.summary();
                const result = await recorder.combine();
                if (closed) return;
                exported = result; sharingServer.publish(result);
                notice = 'All saved sessions combined. Enable phone download to save the file.';
            } finally { busy = false; }
        });
        bind('SHARE', async () => {
            if (sharing) { sharing = false; await sharingServer.close(); return; }
            if (!exported) throw new Error('Combine all saved data first.');
            await sharingServer.start();
            if (closed) { await sharingServer.close(); return; }
            sharing = true;
        });
        ui.onVisible((name, visible) => { if (visible) render(); });
        const close = () => {
            if (closed) return;
            closed = true; clearInterval(timer); stop();
            sharingServer.close().catch((error) => ctx.log.warn(error));
            recorder.close();
        };
        if (ctx.app && ctx.app.on) ctx.app.on('shutdown', close);
        process.once('exit', close);
        timer = setInterval(() => {
            if (collector) collector.summary();
            render();
        }, 1000);
        if (timer.unref) timer.unref();
        render();
    }
});

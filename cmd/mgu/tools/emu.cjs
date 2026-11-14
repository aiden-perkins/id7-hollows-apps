'use strict';

// Adapt the upstream emulator in memory; keep its renderer, UI and host intact.
const fs = require('fs');
const path = require('path');
const Module = require('module');
const config = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const filename = path.join(config.upstream, 'kit', 'tools', 'emu.js');
let source = fs.readFileSync(filename, 'utf8').replace(/\r\n/g, '\n');
function replaceOnce(before, after) {
    if (source.split(before).length !== 2) {
        throw new Error('Upstream emulator interface changed; adapter needs review: ' + before);
    }
    source = source.replace(before, () => after);
}
const literal = (value) => JSON.stringify(value);
replaceOnce("const ROOT = path.resolve(__dirname, '..', '..');",
    'const ROOT = ' + literal(config.root) + ';\nconst HOLLOW_APPS = ' + literal(config.apps) + ';');
replaceOnce("const WEB = path.join(ROOT, 'kit', 'emu', 'web');",
    'const WEB = ' + literal(path.join(config.upstream, 'kit', 'emu', 'web')) + ';');
replaceOnce("const listApps = () => fs.readdirSync(path.join(ROOT, 'apps')).filter((d) => fs.existsSync(path.join(ROOT, 'apps', d, 'app.json'))).sort();",
    'const listApps = () => HOLLOW_APPS.map((app) => app.id);\n' +
    'const appSource = (id) => HOLLOW_APPS.find((app) => app.id === id).source;');
replaceOnce("path.join(ROOT, 'apps', id, 'app.json')", "path.join(appSource(id), 'app.json')");
replaceOnce("path.join(ROOT, 'apps', ic[1], 'icon.png')", "path.join(appSource(ic[1]), 'icon.png')");
replaceOnce("spawn('python3', [path.join(ROOT, 'kit', 'tools', 'build.py'), id], { cwd: ROOT })",
    'spawn(' + literal(config.python) + ', ' + literal(config.buildArgs) + '.concat(id), { cwd: ROOT })');
// Local apps may import files from these sibling apps during packaging.
const dependencies = ['live_data_viewer', 'trip_data'].map((id) => path.join(config.root, 'apps', id));
const watches = [path.join(config.upstream, 'kit', 'runtime'),
    path.join(config.root, 'cmd', 'mgu', 'patches'), path.join(config.root, 'cmd', 'mgu', 'extensions', 'runtime'),
    path.join(config.root, 'cmd', 'mgu', 'tools')].concat(dependencies).filter((dir) => fs.existsSync(dir));
replaceOnce("[path.join(ROOT, 'apps', appId), path.join(ROOT, 'kit', 'runtime')].map((d) => {",
    'Array.from(new Set([appSource(appId)].concat(' + literal(watches) + '))).map((d) => {');
// Node's Windows IPC transport requires a named pipe rather than a Unix socket.
if (process.platform === 'win32') {
    replaceOnce("const SOCK = path.join(os.tmpdir(), 'mgu-emu-' + process.pid + '.sock');",
        'const SOCK = ' + literal('\\\\.\\pipe\\mgu-emu-') + ' + process.pid;');
    replaceOnce("{ cwd: data, env, stdio: ['ignore', 'pipe', 'pipe', 'ipc'] }",
        "{ cwd: data, env, execArgv: process.execArgv.concat(['--require', " +
        literal(path.join(__dirname, 'emu_windows.cjs')) + "]), stdio: ['ignore', 'pipe', 'pipe', 'ipc'] }");
}
process.stdin.on('end', () => process.emit('SIGTERM'));
process.stdin.resume();
process.argv = [process.execPath, filename].concat(process.argv.slice(3));
const emulator = new Module(filename, module);
emulator.filename = filename;
emulator.paths = Module._nodeModulePaths(path.dirname(filename));
emulator._compile(source, filename);

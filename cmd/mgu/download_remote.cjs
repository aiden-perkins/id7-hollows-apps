'use strict';
// Read-only, in-memory SSH download agent; compatible with the head unit's Node 8.
const fs = require('fs');
const path = require('path').posix;
const crypto = require('crypto');
const readline = require('readline');
const os = require('os');
let root = '', stack = [], excluded = [], seen = new Set(), known = new Set();
const digest = (text) => crypto.createHash('sha256').update(text).digest('hex');
const within = (base, name) => base === '/' ? name[0] === '/' : name === base || name.indexOf(base + '/') === 0;
const blocked = (name) => excluded.some((item) => within(item, name));
const signature = (st) => digest(JSON.stringify([st.mode, st.size, st.mtime.getTime(), st.ctime.getTime(), String(st.ino), String(st.dev)]));
function parents(name) {
    for (let dir = path.dirname(name); dir !== root && within(root, dir); dir = path.dirname(dir)) {
        if (fs.lstatSync(dir).isSymbolicLink()) throw new Error('Path crosses a symbolic link: ' + dir);
        if (dir === '/') break;
    }
}
function entry(name) {
    parents(name);
    const st = fs.lstatSync(name);
    const kind = st.isFile() ? 'file' : st.isDirectory() ? 'directory' : st.isSymbolicLink() ? 'symlink' : 'special';
    const link = kind === 'symlink' ? fs.readlinkSync(name, { encoding: 'buffer' }) : null;
    return { path: name, kind, size: st.size, mode: st.mode, uid: st.uid, gid: st.gid,
        mtime: st.mtime.toISOString(), ctime: st.ctime.toISOString(), inode: String(st.ino), device: String(st.dev),
        signature: signature(st), link: link ? link.toString('utf8') : '', linkBytes: link ? link.toString('base64') : '' };
}
function hello(request) {
    if (root) throw new Error('Download session already initialized');
    if (request.target === 'head-unit') {
        if (process.getuid() !== 0) throw new Error('Root SSH access is required for a head-unit capture');
        root = '/';
        const virtual = new Set(['proc', 'sysfs', 'devtmpfs', 'devpts', 'cgroup', 'cgroup2', 'debugfs', 'tracefs',
            'securityfs', 'configfs', 'pstore', 'mqueue', 'hugetlbfs', 'bpf', 'fusectl', 'binfmt_misc', 'rpc_pipefs']);
        excluded = ['/proc', '/sys', '/dev'];
        fs.readFileSync('/proc/mounts', 'utf8').trim().split('\n').forEach((line) => {
            const fields = line.split(/\s+/);
            if (virtual.has(fields[2])) {
                const mount = fields[1].replace(/\\([0-7]{3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)));
                if (mount === '/') throw new Error('Refusing to exclude the root filesystem');
                excluded.push(mount);
            }
        });
    } else {
        if (!/^[a-zA-Z0-9_][a-zA-Z0-9_.-]*$/.test(request.target)) throw new Error('Invalid app id');
        const rows = fs.readFileSync('/var/opt/public/oap/oap_12201/security/uids.txt', 'utf8').split('\n');
        const ids = rows.map((row) => row.trim().split('=')).filter((row) => row.length === 2 && row[1] === request.target);
        if (ids.length !== 1 || !/^\d+$/.test(ids[0][0])) throw new Error('App is not uniquely registered: ' + request.target);
        const app = fs.realpathSync('/var/opt/public/oap/oap_' + ids[0][0]);
        root = app;
        if (!fs.lstatSync(root).isDirectory() || fs.lstatSync(root).isSymbolicLink()) throw new Error('App storage is not a regular directory');
    }
    let requested = request.paths || [];
    if (!requested.length) requested = request.target === 'head-unit' ? ['.'] : ['data', 'kvs', 'share', 'security'];
    stack = requested.map((name) => {
        const resolved = path.resolve(root, name);
        if (!within(root, resolved) || blocked(resolved)) throw new Error('Path is outside the capture scope or virtual: ' + name);
        if (request.target !== 'head-unit' && !['data', 'kvs', 'share', 'security'].some((part) => within(path.join(root, part), resolved))) {
            throw new Error('Only app data, kvs, share and security are in scope');
        }
        parents(resolved);
        return resolved;
    }).reverse();
    let identity;
    try {
        const id = fs.readFileSync('/etc/machine-id', 'utf8').trim();
        if (!id) throw new Error('Empty machine id');
        identity = 'machine-id:' + id;
    }
    catch (error) {
        for (const file of ['/etc/ssh/ssh_host_ed25519_key.pub', '/etc/ssh/ssh_host_rsa_key.pub', '/etc/ssh/ssh_host_ecdsa_key.pub']) {
            try { identity = 'ssh-public-key:' + digest(fs.readFileSync(file)); break; } catch (missing) {}
        }
        if (!identity) identity = 'hostname:' + os.hostname();
    }
    return { root, identity, excluded, paths: stack.slice().reverse() };
}
function scan() {
    if (!root) throw new Error('Download session is not initialized');
    const entries = [];
    while (stack.length && entries.length < 64) {
        const name = stack.pop();
        if (seen.has(name)) continue;
        seen.add(name);
        if (blocked(name)) { entries.push({ path: name, kind: 'excluded' }); continue; }
        try {
            const item = entry(name);
            let invalidNames = 0;
            if (item.kind === 'directory') {
                const children = fs.readdirSync(name, { encoding: 'buffer' }).sort(Buffer.compare);
                for (let i = children.length - 1; i >= 0; i--) {
                    const decoded = children[i].toString('utf8');
                    if (!Buffer.from(decoded, 'utf8').equals(children[i])) { invalidNames++; continue; }
                    stack.push(path.join(name, decoded));
                }
            }
            if (item.kind === 'file') known.add(name);
            entries.push(item);
            if (invalidNames) entries.push({ path: name, kind: 'error', error: invalidNames + ' non-UTF-8 filenames were not copied; use a tar capture for those entries' });
        } catch (error) { entries.push({ path: name, kind: 'error', error: error.message }); }
    }
    return { entries, done: stack.length === 0 };
}
function open(request) {
    if (!known.has(request.path) || !within(root, request.path) || blocked(request.path)) throw new Error('File was not enumerated in this session');
    parents(request.path);
    const before = fs.lstatSync(request.path);
    if (!before.isFile() || signature(before) !== request.signature) throw new Error('File changed since enumeration: ' + request.path);
    const fd = fs.openSync(request.path, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
    if (signature(fs.fstatSync(fd)) !== request.signature) { fs.closeSync(fd); throw new Error('File changed while opening'); }
    return fd;
}
function hash(request) {
    const fd = open(request);
    try {
        const all = crypto.createHash('sha256'), prefix = crypto.createHash('sha256');
        const buffer = Buffer.alloc(1024 * 1024);
        const size = fs.fstatSync(fd).size;
        if (!Number.isSafeInteger(size) || !Number.isSafeInteger(request.prefix) || request.prefix < 0 || request.prefix > size) throw new Error('Invalid file size or resume offset');
        let offset = 0;
        while (offset < size) {
            const count = fs.readSync(fd, buffer, 0, Math.min(buffer.length, size - offset), offset);
            if (!count) throw new Error('File ended during hashing');
            const chunk = buffer.slice(0, count);
            all.update(chunk);
            if (offset < request.prefix) prefix.update(chunk.slice(0, Math.min(count, request.prefix - offset)));
            offset += count;
        }
        if (signature(fs.fstatSync(fd)) !== request.signature || signature(fs.lstatSync(request.path)) !== request.signature) throw new Error('File changed while hashing');
        return { sha256: all.digest('hex'), prefixSHA256: prefix.digest('hex') };
    } finally { fs.closeSync(fd); }
}
function read(request) {
    if (!Number.isSafeInteger(request.offset) || !Number.isSafeInteger(request.length) || request.offset < 0 || request.length < 1 || request.length > 1024 * 1024) throw new Error('Invalid download range');
    const fd = open(request);
    try {
        const size = fs.fstatSync(fd).size;
        if (request.offset > size) throw new Error('Resume offset exceeds file size');
        const buffer = Buffer.alloc(Math.min(request.length, size - request.offset));
        let used = 0;
        while (used < buffer.length) {
            const count = fs.readSync(fd, buffer, used, buffer.length - used, request.offset + used);
            if (!count) throw new Error('File ended during transfer');
            used += count;
        }
        if (signature(fs.fstatSync(fd)) !== request.signature || signature(fs.lstatSync(request.path)) !== request.signature) throw new Error('File changed during transfer');
        return { offset: request.offset, data: buffer.toString('base64') };
    } finally { fs.closeSync(fd); }
}
const input = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
input.on('line', (line) => {
    let reply;
    try {
        const request = JSON.parse(line);
        const handlers = { hello, scan, hash, read };
        if (!Object.prototype.hasOwnProperty.call(handlers, request.op)) throw new Error('Unknown download operation');
        reply = Object.assign({ ok: true }, handlers[request.op](request));
    } catch (error) { reply = { ok: false, error: error.message }; }
    process.stdout.write(JSON.stringify(reply) + '\n');
});

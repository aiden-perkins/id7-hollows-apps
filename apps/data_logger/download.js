'use strict';
const http = require('http');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
}

class Download {
    constructor(onChange) {
        this.onChange = onChange;
        this.server = null;
        this.sockets = new Set();
        this.export = null;
        this.token = '';
        this.port = 0;
        this.error = '';
        this.operations = Promise.resolve();
    }

    _changed() {
        if (typeof this.onChange === 'function') {
            try { this.onChange(); } catch (_) { /* UI callbacks must not crash HTTP handlers. */ }
        }
    }

    _queue(operation) {
        const result = this.operations.then(operation);
        this.operations = result.catch(() => {});
        return result;
    }

    start() {
        return this._queue(async () => {
            if (this.server && this.server.listening) return this.urls();
            await this._close();
            this.error = '';
            try {
                this.token = crypto.randomBytes(12).toString('hex');
                const server = http.createServer((request, response) => this._request(request, response));
                this.server = server;
                server.on('connection', (socket) => {
                    this.sockets.add(socket);
                    socket.on('error', () => {});
                    socket.on('close', () => this.sockets.delete(socket));
                });
                server.on('clientError', (_, socket) => socket.destroy());
                server.on('error', (error) => {
                    if (this.server !== server) return;
                    this.error = 'Sharing listener error (' + (error.code || 'HTTP error') + ')';
                    this._changed();
                });
                server.on('close', () => {
                    if (this.server === server) {
                        this.port = 0;
                        this._changed();
                    }
                });
                await new Promise((resolve, reject) => {
                    const failed = (error) => { server.removeListener('listening', ready); reject(error); };
                    const ready = () => { server.removeListener('error', failed); resolve(); };
                    server.once('error', failed);
                    server.once('listening', ready);
                    server.listen(0, '0.0.0.0');
                });
                this.port = server.address().port;
            } catch (error) {
                this.error = 'Sharing listener error (' + (error.code || 'unable to start') + ')';
                await this._close();
            }
            this._changed();
            return this.urls();
        });
    }

    urls() {
        if (!this.server || !this.server.listening || !this.port) return [];
        const addresses = new Set();
        try {
            const interfaces = os.networkInterfaces();
            Object.keys(interfaces).forEach((name) => {
                (interfaces[name] || []).forEach((address) => {
                    if (!address.internal && (address.family === 'IPv4' || address.family === 4)) {
                        addresses.add('http://' + address.address + ':' + this.port + '/' + this.token + '/');
                    }
                });
            });
        } catch (_) { return []; }
        return Array.from(addresses);
    }

    publish(value) {
        this.export = value && typeof value.path === 'string' && value.path ? {
            path: value.path,
            name: String(value.name || 'data-logger.jsonl'),
            bytes: Number.isFinite(value.bytes) && value.bytes >= 0 ? value.bytes : null
        } : null;
        this._changed();
    }

    status() {
        if (this.error) return this.error;
        if (!this.server || !this.server.listening) return 'Sharing off';
        if (!this.urls().length) return 'Sharing on; no non-internal IPv4 address. Connect the phone hotspot.';
        return this.export ? 'Sharing on; export ready to download' : 'Sharing on; no export available';
    }

    close() {
        return this._queue(() => this._close());
    }

    async _close() {
        const server = this.server;
        this.server = null;
        this.port = 0;
        this.token = '';
        const closed = server ? new Promise((resolve) => {
            try { server.close(() => resolve()); } catch (_) { resolve(); }
        }) : Promise.resolve();
        this.sockets.forEach((socket) => socket.destroy());
        this.sockets.clear();
        await closed;
        this._changed();
    }

    _reply(response, code, message) {
        if (response.destroyed) return;
        response.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end(message + '\n');
    }

    _request(request, response) {
        response.on('error', () => response.destroy());
        response.setHeader('Cache-Control', 'no-store');
        response.setHeader('X-Content-Type-Options', 'nosniff');
        response.setHeader('Referrer-Policy', 'no-referrer');
        response.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
        const root = '/' + this.token + '/';
        if (!this.token || (request.url !== root && request.url !== root + 'download')) {
            this._reply(response, 404, 'Not found');
            return;
        }
        if (request.method !== 'GET') {
            response.setHeader('Allow', 'GET');
            this._reply(response, 405, 'Only GET is supported');
            return;
        }
        if (request.url === root + 'download') {
            this._download(response);
            return;
        }
        const published = this.export;
        const available = published ? '<p><a href="download">Download ' + escapeHtml(published.name) + '</a>' +
            (published.bytes === null ? '' : ' (' + published.bytes + ' bytes)') + '</p>' :
            '<p>No export available. Combine the saved sessions in the car first, then reload this page.</p>';
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        response.end('<!doctype html><html lang="en"><meta charset="utf-8">' +
            '<meta name="viewport" content="width=device-width,initial-scale=1">' +
            '<title>Data Logger download</title><h1>Data Logger</h1>' +
            '<p>Keep your phone and car connected to the same hotspot. Tap the link below to save the JSONL file.</p>' +
            available + '<p>Privacy: logs may contain sensitive vehicle and trip data. This is unencrypted HTTP. ' +
            'Anyone on this network with this link can download the export. Do not forward the link. ' +
            'Stop sharing in the car when finished.</p></html>');
    }

    _download(response) {
        const published = this.export;
        if (!published) {
            this._reply(response, 404, 'No export available. Combine saved sessions in the car first.');
            return;
        }
        // Snapshot the path before async work. An open descriptor pins an atomically replaced export.
        const file = published.path;
        const name = published.name.replace(/[^a-zA-Z0-9._ -]/g, '_').slice(0, 160) || 'data-logger.jsonl';
        let disconnected = response.destroyed;
        let stream = null;
        response.once('close', () => {
            disconnected = true;
            if (stream) stream.destroy();
        });
        fs.open(file, 'r', (openError, fd) => {
            if (openError) {
                this._reply(response, 404, 'Export unavailable. Combine saved sessions again.');
                return;
            }
            const close = (next) => fs.close(fd, () => { if (next) next(); });
            if (disconnected) { close(); return; }
            fs.fstat(fd, (statError, stat) => {
                if (disconnected) { close(); return; }
                if (statError || !stat.isFile()) {
                    close(() => this._reply(response, 404, 'Export unavailable. Combine saved sessions again.'));
                    return;
                }
                const headers = {
                    'Content-Type': 'application/x-ndjson; charset=utf-8',
                    'Content-Disposition': 'attachment; filename="' + name + '"',
                    'Content-Length': stat.size
                };
                if (!stat.size) {
                    close(() => {
                        if (!response.destroyed) { response.writeHead(200, headers); response.end(); }
                    });
                    return;
                }
                try {
                    stream = fs.createReadStream(file, { fd, autoClose: true, start: 0, end: stat.size - 1 });
                } catch (_) {
                    close(() => this._reply(response, 500, 'Unable to read export.'));
                    return;
                }
                stream.on('error', () => {
                    if (response.headersSent) response.destroy();
                    else this._reply(response, 500, 'Unable to read export.');
                });
                response.writeHead(200, headers);
                stream.pipe(response);
            });
        });
    }
}

module.exports = { Download };

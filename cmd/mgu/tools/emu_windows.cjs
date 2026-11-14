'use strict';

// The car runtime detects Unix sockets with stat(). Named pipes use the same
// Node net API on Windows, but do not have a filesystem socket entry.
const fs = require('fs');
const stat = fs.statSync;
fs.statSync = function (filename, ...args) {
    if (process.platform === 'win32' && filename === process.env.MGU_RENDERD_SOCKET &&
            typeof filename === 'string' && filename.startsWith('\\\\.\\pipe\\mgu-emu-')) {
        return { isSocket: () => true };
    }
    return stat.call(this, filename, ...args);
};

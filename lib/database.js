/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';
/* 
    DATABASE FUNCTIONS
    ------------------
    This file hosts the database functionality of the StakeCube Protocol, allowing for synchronous disk I/O operations
*/
const fs = require('fs');

// System Application data directory
let appdata = null;

// StakeCubeCoin Core data directory
let appdataCore = null;

function updatePaths(p1, p2) {
    appdata = p1;
    appdataCore = p2;
}

// Write data to a specified file
async function toDisk (file, data, isJson = false) {
    if (isJson) data = JSON.stringify(data);
    await fs.writeFileSync(appdata + file, data);
    return true;
}

// Write data to a StakeCubeCoin Core file
async function toDiskCore (file, data, isJson = false) {
    if (isJson) data = JSON.stringify(data);
    try {
        await fs.writeFileSync(appdataCore + file, data);
    } catch (e) {
        // This is *probably* due to the user not specifying the correct SCC Core datadir path...
        console.error("FILESYSTEM ERROR: Cannot write file '" + file + "' to SCC Core datadir...\n" +
                      "Current path: '" + appdataCore + "'");
        return false;
    }
    return true;
}

// Read data from a specified StakeCubeCoin Core file
async function fromDiskCore (file, isJson = false) {
    if (!fs.existsSync(appdataCore + file)) return null;
    let data = await fs.readFileSync(appdataCore + file, "utf8");
    if (isJson) data = JSON.parse(data);
    return data;
}

// Read data from a specified file
async function fromDisk (file, isJson = false) {
    if (!fs.existsSync(appdata + file)) return null;
    let data = await fs.readFileSync(appdata + file, "utf8");
    if (isJson) data = JSON.parse(data);
    return data;
}

// Params
exports.appdata = appdata;
exports.appdataCore = appdataCore;
exports.updatePaths = updatePaths;
// Funcs
exports.toDisk = toDisk;
exports.toDiskCore = toDiskCore;
exports.fromDiskCore = fromDiskCore;
exports.fromDisk = fromDisk;
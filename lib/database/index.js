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
const {join} = require("path");
const { toUnicode } = require('punycode');
const appdata = require('./appdata.js');

const pathSCP = appdata.getAppDataPath("SCPWallet") + "/";

// SCC Core data directory
let appdataCore = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support/StakeCubeCoin/' : process.env.HOME + '/.stakecubecoin/');
if (appdataCore === process.env.APPDATA) appdataCore += '/StakeCubeCoin/'; // Append '/StakeCubeCoin/' to the windows appdata directory
appdataCore = appdataCore.replace(/\\/g, '/');

// Write data to a specified file
async function toDisk (file, data, isJson = false) {
    if (isJson) data = JSON.stringify(data);
    await fs.writeFileSync(pathSCP + file, data);
    return true;
}

// Read data from a specified file
async function fromDisk (file, isJson = false) {
    if (!fs.existsSync(pathSCP + file)) return null;
    let data = await fs.readFileSync(pathSCP + file, "utf8");
    if (isJson) data = JSON.parse(data);
    return data;
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

// Loads the current wallet DB
async function getWallet() {
    return await fromDisk("wallet.json", true);
}

// Saves data to the wallet DB
async function setWallet(data) {
    return await toDisk("wallet.json", data, true);
}

// Exposing FS via the database export
exports.fs = fs;
exports.join = join;
// Funcs
exports.appdata = appdata;
exports.toDisk = toDisk;
exports.fromDisk = fromDisk;
exports.toDiskCore = toDiskCore;
exports.fromDiskCore = fromDiskCore;
exports.getWallet = getWallet;
exports.setWallet = setWallet;
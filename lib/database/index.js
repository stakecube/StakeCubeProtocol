/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';
/*
    DATABASE FUNCTIONS
    ------------------
    This file hosts the database functionality of the StakeCube Protocol,
    allowing for synchronous disk I/O operations
*/
const fs = require('fs');
const path = require('path');
let appdata;
try {
    // GUI
    appdata = require('../lib/database/appdata.js');
} catch(e) {
    // Terminal
    appdata = require('./appdata.js');
}

// SCP Wallet data directory
const pathSCP = appdata.getAppDataPath('SCPWallet') + path.sep;

// SCP Wallet config
let SCP_CONFIG = [];

// SCC Core config
let SCC_CONFIG = [];
let sccConfigName = 'stakecubecoin.conf';

// Simplified Payment Verification (Lightwallet)
let spv = false;

// SCC Core data directory
let pathSCC = process.env.APPDATA ||
    (process.platform === 'darwin'
        ? process.env.HOME + // MacOS
            path.sep +
            path.join('Library', 'Application Support', 'StakeCubeCoin') +
            path.sep
        : process.env.HOME + // Linux
            path.sep +
            '.stakecubecoin' +
            path.sep
    );

if (process.platform === 'win32') {
    pathSCC = appdata.getAppDataPath('StakeCubeCoin') + path.sep;
}

// Returns a value from the SC(P/C) Config file, if one doesn't exist, returns the default
function getConfigValue(wantedValue, defaultValue, useSCC = true) {
    for (const keypair of useSCC ? SCC_CONFIG : SCP_CONFIG) {
        if (!keypair.startsWith(wantedValue)) continue;
        // Return the key's value
        return keypair.split('=')[1];
    }
    // No value, return the default, or nothing!
    return defaultValue;
}

// Write data to a specified file
async function toDisk(file, data, isJson = false) {
    if (isJson) data = JSON.stringify(data);
    await fs.writeFileSync(pathSCP + file, data);
    return true;
}

// Read data from a specified file
async function fromDisk(file, isJson = false) {
    if (!fs.existsSync(pathSCP + file)) return null;
    let data = await fs.readFileSync(pathSCP + file, 'utf8');
    if (isJson) data = JSON.parse(data);
    return data;
}

// Write data to a StakeCubeCoin Core file
async function toDiskCore(file, data, isJson = false) {
    if (isJson) data = JSON.stringify(data);
    try {
        await fs.writeFileSync(pathSCC + file, data);
    } catch(e) {
        // This is *probably* due to the user not specifying the correct SCC Core datadir path...
        console.error("FILESYSTEM ERROR: Cannot write file '" + file +
            "' to SCC Core datadir...\n" +
            "Current path: '" + pathSCC + "'");
        return false;
    }
    return true;
}

// Read data from a specified StakeCubeCoin Core file
async function fromDiskCore(file, isJson = false) {
    if (!fs.existsSync(pathSCC + file)) return null;
    let data = await fs.readFileSync(pathSCC + file, 'utf8');
    if (isJson) data = JSON.parse(data);
    return data;
}

// Loads the current wallet DB
async function getWallet() {
    return await fromDisk('wallet.json', true);
}

// Saves data to the wallet DB
async function setWallet(data) {
    return await toDisk('wallet.json', data, true);
}

// Check SPV mode
async function isSPV() {
    return spv;
}

// Initialize the DB, config, and paths for SCC & SCP
async function init(forceCorePath = false) {
    // If a 'forceCorePath' is present, force this path for SCC Core's config.
    // This was likely passed by the Windows Regex client, which is fine.
    if (forceCorePath && forceCorePath.length) {
        if (!forceCorePath.endsWith(path.sep)) {
            forceCorePath += path.sep;
        }
        pathSCC = path.normalize(forceCorePath);
    }

    // Load the SCP config
    const strConfSCP = await fromDisk('scp.conf');
    // Make sure there's atleast *something* in the config
    if (!strConfSCP) {
        console.warn('No SCP config file detected!');
        await toDisk('scp.conf', '', false);
    } else {
        // Split lines into an array of config values
        SCP_CONFIG = strConfSCP.trim().split(/[\r\n]+/gm);
        // Check for core options and assign them
        // Config Directory
        let strCoreDir = getConfigValue('coredatadir', false, false);
        if (!forceCorePath && strCoreDir.length) {
            if (!strCoreDir.endsWith(path.sep)) {
                strCoreDir += path.sep;
            }
            pathSCC = path.normalize(strCoreDir);
            console.log('Init: Using custom SCC Core datadir:\n' +
                        pathSCC);
        } else {
            console.log('Init: Using default SCC Core datadir:\n' +
                        pathSCC);
        }
        // Config Filename
        const strCoreFilename = getConfigValue('coreconfname', false, false);
        if (strCoreFilename && strCoreFilename.length) {
            sccConfigName = strCoreFilename;
            console.log('Init: Using custom SCC Core config filename:\n' +
                        sccConfigName);
        }
    }

    // Load the core config
    // Make sure there's atleast *something* in the config
    const strConfSCC = await fromDiskCore(sccConfigName);
    
    if (!strConfSCC) {
        // No SCC Core config found
        console.warn('Init: No SCC Core config file detected!\nNote: If ' +
                     'you\'d like to run a full-node, please correct this ' +
                     'via your SCP config file, with "coredatadir=xxxx".\n' +
                     'Another note: If you changed your conf file name, ' +
                     'use "coreconfname=xxx.conf" additionally to specify it.');
        // Set to SPV mode
        spv = true;
    } else {
        // SCC Core config found, split lines into an array of config values
        SCC_CONFIG = strConfSCC.trim().split(/[\r\n]+/gm);
        console.log('Init: Successfully loaded SCC Core config with ' +
                    SCC_CONFIG.length + ' values!');
        // Running a Fullnode 
        spv = false;
    }
}

try {
    // Exposing FS via the database export
    exports.fs = fs;
    exports.join = path.join;
    exports.path = path;
    // Vars
    exports.scpPath = pathSCP;
    exports.sccPath = pathSCC;
    // Funcs
    exports.getConfigValue = getConfigValue;
    exports.appdata = appdata;
    exports.toDisk = toDisk;
    exports.fromDisk = fromDisk;
    exports.toDiskCore = toDiskCore;
    exports.fromDiskCore = fromDiskCore;
    exports.getWallet = getWallet;
    exports.setWallet = setWallet;
    exports.isSPV = isSPV;
    exports.init = init;
} catch(e) {}

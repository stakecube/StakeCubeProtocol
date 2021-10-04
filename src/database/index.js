/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';
/*
    DATABASE FUNCTIONS
    ------------------
    This file hosts the database functionality of the SCP Wallet,
    controlling config loading and wrapping system disk I/O.
*/
const path = require('path');
let appdata;
let disk;
let conf;
let statedb;
try {
    // GUI
    appdata = require('../src/database/appdata.js');
    disk = require('../src/database/disk.js');
    conf = require('../src/database/config.js');
    statedb = require('../src/database/state.js');
} catch(e) {
    // Terminal
    appdata = require('./appdata.js');
    disk = require('./disk.js');
    conf = require('./config.js');
    statedb = require('./state.js');
}

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

// Loads the current wallet DB
async function getWallet() {
    return await disk.readSCP('wallet.json', true);
}

// Saves data to the wallet DB
async function setWallet(data) {
    return await disk.writeSCP('wallet.json', data, true);
}

// Create a new sync-assist snapshot
async function createSyncAssistSnap() {
    return await statedb.setSyncAssist();
}

// Load the current Sync Assist snapshot, if any exists
async function getSyncAssistSnap() {
    return await statedb.getSyncAssist();
}

// Initialize the DB, config, and paths for SCC & SCP
async function init(forceCorePath = false, retry = false) {
    // If a 'forceCorePath' is present, force this path for SCC Core's config.
    // This was likely passed by the Windows Regex client, which is fine.
    if (forceCorePath) {
        forceCorePath += path.sep;
        pathSCC = path.normalize(forceCorePath);
    }

    // Set SCP Wallet datadir path
    const pathSCP = appdata.getAppDataPath('SCPWallet') + path.sep;
    disk.setPath(pathSCP, false);

    // Ensure the SCPWallet Datadir exists
    disk.fs.mkdirSync(disk.getPath(), { 'recursive': true });

    // Load the SCP config
    const strConfSCP = await disk.readSCP('scp.conf');
    if (!conf.setConfig(strConfSCP, false)) {
        if (!retry) {
            console.warn('Init: No SCP config file detected!');
        }
        await disk.writeSCP('scp.conf', '', false);
    } else {
        // Check for core options and assign them
        // Config Directory
        let strCoreDir = conf.getConfigValue('coredatadir', false, false);
        if (strCoreDir) {
            strCoreDir += path.sep;
            pathSCC = path.normalize(strCoreDir);
            if (!retry) {
                console.log('Init: Using custom SCC Core datadir:\n' +
                            pathSCC);
            }
        } else {
            if (!retry) {
                console.log('Init: Using default SCC Core datadir:\n' +
                            pathSCC);
            }
        }
        // Config Filename
        const strCoreName = conf.getConfigValue('coreconfname', false, false);
        if (strCoreName && strCoreName.length) {
            conf.setConfigName(strCoreName);
            if (!retry) {
                console.log('Init: Using custom SCC Core config filename:\n' +
                            conf.getConfigName());
            }
        }
    }

    // Initialize the StateDB
    statedb.init(exports, disk);

    // Set SCC Core datadir path
    disk.setPath(pathSCC, true);

    // Load the core config
    const strConfSCC = await disk.readSCC(conf.getConfigName());
    if (!conf.setConfig(strConfSCC, true)) {
        console.warn('Init: No SCC Core config file detected!\nNote: If ' +
                     'you\'d like to run a full-node, please correct this ' +
                     'via your SCP config file, with "coredatadir=xxxx".\n' +
                     'Another note: If you changed your conf file name, ' +
                     'use "coreconfname=xxx.conf" additionally to specify it.');
    } else {
        if (!retry) {
            console.log('Init: Successfully loaded SCC Core config with ' +
                        conf.getConfig(true).length + ' values!');
        }
    }
}

try {
    // Exposing FS and Config
    exports.fs = disk.fs;
    exports.join = path.join;
    exports.path = path;
    exports.getConfigValue = conf.getConfigValue;
    exports.state = statedb;
    // Funcs
    exports.appdata = appdata;
    exports.getWallet = getWallet;
    exports.setWallet = setWallet;
    exports.createSyncAssistSnap = createSyncAssistSnap;
    exports.getSyncAssistSnap = getSyncAssistSnap;
    exports.init = init;
} catch(e) {}

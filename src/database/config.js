/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';
/*
    CONFIG FUNCTIONS
    ----------------
    This file hosts the config functionality of the SCP Wallet,
    granting easy access to config params, setting or getting.
*/

// SCP Wallet config
let SCP_CONFIG = [];

// SCC Core config
let SCC_CONFIG = [];
let sccConfigName = 'stakecubecoin.conf';

function setConfigName(strName) {
    sccConfigName = strName;
}

function getConfigName() {
    return sccConfigName;
}

function setConfig(arrConf, useSCC = false) {
    if (typeof arrConf === 'string') arrConf = parseConfig(arrConf);
    if (!Array.isArray(arrConf) || !arrConf.length) return false;
    if (useSCC) {
        SCC_CONFIG = arrConf;
    } else {
        SCP_CONFIG = arrConf;
    }
    return true;
}

function getConfig(useSCC = false) {
    return useSCC ? SCC_CONFIG : SCP_CONFIG;
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

// Returns an array of the parsed key/value config file
function parseConfig(strConf) {
    if (!strConf || !strConf.length) return [];
    // Split lines into an array of lines
    const arrConfRaw = strConf.trim().split(/[\r\n]+/gm);
    const arrConf = [];
    // Remove comments
    for (const strLine of arrConfRaw) {
        if (strLine.startsWith('#')) continue;
        arrConf.push(strLine);
    }
    // Return parsed, clean config lines
    return arrConf;
}

exports.setConfigName = setConfigName;
exports.getConfigName = getConfigName;
exports.setConfig = setConfig;
exports.getConfig = getConfig;
exports.getConfigValue = getConfigValue;
exports.parseConfig = parseConfig;

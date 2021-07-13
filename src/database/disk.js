/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';
/*
    DISK FUNCTIONS
    --------------
    This file hosts the disk read/write functionality of the SCP Wallet,
    allowing for synchronous disk I/O operations
*/
const fs = require('fs');

// Filesystem paths
let pathSCP = '';
let pathSCC = '';

function setPath(strPath, useSCC = false) {
    if (useSCC) {
        pathSCC = strPath;
    } else {
        pathSCP = strPath;
    }
    return true;
}

function getPath(useSCC = false) {
    return useSCC ? pathSCC : pathSCP;
}

// Write data to a SCP file
async function writeSCP(file, data, isJson = false) {
    fs.writeFileSync(pathSCP + file,
        isJson ? JSON.stringify(data) : data);
    return true;
}

// Read data from a SCP file
async function readSCP(file, isJson = false) {
    if (!fs.existsSync(pathSCP + file)) return null;
    const data = fs.readFileSync(pathSCP + file, 'utf8');
    return isJson ? JSON.parse(data) : data;
}

// Write data to a SCC Core file
async function writeSCC(file, data, isJson = false) {
    try {
        fs.writeFileSync(pathSCC + file,
            isJson ? JSON.stringify(data) : data);
    } catch(e) {
        // This is *probably* due to the user not specifying the correct SCC Core datadir path...
        console.error("DB ERROR: Cannot write file '" + file + "' to SCC Core" +
                      " datadir!\nCurrent path: '" + pathSCC + "'");
        return false;
    }
    return true;
}

// Read data from a specified SCC Core file
async function readSCC(file, isJson = false) {
    if (!fs.existsSync(pathSCC + file)) return null;
    const data = fs.readFileSync(pathSCC + file, 'utf8');
    return isJson ? JSON.parse(data) : data;
}

exports.fs = fs;
exports.setPath = setPath;
exports.getPath = getPath;
exports.writeSCP = writeSCP;
exports.readSCP = readSCP;
exports.writeSCC = writeSCC;
exports.readSCC = readSCC;

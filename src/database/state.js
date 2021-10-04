/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';
/*
    STATE DATABASE FUNCTIONS
    ------------------------
    This file hosts the database functionality of the SCP State,
    allowing the ability to save the state to disk, read the state,
    or create 'sync assist' snapshots for assisted full-node syncs.
*/

// Modules
let DB, disk;

// Pointers
let arrStatePtr = [];

function init(context, d) {
    DB = context;
    disk = d;
}

function setStateMsgPtr(ptr) {
    arrStatePtr = ptr;
}

async function setSyncAssist() {
    // Create a non-duplicate, height-only map of all state message blocks
    const arrBlks = Array.from(new Set(arrStatePtr.map(a => a.height)));
    // Save to disk as JSON
    return await disk.writeSCP('snap.sync', arrBlks, true);
}

async function getSyncAssist() {
    // Open the Sync Assist file, if any exists
    const arrBlks = await disk.readSCP('snap.sync', true);
    // Always keep ascending order
    if (Array.isArray(arrBlks)) {
        arrBlks.sort((a, b) => { return a - b });
    }
    return arrBlks;
}

exports.init = init;
exports.setStateMsgPtr = setStateMsgPtr;
exports.setSyncAssist = setSyncAssist;
exports.getSyncAssist = getSyncAssist;
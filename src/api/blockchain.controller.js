/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';

// The permissions controller, allows/disallows usage of the module
const cPerms = require('./permissions.js');

// Contextual pointers provided by the index.js process
let ptrGetFullMempool;
let ptrIsFullnode;
let strModule;

function init(context) {
    ptrGetFullMempool = context.gfm;
    ptrIsFullnode = context.isFullnode;
    // Static Non-Pointer (native value)
    strModule = context.strModule;
    // Initialize permissions controller
    cPerms.init({ 'DB': context.DB });
}

async function getFullMempool(req, res) {
    if (!cPerms.isModuleAllowed(strModule)) {
        return disabledError(res);
    }
    if (!ptrIsFullnode()) {
        return fullnodeError(res);
    }
    res.json(await ptrGetFullMempool());
}

function fullnodeError(res) {
    return res.status(403).json({
        'error': 'This endpoint is only available to Full-nodes, please ' +
                 'connect an SCC Core RPC server to enable as a Full-node!'
    });
}

function disabledError(res) {
    return res.status(403).json({
        'error': 'This module (' + strModule + ') is disabled!'
    });
}

exports.init = init;
exports.getFullMempool = getFullMempool;

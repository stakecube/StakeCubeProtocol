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
let arrAllowedCallers;

function init(context) {
    ptrGetFullMempool = context.gfm;
    ptrIsFullnode = context.isFullnode;
    arrAllowedCallers = context.callers;
    // Static Non-Pointer (native value)
    strModule = context.strModule;
    // Initialize permissions controller
    return cPerms.init({ 'DB': context.DB, 'strModule': strModule });
}

async function getFullMempool(req, res) {
    if (!hasPermission(req, res)) return false;
    res.json(await ptrGetFullMempool());
}

function callerError(req, res) {
    res.status(403).json({
        'error': 'Your IP (' + req.ip + ') is not in the API whitelist!'
    });
    return false;
}

function fullnodeError(res) {
    res.status(403).json({
        'error': 'This endpoint is only available to Full-nodes, please ' +
                 'connect an SCC Core RPC server to enable as a Full-node!'
    });
    return false;
}

function disabledError(res) {
    res.status(403).json({
        'error': 'This module (' + strModule + ') is disabled!'
    });
    return false;
}

function hasPermission(req, res) {
    // Caller IP check
    if (!arrAllowedCallers.includes('all') &&
        !arrAllowedCallers.includes(req.ip.replace(/::ffff:/g, ''))) {
        return callerError(req, res);
    }
    // Full Node check
    if (!ptrIsFullnode()) return fullnodeError(res);
    // Module activation status
    if (!cPerms.isModuleAllowed(strModule)) return disabledError(res);

    // If we reach here, then all checks are a-go!
    return true;
}

exports.init = init;
exports.getFullMempool = getFullMempool;

/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';

// The permissions controller, allows/disallows usage of the module
let cPerms = require('./permissions.js');

// Contextual pointers provided by the index.js process
let ptrTOKENS;
let ptrIsFullnode;
let strModule;

function init(context) {
    ptrTOKENS = context.TOKENS;
    ptrIsFullnode = context.isFullnode;
    // Static Non-Pointer (native value)
    strModule = context.strModule;
    // Initialize permissions controller
    cPerms.init({ DB: context.DB });
}

async function getAllTokens(req, res) {
    if (!cPerms.isModuleAllowed(strModule)) {
        return disabledError(res);
    }
    if (!ptrIsFullnode()) {
        return fullnodeError(res);
    }
    res.json(ptrTOKENS.getTokensPtr());
}

function getToken(req, res) {
    if (!cPerms.isModuleAllowed(strModule)) {
        return disabledError(res);
    }
    if (!ptrIsFullnode()) {
        return fullnodeError(res);
    }
    if (!req.params.contract || req.params.contract.length !== 64) {
        return res.json({
            'error': "You must specify a 'contract' param!"
        });
    }
    const cToken = ptrTOKENS.getToken(req.params.contract);
    if (cToken.error) {
        return res.json({
            'error': 'Token contract does not exist!'
        });
    }
    res.json(cToken);
}

function getTokensByAccount(req, res) {
    if (!cPerms.isModuleAllowed(strModule)) {
        return disabledError(res);
    }
    if (!ptrIsFullnode()) {
        return fullnodeError(res);
    }
    if (!req.params.account || req.params.account.length <= 1) {
        return res.json({
            'error': "You must specify an 'account' param!"
        });
    }
    res.json(ptrTOKENS.getTokensByAccount(req.params.account));
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
exports.getAllTokens = getAllTokens;
exports.getToken = getToken;
exports.getTokensByAccount = getTokensByAccount;

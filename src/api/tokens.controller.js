/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';

// The permissions controller, allows/disallows usage of the module
const cPerms = require('./permissions.js');

// Contextual pointers provided by the index.js process
let ptrTOKENS;
let ptrNFT;
let ptrIsFullnode;
let strModule;

function init(context) {
    ptrTOKENS = context.TOKENS;
    ptrNFT = context.NFT;
    ptrIsFullnode = context.isFullnode;
    // Static Non-Pointer (native value)
    strModule = context.strModule;
    // Initialize permissions controller
    return cPerms.init({ 'DB': context.DB, 'strModule': strModule });
}

/* ---- Divisible Tokens (SCP-1, SCP-2) ---- */

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

async function getStakingStatus(req, res) {
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
    if (!req.params.account || req.params.account.length !== 34) {
        return res.json({
            'error': "You must specify an 'account' param!"
        });
    }
    const cToken = ptrTOKENS.getToken(req.params.contract);
    if (cToken.error) {
        return res.json({
            'error': 'Token contract does not exist!'
        });
    }
    if (cToken.version !== 2) {
        return res.json({
            'error': 'Token is not an SCP-2!'
        });
    }
    res.json(cToken.getStakingStatus(req.params.account));
}

/* ---- NFTs (SCP-4) ---- */

async function getAllCollections(req, res) {
    if (!cPerms.isModuleAllowed(strModule)) {
        return disabledError(res);
    }
    if (!ptrIsFullnode()) {
        return fullnodeError(res);
    }
    res.json(ptrNFT.getCollectionPtr());
}

function getCollection(req, res) {
    if (!cPerms.isModuleAllowed(strModule)) {
        return disabledError(res);
    }
    if (!ptrIsFullnode()) {
        return fullnodeError(res);
    }
    if (!req.params.contract) {
        return res.json({
            'error': "You must specify a 'contract' param!"
        });
    }
    const cCollection = ptrNFT.getCollection(req.params.contract);
    if (cCollection.error) {
        return res.json({
            'error': 'Collection contract does not exist!'
        });
    }
    res.json(cCollection);
}

function getNFTsByAccount(req, res) {
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
    res.json(ptrNFT.getAllNFTsByAccount(req.params.account));
}

function getNFTbyID(req, res) {
    if (!cPerms.isModuleAllowed(strModule)) {
        return disabledError(res);
    }
    if (!ptrIsFullnode()) {
        return fullnodeError(res);
    }
    if (!req.params.id || req.params.id.length <= 1) {
        return res.json({
            'error': "You must specify an 'id' param!"
        });
    }
    res.json(ptrNFT.getNFTbyId(req.params.id));
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
// SCP-1, SCP-2
exports.getAllTokens = getAllTokens;
exports.getToken = getToken;
exports.getTokensByAccount = getTokensByAccount;
exports.getStakingStatus = getStakingStatus;
// SCP-4
exports.getAllCollections = getAllCollections;
exports.getCollection = getCollection;
exports.getNFTsByAccount = getNFTsByAccount;
exports.getNFTbyID = getNFTbyID;
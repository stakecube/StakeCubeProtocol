/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';

// Contextual pointers provided by the index.js process
let ptrTOKENS;

function init(context) {
    ptrTOKENS = context.TOKENS;
}

async function getAllTokens(req, res) {
    res.json(ptrTOKENS.getTokensPtr());
}

function getToken(req, res) {
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
    if (!req.params.account || req.params.account.length <= 1) {
        return res.json({
            'error': "You must specify an 'account' param!"
        });
    }
    res.json(ptrTOKENS.getTokensByAccount(req.params.account));
}

exports.init = init;
exports.getAllTokens = getAllTokens;
exports.getToken = getToken;
exports.getTokensByAccount = getTokensByAccount;
/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';
/* 
    SCP-1 TOKEN FUNCTIONS
    ------------------
    This file hosts the interpreter functionality, classes and logic handling of SCP-1 tokens.
*/

// The current chain state of SCP-1 tokens
let stateTokens = [];

// The class of each individual token, containing all pre-processed state data
class SCPToken {
    constructor(contract, name, ticker, maxSupply, creator, owners = []) {
        this.contract  = contract;
        this.name      = name;
        this.ticker    = ticker;
        this.maxSupply = maxSupply;
        this.creator   = creator;
        this.owners    = owners;
    }
}

function addToken(cToken = SCPToken) {
    // First, ensure the token isn't already indexed in the current chain state.
    for (const token of stateTokens) {
        if (token.contract === cToken.contract) return { error: true, message: "SCP-1 Token already indexed in current chain state.", id: 8 };
    }
    // Push the token into the SCP-1 token state tracker.
    stateTokens.push(cToken);
    return true;
}

function getToken(txid = String) {
    // Find a token by it's contract TX-ID
    for (const token of stateTokens) {
        if (token.contract === txid.contract) return token;
    }
    // If we reach here, no token contract found!
    return { error: true, message: "SCP-1 Token is not indexed in current chain state.", id: 9 };
}

function getTokensPtr() {
    // Return the full list of tokens
    return stateTokens;
}

// Class
exports.SCPToken = SCPToken;
// Funcs
exports.addToken  = addToken;
exports.getToken  = getToken;
exports.getTokensPtr = getTokensPtr;
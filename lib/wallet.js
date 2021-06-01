/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';

/* 
    WALLET FUNCTIONS
    ------------------
    This file hosts the wallet functionality of the StakeCube Protocol Wallet, allowing for
    fully automated management of UTXOs, mempool tracking, UTXO locking, Coin Control, etc.
*/

// The amount of satoshis that make a full coin
const COIN = 100000000;

let pubkeyMain = "";
let privkeyMain = "";

// Sets the pubkey and privkey of the wallet
function setKeys(pubkey = new String, privkey = new String) {
    if (pubkey)
        pubkeyMain  = pubkey;
    if (privkey)
        privkeyMain = privkey;
    return true;
}

// Returns the loaded pubkey
function getPubkey()  { return pubkeyMain; }
// Returns the loaded privkey
function getPrivkey() { return privkeyMain; }

class UTXO {
    constructor(id, vout, script, sats, spent = false) {
        this.id     = id;
        this.vout   = vout;
        this.script = script;
        this.sats   = sats;
        // UTXOs are assumed to be unspent by default
        this.spent  = spent;
    }
}

// The cache of wallet-owned UTXOs
let arrUTXOs = [];

// Returns the balance of the wallet (aggregate UTXOs value)
function getBalance() {
    let nBal = 0;
    for (const cUTXO of arrUTXOs) {
      if (cUTXO.spent) continue;
      // Calculate the balance from our UTXO cache
      nBal += Number((cUTXO.sats / COIN).toFixed(8));
    }
    return nBal;
}

// Returns the fee for the given bytes
function getFee(bytes) { return Number(((bytes * 2) / COIN).toFixed(8)); }

// Deep-clones a UTXO
function deepCloneUTXO(utxo = new UTXO) {
    return new UTXO(utxo.id, utxo.vout, utxo.script, utxo.sats, utxo.spent);
}

// Searches for a single UTXO and returns it, if it exists
function getUTXO(id, vout) {
    for (const cUTXO of arrUTXOs) {
        if (cUTXO.id === id && cUTXO.vout === vout) return cUTXO;
    }
    return false;
}

// Adds a new UTXO to the wallet, if not already added
function addUTXO(id, vout, script, sats, spent = false) {
    if (getUTXO(id, vout)) return false;
    // Our wallet doesn't contain this UTXO, add it!
    arrUTXOs.push(new UTXO(id, vout, script, sats, spent));
}

// Removes a new UTXO to the wallet, if it exists
function removeUTXO(id, vout) {
    let i, len = arrUTXOs.length;
    for (i = 0; i<len; i++) {
        let cUTXO = arrUTXOs[i];
        if (cUTXO.id === id && cUTXO.vout === vout) {
            // Splice the UTXO from our list and return true!
            arrUTXOs.splice(i, 1);
            return true;
        }
    }
    // If we reach here, our wallet doesn't contain this UTXO, return false
    return false;
}

// Merges a new set of of UTXOs into the current set
// - Removes UTXOs from the wallet which are no longer in the mempool (and were spent).
// - Adds UTXOs from the mempool which we werent previously aware of.
function mergeUTXOs(arrNewUTXOs) {
    // Merge new UTXOs into our set
    for (const cNewUTXO of arrNewUTXOs) {
        if (!getUTXO(cNewUTXO.id, cNewUTXO.vout)) {
            // We don't have this UTXO, add it!
            arrUTXOs.push(deepCloneUTXO(cNewUTXO));
        } // else, we have this UTXO already
    }
    // Remove UTXOs which are no longer present in the list
    for (const cUTXO of arrUTXOs) {
        let hasUTXO = false;
        for (const cNewUTXO of arrNewUTXOs) {
            if (cUTXO.id === cNewUTXO.id && cUTXO.vout === cNewUTXO.vout) {
                // We still have this UTXO
                hasUTXO = true;
            }
        }
        // Do we still have this UTXO?
        if (!hasUTXO) {
            // Nuke it!
            removeUTXO(cUTXO.id, cUTXO.vout);
        }
    }
}

// Returns the direct UTXO cache pointer, NOT recommended for most usage
function getUTXOsPtr() {
    return arrUTXOs;
}

// Class
exports.UTXO = UTXO;
// Funcs
exports.setKeys       = setKeys;
exports.getPubkey     = getPubkey;
exports.getPrivkey    = getPrivkey;
exports.getBalance    = getBalance;
exports.getFee        = getFee;
exports.deepCloneUTXO = deepCloneUTXO
exports.getUTXO       = getUTXO;
exports.addUTXO       = addUTXO;
exports.removeUTXO    = removeUTXO;
exports.mergeUTXOs    = mergeUTXOs;
exports.getUTXOsPtr   = getUTXOsPtr;
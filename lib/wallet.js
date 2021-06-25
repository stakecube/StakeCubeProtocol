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

const sccjs = require('scc-js');

// The amount of satoshis that make a full coin
const COIN = 100000000;

let opt2FA = '';

// Sets the 2FA private code
function set2FAkey(code = false) {
    opt2FA = code;
}

// Returns the loaded 2FA privkey
function get2FAkey() {
    return opt2FA;
}

class Wallet {
    constructor(pubkey, privkey, privkeyEnc) {
        this.pubkey = pubkey || null;
        this.privkey = privkey || null;
        this.privkeyEnc = privkeyEnc || null;
    }

    // Sets the pubkey and privkey of the wallet
    setKeys(pubkey = false, privkey = false, privkeyEnc = false) {
        if (pubkey) {
            this.pubkey = pubkey;
        }
        if (privkey) {
            this.privkey = privkey;
        }
        if (privkeyEnc) {
            this.privkeyEnc = privkeyEnc;
        }
        return true;
    }

    // Returns the loaded pubkey
    getPubkey() {
        return this.pubkey;
    }

    // Returns the loaded privkey
    getPrivkey() {
        return this.privkey;
    }

    // Returns the loaded encrypted privkey
    getPrivkeyEnc() {
        return this.privkeyEnc;
    }

    // Formats the wallet database for DB storage
    toDB() {
        return {
            'pubkey': this.pubkey,
            'privkeyDecrypted': this.privkeyEnc !== null ? '' : this.privkey,
            'privkeyEncrypted': this.privkeyEnc
        };
    }
}

class UTXO {
    constructor(address, id, vout, script, sats, spent = false) {
        this.address = address;
        this.id = id;
        this.vout = vout;
        this.script = script;
        this.sats = sats;
        // UTXOs are assumed to be unspent by default
        this.spent = spent;
        this.mempool = false;
    }
}

// The cache of all loaded wallets, a wallet consists of: pubkey, privkey, privkeyEncrypted
const arrWallets = [];

// Deep-clones a Wallet
function deepCloneWallet(cWallet = new Wallet()) {
    return new Wallet(
        cWallet.pubkey,
        cWallet.privkey,
        cWallet.privkeyEnc);
}

// Finds a wallet, by it's address or privkey, and if it exists
function getWallet(query = String()) {
    for (const cWallet of arrWallets) {
        if (cWallet.getPubkey() === query ||
            cWallet.getPrivkey() === query) {
            return cWallet;
        }
    }
    return false;
}

// Returns the first wallet of the cache, generally considered the 'active' wallet for GUI purposes
function getActiveWallet() {
    if (arrWallets.length > 0) {
        return arrWallets[0];
    } else {
        return false;
    }
}

// Adds a wallet, if it doesn't already exist
function addWallet(cNewWallet = new Wallet()) {
    if (getWallet(cNewWallet.getPrivkey()) ||
        getWallet(cNewWallet.getPubkey())) {
        return false;
    }
    arrWallets.push(deepCloneWallet(cNewWallet));
    console.log('Loaded new wallet! Now ' + arrWallets.length + ' loaded.');
    // Return the *pointer* of the new wallet - very important to avoid data loss!
    return getWallet(cNewWallet.pubkey);
}

// Creates a new wallet
async function createWallet() {
    const rawWallet = await sccjs.generateWallet();
    console.log('Generated wallet!');
    console.log('Pubkey:  ' + rawWallet.pubkey);
    console.log('Privkey: ' + rawWallet.privkey.substr(0, 6) + '...');
    addWallet(new Wallet(rawWallet.pubkey, rawWallet.privkey, false));
    // Return the *pointer* of the new wallet - very important to avoid data loss!
    return getWallet(rawWallet.pubkey);
}

// The cache of wallet-owned UTXOs
const arrUTXOs = [];

// Returns the balance of the wallet (aggregate UTXOs value)
function getBalance() {
    let nBal = 0;
    for (const cUTXO of getAvailableUTXOs()) {
        // Calculate the balance from our UTXO cache
        nBal += Number((cUTXO.sats / COIN).toFixed(8));
    }
    return nBal;
}

// Returns the fee for the given bytes
function getFee(bytes) {
    return Number(((bytes * 2) / COIN).toFixed(8));
}

// Deep-clones a UTXO
function deepCloneUTXO(utxo = new UTXO()) {
    return new UTXO(
        utxo.address,
        utxo.id, utxo.vout,
        utxo.script, utxo.sats,
        utxo.spent);
}

// Searches for a single UTXO and returns it, if it exists
function getUTXO(id, vout) {
    for (const cUTXO of arrUTXOs) {
        if (cUTXO.id === id && cUTXO.vout === vout) return cUTXO;
    }
    return false;
}

// Adds a new UTXO to the wallet, if not already added
function addUTXO(address, id, vout, script, sats, spent = false) {
    if (getUTXO(id, vout)) return false;
    // Our wallet doesn't contain this UTXO, add it!
    arrUTXOs.push(new UTXO(address, id, vout, script, sats, spent));
}

// Removes a new UTXO to the wallet, if it exists
function removeUTXO(id, vout) {
    let i; const len = arrUTXOs.length;
    for (i = 0; i < len; i++) {
        const cUTXO = arrUTXOs[i];
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
        const cUTXO = getUTXO(cNewUTXO.id, cNewUTXO.vout);
        if (!cUTXO) {
            // We don't have this UTXO, add it!
            arrUTXOs.push(deepCloneUTXO(cNewUTXO));
        } else {
            // We have this UTXO, but did it's properties change?
            if (cNewUTXO.mempool !== cUTXO.mempool) {
                cUTXO.mempool = cNewUTXO.mempool;
            }
        }
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

// Returns a list of all incoming mempool UTXOs
function getIncomingUTXOs() {
    const arrMempoolUTXOs = [];
    for (const cUTXO of arrUTXOs) {
        if (cUTXO.mempool && !cUTXO.spent) arrMempoolUTXOs.push(cUTXO);
    }
    return arrMempoolUTXOs;
}

// Returns a list of all available (unspent) UTXOs
function getAvailableUTXOs() {
    const arrAvailUTXOs = [];
    for (const cUTXO of arrUTXOs) {
        if (!cUTXO.spent) arrAvailUTXOs.push(cUTXO);
    }
    return arrAvailUTXOs;
}

// Returns a list of calculated UTXOs to be spent in fulfilment of the given spend parameters
function getCoinsToSpend(sats = 0, min = false, chosenAddress = false) {
    let spent = 0;
    const chosenUTXOs = [];
    const suitableUTXOs = getAvailableUTXOs();
    // Goal: Loop all UTXOs until the 'spent' amount is >= the sats amount, plus estimated fees
    for (const cUTXO of suitableUTXOs) {
        // If a minimum is enforced, ONLY accept UTXOs above the minimum
        if (min && cUTXO.sats <= sats) continue;
        // If an address is enforced, ONLY accept UTXOs from said address
        if (chosenAddress && cUTXO.address !== chosenAddress) continue;
        if (spent >= (sats + 1000)) {
            console.log('Coin Control: Selected ' + chosenUTXOs.length +
                        ' input(s) (' + (spent / COIN) + ' SCC)');
            return chosenUTXOs;
        }
        spent += cUTXO.sats;
        chosenUTXOs.push(cUTXO);
    }
    // If we reach here, we don't have sufficient balance for the spend!
    return chosenUTXOs;
}

// Returns the entire wallets cache in a DB-sanitized format
function toDB() {
    const objDB = {
        'wallets': [],
        'opt2FA': get2FAkey()
    };
    // Add each wallet
    for (const cWallet of arrWallets) {
        objDB.wallets.push(cWallet.toDB());
    }
    return objDB;
}

// Returns the direct UTXO cache pointer, NOT recommended for most usage
function getUTXOsPtr() {
    return arrUTXOs;
}

// Lib exports
exports.sccjs = sccjs;
// Class
exports.Wallet = Wallet;
exports.UTXO = UTXO;
// Funcs
exports.deepCloneWallet = deepCloneWallet;
exports.getWallet = getWallet;
exports.getActiveWallet = getActiveWallet;
exports.addWallet = addWallet;
exports.createWallet = createWallet;
exports.set2FAkey = set2FAkey;
exports.get2FAkey = get2FAkey;
exports.getBalance = getBalance;
exports.getFee = getFee;
exports.deepCloneUTXO = deepCloneUTXO;
exports.getUTXO = getUTXO;
exports.addUTXO = addUTXO;
exports.removeUTXO = removeUTXO;
exports.mergeUTXOs = mergeUTXOs;
exports.getIncomingUTXOs = getIncomingUTXOs;
exports.getAvailableUTXOs = getAvailableUTXOs;
exports.getCoinsToSpend = getCoinsToSpend;
exports.getUTXOsPtr = getUTXOsPtr;
exports.toDB = toDB;

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
const NET = require('./network.js');

let ptrIsHeadless;
let ptrRpcMain;
let ptrGetFullMempool;
let ptrCOIN;

function init(context) {
    ptrIsHeadless = context.isHeadless;
    ptrGetFullMempool = context.gfm;
    ptrRpcMain = context.rpcMain;
    ptrCOIN = context.COIN;
}

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

// Returns the count of wallets in memory
function countWallets() {
    return arrWallets.length;
}

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
    // Return the *pointer* of the new wallet - very important to avoid data loss!
    return getWallet(cNewWallet.pubkey);
}

// Creates a new wallet
async function createWallet() {
    const rawWallet = await sccjs.generateWallet();
    addWallet(new Wallet(rawWallet.pubkey, rawWallet.privkey, false));
    console.log('Created new wallet! Now ' + arrWallets.length + ' loaded.');
    // Return the *pointer* of the new wallet - very important to avoid data loss!
    return getWallet(rawWallet.pubkey);
}

// The cache of wallet-owned UTXOs
const arrUTXOs = [];

// Returns the balance of the wallet (aggregate UTXOs value)
function getBalance(strAddr = false) {
    return getAvailableUTXOs(strAddr)
        .reduce((a, b) => {
            return a + b.sats;
        }, 0) / ptrCOIN;
}

// Returns the fee for the given bytes
function getFee(nBytes) {
    return (nBytes * 2) / ptrCOIN;
}

// Deep-clones a UTXO
function deepCloneUTXO(utxo = new UTXO()) {
    const cNewUTXO = new UTXO(
        utxo.address,
        utxo.id, utxo.vout,
        utxo.script, utxo.sats,
        utxo.spent);
    cNewUTXO.mempool = utxo.mempool;
    return cNewUTXO;
}

// Searches for a single UTXO and returns it, if it exists
function getUTXO(id, vout) {
    return arrUTXOs.find(a => a.vout === vout && a.id === id) || false;
}

// Adds a new UTXO to the wallet, if not already added
function addUTXO(address, id, vout, script, sats, spent = false) {
    if (getUTXO(id, vout)) return false;
    // Our wallet doesn't contain this UTXO, add it!
    arrUTXOs.push(new UTXO(address, id, vout, script, sats, spent));
}

// Removes a new UTXO to the wallet, if it exists
function removeUTXO(id, vout) {
    const i = arrUTXOs.findIndex(a => a.vout === vout && a.id === id);
    if (i === -1) return false;
    arrUTXOs.splice(i, 1);
    return true;
}

// Merges a new set of of UTXOs into the current set
// - Removes UTXOs from the wallet which are no longer in the mempool (and were spent).
// - Adds UTXOs from the mempool which we werent previously aware of.
function mergeUTXOs(arrNewUTXOs, strAddr) {
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
    // Remove UTXOs which are no longer present in the list, ignoring UTXOs belonging to different addresses
    for (const cUTXO of arrUTXOs) {
        if (countWallets() > 1 && cUTXO.address !== strAddr) continue;
        const fUTXO = arrNewUTXOs
            .find(a => a.vout === cUTXO.vout && a.id === cUTXO.id);
        // Do we still have this UTXO?
        if (!fUTXO) {
            // Nuke it!
            removeUTXO(cUTXO.id, cUTXO.vout);
        }
    }
    return true;
}

// Fetches, parses and merges UTXOs for a given address from our data source(s)
async function refreshUTXOs(strAddr = String()) {
    // Step 1 --- Blockchain Sync
    // Headless Default source: Core RPC
    // GUI Fallback Source: Use scc.net web3 server
    const res = ptrIsHeadless()
        ? await ptrRpcMain.call('getaddressutxos', strAddr)
        : JSON.parse(await NET.getLightUTXOs(strAddr));
    // Convert explorer dataset into UTXO classes and merge with the current set
    const arrUTXOList = [];
    for (const rawUTXO of res) {
        arrUTXOList.push(new UTXO(strAddr,
            rawUTXO.txid,
            rawUTXO.outputIndex,
            rawUTXO.script,
            rawUTXO.satoshis));
    }

    // Step 2 --- Mempool Sync
    const arrMempool = [];
    await refreshMempoolUTXOs(arrUTXOList, arrMempool);

    // Merge our newly fetched UTXO set with our known in-wallet set
    mergeUTXOs(arrUTXOList, strAddr);

    // Identify and mark all spent VINs from our wallet in the mempool
    for (const rawTX of arrMempool) {
        // Search for all spent VINs for our wallet, and mark them as spent
        for (const rawVin of rawTX.vin) {
            const spentVout = getUTXO(rawVin.txid, rawVin.vout);
            if (spentVout) {
                // Mark this UTXO as spent!
                spentVout.spent = true;
            }
        }
    }

    // Finished!
    return true;
}

// Fetches, parses and merges mempool UTXOs for all local addresses from our data source(s)
async function refreshMempoolUTXOs(arrUTXOList, arrMempool) {
    try {
        const rawMempool = ptrIsHeadless()
            ? await ptrGetFullMempool()
            : JSON.parse(await NET.getMempoolLight());
        // Fetch all mempool UTXOs (vouts) belonging to our pubkey
        for (const rawTX of rawMempool) {
            // Search all VOUTs belonging to us, add them to our wallet
            for (const rawVout of rawTX.vout) {
                const hasPubkey = rawVout.scriptPubKey &&
                                rawVout.scriptPubKey.addresses &&
                                rawVout.scriptPubKey.addresses.length > 0;
                if (hasPubkey) {
                    const strPubkey = rawVout.scriptPubKey.addresses[0];
                    // Check if our wallet contains this address
                    const cWallet = getWallet(strPubkey);
                    if (!cWallet) continue;
                    // Found a mempool vout for our wallet!
                    const cUTXO = new UTXO(strPubkey,
                        rawTX.txid,
                        rawVout.n,
                        rawVout.scriptPubKey.hex,
                        rawVout.valueSat);
                    cUTXO.mempool = true;
                    arrUTXOList.push(cUTXO);
                }
            }
        }
        // Set the mempool pointer to allow for external spent-VIN linkage
        arrMempool = rawMempool;
        return true;
    } catch(e) {
        console.error('Wallet: Unable to sync Mempool data!');
        console.error(e);
        return false;
    }
}

// Broadcast a signed transaction
async function broadcastTx(strTx) {
    return ptrIsHeadless()
        ? await ptrRpcMain.call('sendrawtransaction', strTx)
        : await NET.broadcastTx(strTx);
}

// Returns a list of all incoming mempool UTXOs
function getIncomingUTXOs() {
    return arrUTXOs.filter(a => a.mempool && !a.spent);
}

// Returns a list of all available (unspent) UTXOs
function getAvailableUTXOs(strAddr = false) {
    const fAddr = countWallets() > 1 && strAddr !== false;
    return arrUTXOs.filter(a => !a.spent && (!fAddr || a.address === strAddr));
}

// Returns a list of calculated UTXOs to be spent in fulfilment of the given spend parameters
function getCoinsToSpend(sats = 0, min = false, chosenAddress = false) {
    let spent = 0;
    const chosenUTXOs = [];
    const suitableUTXOs = getAvailableUTXOs(chosenAddress);
    // Goal: Loop all UTXOs until the 'spent' amount is >= the sats amount, plus estimated fees
    for (const cUTXO of suitableUTXOs) {
        // If a minimum is enforced, ONLY accept UTXOs above the minimum
        if (min && cUTXO.sats <= sats) continue;
        if (spent >= (sats + 1000)) {
            console.log('Coin Control: Selected ' + chosenUTXOs.length +
                        ' input(s) (' + (spent / ptrCOIN) + ' SCC)');
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

// Returns the direct Wallets cache pointer, NOT recommended for most usage
function getWalletsPtr() {
    return arrWallets;
}

// Lib exports
exports.sccjs = sccjs;
// Class
exports.Wallet = Wallet;
exports.UTXO = UTXO;
// Funcs
exports.init = init;
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
exports.refreshUTXOs = refreshUTXOs;
exports.broadcastTx = broadcastTx;
exports.getIncomingUTXOs = getIncomingUTXOs;
exports.getAvailableUTXOs = getAvailableUTXOs;
exports.getCoinsToSpend = getCoinsToSpend;
exports.getUTXOsPtr = getUTXOsPtr;
exports.getWalletsPtr = getWalletsPtr;
exports.countWallets = countWallets;
exports.toDB = toDB;

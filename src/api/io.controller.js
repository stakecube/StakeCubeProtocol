/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';

// The permissions controller, allows/disallows usage of the module
const cPerms = require('./permissions.js');

// Contextual pointers provided by the index.js process
let ptrWALLET;
let ptrVM;
let ptrGetMsgFromTx;
let ptrIsFullnode;
let strModule;
let COIN;
let arrAllowedCallers;

function init(context) {
    ptrWALLET = context.WALLET;
    ptrVM = context.VM;
    ptrGetMsgFromTx = context.getMsgFromTx;
    ptrIsFullnode = context.isFullnode;
    arrAllowedCallers = context.callers;
    // Static Non-Pointer (native value)
    strModule = context.strModule;
    COIN = context.COIN;
    // Initialize permissions controller
    return cPerms.init({ 'DB': context.DB, 'strModule': strModule });
}

async function readTx(req, res) {
    if (!hasPermission(req, res)) return false;

    if (!req.params.txid || req.params.txid.length !== 64) {
        return res.json({
            'error': "You must specify a 'txid' param!"
        });
    }
    if (!req.params.format || !req.params.format.length) {
        return res.json({
            'error': "You must specify an 'format' param!"
        });
    }
    const strFormat = req.params.format;
    const strTxid = req.params.txid;
    // Check the encoding format is valid
    if (!Buffer.isEncoding(strFormat)) {
        return res.json({
            'error': 'Encoding format (' + strFormat + ') is invalid'
        });
    }
    res.json(await ptrGetMsgFromTx(strTxid, true, strFormat));
}

async function writeTx(req, res) {
    if (!hasPermission(req, res)) return false;

    if (!req.params.address || req.params.address.length !== 34) {
        return res.status(400).send('Missing "address" parameter!');
    }
    try {
        if (!req.body || !req.body.byteLength) {
            return res.status(400).send('Missing "body" data!');
        }
        const strAddr = req.params.address;
        const strData = req.body.toString();
        // Ensure the data doesn't exceed 500 bytes in HEX (the maximum SCC data relay)
        const nByteLen = req.body.byteLength * 2;
        if (nByteLen > 500) {
            return res.status(400).json({
                'error': 'The provided data (' + nByteLen + ' bytes in HEX) ' +
                         'exceeds the maximum length of 500 bytes'
            });
        }
        // Ensure we have the address specified, and it's unlocked
        const cWallet = ptrWALLET.getWallet(strAddr);
        if (!cWallet) {
            return res.status(400)
                .send('Address "' + strAddr +
                        '" does not exist in this wallet!');
        }
        const strPubkey = cWallet.getPubkey();
        if (cWallet.getPrivkey() === null) {
            return res.status(400)
                .send('This address is locked (encrypted)' +
                        ' via passphrase! Please unlock via' +
                        ' GUI before using the API.');
        }

        // Asynchronously sync UTXOs with the network
        await ptrWALLET.refreshUTXOs(strPubkey);

        // Construct the transaction
        const cTx = ptrWALLET.sccjs.tx.transaction();
        // Add input
        const cUTXO = ptrWALLET.getCoinsToSpend(10000, true, strPubkey)[0];
        if (!cUTXO) {
            return res.status(400).send('Not enough gas funds!');
        }
        cTx.addinput(cUTXO.id, cUTXO.vout, cUTXO.script);
        // SCP output
        cTx.addoutputburn(0.00000001, strData);
        // Fee & Change output
        const nFee = ptrWALLET.getFee(cTx.serialize().length);
        const nChange = ((cUTXO.sats / COIN) - nFee).toFixed(8);
        cTx.addoutput(strPubkey, nChange);
        // Broadcast
        const strSignedTx = await cTx.sign(cWallet.getPrivkey(), 1);
        const strTXID = await ptrWALLET.broadcastTx(strSignedTx);
        // Mark UTXO as spent
        cUTXO.spent = true;
        return res.json({
            'txid': strTXID,
            'rawTx': strSignedTx
        });
    } catch(e) {
        console.error("Network error on API '" + strModule + "/write'");
        console.error(e);
        return res.status(400).send('Internal API Error');
    }
}

async function createDappIdentifier(req, res) {
    if (!hasPermission(req, res)) return false;

    if (!req.params.address || req.params.address.length !== 34) {
        return res.status(400).send('Missing "address" parameter!');
    }
    if (!req.params.type || !req.params.type.length) {
        return res.status(400).send('Missing "type" parameter!');
    }
    try {
        const strAddr = req.params.address;
        const strType = req.params.type;
        // Ensure we have the address specified, and it's unlocked
        const cWallet = ptrWALLET.getWallet(strAddr);
        if (!cWallet) {
            return res.status(400)
                .send('Address "' + strAddr +
                        '" does not exist in this wallet!');
        }
        const strPubkey = cWallet.getPubkey();
        if (cWallet.getPrivkey() === null) {
            return res.status(400)
                .send('This address is locked (encrypted)' +
                        ' via passphrase! Please unlock via' +
                        ' GUI before using the API.');
        }

        // Asynchronously sync UTXOs with the network
        await ptrWALLET.refreshUTXOs(strPubkey);

        // Construct the transaction
        const cTx = ptrWALLET.sccjs.tx.transaction();
        // Add input
        const cUTXO = ptrWALLET.getCoinsToSpend(10000, true, strPubkey)[0];
        if (!cUTXO) {
            return res.status(400).send('Not enough gas funds!');
        }
        cTx.addinput(cUTXO.id, cUTXO.vout, cUTXO.script);
        // SCP output
        cTx.addoutputburn(0.00000001, ptrVM.createIdentifierScript(strType));
        // Fee & Change output
        const nFee = ptrWALLET.getFee(cTx.serialize().length);
        const nChange = ((cUTXO.sats / COIN) - nFee).toFixed(8);
        cTx.addoutput(strPubkey, nChange);
        // Broadcast
        const strSignedTx = await cTx.sign(cWallet.getPrivkey(), 1);
        const strTXID = await ptrWALLET.broadcastTx(strSignedTx);
        // Mark UTXO as spent
        cUTXO.spent = true;
        return res.json({
            'note': 'The given \'txid\' is your DApp Identifier, please use ' +
                    'this when calling your DApp!',
            'txid': strTXID,
            'rawTx': strSignedTx
        });
    } catch(e) {
        console.error("Network error on API '" + strModule + "/createid'");
        console.error(e);
        return res.status(400).send('Internal API Error');
    }
}

async function writePushToStorage(req, res) {
    if (!hasPermission(req, res)) return false;

    if (!req.params.address || req.params.address.length !== 34) {
        return res.status(400).send('Missing "address" parameter!');
    }
    if (!req.params.id || !req.params.id.length) {
        return res.status(400).send('Missing "id" parameter!');
    }
    try {
        if (!req.body || !req.body.byteLength) {
            return res.status(400).send('Missing "body" data!');
        }
        const strAddr = req.params.address;
        const strID = req.params.id;
        const strData = req.body.toString();
        // Ensure the data doesn't exceed 400 bytes in HEX (the maximum SCC data relay, with SCP overhead buffer)
        const nByteLen = req.body.byteLength * 2;
        if (nByteLen > 400) {
            return res.status(400).json({
                'error': 'The provided data (' + nByteLen + ' bytes in HEX) ' +
                         'exceeds the maximum length of 400 bytes'
            });
        }
        // Ensure we have the address specified, and it's unlocked
        const cWallet = ptrWALLET.getWallet(strAddr);
        if (!cWallet) {
            return res.status(400)
                .send('Address "' + strAddr +
                        '" does not exist in this wallet!');
        }
        const strPubkey = cWallet.getPubkey();
        if (cWallet.getPrivkey() === null) {
            return res.status(400)
                .send('This address is locked (encrypted)' +
                        ' via passphrase! Please unlock via' +
                        ' GUI before using the API.');
        }

        // Asynchronously sync UTXOs with the network
        await ptrWALLET.refreshUTXOs(strPubkey);

        // Construct the transaction
        const cTx = ptrWALLET.sccjs.tx.transaction();
        // Add input
        const cUTXO = ptrWALLET.getCoinsToSpend(10000, true, strPubkey)[0];
        if (!cUTXO) {
            return res.status(400).send('Not enough gas funds!');
        }
        cTx.addinput(cUTXO.id, cUTXO.vout, cUTXO.script);
        // SCP output
        cTx.addoutputburn(0.00000001,
            ptrVM.createWritePushScript(strID, strData));
        // Fee & Change output
        const nFee = ptrWALLET.getFee(cTx.serialize().length);
        const nChange = ((cUTXO.sats / COIN) - nFee).toFixed(8);
        cTx.addoutput(strPubkey, nChange);
        // Broadcast
        const strSignedTx = await cTx.sign(cWallet.getPrivkey(), 1);
        const strTXID = await ptrWALLET.broadcastTx(strSignedTx);
        // Mark UTXO as spent
        cUTXO.spent = true;
        return res.json({
            'txid': strTXID,
            'rawTx': strSignedTx
        });
    } catch(e) {
        console.error("Network error on API '" + strModule + "/storage/push'");
        console.error(e);
        return res.status(400).send('Internal API Error');
    }
}

async function writeKeyToStorage(req, res) {
    if (!hasPermission(req, res)) return false;

    if (!req.params.address || req.params.address.length !== 34) {
        return res.status(400).send('Missing "address" parameter!');
    }
    if (!req.params.id || !req.params.id.length) {
        return res.status(400).send('Missing "id" parameter!');
    }
    if (!req.params.key || !req.params.key.length) {
        return res.status(400).send('Missing "key" parameter!');
    }
    try {
        if (!req.body || !req.body.byteLength) {
            return res.status(400).send('Missing "body" data!');
        }
        const strAddr = req.params.address;
        const strID = req.params.id;
        const strKey = req.params.key;
        const strData = req.body.toString();
        // Ensure the data doesn't exceed 400 bytes in HEX (the maximum SCC data relay, with SCP overhead buffer)
        const nByteLen = req.body.byteLength * 2;
        if (nByteLen > 400) {
            return res.status(400).json({
                'error': 'The provided data (' + nByteLen + ' bytes in HEX) ' +
                         'exceeds the maximum length of 400 bytes'
            });
        }
        // Ensure we have the address specified, and it's unlocked
        const cWallet = ptrWALLET.getWallet(strAddr);
        if (!cWallet) {
            return res.status(400)
                .send('Address "' + strAddr +
                        '" does not exist in this wallet!');
        }
        const strPubkey = cWallet.getPubkey();
        if (cWallet.getPrivkey() === null) {
            return res.status(400)
                .send('This address is locked (encrypted)' +
                        ' via passphrase! Please unlock via' +
                        ' GUI before using the API.');
        }

        // Asynchronously sync UTXOs with the network
        await ptrWALLET.refreshUTXOs(strPubkey);

        // Construct the transaction
        const cTx = ptrWALLET.sccjs.tx.transaction();
        // Add input
        const cUTXO = ptrWALLET.getCoinsToSpend(10000, true, strPubkey)[0];
        if (!cUTXO) {
            return res.status(400).send('Not enough gas funds!');
        }
        cTx.addinput(cUTXO.id, cUTXO.vout, cUTXO.script);
        // SCP output
        cTx.addoutputburn(0.00000001,
            ptrVM.createWriteKeyScript(strID, strKey, strData));
        // Fee & Change output
        const nFee = ptrWALLET.getFee(cTx.serialize().length);
        const nChange = ((cUTXO.sats / COIN) - nFee).toFixed(8);
        cTx.addoutput(strPubkey, nChange);
        // Broadcast
        const strSignedTx = await cTx.sign(cWallet.getPrivkey(), 1);
        const strTXID = await ptrWALLET.broadcastTx(strSignedTx);
        // Mark UTXO as spent
        cUTXO.spent = true;
        return res.json({
            'txid': strTXID,
            'rawTx': strSignedTx
        });
    } catch(e) {
        console.error("Network error on API '" + strModule +
                      "/storage/setkey'");
        console.error(e);
        return res.status(400).send('Internal API Error');
    }
}

async function getAllFromStorage(req, res) {
    if (!hasPermission(req, res)) return false;

    if (!req.params.id || !req.params.id.length) {
        return res.status(400).send('Missing "id" parameter!');
    }
    try {
        const strID = req.params.id;
        const arrData = ptrVM.getMetaStateByIdPtr(strID);
        if (arrData === undefined || !arrData) {
            return res.status(400).send('No storage contract exists with ID (' +
                                        strID + ')');
        }
        return res.json(arrData);
    } catch(e) {
        console.error("Network error on API '" + strModule +
                      "/storage/getall'");
        console.error(e);
        return res.status(400).send('Internal API Error');
    }
}

async function getKeyFromStorage(req, res) {
    if (!hasPermission(req, res)) return false;

    if (!req.params.id || !req.params.id.length) {
        return res.status(400).send('Missing "id" parameter!');
    }
    if (!req.params.key || !req.params.key.length) {
        return res.status(400).send('Missing "key" parameter!');
    }
    try {
        const strID = req.params.id;
        const strKey = req.params.key;
        const strData = ptrVM.getMetaKeyStr(strID, strKey);
        if (strData === undefined || !strData) {
            return res.status(400)
                .send('Storage Key does not exist, or the ' +
                         'specified storage contract does not exist!');
        }
        return res.json(strData);
    } catch(e) {
        console.error("Network error on API '" + strModule +
                      "/storage/getkey'");
        console.error(e);
        return res.status(400).send('Internal API Error');
    }
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
exports.readTx = readTx;
exports.writeTx = writeTx;
exports.createDappIdentifier = createDappIdentifier;
exports.writePushToStorage = writePushToStorage;
exports.writeKeyToStorage = writeKeyToStorage;
exports.getAllFromStorage = getAllFromStorage;
exports.getKeyFromStorage = getKeyFromStorage;

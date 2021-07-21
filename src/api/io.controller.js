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
let ptrGetMsgFromTx;
let ptrIsFullnode;
let strModule;
let COIN;

function init(context) {
    ptrWALLET = context.WALLET;
    ptrGetMsgFromTx = context.getMsgFromTx;
    ptrIsFullnode = context.isFullnode;
    // Static Non-Pointer (native value)
    strModule = context.strModule;
    COIN = context.COIN;
    // Initialize permissions controller
    return cPerms.init({ 'DB': context.DB, 'strModule': strModule });
}

async function readTx(req, res) {
    if (!cPerms.isModuleAllowed(strModule)) {
        return disabledError(res);
    }
    if (!ptrIsFullnode()) {
        return fullnodeError(res);
    }
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
    res.json(await ptrGetMsgFromTx(strTxid, strFormat));
}

async function writeTx(req, res) {
    if (!cPerms.isModuleAllowed(strModule)) {
        return disabledError(res);
    }
    if (!ptrIsFullnode()) {
        return fullnodeError(res);
    }
    if (!req.params.address || req.params.address.length !== 34) {
        return res.status(400).send('Missing "address" parameter!');
    }
    if (!req.params.data) {
        return res.status(400).send('Missing "data" parameter!');
    }
    const strAddr = req.params.address;
    const strData = req.params.data;
    try {
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
exports.readTx = readTx;
exports.writeTx = writeTx;

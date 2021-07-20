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
let ptrTOKENS;
let ptrDB;
let ptrIsFullnode;
let strModule;
let COIN;

function init(context) {
    ptrWALLET = context.WALLET;
    ptrTOKENS = context.TOKENS;
    ptrDB = context.DB;
    ptrIsFullnode = context.isFullnode;
    // Static Non-Pointer (native value)
    strModule = context.strModule;
    COIN = context.COIN;
    // Initialize permissions controller
    return cPerms.init({ 'DB': context.DB, 'strModule': strModule });
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

async function getBalances(req, res) {
    if (!cPerms.isModuleAllowed(strModule)) {
        return disabledError(res);
    }
    if (!ptrIsFullnode()) {
        return fullnodeError(res);
    }
    if (!req.params.account || req.params.account.length !== 34) {
        return res.status(400).send('Missing "account" parameter!');
    }
    const strAddr = req.params.account;
    try {
        // Asynchronously sync UTXOs with the network
        await ptrWALLET.refreshUTXOs(strAddr);
        const arrBalances = [];
        const arrUTXOs = [];
        for (const cUTXO of ptrWALLET.getUTXOsPtr()) {
            if (cUTXO.address === strAddr && !cUTXO.spent) {
                arrUTXOs.push(cUTXO);
            }
        }
        // Push SCC balance
        arrBalances.push({
            'name': 'StakeCubeCoin',
            'ticker': 'SCC',
            // Balance is the sum of all UTXOs, for standardization
            'balance': arrUTXOs.reduce((a, b) => {
                return a + b.sats;
            }, 0),
            'utxos': arrUTXOs
        });
        // Get SCP tokens and add these to the list too
        const cTokens = ptrTOKENS.getTokensByAccount(strAddr);
        for (const cToken of cTokens) {
            arrBalances.push({
                'name': cToken.token.name,
                'contract': cToken.token.contract,
                'ticker': cToken.token.ticker,
                'version': cToken.token.version,
                'balance': cToken.account.balance,
                'unclaimed_balance': (cToken.account.unclaimed_balance
                    ? cToken.account.unclaimed_balance
                    : 0)
            });
        }
        return res.json(arrBalances);
    } catch(e) {
        console.error("Network error on API '" + strModule + '/getbalances/' +
                      strAddr + "'");
        console.error(e);
        return res.status(400).send('Internal API Error');
    }
}

async function listAddresses(req, res) {
    if (!cPerms.isModuleAllowed(strModule)) {
        return disabledError(res);
    }
    if (!ptrIsFullnode()) {
        return fullnodeError(res);
    }
    try {
        const arrAddresses = [];
        const cWalletDB = ptrWALLET.toDB();
        for (const cAddr of cWalletDB.wallets) {
            arrAddresses.push({
                'address': cAddr.pubkey,
                'unlocked': cAddr.privkeyDecrypted.length > 0
            });
        }
        return res.json(arrAddresses);
    } catch(e) {
        console.error("Network error on API '" + strModule + "/listaddresses'");
        console.error(e);
        return res.status(400).send('Internal API Error');
    }
}

async function getNewAddress(req, res) {
    if (!cPerms.isModuleAllowed(strModule)) {
        return disabledError(res);
    }
    if (!ptrIsFullnode()) {
        return fullnodeError(res);
    }
    try {
        // Create a new wallet address
        const cWallet = await ptrWALLET.createWallet();
        // Save to the database
        await ptrDB.setWallet(ptrWALLET.toDB());
        return res.send(cWallet.getPubkey());
    } catch(e) {
        console.error("Network error on API '" + strModule + "/getnewaddress'");
        console.error(e);
        return res.status(400).send('Internal API Error');
    }
}

async function send(req, res) {
    if (!cPerms.isModuleAllowed(strModule)) {
        return disabledError(res);
    }
    if (!ptrIsFullnode()) {
        return fullnodeError(res);
    }
    if (!req.params.address || req.params.address.length !== 34) {
        return res.status(400).send('Missing "address" parameter!');
    }
    if (!req.params.currency) {
        return res.status(400).send('Missing "currency" parameter!');
    }
    if (!req.params.to || req.params.to.length !== 34) {
        return res.status(400).send('Missing "to" parameter!');
    }
    if (!req.params.amount) {
        return res.status(400).send('Missing "amount" parameter!');
    }
    const strAddr = req.params.address;
    const strCurrency = req.params.currency;
    const strTo = req.params.to;
    const nAmount = Number(req.params.amount);
    try {
    // Cache our tokens list, for if needed
        let cTokens = false;
        let cSelectedToken = false;

        // Ensure the 'to' address looks correct
        if (!strTo.startsWith('s')) {
            return res.status(400)
                .send('Receiving address "' + strTo +
                        '" is invalid!');
        }

        // Ensure the 'amount' is a valid number
        if (Number.isNaN(nAmount) || !Number.isFinite(nAmount)) {
            return res.status(400)
                .send('Sending amount "' + nAmount +
                        '" is an invalid amount!');
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

        // Ensure we have the currency specified
        if (strCurrency.toLowerCase() !== 'scc') {
            cTokens = ptrTOKENS.getTokensByAccount(strAddr);
            for (const cToken of cTokens) {
                if (cToken.token.contract === strCurrency) {
                    cSelectedToken = cToken;
                }
            }
            // If no token was found, bail out!
            if (!cSelectedToken) {
                return res
                    .status(400)
                    .send('Invalid token contract ID, "' +
                            strCurrency + '"! Or this token' +
                            ' is not held within this account.');
            }
        }

        // Create the transaction!
        if (!cSelectedToken) {
        // --- SCC ---
            const cTx = ptrWALLET.sccjs.tx.transaction();
            // Inputs
            const usedUTXOs = ptrWALLET.getCoinsToSpend(nAmount * COIN,
                false,
                strPubkey);
            const nUTXOs = usedUTXOs.reduce((a, b) => {
                return a + b.sats;
            }, 0);
            for (const cUTXO of usedUTXOs) {
                cTx.addinput(cUTXO.id, cUTXO.vout, cUTXO.script);
            }
            if (nAmount >= nUTXOs / COIN) {
                return res
                    .status(400)
                    .send('Not enough funds! (Sending: ' +
                            nAmount + ', Have: ' + (nUTXOs / COIN) +
                            ')');
            }
            // Destination output
            cTx.addoutput(strTo, nAmount);
            // Fee & Change output
            const nFee = ptrWALLET.getFee(cTx.serialize().length);
            const nSpent = (nFee + nAmount).toFixed(8);
            const nChange = ((nUTXOs / COIN) - nSpent).toFixed(8);
            cTx.addoutput(strPubkey, nChange);
            // Broadcast
            const strSignedTx = await cTx.sign(cWallet.getPrivkey(), 1);
            const strTXID = await ptrWALLET.broadcastTx(strSignedTx);
            // Mark UTXOs as spent
            for (const cUTXO of usedUTXOs) {
                cUTXO.spent = true;
            }
            return res.json({
                'txid': strTXID,
                'rawTx': strSignedTx
            });
        } else {
        // --- SCP ---
            const cTx = ptrWALLET.sccjs.tx.transaction();
            const nCoinsBal = (cSelectedToken.account.balance / COIN);
            if (nAmount > nCoinsBal) {
                return res
                    .status(400)
                    .send('Not enough funds! (Sending: ' +
                            nAmount + ', Have: ' +
                            nCoinsBal + ')');
            }
            // Add input
            const cUTXO = ptrWALLET.getCoinsToSpend(10000, true,
                strPubkey)[0];
            if (!cUTXO) {
                return res.status(400).send('Not enough gas funds!');
            }
            cTx.addinput(cUTXO.id, cUTXO.vout, cUTXO.script);
            // SCP output
            cTx.addoutputburn(0.00000001,
                cSelectedToken.token.contract + ' send ' +
                            (nAmount * COIN).toFixed(0) + ' ' + strTo);
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
        }
    } catch(e) {
        console.error("Network error on API '" + strModule + "/send'");
        console.error(e);
        return res.status(400).send('Internal API Error');
    }
}

async function stake(req, res) {
    if (!cPerms.isModuleAllowed(strModule)) {
        return disabledError(res);
    }
    if (!ptrIsFullnode()) {
        return fullnodeError(res);
    }
    if (!req.params.address || req.params.address.length !== 34) {
        return res.status(400).send('Missing "address" parameter!');
    }
    if (!req.params.contract) {
        return res.status(400).send('Missing "contract" parameter!');
    }
    const strAddr = req.params.address;
    const strContract = req.params.contract;
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

        // Ensure we have the currency specified
        const cTokens = ptrTOKENS.getTokensByAccount(strAddr);
        let cSelectedToken = false;
        for (const cToken of cTokens) {
            if (cToken.token.contract === strContract) {
                cSelectedToken = cToken;
            }
        }
        // If no token was found, bail out!
        if (!cSelectedToken) {
            return res.status(400).send('Invalid token contract ID, "' +
                                    strContract + '"! Or this token' +
                                    ' is not held within this ' +
                                    'account.');
        }
        // --- CLAIM STAKE ---
        const cTx = ptrWALLET.sccjs.tx.transaction();
        const nCoinsBal = (cSelectedToken.account.unclaimed_balance / COIN);
        if (nCoinsBal <= 0) {
            return res.status(400).send('You have no pending rewards!');
        }
        // Add input
        const cUTXO = ptrWALLET.getCoinsToSpend(10000, true, strPubkey)[0];
        if (!cUTXO) {
            return res.status(400).send('Not enough gas funds!');
        }
        cTx.addinput(cUTXO.id, cUTXO.vout, cUTXO.script);
        // SCP output
        cTx.addoutputburn(0.00000001,
            cSelectedToken.token.contract + ' redeem');
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
        console.error("Network error on API '" + strModule + "/stake'");
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
exports.getStakingStatus = getStakingStatus;
exports.getBalances = getBalances;
exports.listAddresses = listAddresses;
exports.getNewAddress = getNewAddress;
exports.send = send;
exports.stake = stake;

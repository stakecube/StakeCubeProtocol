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
let ptrRpcMain;
let ptrGetFullMempool;
let ptrIsFullnode;
let strModule;

function init(context) {
    ptrTOKENS = context.TOKENS;
    ptrGetFullMempool = context.gfm;
    ptrRpcMain = context.rpcMain;
    ptrIsFullnode = context.isFullnode;
    // Static Non-Pointer (native value)
    strModule = context.strModule;
    // Initialize permissions controller
    return cPerms.init({ 'DB': context.DB, 'strModule': strModule });
}

function getActivity(req, res) {
    if (!cPerms.isModuleAllowed(strModule)) {
        return disabledError(res);
    }
    if (!ptrIsFullnode()) {
        return fullnodeError(res);
    }
    if (!req.params.contract || req.params.contract.length <= 1) {
        return res.json({
            'error': "You must specify a 'contract' param!"
        });
    }
    if (!req.params.account || req.params.account.length <= 1) {
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
    const cAccount = cToken.getAccount(req.params.account);
    if (!cAccount) {
        return res.json({
            'error': 'Account does not exist for this token!'
        });
    }
    res.json(cAccount.activity);
}

function getAllActivity(req, res) {
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
    const cActivity = ptrTOKENS.getActivityByAccount(req.params.account);
    res.json(cActivity);
}

function getBlockActivity(req, res) {
    if (!cPerms.isModuleAllowed(strModule)) {
        return disabledError(res);
    }
    if (!ptrIsFullnode()) {
        return fullnodeError(res);
    }
    if (!req.params.block || req.params.block.length <= 1) {
        return res.json({
            'error': "You must specify a 'block' param!"
        });
    }
    const cLinearActivity = [];
    const nBlock = Number(req.params.block);
    if (!Number.isSafeInteger(nBlock)) {
        return res.json({
            'error': "Param 'block' is not an integer!"
        });
    }
    // Loop every token
    const cTknPtr = ptrTOKENS.getTokensPtr();
    for (const cToken of cTknPtr) {
        // Loop every account
        for (const cAccount of cToken.owners) {
            // Loop every activity entry
            for (const activity of cAccount.activity) {
                // If the activity is in our needed block, save it
                if (activity.block !== nBlock) continue;
                cLinearActivity.push({
                    'txid': activity.id,
                    'contract': cToken.contract,
                    'account': cAccount.address,
                    'type': activity.type,
                    'amount': activity.amount
                });
            }
        }
    }
    res.json(cLinearActivity);
}

function getActivityByTxid(req, res) {
    if (!cPerms.isModuleAllowed(strModule)) {
        return disabledError(res);
    }
    if (!ptrIsFullnode()) {
        return fullnodeError(res);
    }
    if (!req.params.txid || req.params.txid.length !== 64) {
        return res.json({
            'error': "You must specify a valid 'txid' param!"
        });
    }
    const allowedTypes = ['all', 'sent', 'received', 'staked'];
    if (!req.params.type) {
        return res.json({
            'error': "You must specify a 'type' param!",
            'options': allowedTypes.join(', ')
        });
    }
    if (!allowedTypes.includes(req.params.type)) {
        return res.json({
            'error': "Bad 'type' (" + req.params.type + ')!',
            'options': allowedTypes.join(', ')
        });
    }
    const cLinearActivity = [];
    const strTx = req.params.txid;
    const strType = req.params.type;
    // Loop every token
    const cTknPtr = ptrTOKENS.getTokensPtr();
    for (const cToken of cTknPtr) {
        // Loop every account
        for (const cAccount of cToken.owners) {
            // Loop every activity entry
            for (const activity of cAccount.activity) {
                // If the activity matches our type
                if (strType !== 'all' && activity.type !== strType) {
                    continue;
                }
                // If the activity has our TX-ID
                if (activity.id !== strTx) {
                    continue;
                }
                cLinearActivity.push({
                    'txid': activity.id,
                    'contract': cToken.contract,
                    'account': cAccount.address,
                    'type': activity.type,
                    'amount': activity.amount
                });
            }
        }
    }
    res.json(cLinearActivity);
}

async function listDeltas(req, res) {
    if (!cPerms.isModuleAllowed(strModule)) {
        return disabledError(res);
    }
    if (!ptrIsFullnode()) {
        return fullnodeError(res);
    }
    if (!req.params.address || req.params.address.length !== 34) {
        return res.status(400).send('Missing "address" parameter!');
    }
    try {
        const arrTxs = await ptrRpcMain.call('getaddressdeltas', {
            'addresses': [req.params.address]
        });
        return res.json(arrTxs);
    } catch(e) {
        console.error("Network error on API '" + strModule + "/listdeltas'");
        console.error(e);
        return res.status(400).send('Internal API Error');
    }
}

async function getMempoolActivity(req, res) {
    if (!cPerms.isModuleAllowed(strModule)) {
        return disabledError(res);
    }
    if (!ptrIsFullnode()) {
        return fullnodeError(res);
    }
    if (!req.params.account) {
        return res.status(400).send('Missing "account" parameter!');
    }
    let account;
    if (req.params.account.length !== 34 &&
        req.params.account.toLowerCase() !== 'all') {
            return res.status(400).send('Invalid "account" parameter! Use an' +
                                        ' SCC address or "all" for all' +
                                        ' activity data!');
    } else if (req.params.account.length === 34) {
        account = req.params.account;
    } // else, no account, so use 'all'
    try {
        const arrFullMempool = await ptrGetFullMempool();
        const arrActivity = [];
        // Loop all mempool TXs
        for (const cTX of arrFullMempool) {
            // Loop all TX vouts
            for (const cVout of cTX.vout) {
                if (!cVout.scriptPubKey) continue;
                if (!cVout.scriptPubKey.hex) continue;
                // Scan the scriptPubKey for OP_RETURN (+ PUSHDATA)
                if (cVout.scriptPubKey.hex.startsWith('6a4c')) {
                    // Found an OP_RETURN! Parse the message from HEX to UTF-8
                    const rawHex = cVout.scriptPubKey.asm.substr(10);
                    const buf = Buffer.from(rawHex, 'hex');
                    const strOp = buf.toString('utf8');
                    if (!strOp.includes(' ')) continue;
                    const arrOp = strOp.split(' ');
                    const isLongData = strOp.length > 64;
                    let isUsingIndex = false;
                    if (UPGRADES.isTokenIndexingActive(nCacheHeight)) {
                        isUsingIndex = strOp.startsWith('id');
                        arrOp[0] = Number(arrOp[0].substr(2));
                    }
                    // If one of these flags are enabled, this is highly likely a normal token event
                    if (isLongData || isUsingIndex) {
                        // Ensure the token is valid and exists
                        const cToken = TOKENS.getToken(arrOp[0]);
                        if (!cToken || cToken.supply <= 0) continue;
                        // Construct the caller's Activity object
                        const strConfType = (cTX.instantlock ? '⚡ C' : 'Unc');
                        const cActivity = {
                            'id': cTX.txid,
                            'token': {
                                'contract': cToken.contract,
                                'ticker': cToken.ticker,
                                'name': cToken.name
                            },
                            'block': strConfType + 'onfirmed',
                            'contract': cToken.contract,
                            'account': cTX.vout[1].scriptPubKey.addresses[0],
                            'type': 'unknown',
                            'amount': 0
                        };
                        const cAccount = cActivity.account;
                        // Identify the transaction type
                        const operation = arrOp[1];
                        switch (operation) {
                        case 'mint':
                            cActivity.type = 'received';
                            cActivity.amount = Number(arrOp[2]);
                            if (!account ||
                                    (account && cAccount === account)) {
                                arrActivity.push(cActivity);
                            }
                            break;

                        case 'burn':
                            cActivity.type = 'sent';
                            cActivity.amount = Number(arrOp[2]);
                            if (!account ||
                                    (account && cAccount === account)) {
                                arrActivity.push(cActivity);
                            }
                            break;

                        case 'send':
                            // Sender activity
                            cActivity.type = 'sent';
                            cActivity.amount = Number(arrOp[2]);
                            if (!account ||
                                    (account && cAccount === account)) {
                                arrActivity.push(cActivity);
                            }
                            // Receiver activity
                            const cRecvActivity = JSON.parse(
                                JSON.stringify(cActivity));
                            cRecvActivity.type = 'received';
                            cRecvActivity.account = arrOp[3];
                            if (!account ||
                                    (account && arrOp[3] === account)) {
                                arrActivity.push(cRecvActivity);
                            }
                            break;

                        case 'redeem':
                            cActivity.type = 'staked';
                            const cStatus = cToken.getStakingStatus(cAccount);
                            cActivity.amount = cStatus.unclaimed_rewards;
                            if (!account ||
                                    (account && cAccount === account)) {
                                arrActivity.push(cActivity);
                            }
                            break;

                        default:
                            break;
                        }
                        // End the vout loop
                        break;
                    }
                }
            }
        }
        return res.json(arrActivity);
    } catch(e) {
        console.error("Network error on API '" + strModule +
                      "/getmempoolactivity'");
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
exports.getActivity = getActivity;
exports.getAllActivity = getAllActivity;
exports.getBlockActivity = getBlockActivity;
exports.getActivityByTxid = getActivityByTxid;
exports.getMempoolActivity = getMempoolActivity;
exports.listDeltas = listDeltas;

/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';

// Contextual pointers provided by the index.js process
let ptrTOKENS;
let ptrRpcMain;
let ptrIsFullnode;

function init(context) {
    ptrTOKENS = context.TOKENS;
    ptrRpcMain = context.rpcMain;
    ptrIsFullnode = context.isFullnode;
}

function getActivity(req, res) {
    if (!ptrIsFullnode())
        return fullnodeError(res);
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
    if (!ptrIsFullnode())
        return fullnodeError(res);
    if (!req.params.account || req.params.account.length <= 1) {
        return res.json({
            'error': "You must specify an 'account' param!"
        });
    }
    const cActivity = ptrTOKENS.getActivityByAccount(req.params.account);
    res.json(cActivity);
}

function getBlockActivity(req, res) {
    if (!ptrIsFullnode())
        return fullnodeError(res);
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
    if (!ptrIsFullnode())
        return fullnodeError(res);
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
    if (!ptrIsFullnode())
        return fullnodeError(res);
    if (!req.params.address || req.params.address.length !== 34) {
        return res.status(400).send('Missing "address" parameter!');
    }
    try {
        const arrTxs = await ptrRpcMain.call('getaddressdeltas', {
            'addresses': [req.params.address]
        });
        return res.json(arrTxs);
    } catch(e) {
        console.error("Network error on API 'wallet/listdeltas'");
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

exports.init = init;
exports.getActivity = getActivity;
exports.getAllActivity = getAllActivity;
exports.getBlockActivity = getBlockActivity;
exports.getActivityByTxid = getActivityByTxid;
exports.listDeltas = listDeltas;
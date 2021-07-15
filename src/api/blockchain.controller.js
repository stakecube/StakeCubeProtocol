/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';

// Contextual pointers provided by the index.js process
let ptrGetFullMempool;
let ptrIsFullnode;

function init(context) {
    ptrGetFullMempool = context.gfm;
    ptrIsFullnode = context.isFullnode;
}

async function getFullMempool(req, res) {
    if (!ptrIsFullnode())
        return fullnodeError(res);
    res.json(await ptrGetFullMempool());
}

function fullnodeError(res) {
    return res.status(403).json({
        'error': 'This endpoint is only available to Full-nodes, please ' +
                 'connect an SCC Core RPC server to enable as a Full-node!'
    });
}

exports.init = init;
exports.getFullMempool = getFullMempool;
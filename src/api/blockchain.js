/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';

// Contextual pointers provided by the index.js process
let ptrGetFullMempool;

function init(app, context) {
    ptrGetFullMempool = context.gfm;

    // Get the current raw mempool
    app.get('/api/v1/getrawmempool', async function(req, res) {
        res.json(await ptrGetFullMempool());
    });
}

exports.init = init;

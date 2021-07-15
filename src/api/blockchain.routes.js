/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';

const cController = require('./blockchain.controller.js');

// The main 'route' for this API module
const strRoute = '/api/v1/blockchain/';

function init(app, context) {
    cController.init(context);

    // Get the current raw mempool
    app.get(strRoute + 'getrawmempool',
        cController.getFullMempool);

    /// / BACKWARDS-COMPAT: Removal scheduled for v1.1.6
    app.get('/api/v1/getrawmempool',
        cController.getFullMempool);
}

exports.init = init;

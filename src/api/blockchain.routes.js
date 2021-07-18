/*
    # This Source Code Form is subject to the terms of the Mozilla Public
    # License, v. 2.0. If a copy of the MPL was not distributed with this
    # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';

const cController = require('./blockchain.controller.js');

// The main 'route' for this API module
const strModule = 'blockchain';
const strRoute = '/api/v1/' + strModule + '/';

function init(app, context) {
    context.strModule = strModule;
    const cbackRes = cController.init(context);

    // Get the current raw mempool
    app.get(strRoute + 'getrawmempool',
        cController.getFullMempool);

    /// / BACKWARDS-COMPAT: Removal scheduled for v1.1.6
    app.get('/api/v1/getrawmempool',
        cController.getFullMempool);

    // Return if this module is enabled via config
    return cbackRes;
}

exports.init = init;

/*
    # This Source Code Form is subject to the terms of the Mozilla Public
    # License, v. 2.0. If a copy of the MPL was not distributed with this
    # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';

// The main 'route' for this API module
const strModule = 'io';
const strRoute = '/api/v1/' + strModule + '/';

const cController = require('./' + strModule + '.controller.js');

function init(app, context) {
    context.strModule = strModule;
    const cbackRes = cController.init(context);

    // Parse HEX-encoded data from an on-chain transaction
    app.get(strRoute + 'read/:txid/:format',
        cController.readTx);

    // Write custom, retrievable data to the blockchain via an on-chain transaction
    app.post(strRoute + 'write/:address',
        cController.writeTx);

    // Return if this module is enabled via config
    return cbackRes;
}

exports.init = init;

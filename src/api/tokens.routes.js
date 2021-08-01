/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';

// The main 'route' for this API module
const strModule = 'tokens';
const strRoute = '/api/v1/' + strModule + '/';

const cController = require('./' + strModule + '.controller.js');

function init(app, context) {
    context.strModule = strModule;
    const cbackRes = cController.init(context);

    // Get All Tokens
    app.get(strRoute + 'getalltokens',
        cController.getAllTokens);

    // Get a single Token
    app.get(strRoute + 'gettoken/:contract',
        cController.getToken);

    // Get Tokens by Account
    app.get(strRoute + 'gettokensbyaccount/:account',
        cController.getTokensByAccount);

    // Get an SCP-2 token's staking status for a single account
    app.get(strRoute + 'getstakingstatus/:contract/:account',
        cController.getStakingStatus);

    /// / BACKWARDS-COMPAT: Removal scheduled for v1.1.6
    app.get('/api/v1/getalltokens',
        cController.getAllTokens);
    app.get('/api/v1/gettoken/:contract',
        cController.getToken);
    app.get('/api/v1/gettokensbyaccount/:account',
        cController.getTokensByAccount);
    app.get('/api/v1/getstakingstatus/:contract/:account',
        cController.getStakingStatus);

    // Return if this module is enabled via config
    return cbackRes;
}

exports.init = init;

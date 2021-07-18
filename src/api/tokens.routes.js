/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';

const cController = require('./tokens.controller.js');

// The main 'route' for this API module
const strModule = 'tokens';
const strRoute = '/api/v1/' + strModule + '/';

function init(app, context) {
    context.strModule = strModule;
    cController.init(context);

    // Get All Tokens
    app.get(strRoute + 'getalltokens',
        cController.getAllTokens);

    // Get a single Token
    app.get(strRoute + 'gettoken/:contract',
        cController.getToken);

    // Get Tokens by Account
    app.get(strRoute + 'gettokensbyaccount/:account',
        cController.getTokensByAccount);

    /// / BACKWARDS-COMPAT: Removal scheduled for v1.1.6
    app.get('/api/v1/getalltokens',
        cController.getAllTokens);
    app.get('/api/v1/gettoken/:contract',
        cController.getToken);
    app.get('/api/v1/gettokensbyaccount/:account',
        cController.getTokensByAccount);
}

exports.init = init;

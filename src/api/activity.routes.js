/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';

const cController = require('./activity.controller.js');

// The main 'route' for this API module
const strRoute = '/api/v1/activity/';

function init(app, context) {
    cController.init(context);

    // Get a single account's activity/history for a single token
    app.get(strRoute + 'getactivity/:contract/:account',
        cController.getActivity);

    // Get a single account's activity/history for all tokens
    app.get(strRoute + 'getallactivity/:account',
        cController.getAllActivity);

    // Gets all activity/history for all tokens, in one block, in a linear (flat) format with no nesting
    app.get(strRoute + 'getblockactivity/:block',
        cController.getBlockActivity);

    // Gets all activity/history for a specified TX-ID and a type
    app.get(strRoute + 'getactivitybytxid/:txid/:type',
        cController.getActivityByTxid);

    // Gets a list of all changes related to the given address
    app.get(strRoute + 'listdeltas/:address',
        cController.listDeltas);

    /// / BACKWARDS-COMPAT: Removal scheduled for v1.1.6
    app.get('/api/v1/getactivity/:contract/:account',
        cController.getActivity);
    app.get('/api/v1/getallactivity/:account',
        cController.getAllActivity);
    app.get('/api/v1/getblockactivity/:block',
        cController.getBlockActivity);
    app.get('/api/v1/getactivitybytxid/:txid/:type',
        cController.getActivityByTxid);
    app.get('/api/v1/wallet/listdeltas/:address',
        cController.listDeltas);
}

exports.init = init;

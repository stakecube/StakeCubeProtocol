/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';

const cController = require('./wallet.controller.js');

// The main 'route' for this API module
const strModule = 'wallet';
const strRoute = '/api/v1/' + strModule + '/';

function init(app, context) {
    context.strModule = strModule;
    const cbackRes = cController.init(context);

    // Get an SCP-2 token's staking status for a single account
    app.get(strRoute + 'getstakingstatus/:contract/:account',
        cController.getStakingStatus);
    // Get the balances of all owned tokens by this account, including SCC
    app.get(strRoute + 'getbalances/:address',
        cController.getBalances);
    // Gets a list of all addresses available to the wallet
    app.get(strRoute + 'listaddresses',
        cController.listAddresses);
    // Creates a new wallet address
    app.get(strRoute + 'getnewaddress',
        cController.getNewAddress);
    // Creates an SCC transaction with the given wallet address
    app.get(strRoute + 'send/:address/:currency/:to/:amount',
        cController.send);
    // Creates a stake transaction to claim the pending rewards of a given account
    app.get(strRoute + 'stake/:address/:currency',
        cController.stake);

    /// / BACKWARDS-COMPAT: Removal scheduled for v1.1.6
    app.get('/api/v1/getstakingstatus/:contract/:account',
        cController.getStakingStatus);

    // Return if this module is enabled via config
    return cbackRes;
}

exports.init = init;

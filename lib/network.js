/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';

/* 
    NETWORK FUNCTIONS
    ------------------
    This file hosts the network functionality of the StakeCube Protocol Wallet, allowing for
    asynchronous requests to Lightwallet servers, SC API and other external HTTPS sources.
*/

const bent = require('bent');
const get = bent('GET', 'string', 200);

async function getLightUTXOs(address) {
    return await get('https://stakecubecoin.net/web3/getutxos?addr=' + address);
}

async function getLightTokensByAccount(address) {
    return await get('https://stakecubecoin.net/web3/scp/gettokensbyaccount/' + address);
}

exports.getLightUTXOs = getLightUTXOs;
exports.getLightTokensByAccount = getLightTokensByAccount;
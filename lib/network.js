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

const rootSCCNet = 'https://stakecubecoin.net/web3/';
const rootGithub = 'https://api.github.com/repos/stakecube/StakeCubeProtocol/';

const bent = require('bent');
const get = bent('GET', 'string', 200, { 'User-Agent': 'SCP Wallet' });

async function getLightUTXOs(address) {
    return await get(rootSCCNet + 'getutxos?addr=' + address);
}

async function getMempoolLight() {
    return await get(rootSCCNet + 'scp/getrawmempool');
}

async function getLightTokensByAccount(address) {
    return await get(rootSCCNet + 'scp/gettokensbyaccount/' + address);
}

async function broadcastTx(tx) {
    return await get(rootSCCNet + 'submittx?tx=' + tx);
}

async function getLatestRelease(tx) {
    return await get(rootGithub + 'releases/latest');
}

exports.getLightUTXOs = getLightUTXOs;
exports.getMempoolLight = getMempoolLight;
exports.getLightTokensByAccount = getLightTokensByAccount;
exports.broadcastTx = broadcastTx;
exports.getLatestRelease = getLatestRelease;

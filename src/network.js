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

const http = require('http');
const https = require('https');

async function request(endpoint, method, body) {
    const url = new URL(endpoint);
    const opts = {
        'auth': url.username + ':' + url.password,
        'host': url.host,
        'hostname': url.hostname,
        'port': url.port,
        'href': url.href,
        'protocol': url.protocol,
        'path': url.pathname + url.search,
        'method': method
    };
    const server = opts.protocol === 'https:' ? https : http;
    return new Promise((resolve, reject) => {
        const req = server.request(opts, (res) => {
            let strData = '';
            res.setEncoding('utf8');

            res.on('data', d => {
                // Concatenate response chunks into one string
                strData += d;
            });

            res.on('end', () => {
                // Return the full string
                if (res.statusCode === 200) {
                    resolve(strData);
                } else {
                    reject(Error('Status Code: ' + res.statusCode + ' (' +
                           res.statusMessage + ')\nResult: ' + strData));
                }
            });
        });

        req.on('error', error => {
            reject(error);
        });

        req.setHeader('User-Agent', 'SCP Wallet');
        if (body) {
            req.write(body);
        }
        req.end();
    });
}

async function get(endpoint) {
    return await request(endpoint, 'GET');
}

async function post(endpoint, body) {
    return await request(endpoint, 'POST', body);
}

async function getActivityLight(address) {
    return await get(rootSCCNet + 'scp/activity/getallactivity/' + address);
}

async function getDeltasLight(address) {
    return await get(rootSCCNet + 'scp/wallet/listdeltas/' + address);
}

async function getLightUTXOs(address) {
    return await get(rootSCCNet + 'getutxos?addr=' + address);
}

async function getLightStakingStatus(contract, address) {
    return await get(rootSCCNet + 'scp/tokens/getstakingstatus/' + contract +
                                                             '/' + address);
}

async function getMempoolLight() {
    return await get(rootSCCNet + 'scp/blockchain/getrawmempool');
}

async function getLightTokensByAccount(address) {
    return await get(rootSCCNet + 'scp/tokens/gettokensbyaccount/' + address);
}

async function broadcastTx(tx) {
    return await get(rootSCCNet + 'submittx?tx=' + tx);
}

async function getLatestRelease() {
    return await get(rootGithub + 'releases/latest');
}

exports.get = get;
exports.post = post;
exports.getActivityLight = getActivityLight;
exports.getDeltasLight = getDeltasLight;
exports.getLightUTXOs = getLightUTXOs;
exports.getLightStakingStatus = getLightStakingStatus;
exports.getMempoolLight = getMempoolLight;
exports.getLightTokensByAccount = getLightTokensByAccount;
exports.broadcastTx = broadcastTx;
exports.getLatestRelease = getLatestRelease;

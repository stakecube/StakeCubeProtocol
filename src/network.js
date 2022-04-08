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
const rootSCNet = 'https://stakecube.io/api/v2/';
const rootGithub = 'https://api.github.com/repos/stakecube/StakeCubeProtocol/';

const http = require('http');
const https = require('https');

const strIPFSKey = [
    81, 49, 107, 100, 112, 52, 67, 110, 75, 65, 76, 81, 79, 101, 81, 68, 66,
    81, 120, 118, 113, 78, 105, 98, 49, 72, 65, 88, 108, 105, 48, 76, 118, 117,
    70, 49, 70, 86, 107, 112, 111, 113, 100, 46, 57, 74, 121, 99, 85, 90, 107,
    84, 103, 81, 88, 90, 115, 120, 87, 89, 88, 66, 67, 85, 68, 78, 108, 73, 54,
    73, 83, 90, 116, 70, 109, 98, 105, 119, 105, 78, 52, 77, 84, 78, 49, 99,
    106, 78, 53, 85, 106, 77, 122, 89, 84, 77, 54, 73, 67, 100, 104, 108, 109,
    73, 115, 73, 83, 90, 110, 70, 109, 99, 118, 82, 51, 99, 116, 81, 110, 90,
    117, 74, 105, 79, 105, 77, 51, 99, 112, 74, 67, 76, 105, 89, 106, 77, 50,
    73, 69, 77, 67, 82, 68, 77, 120, 89, 107, 77, 120, 69, 48, 81, 120, 103,
    84, 79, 52, 65, 106, 82, 53, 69, 69, 78, 53, 81, 87, 78, 107, 70, 109, 78,
    108, 78, 85, 78, 48, 85, 109, 90, 109, 70, 107, 90, 66, 78, 69, 101, 119,
    111, 106, 99, 111, 82, 88, 90, 54, 81, 87, 97, 107, 74, 105, 79, 105, 73,
    87, 100, 122, 74, 121, 101, 46, 57, 74, 67, 86, 88, 112, 107, 73, 54, 73,
    67, 99, 53, 82, 110, 73, 115, 73, 105, 78, 49, 73, 122, 85, 73, 74, 105,
    79, 105, 99, 71, 98, 104, 74, 121, 101
];

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

async function uploadToIPFS(body) {
    const url = new URL('https://api.nft.storage/upload');
    const opts = {
        'host': url.host,
        'hostname': url.hostname,
        'port': url.port,
        'href': url.href,
        'protocol': url.protocol,
        'path': url.pathname + url.search,
        'method': 'POST'
    };
    return new Promise((resolve, reject) => {
        const req = https.request(opts, (res) => {
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
        req.setHeader('Authorization', 'Bearer ' +
                                       Buffer.from((
                                           Array.from(strIPFSKey)).reverse())
                                           .toString('UTF8'));
        req.write(body);
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

async function getMempoolActivityLight(address) {
    return await get(rootSCCNet + 'scp/activity/getmempoolactivity/' +
                     address);
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

async function getLightNFTsByAccount(address) {
    return await get(rootSCCNet + 'scp/tokens/getnftsbyaccount/' + address);
}

async function getLightCollection(contract) {
    return await get(rootSCCNet + 'scp/tokens/getcollection/' + contract);
}

async function getLightCollectionHeaders() {
    return await get(rootSCCNet + 'scp/tokens/getallcollectionheaders');
}

async function broadcastTx(tx) {
    return await post(rootSCCNet + 'submittx', tx);
}

async function getLatestRelease() {
    return await get(rootGithub + 'releases/latest');
}

async function getPrice(strCoin = 'SCC') {
    return JSON.parse(
        await get(rootSCNet + 'exchange/spot/arbitrageInfo?ticker=' + strCoin)
    );
}

exports.uploadToIPFS = uploadToIPFS;
exports.get = get;
exports.post = post;
exports.getActivityLight = getActivityLight;
exports.getMempoolActivityLight = getMempoolActivityLight;
exports.getDeltasLight = getDeltasLight;
exports.getLightUTXOs = getLightUTXOs;
exports.getLightStakingStatus = getLightStakingStatus;
exports.getMempoolLight = getMempoolLight;
exports.getLightTokensByAccount = getLightTokensByAccount;
exports.getLightNFTsByAccount = getLightNFTsByAccount;
exports.getLightCollection = getLightCollection;
exports.getLightCollectionHeaders = getLightCollectionHeaders;
exports.broadcastTx = broadcastTx;
exports.getLatestRelease = getLatestRelease;
exports.getPrice = getPrice;

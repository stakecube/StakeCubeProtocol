/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';

/*
    RPC FUNCTIONS
    ------------------
    This file hosts the RPC functionality of the StakeCube Protocol Wallet, allowing for
    full-node communications between SCC Core and SCP Wallet.
*/

const NET = require('./network.js');

const creds = {
    'user': null,
    'pass': null,
    'host': '',
    'port': 0
};

const RPC = {
    'auth': function(user, pass, host = 'localhost', port = 39999) {
        creds.user = user;
        creds.pass = pass;
        creds.host = host;
        creds.port = port;
    },
    'call': async function() {
        try {
            const method = arguments[0];
            const params = [...arguments].splice(1);
            const request = {
                'jsonrpc': '1.0',
                'id': this._id,
                'method': method,
                'params': params
            };
            let res = JSON.parse(await NET.post('http://' +
                                creds.user + ':' +
                                creds.pass + '@' +
                                creds.host + ':' +
                                creds.port,
            JSON.stringify(request)));
            // Result may be JSON or a string, so we'll attempt to parse JSON, but if it fails then it's fine too! It's a string
            try {
                res = JSON.parse(res.result);
            } catch(e) {
                res = res.result;
            }
            this._id++;
            return res;
        } catch(e) {
            throw e.json ? (await e.json()).error : e;
        }
    },
    '_id': 0
};

module.exports = RPC;

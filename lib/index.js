/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';

// NPM
const regedit = require('regedit');

let isGUI = false;
let isFullnode = false;
let isScanningBlocks = false;

// Flag to specify if the client is outdated according to external sources (i.e; Github API)
let isOutdated = false;

let rpcMain;

let npmPackage;
let DB;
let NET;
let RPC;
let TOKENS;
let WALLET;
try {
// GUI
    DB = require('../lib/database/index.js');
    NET = require('../lib/network.js');
    RPC = require('../lib/rpc.js');
    TOKENS = require('../lib/token.js');
    WALLET = require('../lib/wallet.js');
    isGUI = true;
    // It's more tricky to fetch the package.json file when GUI-packed, so... here's the workaround!
    try {
        // Unpacked
        let strFile;
        try {
            // starting index.js from /lib/..
            strFile = DB.fs.readFileSync('../package.json', 'utf8');
            isGUI = false;
        } catch(e) {
            // starting index.js from root directory
            strFile = DB.fs.readFileSync('package.json', 'utf8');
        }
        npmPackage = JSON.parse(strFile);
    } catch(e) {
        try {
            // Packed
            const strFile = DB.fs.readFileSync(process.cwd() +
                                               '\\resources\\app\\package.json',
            'utf8');
            npmPackage = JSON.parse(strFile);
        } catch(ee) {
            // NPM package is hiding somewhere unusual... but we can live without it!
            console.warn(e);
        }
    }
} catch(e) {
    // Terminal
    try {
        DB = require('./database/index.js');
        NET = require('./network.js');
        RPC = require('./rpc.js');
        TOKENS = require('./token.js');
        WALLET = require('./wallet.js');
        npmPackage = JSON.parse(DB.fs.readFileSync('../package.json', 'utf8'));
    } catch(ee) {
        // At this point, we have no idea what's causing the error, bail out!
        console.error('CRITICAL INITIALIZATION ERROR!\nThis error was not ' +
                      'caught and/or handled properly, this may need ' +
                      'reporting to the developer!');
        console.error(e);
        console.error(ee);
    }
}

if (npmPackage) {
    console.log('--- StakeCube Protocol (SCP) Wallet v' + npmPackage.version +
                ' --- ' + (isGUI ? 'GUI Mode' : ''));
    // Check if we're running the latest version
    NET.getLatestRelease().then(res => {
        res = JSON.parse(res);
        // If this is a draft or pre-release, just ignore it for now
        if (!res.draft && !res.prerelease) {
            const nWebVersion = Number(res.tag_name
                .replace('v', '')
                .replace(/\./g, ''));
            const nOurVersion = Number(npmPackage.version
                .replace('v', '')
                .replace(/\./g, ''));
            if (Number.isFinite(nWebVersion) && Number.isInteger(nWebVersion)) {
                if (nWebVersion > nOurVersion) {
                    // New version is released! We're running older software
                    isOutdated = true;
                }
            }
        }

        if (isOutdated) {
            console.warn('NEW VERSION AVAILABLE! (' + res.tag_name +
                         ')\nDownload the update on Github!');
        }
    });
} else {
    console.warn("Init: Unable to load npmPackage data... this won't cause " +
                 "major issues, don't worry!");
}

// The first SCP block
const nFirstBlock = 155084;

// The amount of satoshis that make a full coin
const COIN = 100000000;

// The SCP deployment fee, in SCC
const nDeployFee = 10;
const strDeployFeeDest = 'sccburnaddressXXXXXXXXXXXXXXSfqakF';

// SCC Core config
let SCC_CONFIG;

// Returns a value from the SCC Config file, if one doesn't exist, returns the default
function getConfigValue(wantedValue, defaultValue) {
    for (const keypair of SCC_CONFIG) {
        if (!keypair.startsWith(wantedValue)) continue;
        // Return the key's value
        return keypair.split('=')[1];
    }
    // No value, return the default, or nothing!
    return isNil(defaultValue) ? undefined : defaultValue;
}

// System Application data directory
const appdata = DB.appdata.getAppDataPath('SCPWallet') + '/';

// SCC Core data directory
let appdataCore = process.env.APPDATA || // Windows
                  (process.platform === 'darwin'
                      ? process.env.HOME + // MacOS
                  '/Library/Application Support/StakeCubeCoin/'
                      : process.env.HOME + // Linux
                  '/.stakecubecoin/');
if (appdataCore === process.env.APPDATA) appdataCore += '/StakeCubeCoin/'; // Append '/StakeCubeCoin/' to the windows appdata directory
appdataCore = appdataCore.replace(/\\/g, '/');

// API import
const express = require('express');
const app = express();
// Get All Tokens
app.get('/api/v1/getalltokens', function(req, res) {
    res.json(TOKENS.getTokensPtr());
});
// Get a single Token
app.get('/api/v1/gettoken/:contract', function(req, res) {
    if (!req.params.contract || req.params.contract.length <= 1) {
        return res.json({ 'error': "You must specify a 'contract' param!" });
    }
    const cToken = TOKENS.getToken(req.params.contract);
    if (cToken.error) {
        return res.json({ 'error': 'Token contract does not exist!' });
    }
    res.json(cToken);
});
// Get Tokens by Account
app.get('/api/v1/gettokensbyaccount/:account', function(req, res) {
    if (!req.params.account || req.params.account.length <= 1) {
        return res.json({ 'error': "You must specify an 'account' param!" });
    }
    res.json(TOKENS.getTokensByAccount(req.params.account));
});
// Get a single account's activity/history for a single token
app.get('/api/v1/getactivity/:contract/:account', function(req, res) {
    if (!req.params.contract || req.params.contract.length <= 1) {
        return res.json({ 'error': "You must specify a 'contract' param!" });
    }
    if (!req.params.account || req.params.account.length <= 1) {
        return res.json({ 'error': "You must specify an 'account' param!" });
    }
    const cToken = TOKENS.getToken(req.params.contract);
    if (cToken.error) {
        return res.json({ 'error': 'Token contract does not exist!' });
    }
    const cAccount = cToken.getAccount(req.params.account);
    if (!cAccount) {
        return res.json({ 'error': 'Account does not exist for this token!' });
    }
    res.json(cAccount.activity);
});
// Get a single account's activity/history for all tokens
app.get('/api/v1/getallactivity/:account', function(req, res) {
    if (!req.params.account || req.params.account.length <= 1) {
        return res.json({ 'error': "You must specify an 'account' param!" });
    }
    const cActivity = TOKENS.getActivityByAccount(req.params.account);
    res.json(cActivity);
});
// Gets all activity/history for all tokens, in one block, in a linear (flat) format with no nesting
app.get('/api/v1/getblockactivity/:block', function(req, res) {
    if (!req.params.block || req.params.block.length <= 1) {
        return res.json({ 'error': "You must specify a 'block' param!" });
    }
    const cLinearActivity = [];
    const nBlock = Number(req.params.block);
    if (!Number.isSafeInteger(nBlock)) {
        return res.json({ 'error': "Param 'block' is not an integer!" });
    }
    // Loop every token
    const cTknPtr = TOKENS.getTokensPtr();
    for (const cToken of cTknPtr) {
        // Loop every account
        for (const cAccount of cToken.owners) {
            // Loop every activity entry
            for (const activity of cAccount.activity) {
                // If the activity is in our needed block, save it
                if (activity.block !== nBlock) continue;
                cLinearActivity.push({
                    'txid': activity.id,
                    'contract': cToken.contract,
                    'account': cAccount.address,
                    'type': activity.type,
                    'amount': activity.amount
                });
            }
        }
    }
    res.json(cLinearActivity);
});
// Gets all activity/history for a specified TX-ID and a type
app.get('/api/v1/getactivitybytxid/:txid/:type', function(req, res) {
    if (!req.params.txid || req.params.txid.length !== 64) {
        return res.json({ 'error': "You must specify a valid 'txid' param!" });
    }
    const allowedTypes = ['all', 'sent', 'received', 'staked'];
    if (!req.params.type) {
        return res.json({
            'error': "You must specify a 'type' param!",
            'options': allowedTypes.join(', ')
        });
    }
    if (!allowedTypes.includes(req.params.type)) {
        return res.json({
            'error': "Bad 'type' (" + req.params.type + ')!',
            'options': allowedTypes.join(', ')
        });
    }
    const cLinearActivity = [];
    const strTx = req.params.txid;
    const strType = req.params.type;
    // Loop every token
    const cTknPtr = TOKENS.getTokensPtr();
    for (const cToken of cTknPtr) {
        // Loop every account
        for (const cAccount of cToken.owners) {
            // Loop every activity entry
            for (const activity of cAccount.activity) {
                // If the activity matches our type
                if (strType !== 'all' && activity.type !== strType) continue;
                // If the activity has our TX-ID
                if (activity.id !== strTx) continue;
                cLinearActivity.push({
                    'txid': activity.id,
                    'contract': cToken.contract,
                    'account': cAccount.address,
                    'type': activity.type,
                    'amount': activity.amount
                });
            }
        }
    }
    res.json(cLinearActivity);
});
// Gets a list of all changes related to the given address
app.get('/api/v1/wallet/listdeltas/:address', async function(req, res) {
    if (!req.params.address || req.params.address.length !== 34) {
        return res.status(400).send('Missing "address" parameter!');
    }
    try {
        const arrTxs = await rpcMain.call('getaddressdeltas', {
            'addresses': [req.params.address]
        });
        return res.json(arrTxs);
    } catch(e) {
        console.error("Network error on API 'wallet/listdeltas'");
        console.error(e);
        return res.status(400).send('Internal API Error');
    }
});
// Get an SCP-2 token's staking status for a single account
app.get('/api/v1/getstakingstatus/:contract/:account', function(req, res) {
    if (!req.params.contract || req.params.contract.length <= 1) {
        return res.json({ 'error': "You must specify a 'contract' param!" });
    }
    if (!req.params.account || req.params.account.length <= 1) {
        return res.json({ 'error': "You must specify an 'account' param!" });
    }
    const cToken = TOKENS.getToken(req.params.contract);
    if (cToken.error) {
        return res.json({ 'error': 'Token contract does not exist!' });
    }
    if (cToken.version !== 2) {
        return res.json({ 'error': 'Token is not an SCP-2!' });
    }
    res.json(cToken.getStakingStatus(req.params.account));
});
// Get the current raw mempool
app.get('/api/v1/getrawmempool', async function(req, res) {
    res.json(await getFullMempool());
});
// Get the balances of all owned tokens by this account, including SCC
app.get('/api/v1/wallet/getbalances/:address', async function(req, res) {
    if (!req.params.address) {
        return res.status(400).send('Missing "address" parameter!');
    }
    const strAddr = req.params.address;
    try {
        // Asynchronously sync UTXOs with the network
        await WALLET.refreshUTXOs(strAddr);
        const arrBalances = [];
        const arrUTXOs = [];
        for (const cUTXO of WALLET.getUTXOsPtr()) {
            if (cUTXO.address === strAddr && !cUTXO.spent) {
                arrUTXOs.push(cUTXO);
            }
        }
        // Push SCC balance
        arrBalances.push({
            'name': 'StakeCubeCoin',
            'ticker': 'SCC',
            // Balance is the sum of all UTXOs, for standardization
            'balance': arrUTXOs.reduce((a, b) => {
                return a + b.sats;
            }, 0),
            'utxos': arrUTXOs
        });
        // Get SCP tokens and add these to the list too
        const cTokens = isFullnode
            ? TOKENS.getTokensByAccount(strAddr)
            : JSON.parse(await NET.getLightTokensByAccount(strAddr));
        for (const cToken of cTokens) {
            arrBalances.push({
                'name': cToken.token.name,
                'contract': cToken.token.contract,
                'ticker': cToken.token.ticker,
                'version': cToken.token.version,
                'balance': cToken.account.balance,
                'unclaimed_balance': (cToken.account.unclaimed_balance
                    ? cToken.account.unclaimed_balance
                    : 0)
            });
        }
        return res.json(arrBalances);
    } catch(e) {
        console.error("Network error on API 'wallet/getbalance/" + strAddr +
                        "'");
        console.error(e);
        return res.status(400).send('Internal API Error');
    }
});
// Gets a list of all addresses available to the wallet
app.get('/api/v1/wallet/listaddresses', async function(req, res) {
    try {
        const arrAddresses = [];
        const cWalletDB = WALLET.toDB();
        for (const cAddr of cWalletDB.wallets) {
            arrAddresses.push({
                'address': cAddr.pubkey,
                'unlocked': cAddr.privkeyDecrypted.length > 0
            });
        }
        return res.json(arrAddresses);
    } catch(e) {
        console.error("Network error on API 'wallet/listaddresses'");
        console.error(e);
        return res.status(400).send('Internal API Error');
    }
});

// Creates a new wallet address
app.get('/api/v1/wallet/getnewaddress', async function(req, res) {
    try {
        // Create a new wallet address
        const cWallet = await WALLET.createWallet();
        // Save to the database
        await DB.setWallet(WALLET.toDB());
        return res.send(cWallet.getPubkey());
    } catch(e) {
        console.error("Network error on API 'wallet/getnewaddress'");
        console.error(e);
        return res.status(400).send('Internal API Error');
    }
});
// Creates an SCC transaction with the given wallet address
app.get('/api/v1/wallet/send/:address/:currency/:to/:amount',
    async function(req, res) {
        if (!req.params.address) {
            return res.status(400).send('Missing "address" parameter!');
        }
        if (!req.params.currency) {
            return res.status(400).send('Missing "currency" parameter!');
        }
        if (!req.params.to) {
            return res.status(400).send('Missing "to" parameter!');
        }
        if (!req.params.amount) {
            return res.status(400).send('Missing "amount" parameter!');
        }
        const strAddr = req.params.address;
        const strCurrency = req.params.currency;
        const strTo = req.params.to;
        const nAmount = Number(req.params.amount);
        try {
        // Cache our tokens list, for if needed
            let cTokens = false;
            let cSelectedToken = false;

            // Ensure the 'to' address looks correct
            if (!strTo.startsWith('s') || strTo.length !== 34) {
                return res.status(400)
                    .send('Receiving address "' + strTo +
                             '" is invalid!');
            }

            // Ensure the 'amount' is a valid number
            if (Number.isNaN(nAmount) || !Number.isFinite(nAmount)) {
                return res.status(400)
                    .send('Sending amount "' + nAmount +
                             '" is an invalid amount!');
            }

            // Ensure we have the address specified, and it's unlocked
            const cWallet = WALLET.getWallet(strAddr);
            const strPubkey = cWallet.getPubkey();
            if (!cWallet) {
                return res.status(400)
                    .send('Address "' + strAddr +
                             '" does not exist in this wallet!');
            }
            if (cWallet.getPrivkey() === null) {
                return res.status(400)
                    .send('This address is locked (encrypted)' +
                             ' via passphrase! Please unlock via' +
                             ' GUI before using the API.');
            }

            // Asynchronously sync UTXOs with the network
            await WALLET.refreshUTXOs(strPubkey);

            // Ensure we have the currency specified
            if (strCurrency.toLowerCase() !== 'scc') {
                cTokens = isFullnode
                    ? TOKENS.getTokensByAccount(strAddr)
                    : JSON.parse(await NET.getLightTokensByAccount(strAddr));
                for (const cToken of cTokens) {
                    if (cToken.token.contract === strCurrency) {
                        cSelectedToken = cToken;
                    }
                }
                // If no token was found, bail out!
                if (!cSelectedToken) {
                    return res.status(400).send('Invalid token contract ID, "' +
                                            strCurrency + '"! Or this token' +
                                            ' is not held within this ' +
                                            'account.');
                }
            }

            // Create the transaction!
            if (!cSelectedToken) {
            // --- SCC ---
                const cTx = WALLET.sccjs.tx.transaction();
                // Inputs
                const usedUTXOs = WALLET.getCoinsToSpend(nAmount * COIN,
                    false,
                    strPubkey);
                const nUTXOs = usedUTXOs.reduce((a, b) => {
                    return a + b.sats;
                }, 0);
                for (const cUTXO of usedUTXOs) {
                    cTx.addinput(cUTXO.id, cUTXO.vout, cUTXO.script);
                }
                if (nAmount >= nUTXOs / COIN) {
                    return res.status(400).send('Not enough funds! (Sending: ' +
                                            nAmount + ', Have: ' +
                                            (nUTXOs / COIN) + ')');
                }
                // Destination output
                cTx.addoutput(strTo, nAmount);
                // Fee & Change output
                const nFee = WALLET.getFee(cTx.serialize().length);
                const nSpent = (nFee + nAmount).toFixed(8);
                const nChange = ((nUTXOs / COIN) - nSpent).toFixed(8);
                cTx.addoutput(strPubkey, nChange);
                // Broadcast
                const strSignedTx = await cTx.sign(cWallet.getPrivkey(), 1);
                const strTXID = await NET.broadcastTx(strSignedTx);
                // Mark UTXOs as spent
                for (const cUTXO of usedUTXOs) {
                    cUTXO.spent = true;
                }
                return res.json({
                    'txid': strTXID,
                    'rawTx': strSignedTx
                });
            } else {
            // --- SCP ---
                const cTx = WALLET.sccjs.tx.transaction();
                const nCoinsBal = (cSelectedToken.account.balance / COIN);
                if (nAmount > nCoinsBal) {
                    return res.status(400).send('Not enough funds! (Sending: ' +
                                            nAmount + ', Have: ' +
                                            nCoinsBal + ')');
                }
                // Add input
                const cUTXO = WALLET.getCoinsToSpend(10000, true, strPubkey)[0];
                if (!cUTXO) {
                    return res.status(400).send('Not enough gas funds!');
                }
                cTx.addinput(cUTXO.id, cUTXO.vout, cUTXO.script);
                // SCP output
                cTx.addoutputburn(0.00000001,
                    cSelectedToken.token.contract + ' send ' +
                                (nAmount * COIN).toFixed(0) + ' ' + strTo);
                // Fee & Change output
                const nFee = WALLET.getFee(cTx.serialize().length);
                const nChange = ((cUTXO.sats / COIN) - nFee).toFixed(8);
                cTx.addoutput(strPubkey, nChange);
                // Broadcast
                const strSignedTx = await cTx.sign(cWallet.getPrivkey(), 1);
                const strTXID = await NET.broadcastTx(strSignedTx);
                // Mark UTXO as spent
                cUTXO.spent = true;
                return res.json({
                    'txid': strTXID,
                    'rawTx': strSignedTx
                });
            }
        } catch(e) {
            console.error("Network error on API 'wallet/send'");
            console.error(e);
            return res.status(400).send('Internal API Error');
        }
    });
// Creates a stake transaction to claim the pending rewards of a given account
app.get('/api/v1/wallet/stake/:address/:currency', async function(req, res) {
    if (!req.params.address) {
        return res.status(400).send('Missing "address" parameter!');
    }
    if (!req.params.currency) {
        return res.status(400).send('Missing "currency" parameter!');
    }
    const strAddr = req.params.address;
    const strCurrency = req.params.currency;
    try {
        // Ensure we have the address specified, and it's unlocked
        const cWallet = WALLET.getWallet(strAddr);
        const strPubkey = cWallet.getPubkey();
        if (!cWallet) {
            return res.status(400)
                .send('Address "' + strAddr +
                         '" does not exist in this wallet!');
        }
        if (cWallet.getPrivkey() === null) {
            return res.status(400)
                .send('This address is locked (encrypted)' +
                         ' via passphrase! Please unlock via' +
                         ' GUI before using the API.');
        }

        // Asynchronously sync UTXOs with the network
        await WALLET.refreshUTXOs(strPubkey);

        // Ensure we have the currency specified
        const cTokens = isFullnode
            ? TOKENS.getTokensByAccount(strAddr)
            : JSON.parse(await NET.getLightTokensByAccount(strAddr));
        let cSelectedToken = false;
        for (const cToken of cTokens) {
            if (cToken.token.contract === strCurrency) {
                cSelectedToken = cToken;
            }
        }
        // If no token was found, bail out!
        if (!cSelectedToken) {
            return res.status(400).send('Invalid token contract ID, "' +
                                    strCurrency + '"! Or this token' +
                                    ' is not held within this ' +
                                    'account.');
        }
        // --- CLAIM STAKE ---
        const cTx = WALLET.sccjs.tx.transaction();
        const nCoinsBal = (cSelectedToken.account.unclaimed_balance / COIN);
        if (nCoinsBal <= 0) {
            return res.status(400).send('You have no pending rewards!');
        }
        // Add input
        const cUTXO = WALLET.getCoinsToSpend(10000, true, strPubkey)[0];
        if (!cUTXO) {
            return res.status(400).send('Not enough gas funds!');
        }
        cTx.addinput(cUTXO.id, cUTXO.vout, cUTXO.script);
        // SCP output
        cTx.addoutputburn(0.00000001,
            cSelectedToken.token.contract + ' redeem');
        // Fee & Change output
        const nFee = WALLET.getFee(cTx.serialize().length);
        const nChange = ((cUTXO.sats / COIN) - nFee).toFixed(8);
        cTx.addoutput(strPubkey, nChange);
        // Broadcast
        const strSignedTx = await cTx.sign(cWallet.getPrivkey(), 1);
        const strTXID = await NET.broadcastTx(strSignedTx);
        // Mark UTXO as spent
        cUTXO.spent = true;
        return res.json({
            'txid': strTXID,
            'rawTx': strSignedTx
        });
    } catch(e) {
        console.error("Network error on API 'wallet/stake'");
        console.error(e);
        return res.status(400).send('Internal API Error');
    }
});

app.listen(3000);

async function init() {
    // Ensure the SCPWallet Data Directory exists
    DB.fs.mkdirSync(appdata, { 'recursive': true });
    // Loop the StakeCubeCoin.conf file for RPC username and password params, if any
    try {
        // Load the wallet DB
        const rawDBWallet = await DB.getWallet();
        if (rawDBWallet) {
            // Check which format we're using (pre-v1.1.4, or above)
            if (rawDBWallet.wallets && rawDBWallet.wallets.length > 0) {
                // New format
                for (const rawWallet of rawDBWallet.wallets) {
                    const cWallet = new WALLET.Wallet(rawWallet.pubkey,
                        rawWallet.privkeyDecrypted,
                        rawWallet.privkeyEncrypted);
                    WALLET.addWallet(cWallet);
                }
            } else {
                // Old format
                const cWallet = new WALLET.Wallet(rawDBWallet.pubkey,
                    rawDBWallet.privkeyDecrypted,
                    rawDBWallet.privkeyEncrypted);
                WALLET.addWallet(cWallet);
            }
            // Set 2FA (resides in the root object, regardless of wallet format)
            WALLET.set2FAkey(rawDBWallet.opt2FA);
        }
        // Load the core config
        const conf = await DB.fromDiskCore('stakecubecoin.conf');
        // Make sure there's atleast *something* in the config
        if (!conf || conf.length === 0) {
            console.warn('No SCC Core config file detected!');
            return false;
        }
        // Split lines into an array of config settings
        SCC_CONFIG = conf.trim().split(/[\r\n]+/gm);

        // Prepare RPC connection
        // A TX Index is required to retrieve raw transaction information from the chain, this is required to use SC-Protocol
        const hasIndexing = getConfigValue('txindex', false);
        if (!hasIndexing) {
            return {
                'error': true,
                'message': 'No transaction index ' +
                           '(-txindex=1) detected!',
                'id': 0
            };
        }

        const server = getConfigValue('server', false);
        if (!server) {
            return {
                'error': true,
                'message': 'No RPC server (-server=1) detected!',
                'id': 1
            };
        }

        const rpcUser = getConfigValue('rpcuser', false);
        if (!rpcUser) {
            return {
                'error': true,
                'message': 'No RPC username (-rpcuser=xyz...) ' +
                           'detected!',
                'id': 2
            };
        }

        const rpcPass = getConfigValue('rpcpassword', false);
        if (!rpcPass) {
            return {
                'error': true,
                'message': 'No RPC password (-rpcpassword=zyx...) ' +
                           'detected!',
                'id': 3
            };
        }

        const rpcPort = getConfigValue('rpcport', 39999);
        if (!rpcPort) {
            return {
                'error': true,
                'message': 'No RPC port (-rpcport=39999) detected!',
                'id': 4
            };
        }

        rpcMain = RPC;
        rpcMain.auth(rpcUser, rpcPass, 'localhost', rpcPort);

        // Test the RPC connection
        try {
            const uptime = await rpcMain.call('uptime');
            if (!isFinite(Number(uptime))) {
                return {
                    'error': true,
                    'message': 'Unable to connect to the RPC!',
                    'id': 5
                };
            }
            // RPC Connection successful!
            isFullnode = true;
            return {
                'error': false,
                'message': 'Successfully connected to the RPC!',
                'id': 6
            };
        } catch(e) {
            return {
                'error': true,
                'message': 'Unable to connect to the RPC!',
                'rejection': e,
                'id': 5
            };
        }
    } catch(e) {
        console.error('SCC.CONF FATAL ERROR:');
        console.error(e);
    }
}

// If we're on Windows; check the registry for SCC Core's data directory
if (process.platform === 'win32') {
    const regPath = 'HKCU\\Software\\StakeCubeCoin\\SCC-Qt';
    regedit.list(regPath, function(err, result) {
        if (err || !result[regPath] || isEmpty(result[regPath].values)) {
            if (err) console.warn(err);
            console.warn('Registry: Unable to read SCC-Qt registry, ' +
                         'defaulting to:\n' + appdataCore);
            init().then(console.log);
        } else {
            const res = result[regPath].values;
            // No errors; ensure the registries and paths are available
            const pathExists = res && res.strDataDir && res.strDataDir.value;
            if (pathExists && res.strDataDir.value.length > 1) {
                // We found the StakeCubeCoin Core datadir!
                appdataCore = res.strDataDir.value.replace(/\\/g, '/');
                // Make sure the ending "/" isn't missing
                if (!appdataCore.endsWith('/')) {
                    appdataCore += '/';
                }
                console.log('Registry: Detected data directory from registry!' +
                            '\n' + appdataCore);
                init().then(console.log);
            } else {
                // Failed to find the registry datadir, initializing with defaults...
                console.warn('Registry: Unable to read SCC-Qt registry, ' +
                             'defaulting to:\n' + appdataCore);
                init().then(console.log);
            }
        }
    });
} else {
// Otherwise, just initialize straight away!
    init().then(console.log);
}

const chainMessages = [];
const chainHashesCache = [];
let currentScanBlock = null;
async function getMsgsFromChain(nBlocksTotal) {
    isScanningBlocks = true;
    currentScanBlock = null;
    let nBestBlock = await rpcMain.call('getbestblockhash');
    nBestBlock = await rpcMain.call('getblock', nBestBlock);
    const nStartBlock = nBestBlock.height - nBlocksTotal;
    console.log('Scanning block range ' + nStartBlock + ' to ' +
                nBestBlock.height + ' (Total: ' + nBlocksTotal + ')');
    for (let i = nStartBlock; i < nBestBlock.height + 1; i++) {
        // Optimization note:
        // If we've started a new scan, clear currentScanBlock and pull the fresh block data from RPC
        // ... if we're doing a long scan, we cache the last block and rely on 'nextblockhash' for
        // ... faster querying, as it removes the need to call 'getblockhash' on every loop tick
        let currentScanHash = null;
        if (currentScanBlock === null || !currentScanBlock.nextblockhash) {
            currentScanHash = await rpcMain.call('getblockhash', i);
        } else {
            currentScanHash = currentScanBlock.nextblockhash;
        }
        // Skip blocks if we've already scanned them before
        if (chainHashesCache.includes(currentScanHash)) continue;
        // Grab the block from RPC, cache it to save on future requests
        currentScanBlock = await rpcMain.call('getblock', currentScanHash);
        await getMsgsFromBlock(currentScanBlock);
    }
    console.log('Scan done!');
    isScanningBlocks = false;
}

async function getMsgsFromBlock(blk) {
    if (blk === null || blk === undefined) return null;
    chainHashesCache.push(blk.hash);
    TOKENS.setBlockHeight(blk.height);
    if (blk.nTx === 1) return null;

    for (let i = 0; i < blk.nTx; i++) {
        const txRes = await getMsgFromTx(blk.tx[i]);
        if (txRes === null || txRes.msg.length === 0) continue;
        if (txRes.error) return console.error(txRes);
        // Process the new state
        try {
            await processState(txRes.msg, txRes.tx);
        } catch(e) {
            console.error('processState() failure !!!\n Block: ' + blk.hash +
                          ' (' + blk.height + ')\n TX: ' + blk.tx[i]);
            console.error(e);
        }
        // Cache this message and block
        chainMessages.push({
            'msg': txRes.msg,
            'time': blk.time,
            'tx': blk.tx[i],
            'mempool': false
        });
        console.log('Message found! (' + txRes.msg + ')');
    }
    return true;
}

async function getMsgFromTx(rawTX) {
    let res;
    try {
        res = await rpcMain.call('getrawtransaction', rawTX, 1);
    } catch(e) {
        return {
            'error': true,
            'message': 'Unable to fetch raw transaction, insufficient ' +
                            'TX indexing',
            'id': 7
        };
    }
    if (isNil(res)) {
        return {
            'error': true,
            'message': 'Unable to fetch raw transaction, ' +
                                           'insufficient TX indexing',
            'id': 7
        };
    }
    for (const cVout of res.vout) {
        if (!cVout.scriptPubKey) continue;
        if (!cVout.scriptPubKey.asm) continue;
        // Scan the scriptPubKey for OP_RETURN
        if (cVout.scriptPubKey.asm.startsWith('OP_RETURN')) {
            // Found an OP_RETURN! Parse the message from HEX to UTF-8
            const rawHex = cVout.scriptPubKey.asm.replace('OP_RETURN ', '');
            const buf = Buffer.from(rawHex, 'hex');
            return {
                'msg': buf.toString('utf8'),
                'tx': res
            };
        }
    }
    return null;
}

async function getFullMempool() {
    const arrFullMempool = [];
    const arrMempool = await rpcMain.call('getrawmempool');
    for (const cTX of arrMempool) {
        arrFullMempool.push(await rpcMain.call('getrawtransaction', cTX, 1));
    }
    return arrFullMempool;
}

// Deterministically Authenticate a contract interaction via it's inputs
async function isCallAuthorized(cTx, strAuthAddr) {
    for (const cVin of cTx.vin) {
        // Fetch the VIN raw tx
        const vinTx = await rpcMain.call('getrawtransaction', cVin.txid, 1);
        // Ensure all vins are from the 'authAddr' address
        const strVinAddr = vinTx.vout[cVin.vout].scriptPubKey.addresses[0];
        if (strVinAddr !== strAuthAddr) {
            return false;
        }
    }
    // If we reach here, all inputs were from the given address!
    return true;
}

// Chain State Processing
async function processState(newMsg, tx) {
    if (isEmpty(newMsg)) return true;

    // SCP Token: CREATE
    // Create a new SCP-predefined token, with name, ticker and max supply
    if (newMsg.startsWith('SCPCREATE') && !isEmpty(tx) && !isEmpty(tx.txid)) {
        /*
            param 0 = SCPCREATE
            version = "SCPCREATE<version>"
            param 1 = NAME (str)
            param 2 = TICKER (str)
            param 3 = MAXSUPPLY (int)
            --- SCP-2 ---
            param 4 = INFLATION (int)
            param 5 = MINAGE (int)
        */
        const arrParams = newMsg.split(' ');
        let nVersion = 1;
        let nExpectedParams = 4;
        if (arrParams[0] !== 'SCPCREATE') {
            const arrVersion = Number(arrParams[0].split('SCPCREATE')[1]);
            if (arrVersion === 2) {
                nVersion = 2;
                nExpectedParams = 6;
            }
        }
        // Ensure we have the correct amount of params
        if (arrParams.length === nExpectedParams) {
            // Sanity checks
            const check1 = arrParams[1].length > 0;
            const check2 = arrParams[2].length > 0;
            const nCheck3 = Number(arrParams[3]);
            const check3 = (nCheck3 > 0 && Number.isSafeInteger(nCheck3));
            // SCP-2 inflation
            const nCheck4 = Number(arrParams[4]);
            let check4 = true;
            // SCP-2 minimum age (in blocks) to stake
            const nCheck5 = Number(arrParams[5]);
            let check5 = true;
            if (nVersion === 2) {
                check4 = (nCheck4 > 1 && Number.isSafeInteger(nCheck4));
                check5 = (nCheck5 > 1 && Number.isSafeInteger(nCheck5));
            }
            if (check1 && check2 && check3 &&
                (check4 && check5)) {
                // Params look good, now verify outputs
                try {
                    // Grab change output (last vout) --> Ensure change output is the token issuer
                    const voutCaller = tx.vout[tx.vout.length - 1];
                    const addrCaller = voutCaller.scriptPubKey.addresses[0];
                    if (!addrCaller || isEmpty(addrCaller)) {
                        throw Error('Missing creator address!');
                    }
                    // Verify the deployment fee output
                    const voutFee = tx.vout[1];
                    const hasPubkey = voutFee &&
                                    voutFee.scriptPubKey &&
                                    voutFee.scriptPubKey.addresses[0];
                    const hasFee = voutFee.value >= nDeployFee;
                    if (hasPubkey && hasFee) {
                        // Ensure the fee pubkey matches the public burn address
                        const feePubkey = voutFee.scriptPubKey.addresses[0];
                        if (feePubkey !== strDeployFeeDest) {
                            throw Error('Deployment fee output is invalid!');
                        }
                        let newToken;
                        if (nVersion === 1) {
                            newToken = new TOKENS.SCP1Token(tx.txid,
                                arrParams[1],
                                arrParams[2],
                                nCheck3,
                                addrCaller,
                                []);
                        }
                        if (nVersion === 2) {
                            newToken = new TOKENS.SCP2Token(tx.txid,
                                arrParams[1],
                                arrParams[2],
                                nCheck3,
                                addrCaller,
                                [],
                                nCheck4,
                                nCheck5);
                        }
                        TOKENS.addToken(newToken);
                        console.log('New SCP-' + nVersion + ' token created!');
                        console.log(newToken);
                    } else {
                        console.warn('An attempt to create a new SCP-' +
                                     nVersion + ' token has failed, invalid ' +
                                     'fee output!');
                    }
                } catch(e) {
                    console.warn('An attempt to create a new SCP-' +
                                 nVersion + ' token has failed, failed ' +
                                 'to verify outputs!');
                    console.error(e);
                }
            } else {
                console.warn('An attempt to create a new SCP-' + nVersion +
                             ' token has failed, incorrect params!');
            }
        } else {
            console.warn('An attempt to create a new SCP-' + nVersion +
                         ' token has failed, incorrect param count! (has ' +
                         arrParams.length + ', expected ' + nExpectedParams +
                         ')\nTX: ' + tx.txid);
        }
    } else if (newMsg.length > 64) {
        // Contract write operation
        /*
            param 0 = TXID (txid str)
            param 1 = METHOD (contract method)
        */
        const arrParams = newMsg.split(' ');
        // Sanity check
        const check1 = arrParams[0].length === 64;
        const check2 = !isNil(arrParams[1]) && arrParams[1].length > 1;
        if (check1 && check2) {
            // Fetch the contract being called
            // SCP Token Contracts
            const cToken = TOKENS.getToken(arrParams[0]);
            if (!cToken.error) {
                // SCP MINTING (Create new tokens on-demand, issuer-only, cannot mint above predefined max supply)
                if (arrParams[1] === 'mint') {
                    /*
                        param 2 = AMOUNT (satoshi int)
                    */
                    if (cToken.version === 2) {
                        // SCP-2 tokens can only mint a single time
                        // The first 'owner' is ALWAYS the issuer, thus, if there's atleast one owner
                        // ... then a mint has already taken place, no rug-pulls today, sir!
                        if (cToken.owners.length > 0) return true;
                    }
                    const nCheck3 = Number(arrParams[2]);
                    const check3 = (nCheck3 > 0 &&
                                    Number.isSafeInteger(nCheck3));
                    if (check3) {
                        // Grab change output --> Ensure change output is the token issuer
                        const addrCaller = tx.vout[1].scriptPubKey.addresses[0];
                        if (!addrCaller || isEmpty(addrCaller)) {
                            throw Error('Missing creator address!');
                        }
                        // Check the change output against the token issuer
                        if (addrCaller === cToken.creator) {
                            // Authentication: Ensure all inputs of the TX are from the issuer
                            const fSafe = await isCallAuthorized(tx,
                                addrCaller);
                            if (fSafe) {
                                // Authentication successful, minting tokens!
                                cToken.creditAccount(cToken.creator, nCheck3,
                                    tx);
                            } else {
                                console.error('An attempt to mint SCP-' +
                                              cToken.version + ' ' +
                                              'containing a non-issuer input ' +
                                              'was detected, ignoring ' +
                                              'request...');
                            }
                        } else {
                            console.error('An attempt by a non-issuer to mint' +
                                          ' SCP-' + cToken.version + ' tokens' +
                                          ' failed! (Issuer: ' +
                                          cToken.creator.substr(0, 5) + '... ' +
                                          'Caller: ' + addrCaller.substr(0, 5) +
                                          '...)');
                        }
                    } else {
                        console.error('An attempt to mint SCP-' +
                                      cToken.version +
                                      ' tokens failed! (Token: ' + cToken.name +
                                      ', amount: ' + arrParams[2] + ')');
                    }
                } else if (arrParams[1] === 'burn') {
                // SCP BURNING (Burn tokens from your account balance, usable by anyone, cannot burn more than your available balance)
                    /*
                        param 2 = AMOUNT (satoshi int)
                    */
                    const nCheck3 = Number(arrParams[2]);
                    const check3 = (nCheck3 > 0 &&
                                    Number.isSafeInteger(nCheck3));
                    if (check3) {
                        // Fetch the change output of the contract call TX, assume the change output is the caller.
                        const addrCaller = tx.vout[1].scriptPubKey.addresses[0];
                        if (!addrCaller || isEmpty(addrCaller)) {
                            throw Error('Missing caller address!');
                        }
                        // Authentication: Ensure all inputs of the TX are from the caller
                        const fSafe = await isCallAuthorized(tx,
                            addrCaller);
                        if (fSafe) {
                            // Authentication successful, burning tokens!
                            cToken.debitAccount(addrCaller, nCheck3, tx);
                        } else {
                            console.error('An attempt to burn SCP-' +
                                          cToken.version + ' containing a ' +
                                          'non-issuer input was detected, ' +
                                          'ignoring request...');
                        }
                    } else {
                        console.error('An attempt to burn SCP-' +
                                      cToken.version +
                                      ' tokens failed! (Token: ' + cToken.name +
                                      ', amount: ' + arrParams[2] + ')');
                    }
                } else if (arrParams[1] === 'send') {
                // SCP SENDS (Transfer tokens to another account, usable by anyone, cannot send more than your available balance)
                    /*
                        param 2 = AMOUNT (satoshi int)
                        param 3 = RECEIVER (address str)
                    */
                    // Fetch the change output of the contract call TX, assume the change output is the caller.
                    const addrCaller = tx.vout[1].scriptPubKey.addresses[0];
                    if (!addrCaller || isEmpty(addrCaller)) {
                        throw Error('Missing caller address!');
                    }
                    // Run sanity checks
                    const nCheck3 = Number(arrParams[2]);
                    const check3 = (nCheck3 > 0 &&
                                    Number.isSafeInteger(nCheck3));
                    const check4 = (await rpcMain.call('validateaddress',
                        arrParams[3])).isvalid;
                    if (check3 && check4 === true) {
                        // Authentication: Ensure all inputs of the TX are from the caller
                        const fSafe = await isCallAuthorized(tx,
                            addrCaller);
                        if (fSafe) {
                            // Authentication successful, burning tokens!
                            cToken.transfer(addrCaller, arrParams[3], nCheck3,
                                tx);
                        } else {
                            console.error('An attempt to transfer SCP-' +
                                          cToken.version + ' containing a ' +
                                          'non-caller input was detected, ' +
                                          'ignoring request...');
                        }
                    } else {
                        console.error('An attempt to transfer SCP-' +
                                      cToken.version + ' tokens failed! ' +
                                      '(Token: ' + cToken.name + ', from ' +
                                      addrCaller.substr(0, 5) + ', to ' +
                                      arrParams[3].substr(0, 5) + ', amount: ' +
                                      arrParams[2] + ')');
                    }
                } else if (cToken.version === 2 && arrParams[1] === 'redeem') {
                // SCP-2 STAKING (Redeem an amount of unclaimed balance, credited from staking rewards)
                    // Fetch the change output of the contract call TX, assume the change output is the caller.
                    const addrCaller = tx.vout[1].scriptPubKey.addresses[0];
                    if (!addrCaller || isEmpty(addrCaller)) {
                        throw Error('Missing caller address!');
                    }
                    // Authentication: Ensure all inputs of the TX are from the caller
                    const fSafe = await isCallAuthorized(tx, addrCaller);
                    if (fSafe) {
                        // Authentication successful, redeeming tokens!
                        cToken.redeemRewards(addrCaller, tx);
                    } else {
                        console.error('An attempt to redeem SCP-' +
                                      cToken.version + ' stakes containing ' +
                                      'a non-issuer input was detected, ' +
                                      'ignoring request...');
                    }
                }
            } else {
                console.error('Contract write attempted on a non-existant ' +
                              'contract, skipping!');
                // Dump the error too, for good debugging measure
                console.error(cToken);
            }
        }
    }

    // Finished processing
    return true;
}

// Util stuff (should probably be put into a lib/util.js module, #soon)
function isNil(a) {
    if (a === undefined || a === null || !a) return true; return false;
}
function isEmpty(a) {
    if (isNil(a) || (a.length && a.length === 0)) return true; return false;
}

// CORE DAEMON
setInterval(async () => {
    // Only run the daemon loop when we're a full-node
    if (!isFullnode) return;
    // Every 2 seconds we check the chain for changes and sync our state with it.
    if (!isScanningBlocks) {
        try {
            // If we have no blocks cache, we need to start scanning the chain!
            if (chainHashesCache.length === 0) {
                // Scan from the first known SCP-burn block
                const nCurrentBlock = await rpcMain.call('getblockcount');
                await getMsgsFromChain(nCurrentBlock - nFirstBlock);
            } else {
            // If we have a blocks cache, only try scanning the last ~20 blocks for changes
                await getMsgsFromChain(20);
            }
        } catch(e) {
            console.warn('CSP: Unable to scan blocks, retrying...');
            isScanningBlocks = false;
        }
    }
}, 5000);

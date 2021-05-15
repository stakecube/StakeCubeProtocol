/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';

// Native
// NPM
const RPC   = require('bitcoin-rpc-promise');
let regedit = require('regedit');
var _       = require('lodash');

let isGUI = false;
let isFullnode = false;


let npm_package;
let DB;
let TOKENS;
try {
// GUI
    DB     = require('../lib/database.js');
    TOKENS = require('../lib/token.js');
    isGUI  = true;
    // It's more tricky to fetch the package.json file when GUI-packed, so... here's the workaround!
    try {
        // Unpacked
        npm_package = JSON.parse(DB.fs.readFileSync("package.json", "utf8"));
    } catch (e) {
        try {
            // Packed
            npm_package = JSON.parse(DB.fs.readFileSync(process.cwd() + "\\resources\\app\\package.json", "utf8"));
        } catch (ee) {
            // NPM package is hiding somewhere unusual... but we can live without it!
            console.warn(e);
        }
    }
} catch (e) {
// Terminal
    DB          = require('./database.js');
    TOKENS      = require('./token.js');
    npm_package = JSON.parse(DB.fs.readFileSync("../package.json", "utf8"));
}

if (npm_package) {
    console.log("--- StakeCube Protocol (SCP) Wallet v" + npm_package.version + " --- ");    
} else {
    console.warn("Init: Unable to load npm_package data... this won't cause major issues, don't worry!");
}

const nFirstBlock = 95713;

// SCC Core config
let SCC_CONFIG;

// The SCC Core RPC daemon
let SCC;

// Returns a value from the SCC Config file, if one doesn't exist, returns the default
function getConfigValue(wantedValue, defaultValue) {
    for (const keypair of SCC_CONFIG) {
        if (!keypair.startsWith(wantedValue)) continue;
        // Return the key's value
        return keypair.split("=")[1];
    }
    // No value, return the default, or nothing!
    return _.isNil(defaultValue) ? undefined : defaultValue;
}

// System Application data directory
let appdata = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : '/var/local');
appdata = appdata.replace(/\\/g, '/') + '/StakeCubeProtocol/';

// SCC Core data directory
let appdataCore = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support/StakeCubeCoin/' : process.env.HOME + '/.stakecubecoin/');
if (appdataCore === process.env.APPDATA) appdataCore += '/StakeCubeCoin/'; // Append '/StakeCubeCoin/' to the windows appdata directory
appdataCore = appdataCore.replace(/\\/g, '/');

// API import
var express = require('express');
var app = express();
// Get All Tokens
app.get('/api/v1/getalltokens', function (req, res) {
    res.json(TOKENS.getTokensPtr());
});
// Get a single Token
app.get('/api/v1/gettoken/:contract', function (req, res) {
    if (!req.params.contract || req.params.contract.length <= 1) return res.json({ error: "You must specify a 'contract' param!" });
    let cToken = TOKENS.getToken(req.params.contract);
    if (cToken.error) return res.json({ error: "Token contract does not exist!" });
    res.json(cToken);
});
// Get Tokens by Account 
app.get('/api/v1/gettokensbyaccount/:account', function (req, res) {
    if (!req.params.account || req.params.account.length <= 1) return res.json({ error: "You must specify an 'account' param!" });
    res.json(TOKENS.getTokensByAccount(req.params.account));
});
// Get a single account's activity/history for a single token
app.get('/api/v1/getactivity/:contract/:account', function (req, res) {
    if (!req.params.contract || req.params.contract.length <= 1) return res.json({ error: "You must specify a 'contract' param!" });
    if (!req.params.account || req.params.account.length <= 1) return res.json({ error: "You must specify an 'account' param!" });
    let cToken = TOKENS.getToken(req.params.contract);
    if (cToken.error) return res.json({ error: "Token contract does not exist!" });
    let cAccount = cToken.getAccount(req.params.account);
    if (!cAccount) return res.json({ error: "Account does not exist for this token!" });
    res.json(cAccount.activity);
});
// Get a single account's activity/history for all tokens
app.get('/api/v1/getallactivity/:account', function (req, res) {
    if (!req.params.account || req.params.account.length <= 1) return res.json({ error: "You must specify an 'account' param!" });
    let cActivity = TOKENS.getActivityByAccount(req.params.account);
    res.json(cActivity);
});
// Gets all activity/history for all tokens, in one block, in a linear (flat) format with no nesting
app.get('/api/v1/getblockactivity/:block', function (req, res) {
    if (!req.params.block || req.params.block.length <= 1) return res.json({ error: "You must specify a 'block' param!" });
    let cLinearActivity = [];
    let nBlock = Number(req.params.block);
    if (!Number.isSafeInteger(nBlock)) return res.json({ error: "Param 'block' is not an integer!" });
    // Loop every token
    let cTknPtr = TOKENS.getTokensPtr();
    for (const cToken of cTknPtr) {
        // Loop every account
        for (const cAccount of cToken.owners) {
            // Loop every activity entry
            for (const activity of cAccount.activity) {
                // If the activity is in our needed block, save it
                if (activity.block !== nBlock) continue;
                cLinearActivity.push({
                    contract: cToken.contract,
                    account: cAccount.address,
                    type: activity.type,
                    amount: activity.amount
                });
            }
        }
    }
    res.json(cLinearActivity);
});
// Get an SCP-2 token's staking status for a single account
app.get('/api/v1/getstakingstatus/:contract/:account', function (req, res) {
    if (!req.params.contract || req.params.contract.length <= 1) return res.json({ error: "You must specify a 'contract' param!" });
    if (!req.params.account || req.params.account.length <= 1) return res.json({ error: "You must specify an 'account' param!" });
    let cToken = TOKENS.getToken(req.params.contract);
    if (cToken.error) return res.json({ error: "Token contract does not exist!" });
    if (cToken.version !== 2) return res.json({ error: "Token is not an SCP-2!" });
    res.json(cToken.getStakingStatus(req.params.account));
});

app.listen(3000);

async function init() {
    // Load the database paths
    DB.updatePaths(appdata, appdataCore);

    // Loop the StakeCubeCoin.conf file for RPC username and password params, if any
    try {
        let conf = await DB.fromDiskCore("stakecubecoin.conf");
        // Make sure there's atleast *something* in the config
        if (!conf || conf.length === 0) {
            console.warn("No SCC Core config file detected!");
            return false;
        }
        // Split lines into an array of config settings
        SCC_CONFIG = conf.trim().split(/[\r\n]+/gm);

        // Prepare RPC connection
        // A TX Index is required to retrieve raw transaction information from the chain, this is required to use SC-Protocol
        let hasIndexing = getConfigValue("txindex", false);
        if (!hasIndexing) return { error: true, message: "No transaction index (-txindex=1) detected!", id: 0 };

        let server = getConfigValue("server", false);
        if (!server) return { error: true, message: "No RPC server (-server=1) detected!", id: 1 };

        let rpcUser = getConfigValue("rpcuser", false);
        if (!rpcUser) return { error: true, message: "No RPC username (-rpcuser=xyz...) detected!", id: 2 };

        let rpcPass = getConfigValue("rpcpassword", false);
        if (!rpcPass) return { error: true, message: "No RPC password (-rpcpassword=zyx...) detected!", id: 3 };

        let rpcPort = getConfigValue("rpcport", 39999);
        if (!rpcPort) return { error: true, message: "No RPC port (-rpcport=39999) detected!", id: 4 };

        SCC = new RPC('http://' + rpcUser + ':' + rpcPass + '@localhost:' + rpcPort);
        TOKENS.setDaemon(SCC);

        // Test the RPC connection
        try {
            let uptime = await SCC.call("uptime");
            if (!isFinite(Number(uptime))) return { error: true, message: "Unable to connect to the RPC!", id: 5 };
            // RPC Connection successful!
            isFullnode = true;
            return { error: false, message: "Successfully connected to the RPC!", id: 6 };
        } catch (e) {
            return { error: true, message: "Unable to connect to the RPC!", id: 5 };
        }
    } catch (e) {
        console.error("SCC.CONF FATAL ERROR:");
        console.error(e);
    }
}

// If we're on Windows; check the registry for SCC Core's data directory
if (process.platform === "win32") {
    const regPath = "HKCU\\Software\\StakeCubeCoin\\SCC-Qt";
    regedit.list(regPath, function(err, result) {
        if (err || !result[regPath] || _.isEmpty(result[regPath].values)) {
            if (err) console.warn(err);
            console.warn("Registry: Unable to read SCC-Qt registry, defaulting to:\n" + appdataCore);
            init().then(console.log);
        } else {
            const res = result[regPath].values;
            // No errors; ensure the registries are available
            if (res && res.strDataDir && res.strDataDir.value && res.strDataDir.value.length > 1) {
                // We found the StakeCubeCoin Core datadir!
                appdataCore = res.strDataDir.value.replace(/\\/g, '/');;
                // Make sure the ending "/" isn't missing
                if (!appdataCore.endsWith("/"))
                    appdataCore += "/";
                console.log("Registry: Detected data directory from registry!\n" + appdataCore);
                init().then(console.log);
            } else {
                // Failed to find the registry datadir, initializing with defaults...
                console.warn("Registry: Unable to read SCC-Qt registry, defaulting to:\n" + appdataCore);
                init().then(console.log);
            }
        }
    });
}
// Otherwise, just initialize straight away!
else {
    init().then(console.log);
}

let chainMessages = [];
let chainHashesCache = [];
let currentScanBlock = null;
async function getMsgsFromChain(nBlocksTotal) {
    isScanningBlocks = true;
    currentScanBlock = null;
    let nBestBlock = await SCC.call("getbestblockhash");
    nBestBlock = await SCC.call("getblock", nBestBlock);
    let nStartBlock = nBestBlock.height - nBlocksTotal;
    console.log("Scanning block range " + nStartBlock + " to " + nBestBlock.height + " (Total: " + nBlocksTotal + ")");
    for (let i=nStartBlock; i<nBestBlock.height+1; i++) {
        // Optimization note:
        // If we've started a new scan, clear currentScanBlock and pull the fresh block data from RPC
        // ... if we're doing a long scan, we cache the last block and rely on 'nextblockhash' for
        // ... faster querying, as it removes the need to call 'getblockhash' on every loop tick
        let currentScanHash = null;
        if (currentScanBlock === null || !currentScanBlock.nextblockhash)
            currentScanHash = await SCC.call("getblockhash", i);
        else
            currentScanHash = currentScanBlock.nextblockhash;
        // Skip blocks if we've already scanned them before
        if (chainHashesCache.includes(currentScanHash)) continue;
        // Grab the block from RPC, cache it to save on future requests
        currentScanBlock = await SCC.call("getblock", currentScanHash);
        await getMsgsFromBlock(currentScanBlock);
    }
    console.log("Scan done!");
    isScanningBlocks = false;
}

async function getMsgsFromBlock(blk) {
    if (blk === null || blk === undefined) return null;
    chainHashesCache.push(blk.hash);
    TOKENS.setBlockHeight(blk.height);
    if (blk.nTx === 1) return null;
  
    for (let i=0; i<blk.nTx; i++) {
      let txRes = await getMsgFromTx(blk.tx[i]);
      if (txRes === null || txRes.msg.length === 0) continue;
      if (txRes.error) return console.error(txRes);
      // Process the new state
      await processState(txRes.msg, txRes.tx);
      // Cache this message and block
      chainMessages.push({msg: txRes.msg, time: blk.time, tx: blk.tx[i], mempool: false});
      console.log("Message found! (" + txRes.msg + ")");
    }
    return true;
  }

async function getMsgFromTx(rawTX) {
    let res;
    try {
        res = await SCC.call("getrawtransaction", rawTX, 1);
    } catch(e) {
        return { error: true, message: "Unable to fetch raw transaction, insufficient TX indexing", id: 7 };
    }
    if (_.isNil(res)) return { error: true, message: "Unable to fetch raw transaction, insufficient TX indexing", id: 7 };
    for (const cVout of res.vout) {
        if (!cVout.scriptPubKey) continue;
        if (!cVout.scriptPubKey.asm) continue;
        // Scan the scriptPubKey for OP_RETURN
        if (cVout.scriptPubKey.asm.startsWith("OP_RETURN")) {
            // Found an OP_RETURN! Parse the message from HEX to UTF-8
            const buf = Buffer.from(cVout.scriptPubKey.asm.replace("OP_RETURN ", ""), 'hex');
            return { msg: buf.toString("utf8"), tx: res};
        }
    }
    return null;
}

// Chain State Processing
async function processState(newMsg, tx) {
    if (_.isNil(newMsg) || _.isEmpty(newMsg)) return true;

    // SCP Token: CREATE
    // Create a new SCP-predefined token, with name, ticker and max supply
    if (newMsg.startsWith("SCPCREATE") && !_.isEmpty(tx) && !_.isEmpty(tx.txid)) {
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
        const arrParams = newMsg.split(" ");
        let nVersion = 1;
        let nExpectedParams = 4;
        if (arrParams[0] !== "SCPCREATE") {
            let arrVersion = Number(arrParams[0].split("SCPCREATE")[1]);
            if (arrVersion === 2) {
                nVersion = 2;
                nExpectedParams = 6;
            }
        }
        // Ensure we have the correct amount of params
        if (arrParams.length === nExpectedParams) {
            // Sanity checks
            let check1 = arrParams[1].length > 0;
            let check2 = arrParams[2].length > 0;
            let check3_num = Number(arrParams[3]);
            let check3 = (check3_num > 0 && Number.isSafeInteger(check3_num));
            // SCP-2 inflation
            let check4_num = Number(arrParams[4]);
            let check4 = true;
            // SCP-2 minimum age (in blocks) to stake
            let check5_num = Number(arrParams[5]);
            let check5 = true;
            if (nVersion === 2) {
                check4 = (check4_num > 1 && Number.isSafeInteger(check4_num));
                check5 = (check5_num > 1 && Number.isSafeInteger(check5_num));
            }
            if (check1 && check2 && check3 &&
                (check4 && check5)) {
                // Params look good, fetch the creator via the first VIN of the contract
                if (tx.vin && !_.isEmpty(tx.vin) && tx.vin[0] && !_.isEmpty(tx.vin[0].txid)) {
                    try {
                        // Fetch VIN --> Grab change output --> Set change address as Creator
                        let addrCreator = (await SCC.call('getrawtransaction', tx.vin[0].txid, 1)).vout[1].scriptPubKey.addresses[0];
                        if (!addrCreator || _.isEmpty(addrCreator)) throw "Missing creator address!";
                        let newToken;
                        if (nVersion === 1) newToken = new TOKENS.SCP1Token(tx.txid, arrParams[1], arrParams[2], check3_num, addrCreator, []);
                        if (nVersion === 2) newToken = new TOKENS.SCP2Token(tx.txid, arrParams[1], arrParams[2], check3_num, addrCreator, [], check4_num, check5_num);
                        TOKENS.addToken(newToken);
                        console.log("New SCP-" + nVersion + " token created!");
                        console.log(newToken);
                    } catch (e) {
                        console.warn("An attempt to create a new SCP-" + nVersion + " token has failed, failed to retrieve VIN info!");
                        console.error(e);
                    }
                } else {
                    // This shouldn't EVER happen!
                    console.warn("An attempt to create a new SCP-" + nVersion + " token has failed, missing VIN!");
                }
            } else {
                console.warn("An attempt to create a new SCP-" + nVersion + " token has failed, incorrect params!");
            }
        } else {
            console.warn("An attempt to create a new SCP-" + nVersion + " token has failed, incorrect param count! (has " + arrParams.length + ", expected " + nExpectedParams + ")\nTX: " + tx.txid);
        }
    } else if (newMsg.length > 64) {
        // Contract write operation
        /*
            param 0 = TXID (txid str)
            param 1 = METHOD (contract method)
        */
        const arrParams = newMsg.split(" ");
        // Sanity check
        let check1 = arrParams[0].length === 64;
        let check2 = !_.isNil(arrParams[1]) && arrParams[1].length > 1;
        if (check1 && check2) {
            // Fetch the contract being called
            // SCP Token Contracts
            let cToken = TOKENS.getToken(arrParams[0]);
            if (!cToken.error) {
                // SCP MINTING (Create new tokens on-demand, issuer-only, cannot mint above predefined max supply)
                if (arrParams[1] === "mint") {
                    /*
                        param 2 = AMOUNT (satoshi int)
                    */
                    if (cToken.version === 2) {
                        // SCP-2 tokens can only mint a single time
                        // The first 'owner' is ALWAYS the issuer, thus, if there's atleast one owner
                        // ... then a mint has already taken place, no rug-pulls today, sir!
                        if (cToken.owners.length > 0) return true;
                    }
                    let check3_num = Number(arrParams[2]);
                    let check3 = (check3_num > 0 && Number.isSafeInteger(check3_num));
                    if (check3) {
                        // Grab change output --> Ensure change output is the token issuer
                        let addrCreator = tx.vout[1].scriptPubKey.addresses[0];
                        if (!addrCreator || _.isEmpty(addrCreator)) throw "Missing creator address!";
                        // Check the change output against the token issuer
                        if (addrCreator === cToken.creator) {
                            // Authentication: Find deterministic proof that the change address of the call has inputs for this TX
                            // Loop every VIN of the contract call
                            let isAuthSafe = true;
                            for (const cVin of tx.vin) {
                                // Fetch the VIN raw tx
                                let vinTx = await SCC.call('getrawtransaction', cVin.txid, 1);
                                // Ensure all vins are from the 'addrCreator' address
                                if (vinTx.vout[cVin.vout].scriptPubKey.addresses[0] !== addrCreator) isAuthSafe = false;
                            }
                            if (isAuthSafe) {
                                // Authentication successful, minting tokens!
                                cToken.creditAccount(cToken.creator, check3_num, tx);
                            } else {
                                console.error("An attempt to mint SCP-" + cToken.version + " containing a non-issuer input was detected, ignoring request...");
                            }
                        } else {
                            console.error("An attempt by a non-issuer to mint SCP-" + cToken.version + " tokens failed! (Issuer: " + cToken.creator.substr(0, 5) + "... Caller: " + addrCreator.substr(0, 5) + "...)");
                        }
                    } else {
                        console.error("An attempt to mint SCP-" + cToken.version + " tokens failed! (Token: " + cToken.name + ", amount: " + arrParams[2] + ")");
                    }
                }
                // SCP BURNING (Burn tokens from your account balance, usable by anyone, cannot burn more than your available balance)
                else if (arrParams[1] === "burn") {
                    /*
                        param 2 = AMOUNT (satoshi int)
                    */
                    let check3_num = Number(arrParams[2]);
                    let check3 = (check3_num > 0 && Number.isSafeInteger(check3_num));
                    if (check3) {
                        // Fetch the change output of the contract call TX, assume the change output is the caller.
                        let addrCaller = tx.vout[1].scriptPubKey.addresses[0];
                        if (!addrCaller || _.isEmpty(addrCaller)) throw "Missing caller address!";
                        // Authentication: Find deterministic proof that the change address of the call has inputs for this TX
                        // Loop every VIN of the contract call
                        let isAuthSafe = true;
                        for (const cVin of tx.vin) {
                            // Fetch the VIN raw tx
                            let vinTx = await SCC.call('getrawtransaction', cVin.txid, 1);
                            // Ensure all vins are from the 'addrCaller' address
                            if (vinTx.vout[cVin.vout].scriptPubKey.addresses[0] !== addrCaller) isAuthSafe = false;
                        }
                        if (isAuthSafe) {
                            // Authentication successful, burning tokens!
                            cToken.debitAccount(addrCaller, check3_num, tx);
                        } else {
                            console.error("An attempt to burn SCP-" + cToken.version + " containing a non-issuer input was detected, ignoring request...");
                        }
                    } else {
                        console.error("An attempt to burn SCP-" + cToken.version + " tokens failed! (Token: " + cToken.name + ", amount: " + arrParams[2] + ")");
                    }
                }
                // SCP SENDS (Transfer tokens to another account, usable by anyone, cannot send more than your available balance)
                else if (arrParams[1] === "send") {
                    /*
                        param 2 = AMOUNT (satoshi int)
                        param 3 = RECEIVER (address str)
                    */
                    let check3_num = Number(arrParams[2]);
                    let check3 = (check3_num > 0 && Number.isSafeInteger(check3_num));
                    let check4 = (await SCC.call('validateaddress', arrParams[3])).isvalid;
                    if (check3 && check4 === true) {
                        // Fetch the change output of the contract call TX, assume the change output is the caller.
                        let addrCaller = tx.vout[1].scriptPubKey.addresses[0];
                        if (!addrCaller || _.isEmpty(addrCaller)) throw "Missing caller address!";
                        console.log("addrCaller: " + addrCaller);
                        // Authentication: Find deterministic proof that the change address of the call has inputs for this TX
                        // Loop every VIN of the contract call
                        let isAuthSafe = true;
                        for (const cVin of tx.vin) {
                            // Fetch the VIN raw tx
                            let vinTx = await SCC.call('getrawtransaction', cVin.txid, 1);
                            // Ensure all vins are from the 'addrCaller' address
                            if (vinTx.vout[cVin.vout].scriptPubKey.addresses[0] !== addrCaller) isAuthSafe = false;
                        }
                        if (isAuthSafe) {
                            // Authentication successful, burning tokens!
                            cToken.transfer(addrCaller, arrParams[3], check3_num, tx);
                        } else {
                            console.error("An attempt to transfer SCP-" + cToken.version + " containing a non-caller input was detected, ignoring request...");
                        }
                    } else {
                        console.error("An attempt to transfer SCP-" + cToken.version + " tokens failed! (Token: " + cToken.name + ", from " + addrCaller.substr(0, 5) + ", to " + arrParams[3].substr(0, 5) + ", amount: " + arrParams[2] + ")");
                    }
                }
                // SCP-2 STAKING (Redeem an amount of unclaimed balance, credited from staking rewards)
                else if (cToken.version === 2 && arrParams[1] === "redeem") {
                    // Fetch the change output of the contract call TX, assume the change output is the caller.
                    let addrCaller = tx.vout[1].scriptPubKey.addresses[0];
                    if (!addrCaller || _.isEmpty(addrCaller)) throw "Missing caller address!";
                    // Authentication: Find deterministic proof that the change address of the call has inputs for this TX
                    // Loop every VIN of the contract call
                    let isAuthSafe = true;
                    for (const cVin of tx.vin) {
                        // Fetch the VIN raw tx
                        let vinTx = await SCC.call('getrawtransaction', cVin.txid, 1);
                        // Ensure all vins are from the 'addrCaller' address
                        if (vinTx.vout[cVin.vout].scriptPubKey.addresses[0] !== addrCaller) isAuthSafe = false;
                    }
                    if (isAuthSafe) {
                        // Authentication successful, redeeming tokens!
                        cToken.redeemRewards(addrCaller, tx);
                    } else {
                        console.error("An attempt to redeem SCP-" + cToken.version + " stakes containing a non-issuer input was detected, ignoring request...");
                    }
                }
            } else {
                console.error("Contract write attempted on a non-existant contract, skipping!");
                // Dump the error too, for good debugging measure
                console.error(cToken);
            }
        }
    }

    // Finished processing
    return true;
}

// Util stuff (should probably be put into a lib/util.js module, #soon)
function percentOf(partial, full) {return (partial / full) * 100;}
function percentChange(decrease, oldNumber) {return (decrease / oldNumber) * 100;}

// CORE DAEMON

let isScanningBlocks = false;
setInterval(async () => {
    // Every 2 seconds we check the chain for changes and sync our state with it.
    if (!isScanningBlocks) {
        try {
            // If we have no blocks cache, we need to start scanning the chain!
            if (chainHashesCache.length === 0) {
                // Scan from the first known SCP-burn block
                let nCurrentBlock = await SCC.call("getblockcount");
                await getMsgsFromChain(nCurrentBlock - nFirstBlock);
            }
            // If we have a blocks cache, only try scanning the last ~20 blocks for changes
            else {
                await getMsgsFromChain(20);
            }
        } catch (e) {
            console.warn("CSP: Unable to scan blocks, retrying...");
            isScanningBlocks = false;
        }
    }
}, 5000);
/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';

// Native
const fs    = require('fs');
// NPM
const RPC   = require('bitcoin-rpc-promise');
let regedit = require('regedit');
var _       = require('lodash');

let isGUI = false;

let DB;
try {
// GUI
    DB = require('./lib/database.js');
    isGUI = true;
} catch (e) {
// Terminal
    DB = require('./database.js');
}

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
let appdata = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + 'Library/Application Support' : '/var/local');
appdata = appdata.replace(/\\/g, '/') + '/StakeCubeCoin_smart_chain/';

// SCC Core data directory
let appdataCore = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + 'Library/Application Support/StakeCubeCoin/' : process.env.HOME + '/.stakecubecoin/');
if (appdataCore === process.env.APPDATA) appdataCore += '/StakeCubeCoin/'; // Append '/StakeCubeCoin/' to the windows appdata directory
appdataCore = appdataCore.replace(/\\/g, '/');

// If we're on Windows; check the registry for SCC Core's data directory
if (process.platform === "win32") {
    const regPath = "HKCU\\Software\\StakeCubeCoin\\SCC-Qt";
    regedit.list(regPath, function(err, result) {
        if (err || !result[regPath] || _.isEmpty(result[regPath].values)) {
            if (err) console.warn(err);
            console.warn("Registry: Unable to read SCC-Qt registry, defaulting to:\n" + appdataCore);
            if (!isGUI)
                init();
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
                if (!isGUI)
                    init();
            } else {
                // Failed to find the registry datadir, initializing with defaults...
                if (!isGUI)
                    init();
            }
        }
    });
}

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
        // A TX Index is required to retrieve raw transaction information from the chain, this is required to use Smart-Chain
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

        // Test the RPC connection
        try {
            let uptime = await SCC.call("uptime");
            if (!isFinite(Number(uptime))) return { error: true, message: "Unable to connect to the RPC!", id: 5 };
            // RPC Connection successful!
            return { error: false, message: "Successfully connected to the RPC!", id: 6 };
        } catch (e) {
            return { error: true, message: "Unable to connect to the RPC!", id: 5 };
        }
    } catch (e) {
        console.error("SCC.CONF FATAL ERROR:");
        console.error(e);
    }
}

let chainMessages = [];
let chainHashesCache = [];
async function getMsgsFromChain(nBlocksTotal) {
    let nBestBlock = await SCC.call("getbestblockhash");
    nBestBlock = await SCC.call("getblock", nBestBlock);
    let nStartBlock = nBestBlock.height - nBlocksTotal;
    console.log("Scanning block range " + nStartBlock + " to " + nBestBlock.height + " (Total: " + nBlocksTotal + ")");
    for (let i=nStartBlock; i<nBestBlock.height+1; i++) {
        let currentBlock = await SCC.call("getblockhash", i);
        await getMsgsFromBlock(currentBlock);
    }
    console.log("Scan done!");
    console.log(chainMessages);
}

async function getMsgsFromBlock(blk) {
    let res;
    try {
      res = await SCC.call("getblock", blk);
    } catch(e) {
      return null;
    }
    if (res === null || res === undefined) return null;
    if (chainHashesCache.includes(blk)) return null;
    chainHashesCache.push(blk);
    if (res.nTx === 1) return null;
  
    for (let i=0; i<res.nTx; i++) {
      let txRes = await getMsgFromTx(res.tx[i]);
      if (txRes === null || txRes.length === 0) continue;
      if (txRes.error) return console.error(txRes);
      chainMessages.push({msg: txRes, time: res.time, tx: res.tx[i], mempool: false});
      console.log("Message found! (" + txRes + ")");
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
            return buf.toString("utf8");
        }
    }
    return null;
}
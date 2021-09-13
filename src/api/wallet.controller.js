/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';

// The permissions controller, allows/disallows usage of the module
const cPerms = require('./permissions.js');

// Contextual pointers provided by the index.js process
let ptrWALLET;
let ptrTOKENS;
let ptrDB;
let ptrNFT;
let ptrIsFullnode;
let strModule;
let COIN;
let nDeployFee;
let strDeployFeeDest;

function init(context) {
    ptrWALLET = context.WALLET;
    ptrTOKENS = context.TOKENS;
    ptrDB = context.DB;
    ptrNFT = context.NFT;
    ptrIsFullnode = context.isFullnode;
    // Static Non-Pointer (native value)
    strModule = context.strModule;
    COIN = context.COIN;
    nDeployFee = context.nDeployFee;
    strDeployFeeDest = context.strDeployFeeDest;
    // Initialize permissions controller
    return cPerms.init({ 'DB': context.DB, 'strModule': strModule });
}

async function getBalances(req, res) {
    if (!cPerms.isModuleAllowed(strModule)) {
        return disabledError(res);
    }
    if (!ptrIsFullnode()) {
        return fullnodeError(res);
    }
    if (!req.params.account || req.params.account.length !== 34) {
        return res.status(400).send('Missing "account" parameter!');
    }
    const strAddr = req.params.account;
    try {
        // Asynchronously sync UTXOs with the network
        await ptrWALLET.refreshUTXOs(strAddr);
        const arrBalances = [];
        const arrUTXOs = [];
        for (const cUTXO of ptrWALLET.getUTXOsPtr()) {
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
        const cTokens = ptrTOKENS.getTokensByAccount(strAddr);
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
        console.error("Network error on API '" + strModule + '/getbalances/' +
                      strAddr + "'");
        console.error(e);
        return res.status(400).send('Internal API Error');
    }
}

async function listAddresses(req, res) {
    if (!cPerms.isModuleAllowed(strModule)) {
        return disabledError(res);
    }
    if (!ptrIsFullnode()) {
        return fullnodeError(res);
    }
    try {
        const arrAddresses = [];
        for (const cWallet of ptrWALLET.getWalletsPtr()) {
            arrAddresses.push({
                'address': cWallet.getPubkey(),
                'unlocked': cWallet.getPrivkey() !== null
            });
        }
        return res.json(arrAddresses);
    } catch(e) {
        console.error("Network error on API '" + strModule + "/listaddresses'");
        console.error(e);
        return res.status(400).send('Internal API Error');
    }
}

async function getNewAddress(req, res) {
    if (!cPerms.isModuleAllowed(strModule)) {
        return disabledError(res);
    }
    if (!ptrIsFullnode()) {
        return fullnodeError(res);
    }
    try {
        // Create a new wallet address
        const cWallet = await ptrWALLET.createWallet();
        // Save to the database
        await ptrDB.setWallet(ptrWALLET.toDB());
        return res.send(cWallet.getPubkey());
    } catch(e) {
        console.error("Network error on API '" + strModule + "/getnewaddress'");
        console.error(e);
        return res.status(400).send('Internal API Error');
    }
}

async function send(req, res) {
    if (!cPerms.isModuleAllowed(strModule)) {
        return disabledError(res);
    }
    if (!ptrIsFullnode()) {
        return fullnodeError(res);
    }
    if (!req.params.address || req.params.address.length !== 34) {
        return res.status(400).send('Missing "address" parameter!');
    }
    if (!req.params.currency) {
        return res.status(400).send('Missing "currency" parameter!');
    }
    if (!req.params.to || req.params.to.length !== 34) {
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
        if (!strTo.startsWith('s')) {
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
        const cWallet = ptrWALLET.getWallet(strAddr);
        if (!cWallet) {
            return res.status(400)
                .send('Address "' + strAddr +
                        '" does not exist in this wallet!');
        }
        const strPubkey = cWallet.getPubkey();
        if (cWallet.getPrivkey() === null) {
            return res.status(400)
                .send('This address is locked (encrypted)' +
                        ' via passphrase! Please unlock via' +
                        ' GUI before using the API.');
        }

        // Asynchronously sync UTXOs with the network
        await ptrWALLET.refreshUTXOs(strPubkey);

        // Ensure we have the currency specified
        if (strCurrency.toLowerCase() !== 'scc') {
            cTokens = ptrTOKENS.getTokensByAccount(strAddr);
            for (const cToken of cTokens) {
                if (cToken.token.contract === strCurrency) {
                    cSelectedToken = cToken;
                }
            }
            // If no token was found, bail out!
            if (!cSelectedToken) {
                return res
                    .status(400)
                    .send('Invalid token contract ID, "' +
                            strCurrency + '"! Or this token' +
                            ' is not held within this account.');
            }
        }

        // Create the transaction!
        if (!cSelectedToken) {
        // --- SCC ---
            const cTx = ptrWALLET.sccjs.tx.transaction();
            // Inputs
            const usedUTXOs = ptrWALLET.getCoinsToSpend(nAmount * COIN,
                false,
                strPubkey);
            const nUTXOs = usedUTXOs.reduce((a, b) => {
                return a + b.sats;
            }, 0);
            for (const cUTXO of usedUTXOs) {
                cTx.addinput(cUTXO.id, cUTXO.vout, cUTXO.script);
            }
            if (nAmount >= nUTXOs / COIN) {
                return res
                    .status(400)
                    .send('Not enough funds! (Sending: ' +
                            nAmount + ', Have: ' + (nUTXOs / COIN) +
                            ')');
            }
            // Destination output
            cTx.addoutput(strTo, nAmount);
            // Fee & Change output
            const nFee = ptrWALLET.getFee(cTx.serialize().length);
            const nSpent = (nFee + nAmount).toFixed(8);
            const nChange = ((nUTXOs / COIN) - nSpent).toFixed(8);
            cTx.addoutput(strPubkey, nChange);
            // Broadcast
            const strSignedTx = await cTx.sign(cWallet.getPrivkey(), 1);
            const strTXID = await ptrWALLET.broadcastTx(strSignedTx);
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
            const cTx = ptrWALLET.sccjs.tx.transaction();
            const nCoinsBal = (cSelectedToken.account.balance / COIN);
            if (nAmount > nCoinsBal) {
                return res
                    .status(400)
                    .send('Not enough funds! (Sending: ' +
                            nAmount + ', Have: ' +
                            nCoinsBal + ')');
            }
            // Add input
            const cUTXO = ptrWALLET.getCoinsToSpend(10000, true,
                strPubkey)[0];
            if (!cUTXO) {
                return res.status(400).send('Not enough gas funds!');
            }
            cTx.addinput(cUTXO.id, cUTXO.vout, cUTXO.script);
            // SCP output
            cTx.addoutputburn(0.00000001,
                cSelectedToken.token.contract + ' send ' +
                            (nAmount * COIN).toFixed(0) + ' ' + strTo);
            // Fee & Change output
            const nFee = ptrWALLET.getFee(cTx.serialize().length);
            const nChange = ((cUTXO.sats / COIN) - nFee).toFixed(8);
            cTx.addoutput(strPubkey, nChange);
            // Broadcast
            const strSignedTx = await cTx.sign(cWallet.getPrivkey(), 1);
            const strTXID = await ptrWALLET.broadcastTx(strSignedTx);
            // Mark UTXO as spent
            cUTXO.spent = true;
            return res.json({
                'txid': strTXID,
                'rawTx': strSignedTx
            });
        }
    } catch(e) {
        console.error("Network error on API '" + strModule + "/send'");
        console.error(e);
        return res.status(400).send('Internal API Error');
    }
}

async function stake(req, res) {
    if (!cPerms.isModuleAllowed(strModule)) {
        return disabledError(res);
    }
    if (!ptrIsFullnode()) {
        return fullnodeError(res);
    }
    if (!req.params.address || req.params.address.length !== 34) {
        return res.status(400).send('Missing "address" parameter!');
    }
    if (!req.params.contract) {
        return res.status(400).send('Missing "contract" parameter!');
    }
    const strAddr = req.params.address;
    const strContract = req.params.contract;
    try {
        // Ensure we have the address specified, and it's unlocked
        const cWallet = ptrWALLET.getWallet(strAddr);
        if (!cWallet) {
            return res.status(400)
                .send('Address "' + strAddr +
                        '" does not exist in this wallet!');
        }
        const strPubkey = cWallet.getPubkey();
        if (cWallet.getPrivkey() === null) {
            return res.status(400)
                .send('This address is locked (encrypted)' +
                        ' via passphrase! Please unlock via' +
                        ' GUI before using the API.');
        }

        // Asynchronously sync UTXOs with the network
        await ptrWALLET.refreshUTXOs(strPubkey);

        // Ensure we have the currency specified
        const cTokens = ptrTOKENS.getTokensByAccount(strAddr);
        let cSelectedToken = false;
        for (const cToken of cTokens) {
            if (cToken.token.contract === strContract) {
                cSelectedToken = cToken;
            }
        }
        // If no token was found, bail out!
        if (!cSelectedToken) {
            return res.status(400).send('Invalid token contract ID, "' +
                                    strContract + '"! Or this token' +
                                    ' is not held within this ' +
                                    'account.');
        }
        // --- CLAIM STAKE ---
        const cTx = ptrWALLET.sccjs.tx.transaction();
        const nCoinsBal = (cSelectedToken.account.unclaimed_balance / COIN);
        if (nCoinsBal <= 0) {
            return res.status(400).send('You have no pending rewards!');
        }
        // Add input
        const cUTXO = ptrWALLET.getCoinsToSpend(10000, true, strPubkey)[0];
        if (!cUTXO) {
            return res.status(400).send('Not enough gas funds!');
        }
        cTx.addinput(cUTXO.id, cUTXO.vout, cUTXO.script);
        // SCP output
        cTx.addoutputburn(0.00000001,
            cSelectedToken.token.contract + ' redeem');
        // Fee & Change output
        const nFee = ptrWALLET.getFee(cTx.serialize().length);
        const nChange = ((cUTXO.sats / COIN) - nFee).toFixed(8);
        cTx.addoutput(strPubkey, nChange);
        // Broadcast
        const strSignedTx = await cTx.sign(cWallet.getPrivkey(), 1);
        const strTXID = await ptrWALLET.broadcastTx(strSignedTx);
        // Mark UTXO as spent
        cUTXO.spent = true;
        return res.json({
            'txid': strTXID,
            'rawTx': strSignedTx
        });
    } catch(e) {
        console.error("Network error on API '" + strModule + "/stake'");
        console.error(e);
        return res.status(400).send('Internal API Error');
    }
}

async function createCollection(req, res) {
    if (!cPerms.isModuleAllowed(strModule)) {
        return disabledError(res);
    }
    if (!ptrIsFullnode()) {
        return fullnodeError(res);
    }
    if (!req.params.address || req.params.address.length !== 34) {
        return res.status(400).send('Missing "address" parameter!');
    }
    if (!req.params.name) {
        return res.status(400).send('Missing "name" parameter!');
    }
    if (!req.params.maxmints) {
        return res.status(400).send('Missing "maxmints" parameter!');
    }
    if (!req.params.protected) {
        return res.status(400).send('Missing "protected" parameter!');
    }
    if (req.params.protected !== '0' && req.params.protected !== '1') {
        return res.status(400).send('parameter "protected" must be 0 or 1!');
    }
    const strAddr = req.params.address;
    const strName = req.params.name;
    const nMaxMints = Number(req.params.maxmints);
    const fProtected = req.params.protected !== '0';

    if (!Number.isSafeInteger(nMaxMints)) {
        return res.status(400).send('parameter "maxmints" must be a number! ' +
                                    'use -1 for unlimited mints.');
    }
    try {
        // Ensure we have the address specified, and it's unlocked
        const cWallet = ptrWALLET.getWallet(strAddr);
        if (!cWallet) {
            return res.status(400)
                .send('Address "' + strAddr +
                        '" does not exist in this wallet!');
        }
        const strPubkey = cWallet.getPubkey();
        if (cWallet.getPrivkey() === null) {
            return res.status(400)
                .send('This address is locked (encrypted)' +
                        ' via passphrase! Please unlock via' +
                        ' GUI before using the API.');
        }

        // Asynchronously sync UTXOs with the network
        await ptrWALLET.refreshUTXOs(strPubkey);

        // --- CREATE COLLECTION CONTRACT ---
        const cTx = ptrWALLET.sccjs.tx.transaction();
        // Inputs
        const usedUTXOs = ptrWALLET.getCoinsToSpend(nDeployFee * COIN,
            false,
            strPubkey);
        const nUTXOs = usedUTXOs.reduce((a, b) => {
            return a + b.sats;
        }, 0);
        if (nDeployFee >= nUTXOs / COIN) {
            return res
                .status(400)
                .send('Not enough funds! (Need: ' +
                        nDeployFee + ', Have: ' + (nUTXOs / COIN) +
                        ')');
        }
        // Add inputs
        for (const cUTXO of usedUTXOs) {
            cTx.addinput(cUTXO.id, cUTXO.vout, cUTXO.script);
        }
        // SCP output
        cTx.addoutputburn(0.00000001,
            'SCPCREATE4 ' + strName + ' ' + nMaxMints + ' ' +
            (fProtected ? '1' : '0'));
        // Static Deployment fee (Sent to the SCC burn address)
        cTx.addoutput(strDeployFeeDest, nDeployFee);
        // Fee & Change output
        const nFee = ptrWALLET.getFee(cTx.serialize().length);
        const nSpent = (nFee + nDeployFee).toFixed(8);
        const nChange = ((nUTXOs / COIN) - nSpent).toFixed(8);
        cTx.addoutput(strPubkey, nChange);
        // Broadcast
        const strSignedTx = await cTx.sign(cWallet.getPrivkey(), 1);
        const strTXID = await ptrWALLET.broadcastTx(strSignedTx);
        // Mark UTXOs as spent
        for (const cUTXO of usedUTXOs) {
            cUTXO.spent = true;
        }
        // Return API data
        return res.json({
            'txid': strTXID,
            'rawTx': strSignedTx
        });
    } catch(e) {
        console.error("Network error on API '" + strModule + "/createcollection'");
        console.error(e);
        return res.status(400).send('Internal API Error');
    }
}

async function mintNFT(req, res) {
    if (!cPerms.isModuleAllowed(strModule)) {
        return disabledError(res);
    }
    if (!ptrIsFullnode()) {
        return fullnodeError(res);
    }
    if (!req.params.address || req.params.address.length !== 34) {
        return res.status(400).send('Missing "address" parameter!');
    }
    if (!req.params.contract) {
        return res.status(400).send('Missing "contract" parameter!');
    }
    if (!req.params.name) {
        return res.status(400).send('Missing "name" parameter!');
    }
    if (!req.params.image_url) {
        return res.status(400).send('Missing "image_url" parameter!');
    }

    const strAddr = req.params.address;
    const strContract = req.params.contract;
    const strName = req.params.name;
    const strImageUrl = req.params.image_url;
    try {
        // Ensure the collection contract exists
        const cCollection = ptrNFT.getCollection(strContract);
        if (cCollection.error) {
            return res.status(400)
                .send('SCP-4 Contract error: ' + cCollection.message);
        }
        // Ensure the collection is capable of minting new NFTs
        if (cCollection.maxMints !== -1 &&
           (cCollection.mints + 1) > cCollection.maxMints) {
            return res.status(400)
                .send('SCP-4 Collection is at max mints, cannot mint! (' +
                      cCollection.mints + '/' + cCollection.maxMints + ')');
        }
        // Ensure we have the address specified, and it's unlocked
        const cWallet = ptrWALLET.getWallet(strAddr);
        if (!cWallet) {
            return res.status(400)
                .send('Address "' + strAddr +
                      '" does not exist in this wallet!');
        }
        const strPubkey = cWallet.getPubkey();
        if (cWallet.getPrivkey() === null) {
            return res.status(400)
                .send('This address is locked (encrypted)' +
                        ' via passphrase! Please unlock via' +
                        ' GUI before using the API.');
        }

        // Asynchronously sync UTXOs with the network
        await ptrWALLET.refreshUTXOs(strPubkey);

        // --- MINT NFT ---
        const cTx = ptrWALLET.sccjs.tx.transaction();
        // Add input
        const cUTXO = ptrWALLET.getCoinsToSpend(10000, true, strPubkey)[0];
        if (!cUTXO) {
            return res.status(400).send('Not enough gas funds!');
        }
        cTx.addinput(cUTXO.id, cUTXO.vout, cUTXO.script);
        // SCP output
        cTx.addoutputburn(0.00000001,
            strContract + ' mint ' + strName + ' ' + strImageUrl);
        // Fee & Change output
        const nFee = ptrWALLET.getFee(cTx.serialize().length);
        const nChange = ((cUTXO.sats / COIN) - nFee).toFixed(8);
        cTx.addoutput(strPubkey, nChange);
        // Broadcast
        const strSignedTx = await cTx.sign(cWallet.getPrivkey(), 1);
        const strTXID = await ptrWALLET.broadcastTx(strSignedTx);
        // Mark UTXO as spent
        cUTXO.spent = true;
        // Return API data
        return res.json({
            'txid': strTXID,
            'rawTx': strSignedTx
        });
    } catch(e) {
        console.error("Network error on API '" + strModule + "/mintnft'");
        console.error(e);
        return res.status(400).send('Internal API Error');
    }
}

async function burnNFT(req, res) {
    if (!cPerms.isModuleAllowed(strModule)) {
        return disabledError(res);
    }
    if (!ptrIsFullnode()) {
        return fullnodeError(res);
    }
    if (!req.params.address || req.params.address.length !== 34) {
        return res.status(400).send('Missing "address" parameter!');
    }
    if (!req.params.contract) {
        return res.status(400).send('Missing "contract" parameter!');
    }
    if (!req.params.id) {
        return res.status(400).send('Missing "id" parameter!');
    }

    const strAddr = req.params.address;
    const strContract = req.params.contract;
    const strID = req.params.id;
    try {
        // Ensure the collection contract exists
        const cCollection = ptrNFT.getCollection(strContract);
        if (cCollection.error) {
            return res.status(400)
                .send('SCP-4 Contract error: ' + cCollection.message);
        }
        // Ensure the collection is not protected
        if (cCollection.protected) {
            return res.status(400)
                .send('SCP-4 Contract error: Collection is protected, ' +
                      'burns are not allowed for this NFT.');
        }
        // Ensure the SCP-4 token exists
        const cNFT = ptrNFT.getNFTptr(strID);
        if (cNFT.error) {
            return res.status(400)
                .send('SCP-4 Token error: ' + cNFT.message);
        }
        // Ensure we own it
        if (cNFT.owner !== strAddr) {
            return res.status(400)
                .send('SCP-4 Token error: You do not own this NFT!');
        }
        // Ensure we have the address specified, and it's unlocked
        const cWallet = ptrWALLET.getWallet(strAddr);
        if (!cWallet) {
            return res.status(400)
                .send('Address "' + strAddr +
                      '" does not exist in this wallet!');
        }
        const strPubkey = cWallet.getPubkey();
        if (cWallet.getPrivkey() === null) {
            return res.status(400)
                .send('This address is locked (encrypted)' +
                        ' via passphrase! Please unlock via' +
                        ' GUI before using the API.');
        }

        // Asynchronously sync UTXOs with the network
        await ptrWALLET.refreshUTXOs(strPubkey);

        // --- BURN NFT ---
        const cTx = ptrWALLET.sccjs.tx.transaction();
        // Add input
        const cUTXO = ptrWALLET.getCoinsToSpend(10000, true, strPubkey)[0];
        if (!cUTXO) {
            return res.status(400).send('Not enough gas funds!');
        }
        cTx.addinput(cUTXO.id, cUTXO.vout, cUTXO.script);
        // SCP output
        cTx.addoutputburn(0.00000001,
            strContract + ' destroy ' + strID);
        // Fee & Change output
        const nFee = ptrWALLET.getFee(cTx.serialize().length);
        const nChange = ((cUTXO.sats / COIN) - nFee).toFixed(8);
        cTx.addoutput(strPubkey, nChange);
        // Broadcast
        const strSignedTx = await cTx.sign(cWallet.getPrivkey(), 1);
        const strTXID = await ptrWALLET.broadcastTx(strSignedTx);
        // Mark UTXO as spent
        cUTXO.spent = true;
        // Return API data
        return res.json({
            'txid': strTXID,
            'rawTx': strSignedTx
        });
    } catch(e) {
        console.error("Network error on API '" + strModule + "/burnnft'");
        console.error(e);
        return res.status(400).send('Internal API Error');
    }
}

async function transferNFT(req, res) {
    if (!cPerms.isModuleAllowed(strModule)) {
        return disabledError(res);
    }
    if (!ptrIsFullnode()) {
        return fullnodeError(res);
    }
    if (!req.params.address || req.params.address.length !== 34) {
        return res.status(400).send('Missing "address" parameter!');
    }
    if (!req.params.contract) {
        return res.status(400).send('Missing "contract" parameter!');
    }
    if (!req.params.to || req.params.to.length !== 34) {
        return res.status(400).send('Missing "to" parameter!');
    }
    if (!req.params.id) {
        return res.status(400).send('Missing "id" parameter!');
    }

    const strAddr = req.params.address;
    const strContract = req.params.contract;
    const strTo = req.params.to;
    const strID = req.params.id;
    try {
        // Ensure the collection contract exists
        const cCollection = ptrNFT.getCollection(strContract);
        if (cCollection.error) {
            return res.status(400)
                .send('SCP-4 Contract error: ' + cCollection.message);
        }
        // Ensure the SCP-4 token exists
        const cNFT = ptrNFT.getNFTptr(strID);
        if (cNFT.error) {
            return res.status(400)
                .send('SCP-4 Token error: ' + cNFT.message);
        }
        // Ensure we own it
        if (cNFT.owner !== strAddr) {
            return res.status(400)
                .send('SCP-4 Token error: You do not own this NFT!');
        }
        // Ensure we have the address specified, and it's unlocked
        const cWallet = ptrWALLET.getWallet(strAddr);
        if (!cWallet) {
            return res.status(400)
                .send('Address "' + strAddr +
                      '" does not exist in this wallet!');
        }
        const strPubkey = cWallet.getPubkey();
        if (cWallet.getPrivkey() === null) {
            return res.status(400)
                .send('This address is locked (encrypted)' +
                        ' via passphrase! Please unlock via' +
                        ' GUI before using the API.');
        }

        // Asynchronously sync UTXOs with the network
        await ptrWALLET.refreshUTXOs(strPubkey);

        // --- TRANSFER NFT ---
        const cTx = ptrWALLET.sccjs.tx.transaction();
        // Add input
        const cUTXO = ptrWALLET.getCoinsToSpend(10000, true, strPubkey)[0];
        if (!cUTXO) {
            return res.status(400).send('Not enough gas funds!');
        }
        cTx.addinput(cUTXO.id, cUTXO.vout, cUTXO.script);
        // SCP output
        cTx.addoutputburn(0.00000001,
            strContract + ' transfer ' + strTo + ' ' + strID);
        // Fee & Change output
        const nFee = ptrWALLET.getFee(cTx.serialize().length);
        const nChange = ((cUTXO.sats / COIN) - nFee).toFixed(8);
        cTx.addoutput(strPubkey, nChange);
        // Broadcast
        const strSignedTx = await cTx.sign(cWallet.getPrivkey(), 1);
        const strTXID = await ptrWALLET.broadcastTx(strSignedTx);
        // Mark UTXO as spent
        cUTXO.spent = true;
        // Return API data
        return res.json({
            'txid': strTXID,
            'rawTx': strSignedTx
        });
    } catch(e) {
        console.error("Network error on API '" + strModule + "/transfernft'");
        console.error(e);
        return res.status(400).send('Internal API Error');
    }
}

function fullnodeError(res) {
    return res.status(403).json({
        'error': 'This endpoint is only available to Full-nodes, please ' +
                 'connect an SCC Core RPC server to enable as a Full-node!'
    });
}

function disabledError(res) {
    return res.status(403).json({
        'error': 'This module (' + strModule + ') is disabled!'
    });
}

exports.init = init;
exports.getBalances = getBalances;
exports.listAddresses = listAddresses;
exports.getNewAddress = getNewAddress;
exports.send = send;
exports.stake = stake;
// SCP-4
exports.createCollection = createCollection;
exports.mintNFT = mintNFT;
exports.burnNFT = burnNFT;
exports.transferNFT = transferNFT;

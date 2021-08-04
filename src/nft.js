/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';
/*
    SCP NFT STANDARDS
    ------------------
    This file hosts the interpreter functionality, classes and logic handling NFTs.
*/

const cUpgrades = require('./upgrades.js');

// The current chain state of SCP NFTs
const stateNFT = [];

// SCP-4: (SCP-4 represents 'barebones' NFTs, with an issuer-only minting process, with: mint and transfer functionality)
class SCP4 {
    constructor(contract, collectionName, creator, owners) {
        this.index = -1;
        this.version = 4;
        this.contract = contract;
        this.collectionName = collectionName;
        this.supply = 0;
        this.creator = creator;
        this.owners = owners;
        if (typeof this.owners !== 'object') this.owners = [];
    }

    // ACCOUNTING METHODS
    // TODO

    // Search for an SCP-4 account by address
    getAccount(address) {
        for (const cAcc of this.owners) {
            if (cAcc.address === address) {
                return cAcc;
            }
        }
        // No account found!
        return false;
    }
}

function addNFT(cNFT = SCP4) {
    // First, ensure the contract isn't already indexed in the current chain state.
    for (const nft of stateNFT) {
        if (nft.contract === cNFT.contract) {
            return {
                'error': true,
                'message': 'SCP-' + nft.version + ' already indexed in current chain state.',
                'id': 8
            };
        }
    }
    // Calculate the index
    cNFT.index = stateNFT.length;
    // Push the Collection into the SCP NFT state tracker.
    stateNFT.push(cNFT);
    return true;
}

function getNFTPtr() {
    // Return the full list of NFTs
    return stateNFT;
}

function getNFT(query) {
    // (Indexed ID only!) Fetch a NFT by it's Index ID
    if (typeof query === 'number') return stateNFT[query];
    // Find a NFT by it's contract TX-ID
    for (const nft of stateNFT) {
        if (nft.contract === query) return nft;
    }
    // If we reach here, no contract found!
    return {
        'error': true,
        'message': 'NFT Contract is not indexed in current chain state.',
        'id': 9
    };
}

// Class
exports.SCP4 = SCP4;
// Funcs
exports.getNFTPtr = getNFTPtr;
exports.addNFT = addNFT;
exports.getNFT = getNFT;

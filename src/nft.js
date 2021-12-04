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

// The current chain state of SCP NFTs
const stateCollections = [];

// Pointers
let ptrGetBlockcount;

function init(getBlockCount) {
    ptrGetBlockcount = getBlockCount;
}

// SCP-4: (SCP-4 represents 'barebones' NFTs, with an issuer-only minting process, with: mint and transfer functionality)
class SCP4 {
    constructor(contract, collectionName, maxMints, collectionProtected,
        creator, nfts) {
        this.index = -1;
        this.version = 4;
        this.genesisBlock = 0;
        this.contract = contract;
        this.collectionName = collectionName;
        this.mints = 0;
        this.maxMints = maxMints; // -1 = infinity
        this.protected = collectionProtected;
        this.creator = creator;
        this.nfts = nfts;
        if (typeof this.nfts !== 'object') this.nfts = [];
    }

    // ACCOUNTING METHODS
    mintNFT(address, name, imgUrl, tx) {
        // Ensure mint does not exceed the maximum mints (if set)
        if (this.maxMints !== -1 && (this.mints + 1) > this.maxMints) {
            console.warn("SCP-4: Attempted mint for collection '" +
                            this.collectionName + "' exceeds maximum mints" +
                            " of '" + this.maxMints + "'!");
            return false;
        }

        // Append NFT to the Collection!
        this.nfts.push({
            'id': tx.txid,
            'name': name,
            'imgUrl': imgUrl,
            'owner': address,
            'activity': [{
                'tx': tx.txid,
                'type': 'mint',
                'from': null,
                'to': address,
                'block': tx.height
            }]
        });

        this.mints += 1;
        console.log("SCP-4: Issuer minted new NFT for '" +
                    this.collectionName + "'!");
        return true;
    }

    transfer(acc1, acc2, nftId, tx) {
        // Ensure the NFT exists
        const nft = getNFTptr(nftId);
        if (!nft || nft.error) {
            console.warn("SCP-4: Attempted to transfer NFT '" + nftId +
                         "' failed. NFT not found within state!");
            return;
        }
        // Ensure account 1 (sender) owns the NFT
        if (nft.owner !== acc1) {
            console.warn("SCP-4: Attempted to transfer NFT '" + nftId +
                         "' failed. NFT not owned by sender!");
            return;
        }

        // Switch owner
        nft.owner = acc2;

        // Add activity
        nft.activity.push({
            'tx': tx.txid,
            'type': 'transfer',
            'from': acc1,
            'to': acc2,
            'block': tx.height
        });

        console.log('SCP-' + this.version + ": NFT '" + nftId +
                    "' transferred from '" + acc1 + "' to '" + acc2 + "'!");
        return true;
    }

    destroy(acc, collection, nftId, tx) {
        // Ensure the Collection exists
        const coll = getCollection(collection);
        if (!coll || coll.error) {
            console.warn("SCP-4: Attempt to destroy NFT '" + nftId +
                         "' failed. Collection not found within state!");
            return;
        }
        // Ensure the Collection is not protected
        if (coll.protected) {
            console.warn("SCP-4: Attempt to destroy NFT '" + nftId +
                         "' failed. Collection is protected!");
            return;
        }
        // Ensure the NFT exists
        const nft = getNFTptr(nftId);
        if (!nft || nft.error) {
            console.warn("SCP-4: Attempt to destroy NFT '" + nftId +
                         "' failed. NFT not found within state!");
            return;
        }
        // Ensure account 1 (sender) owns the NFT
        if (nft.owner !== acc) {
            console.warn("SCP-4: Attempt to destroy NFT '" + nftId +
                         "' failed. NFT not owned by caller!");
            return;
        }

        // Destroy NFT by removing owner from state
        nft.owner = null;

        // Add activity
        nft.activity.push({
            'tx': tx.txid,
            'type': 'destroy',
            'from': acc,
            'to': null,
            'block': tx.height
        });

        console.log('SCP-' + this.version + ": NFT '" +
        nftId + "' destroyed by '" + acc + "'!");
        return true;
    }
}

function addCollection(collection = SCP4, nBlock = 0) {
    // First, ensure the contract isn't already indexed in the current chain state.
    for (const coll of stateCollections) {
        if (coll.contract === collection.contract) {
            return {
                'error': true,
                'message': 'SCP-' + coll.version +
                           ' already indexed in current chain state.',
                'id': 8
            };
        }
    }
    // Calculate the index
    collection.index = stateCollections.length;
    // Set genesis block
    collection.genesisBlock = nBlock;
    // Push the Collection into the SCP NFT state tracker.
    stateCollections.push(collection);
    return true;
}

function getCollectionPtr() {
    // Return the full list of Collections
    return stateCollections;
}

function getAllCollectionHeaders() {
    const arrCollHeaders = [];
    // Loop all collections, deep clone, and strip all NFT data
    for (const cColl of stateCollections) {
        const cClone = JSON.parse(JSON.stringify(cColl));
        delete cClone.nfts;
        cClone.totalTXs = (cColl.nfts.length > 0)
            ? cColl.nfts
                .map(a => a.activity.length) // Map the TX lengths of each NFT's activity.
                .reduce((a, b) => a + b)
            : 0; // Sum the lengths.
        cClone.totalNFTs = cColl.nfts.length;
        cClone.burnedNFTs = cColl.nfts.filter(a => a.owner === null).length;
        const arrHolders = [];
        // Aggregate and sum unique / non-duplicated holders
        for (const cNFT of cColl.nfts) {
            if (cNFT.owner === null) continue;
            if (arrHolders.includes(cNFT.owner)) continue;
            arrHolders.push(cNFT.owner);
        }
        cClone.holders = arrHolders.length;
        cClone.age = {
            'blocks': ptrGetBlockcount() - cColl.genesisBlock,
            'days': (ptrGetBlockcount() - cColl.genesisBlock) / 720
        };
        arrCollHeaders.push(cClone);
    }
    return arrCollHeaders;
}

function getCollection(query) {
    // (Indexed ID only!) Fetch a NFT by it's Index ID
    if (typeof query === 'number') return stateCollections[query];
    // Find a NFT by it's contract TX-ID
    for (const coll of stateCollections) {
        if (coll.contract === query) return coll;
    }
    // If we reach here, no contract found!
    return {
        'error': true,
        'message': 'Collection is not indexed in current chain state.',
        'id': 9
    };
}

function getNFTptr(nftId) {
    // Loop all collections
    for (const collection of stateCollections) {
        // Loop NFTs
        for (const nft of collection.nfts) {
            if (nft.id === nftId) return nft;
        }
    }

    // If we reach here, no NFT found!
    return {
        'error': true,
        'message': 'NFT is not indexed in current chain state.',
        'id': 10
    };
}

function getAllNFTsByAccount(address) {
    // Find a list of NFTs in all collections via address
    const arrNFTs = [];
    // Loop every collection
    for (const collection of stateCollections) {
        // Search for the account
        for (const nft of collection.nfts) {
            if (nft.owner === address) {
                arrNFTs.push({
                    'nft': nft.id,
                    'name': nft.name,
                    'imgUrl': nft.imgUrl,
                    'collection': collection.contract,
                    'collectionIndex': collection.index,
                    'collectionName': collection.collectionName,
                    'activity': nft.activity
                });
            }
        }
    }
    return arrNFTs;
}

// Find a NFT by it's ID
function getNFTbyId(query) {
    // Loop all collections
    for (const collection of stateCollections) {
        // Loop NFTs
        for (const nft of collection.nfts) {
            if (nft.id === query) {
                return {
                    'nft': nft.id,
                    'name': nft.name,
                    'imgUrl': nft.imgUrl,
                    'collection': collection.contract,
                    'collectionIndex': collection.index,
                    'collectionName': collection.collectionName,
                    'owner': nft.owner,
                    'activity': nft.activity
                };
            }
        }
    }
    // If we reach here, no NFT found!
    return {
        'error': true,
        'message': 'NFT is not indexed in current chain state.',
        'id': 11
    };
}

// Class
exports.SCP4 = SCP4;
// Funcs
exports.init = init;
exports.getCollectionPtr = getCollectionPtr;
exports.getAllCollectionHeaders = getAllCollectionHeaders;
exports.addCollection = addCollection;
exports.getCollection = getCollection;
exports.getNFTptr = getNFTptr;
exports.getAllNFTsByAccount = getAllNFTsByAccount;
exports.getNFTbyId = getNFTbyId;

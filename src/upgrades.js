/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';
/*
    SCP-1 CHAIN-UPGRADE FUNCTIONS
    -----------------------------
    This file hosts the constants, params & heights at which SCP & SCC blockchain
    upgrades will take place, this contains all of the smooth-switchover logic.
*/

/* eslint-disable camelcase */
// Ignore camelcase style warnings

// SCP-2 IMPROVEMENT UPGRADE 1
// - Drops min stake-reward to 1 sat, from 0.001% of max supply.
// ... allowing more users of smaller balances to participate in
// ... staking SCP-2 tokens.
const nUpgradeBlock1_minStake = 196000;

// SCP IMPROVEMENT UPGRADE 2
// - Indexes all SCP Token contracts by their State Index, this
// ... allows full-nodes to map a 64-byte contract ID to a single
// ... tiny integer, which enables the network to perform contract
// ... operations in ~25% less space than before
// - This upgrade takes place at the same height as the Min Stake upgrade.
const nUpgradeBlock2_tokenIndexing = nUpgradeBlock1_minStake;

// SCP IMPROVEMENT UPGRADE 3
// - Implements the SCP-4 Standard, which is an NFT standard for deploying
// ... NFT 'collections', these collections have properties such as:
// ... 'name', 'max supply', 'protected', these properties apply to all
// ... NFTs that exist within the given collection.
const nUpgradeBlock3_scp4 = 0; // TODO: SET SCP-4 UPGRADE HEIGHT BEFORE RELEASE!

function isMinStakeActive(height = Number) {
    return height >= nUpgradeBlock1_minStake;
}

function isTokenIndexingActive(height = Number) {
    return height >= nUpgradeBlock2_tokenIndexing;
}

function isScp4Active(height = Number) {
    return height >= nUpgradeBlock3_scp4;
}

/* eslint-enable camelcase */

exports.isMinStakeActive = isMinStakeActive;
exports.isTokenIndexingActive = isTokenIndexingActive;
exports.isScp4Active = isScp4Active;

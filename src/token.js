/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';
/*
    SCP-1 TOKEN FUNCTIONS
    ------------------
    This file hosts the interpreter functionality, classes and logic handling of SCP-1 tokens.
*/

const cUpgrades = require('./upgrades.js');

const COIN = 100000000;

let lastBlockSCP = null;

// The current chain state of SCP-1 tokens
const stateTokens = [];

function setBlockHeight(newBlock) {
    if (newBlock !== lastBlockSCP) tokenTick();
    lastBlockSCP = newBlock;
}

function tokenTick() {
    // Loop all tokens
    for (const cToken of stateTokens) {
        if (cToken.version === 2 && cToken.supply > 0) {
            // Loop all stakers
            stakeTick(cToken);
        }
    }
}

function stakeTick(cToken) {
    // Loop all stakers
    for (const cStaker of cToken.owners) {
        const status = cToken.getStakingStatus(cStaker, true);
        if (status.enabled) {
            // Credit rewards for this block
            cToken.creditRewards(cStaker);
        }
    }
}

// SCP-1: (SCP-1 represents a 'barebones' token, with an issuer-only minting process, with: mint, burn and transfer functionality)
class SCP1Token {
    constructor(contract, name, ticker, maxSupply, creator, owners) {
        this.index = -1;
        this.version = 1;
        this.contract = contract;
        this.name = name;
        this.ticker = ticker;
        this.maxSupply = maxSupply;
        this.supply = 0;
        this.creator = creator;
        this.owners = owners;
        if (typeof this.owners !== 'object') this.owners = [];
    }

    // ACCOUNTING METHODS

    // Credit an SCP-1 account with an amount of tokens
    creditAccount(address, amount, tx) {
        // Ensure appended credit does not exceed the maximum supply
        if ((this.supply + amount) > this.maxSupply) {
            console.error("SCP-1: Attempted credit of '" +
                            amount + "' for token '" +
                            this.name + "' exceeds maximum supply of '" +
                            this.maxSupply + "'!");
            return false;
        }
        // Search for an already-existing acccount
        const cAcc = this.getAccount(address);
        // If no account was found, we create one on-the-fly, with their balance as the credit amount
        if (!cAcc) {
            this.owners.push({
                'address': address,
                'balance': amount,
                'lockedBalance': 0,
                'activity': [
                    {
                        'id': tx.txid,
                        'block': tx.height,
                        'type': 'received',
                        'amount': amount
                    }
                ]
            });
        } else {
        // Found existing account, append credit to the balance!
            cAcc.balance += amount;
            cAcc.activity.push({
                'id': tx.txid,
                'block': tx.height,
                'type': 'received',
                'amount': amount
            });
        }
        this.supply += amount;
        console.log("SCP-1: Issuer for token '" +
                    this.name + "' minted '" +
                    amount + ' ' + this.ticker + "', new supply is '" +
                    this.supply + ' ' + this.ticker + "'!");
        return true;
    }

    // Debits an SCP-1 account with an amount of tokens
    debitAccount(address, amount, tx) {
        // Ensure expended debit does not bring the supply into the negative
        if ((this.supply - amount) < 0) {
            console.error("SCP-" + this.version + ": Attempted burn of '" +
                             amount + "' for token '" + this.name +
                            "' brings the supply into the negative!");
            return false;
        }
        // Ensure the account does not spend more than it's available balance
        const cAcc = this.getAccount(address);
        const nSpendable = cAcc.balance - cAcc.lockedBalance;
        if (nSpendable >= amount) {
            cAcc.balance -= amount;
            cAcc.activity.push({
                'id': tx.txid,
                'block': tx.height,
                'type': 'sent',
                'amount': amount
            });
            this.supply -= amount;
            console.log("SCP-" + this.version + ": User for token '" +
                        this.name + "' burned '" + amount + ' ' + this.ticker +
                        "', new balance is '" + cAcc.balance +
                        "', new supply is '" + this.supply + "'!");
        } else {
            console.log("SCP-" + this.version + ": Attempted burn of token '" +
                        this.name + "' of amount '" + amount +
                        ' ' + this.ticker +
                        "' failed due to insufficient funds!");
            return false;
        }
        return true;
    }

    // Lock an amount of tokens inside an SCP-1 account, making them unspendable until unlocked
    lockAccount(address, amount, tx) {
        // Search for the account, immediately reject if we don't find one
        const cAcc = this.getAccount(address);
        if (!cAcc) return false;

        // Ensure the lock cannot be 'reversed' via negative locks
        if (amount <= 0) {
            console.error("SCP-" + this.version + ": Attempted reverse lock " +
                            "of '" + amount + "' for token '" +
                            this.name + "' was rejected");
            return false;
        }

        // Ensure locked tokens do not exceed the account spendable balance
        const nSpendable = cAcc.balance - cAcc.lockedBalance;
        if (amount > nSpendable) {
            console.error("SCP-" + this.version + ": Attempted lock of '" +
                            amount + "' for token '" +
                            this.name + "' exceeds spendable balance of '" +
                            nSpendable + "'!");
            return false;
        }

        // Lock the desired amount
        cAcc.lockedBalance += amount;
        cAcc.activity.push({
            'id': tx.txid,
            'block': tx.height,
            'type': 'locked',
            'amount': amount
        });

        console.log("SCP-" + this.version + ": User for token '" +
                    this.name + "' locked '" + amount + ' ' + this.ticker +
                    "', new spendable balance is '" +
                    (cAcc.balance - cAcc.lockedBalance) + ' ' + this.ticker +
                    "'!");
        return true;
    }

    // Unlock an amount of tokens inside an SCP-1 account, making them spendable again
    unlockAccount(address, amount, tx) {
        // Search for the account, immediately reject if we don't find one
        const cAcc = this.getAccount(address);
        if (!cAcc) return false;

        // Ensure the unlock cannot be 'reversed' via negative unlocks
        if (amount <= 0) {
            console.error("SCP-" + this.version + ": Attempted reverse unlock " +
                            "of '" + amount + "' for token '" +
                            this.name + "' was rejected");
            return false;
        }

        // Ensure we have enough locked coins to unlock
        if (amount > cAcc.lockedBalance) {
            console.error("SCP-" + this.version + ": Attempted lock of '" +
                            amount + "' for token '" +
                            this.name + "' exceeds locked balance of '" +
                            cAcc.lockedBalance + "'!");
            return false;
        }

        // Unock the desired amount
        cAcc.lockedBalance -= amount;
        cAcc.activity.push({
            'id': tx.txid,
            'block': tx.height,
            'type': 'unlocked',
            'amount': amount
        });

        console.log("SCP-" + this.version + ": User for token '" +
                    this.name + "' unlocked '" + amount + ' ' + this.ticker +
                    "', new spendable balance is '" +
                    (cAcc.balance - cAcc.lockedBalance) + ' ' + this.ticker +
                    "'!");
        return true;
    }

    // Transfers an amount of SCP-1 tokens between the first account to the second account
    transfer(acc1, acc2, amount, tx) {
        // If this returns false, then the sender doesn't have enough funds
        if (!this.debitAccount(acc1, amount, tx)) return;
        // Credit the tokens to the second account
        this.creditAccount(acc2, amount, tx);
        console.log("SCP-" + this.version + ": User for token '" + this.name +
                    "' transferred '" + amount + ' ' + this.ticker +
                    "' to another account!\nFrom: (" + acc1 + '), To: (' +
                    acc2 + ')');
        return true;
    }

    // Search for an SCP-1 account by address
    getAccount(address) {
        return this.owners.find(a => a.address === address) || false;
    }

    percentOf(partial, full) {
        return (partial / full);
    }

    percentChange(decrease, oldNumber) {
        return (decrease / oldNumber);
    }
}

// SCP-2: (A more advanced variant of SCP-1 with per-block proportional staking rewards for all long-term holders, and a safer issuance model)
class SCP2Token extends SCP1Token {
    constructor(contract, name, ticker, maxSupply, creator, owners, inflation,
        minAge) {
        super(contract, name, ticker, maxSupply, creator, owners);
        if (typeof this.owners !== 'object') this.owners = [];
        this.version = 2;
        this.inflation = inflation;
        this.minAge = minAge;
    }

    // ACCOUNTING METHODS

    // Calculates the current amount of pending, redeemable supply from staking
    getPendingSupply() {
        return this.owners.reduce((a, b) => a + b.unclaimed_balance, 0);
    }

    // Calculates the account's holdings (PoS weight) against the rest of the network in percentage
    getWeightPercent(cAcc) {
        if (!cAcc || (cAcc && cAcc.balance <= 0)) return 0;
        // If there's only one owner, then this will always be 100%
        if (this.owners.length <= 1) return 1;
        // Calculate our balance against the network
        return this.percentOf(cAcc.balance, this.supply);
    }

    // Calculates and credits PoS rewards based on the current block
    creditRewards(cAcc) {
        if (!cAcc || (cAcc && cAcc.balance <= 0)) return false;
        // Calculate the weight and reward share
        const nWeight = this.getWeightPercent(cAcc);
        let nReward = this.inflation * nWeight;
        // Correct the reward precision and round-down
        const nOldReward = nReward;
        nReward = Math.round(nReward);
        if (nReward > nOldReward) nReward -= 1;
        // SCP IMPROVEMENT UPGRADE 1
        if (cUpgrades.isMinStakeActive(lastBlockSCP)) {
            // If the reward is under 1 sat, we discard the reward for precision purposes
            if (nReward < 1) return false;
        } else {
            // If the weight is too low (>0.001%), or the reward is under 1 sat, we discard the reward for precision purposes
            if (((nWeight * 100) < 0.001) || nReward < 1) return false;
        }
        // Prevent stakers from 'phantom staking' past the max supply, which would allow them to insta-mint upon any burn post-supply-cap
        if ((this.supply + cAcc.unclaimed_balance) >= this.maxSupply) {
            return false;
        }
        // Credit the reward
        cAcc.unclaimed_balance += nReward;
        return true;
    }

    // Redeems all unclaimed balance from staking rewards
    redeemRewards(cAcc, tx) {
        if (!cAcc || (cAcc && cAcc.unclaimed_balance <= 0)) {
            return false;
        }
        // Ensure redeeming the balance will not overflow the supply
        if ((this.supply + cAcc.unclaimed_balance) > this.maxSupply) {
            console.error('SCP-' + this.version + ": Attempted stake of '" +
                            cAcc.unclaimed_balance + "' for token '" +
                            this.name + "' exceeds maximum supply of '" +
                            this.maxSupply + "'!");
            return false;
        }
        // Redeem the claimable balance and reset it to zero, but allow them to continue staking (don't reset the age)
        cAcc.activity.push({
            'id': tx.txid,
            'block': tx.height,
            'type': 'staked',
            'amount': cAcc.unclaimed_balance
        });
        this.supply += cAcc.unclaimed_balance;
        cAcc.balance += cAcc.unclaimed_balance;
        cAcc.unclaimed_balance = 0;
    }

    // Gets the staking status of an address based on the time since it's last transaction
    getStakingStatus(cAcc, noStrings = false) {
        const ret = {
            'enabled': false,
            'age': 0,
            'unclaimed_rewards': 0,
            'weight': this.getWeightPercent(cAcc),
            'note': ''
        };
        if (cAcc) {
            // We deduct the account's last tx block from the current SCP height to get the age
            const nAge = lastBlockSCP - cAcc.lastTxBlock;
            ret.age = nAge;
            ret.unclaimed_rewards = cAcc.unclaimed_balance;
            // Check if the account's tokens can be staked
            if (nAge >= this.minAge) {
                // Staking!
                ret.enabled = true;
                if (!noStrings) {
                    const strBal = (cAcc.balance / COIN);
                    const strPendingBal = (cAcc.unclaimed_balance / COIN);
                    ret.note = 'currently staking ' +
                               strBal.toLocaleString('en-GB') +
                               ' ' + this.ticker +
                               ' with an age of ' + nAge + ' blocks, with ' +
                               strPendingBal.toLocaleString('en-GB') + ' ' +
                               this.ticker + ' in unclaimed ' +
                               'stake rewards';
                }
            } else {
                // Not staking
                if (!noStrings) {
                    const strBlocksToStaking = (this.minAge - nAge);
                    ret.note = 'not staking, this account has transacted ' +
                               this.ticker +
                               ' tokens too recently, you must wait ' +
                               strBlocksToStaking.toLocaleString('en-GB') +
                               ' blocks to earn stakes';
                }
            }
        } else {
            ret.note = 'this address does not inherit an account for this ' +
                       'SCP-' + this.version + ' token';
        }
        return ret;
    }

    // Credit an SCP-2 account with an amount of tokens
    creditAccount(address, amount, tx) {
        // Ensure appended credit does not exceed the maximum supply
        if ((this.supply + amount) > this.maxSupply) {
            console.error('SCP-' + this.version + ": Attempted credit of '" +
                            amount + "' for token '" + this.name +
                            "' exceeds maximum supply of '" + this.maxSupply +
                            "'!");
            return false;
        }
        // Search for an already-existing acccount
        const cAcc = super.getAccount(address);
        // If no account was found, we create one on-the-fly, with their balance as the credit amount
        if (!cAcc) {
            this.owners.push({
                'address': address,
                'balance': amount,
                'lockedBalance': 0,
                'unclaimed_balance': 0,
                'lastTxBlock': tx.height,
                'activity': [
                    {
                        'id': tx.txid,
                        'block': tx.height,
                        'type': 'received',
                        'amount': amount
                    }
                ]
            });
        } else {
        // Found existing account, append credit to the balance!
            cAcc.balance += amount;
            cAcc.lastTxBlock = tx.height;
            cAcc.activity.push({
                'id': tx.txid,
                'block': tx.height,
                'type': 'received',
                'amount': amount
            });
        }
        this.supply += amount;
        this.redeemRewards(cAcc, tx);
        console.log('SCP-' + this.version + ": Issuer for token '" + this.name +
                    "' minted '" + amount + ' ' + this.ticker +
                    "', new supply is '" + this.supply + ' ' + this.ticker +
                    "'!");
        return true;
    }

    // Debits an SCP-2 account with an amount of tokens, resetting the available rewards
    debitAccount(address, amount, tx) {
        // Ensure expended debit does not bring the supply into the negative
        if ((this.supply - amount) < 0) {
            console.error('SCP-' + this.version + ": Attempted burn of '" +
                            amount + "' for token '" + this.name +
                            "' brings the supply into the negative!");
            return false;
        }

        // Fetch the account
        const cAcc = super.getAccount(address);
        if (!cAcc) return false;

        // Ensure the account does not spend more than it's available balance
        const nSpendable = cAcc.balance - cAcc.lockedBalance;
        if (nSpendable >= amount) {
            this.supply -= amount;
            cAcc.balance -= amount;
            cAcc.unclaimed_balance = 0;
            cAcc.lastTxBlock = tx.height;
            cAcc.activity.push({
                'id': tx.txid,
                'block': tx.height,
                'type': 'sent',
                'amount': amount
            });
            console.log('SCP-' + this.version + ": User for token '" +
                        this.name + "' burned '" + amount + ' ' +
                        this.ticker +
                        "', new balance is '" + cAcc.balance +
                        "', new supply is '" + this.supply + "'!");
        } else {
            console.log('SCP-' + this.version +
                        ": Attempted burn of token '" + this.name +
                        "' of amount '" + amount + ' ' +
                        this.ticker +
                        "' failed due to insufficient funds!");
            return false;
        }
        return true;
    }

    // Transfers an amount of SCP-2 tokens between the first account to the second account
    transfer(acc1, acc2, amount, tx) {
        // If this returns false, then the sender doesn't have enough funds
        if (!this.debitAccount(acc1, amount, tx)) return;
        // Credit the tokens to the second account
        this.creditAccount(acc2, amount, tx);
        console.log('SCP-' + this.version + ": User for token '" +
        this.name + "' transferred '" + amount + ' ' + this.ticker +
        "' to another account!\nFrom: (" + acc1 + '), To: (' + acc2 + ')');
        return true;
    }
}

function addToken(cToken = SCP1Token) {
    // First, ensure the token isn't already indexed in the current chain state.
    const ctToken = stateTokens.find(a => a.contract === cToken.contract);
    if (ctToken) {
        return {
            'error': true,
            'message': 'SCP-' + ctToken.version + ' Token already indexed ' +
                       'in current chain state.',
            'id': 8
        };
    }
    // Calculate the index
    cToken.index = stateTokens.length;
    // Push the token into the SCP token state tracker.
    stateTokens.push(cToken);
    return true;
}

function getTokensPtr() {
    // Return the full list of tokens
    return stateTokens;
}

function getToken(query) {
    // (Indexed ID only!) Fetch a Token by it's Index ID
    if (typeof query === 'number') return stateTokens[query];
    // Find a token by it's contract TX-ID
    const cToken = stateTokens.find(a => a.contract === query);
    if (cToken) return cToken;
    // If we reach here, no token contract found!
    return {
        'error': true,
        'message': 'SCP Token is not indexed in current chain state.',
        'id': 9
    };
}

function getTokensByAccount(address) {
    // Find a list of token accounts via address
    const arrFoundAccounts = [];
    // Loop every token
    for (const token of stateTokens) {
        // Search for the account
        const cAcc = token.getAccount(address);
        if (cAcc) {
            // Found account!
            const clonedToken = JSON.parse(JSON.stringify(token));
            delete clonedToken.owners;
            arrFoundAccounts.push({ 'token': clonedToken, 'account': cAcc });
        }
    }
    return arrFoundAccounts;
}

function getActivityByAccount(address) {
    const cTokens = getTokensByAccount(address);
    if (cTokens.length === 0) return [];
    const blocktimeSortedActivity = [];
    for (const cToken of cTokens) {
        for (const cActivity of cToken.account.activity) {
            const deepClonedActivity = JSON.parse(JSON.stringify(cActivity));
            deepClonedActivity.token = {
                'contract': cToken.token.contract,
                'ticker': cToken.token.ticker,
                'name': cToken.token.name
            };
            blocktimeSortedActivity.push(deepClonedActivity);
        }
    }
    blocktimeSortedActivity.sort(function(a, b) {
        return a.block - b.block;
    });
    return blocktimeSortedActivity;
}

// Class
exports.SCP1Token = SCP1Token;
exports.SCP2Token = SCP2Token;
// Funcs
exports.setBlockHeight = setBlockHeight;
exports.getTokensPtr = getTokensPtr;
exports.addToken = addToken;
exports.getToken = getToken;
exports.getTokensByAccount = getTokensByAccount;
exports.getActivityByAccount = getActivityByAccount;

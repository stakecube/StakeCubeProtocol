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

const COIN = 100000000;

// The SCC Core RPC daemon
let SCC;

let lastBlockSCP = null;

function setDaemon(newSCC) {
    SCC = newSCC;
}
function setBlockHeight(newBlock) {
    if (newBlock !== lastBlockSCP) tokenTick();
    lastBlockSCP = newBlock;
}

function tokenTick() {
    // Loop all tokens
    for (const cToken of stateTokens) {
        if (cToken.version === 2) {
            // Loop all stakers
            for (const cStaker of cToken.owners) {
                let status = cToken.getStakingStatus(cStaker.address);
                if (status.enabled) {
                    // Credit rewards for this block
                    cToken.creditRewards(cStaker.address);
                }
            }
        }
    }
}

// The current chain state of SCP-1 tokens
let stateTokens = [];

// SCP-1: (SCP-1 represents a 'barebones' token, with an issuer-only minting process, with: mint, burn and tranfer functionality)
class SCP1Token {
    constructor(contract, name, ticker, maxSupply, creator, owners) {
        this.version   = 1;
        this.contract  = contract;
        this.name      = name;
        this.ticker    = ticker;
        this.maxSupply = maxSupply;
        this.creator   = creator;
        this.owners    = owners;
        if (typeof this.owners !== "object") this.owners = [];
    }

    // GLOBAL METHODS

    // Get the current supply of the SCP-1 token
    getSupply() {
        let nSupply = 0;
        for (const account of this.owners) {
            nSupply += account.balance;
        }
        return nSupply;
    }


    // ACCOUNTING METHODS

    // Credit an SCP-1 account with an amount of tokens
    creditAccount(address, amount, tx) {
        // Ensure appended credit does not exceed the maximum supply
        if ((this.getSupply() + amount) > this.maxSupply) {
            console.error("SCP-1: Attempted credit of '" + amount + "' for token '" + this.name + "' exceeeds maximum supply of '" + this.maxSupply + "'!");
            return false;
        }
        // Search for an already-existing acccount
        let accFound = false;
        for (const account of this.owners) {
            if (account.address === address) {
                accFound = account;
            }
        }
        // If no account was found, we create one on-the-fly, with their balance as the credit amount
        if (!accFound) {
            this.owners.push({
                address: address,
                balance: amount,
                activity: [
                    { block: tx.height, type: "received", amount: amount }
                ]
            });
        }
        // Found existing account, append credit to the balance!
        else {
            accFound.balance += amount;
            accFound.activity.push({ block: tx.height, type: "received", amount: amount });
        }
        console.log("SCP-1: Issuer for token '" + this.name + "' minted '" + amount + " " + this.ticker + "', new supply is '" + this.getSupply()  + " " + this.ticker + "'!");
        return true;
    }

    // Debits an SCP-1 account with an amount of tokens
    debitAccount(address, amount, tx) {
        // Ensure expended debit does not bring the supply into the negative
        if ((this.getSupply() - amount) < 0) {
            console.error("SCP-1: Attempted burn of '" + amount + "' for token '" + this.name + "' brings the supply into the negative!");
            return false;
        }
        // Search for an already-existing acccount
        for (const account of this.owners) {
            if (account.address === address) {
                // Ensure the account does not spend more than it's available balance
                if ((account.balance - amount) >= 0) {
                    account.balance -= amount;
                    account.activity.push({ block: tx.height, type: "sent", amount: amount });
                    console.log("SCP-1: User for token '" + this.name + "' burned '" + amount + " " + this.ticker + "', new balance is '" + account.balance + "', new supply is '" + this.getSupply()  + "'!");
                } else {
                    console.log("SCP-1: Attempted burn of token '" + this.name + "' of amount '" + amount + " " + this.ticker + "' failed due to insufficient funds!");
                    return false;
                }
            }
        }
        return true;
    }

    // Transfers an amount of SCP-1 tokens between the first account to the second account
    transfer(acc1, acc2, amount, tx) {
        // If this returns false, then the sender doesn't have enough funds
        if (!this.debitAccount(acc1, amount, tx)) return;
        // Credit the tokens to the second account
        this.creditAccount(acc2, amount, tx);
        console.log("SCP-1: User for token '" + this.name + "' transferred '" + amount + " " + this.ticker + "' to another account!\nFrom: (" + acc1 + "), To: (" + acc2 + ")");
        return true;
    }

    // Search for an SCP-1 account by address
    getAccount(address) {
        for (const account of this.owners) {
            if (account.address === address) {
                return account;
            }
        }
        // No account found!
        return false;
    }

    percentOf(partial, full) {return (partial / full);}
    percentChange(decrease, oldNumber) {return (decrease / oldNumber);}
}

// SCP-2: (A more advanced variant of SCP-1 with per-block proportional staking rewards for all long-term holders, and a safer issuance model)
class SCP2Token extends SCP1Token {
    constructor(contract, name, ticker, maxSupply, creator, owners, inflation, minAge) {
        super(contract, name, ticker, maxSupply, creator, owners);
        if (typeof this.owners !== "object") this.owners = [];
        this.version = 2;
        this.inflation = inflation;
        this.minAge = minAge;
    }

    // ACCOUNTING METHODS

    // Calculates the current amount of pending, redeemable supply from staking
    getPendingSupply() {
        let nSupply = 0;
        for (const cAccount of this.owners) {
            nSupply += cAccount.unclaimed_balance;
        }
        return nSupply;
    }

    // Calculates the account's holdings (PoS weight) against the rest of the network in percentage
    getWeightPercent(address, cachedSupply = false) {
        // Ensure the account exists and has a balance
        let cAccount = this.getAccount(address);
        if (!cAccount || (cAccount && cAccount.balance <= 0)) return 0;
        // If there's only one owner, then this will always be 100%
        if (this.owners <= 1) return 1;
        // Calculate our balance against the network
        let nSupply = cachedSupply || this.getSupply();
        return this.percentOf(cAccount.balance, nSupply);
    }

    // Calculates and credits PoS rewards based on the current block
    creditRewards(address) {
        // Ensure the account exists and has a balance
        let cAccount = this.getAccount(address);
        if (!cAccount || (cAccount && cAccount.balance <= 0)) return false;
        // Calculate the weight and reward share
        let nSupply = this.getSupply();
        let nWeight = this.getWeightPercent(address, nSupply);
        let nReward = this.inflation * nWeight;
        // Correct the reward precision and round-down
        let nOldReward = nReward;
        nReward = Number(nReward.toFixed(0));
        if (nReward > nOldReward) nReward -= 1;
        // If the weight is too low (>0.001%), or the reward is under 1 sat, we discard the reward for precision purposes
        if (((nWeight * 100) < 0.001) || nReward < 1) return false;
        // Prevent stakers from 'phantom staking' past the max supply, which would allow them to insta-mint upon any burn post-supply-cap
        if ((nSupply + nReward) >= this.maxSupply) return false;
        // Credit the reward
        cAccount.unclaimed_balance += nReward;
        console.log("SCP-" + this.version + " PoS: Credited account (" + address.substr(0, 6) + "...) with " + (nReward / COIN) + "");
        return true;
    }

    // Redeems all unclaimed balance from staking rewards
    redeemRewards(address, tx) {
        // Ensure the account exists and has a redeemable balance
        let cAccount = this.getAccount(address);
        if (!cAccount || (cAccount && cAccount.unclaimed_balance <= 0)) return false;
        // Ensure redeeming the balance will not overflow the supply
        if ((this.getSupply() + cAccount.unclaimed_balance) > this.maxSupply) {
            console.error("SCP-" + this.version + ": Attempted stake of '" + cAccount.unclaimed_balance + "' for token '" + this.name + "' exceeds maximum supply of '" + this.maxSupply + "'!");
            return false;
        }
        // Redeem the claimable balance and reset it to zero, but allow them to continue staking (don't reset the age)
        cAccount.activity.push({ block: tx.height, type: "staked", amount: cAccount.unclaimed_balance });
        cAccount.balance += cAccount.unclaimed_balance;
        cAccount.unclaimed_balance = 0;
    }

    // Gets the staking status of an address based on the time since it's last transaction
    getStakingStatus(address) {
        let ret = {
            enabled: false,
            age: 0,
            unclaimed_rewards: 0,
            weight: this.getWeightPercent(address),
            note: "this address does not inherit an account for this SCP-2 token"
        }
        let cAccount = super.getAccount(address);
        if (cAccount) {
            // We deduct the account's last tx block from the current SCP height to get the age
            let nAge = lastBlockSCP - cAccount.lastTxBlock;
            ret.age = nAge;
            ret.unclaimed_rewards = cAccount.unclaimed_balance;
            // Check if the account's tokens can be staked
            if (nAge >= this.minAge) {
                ret.enabled = true;
                ret.note = "currently staking " + (cAccount.balance / COIN).toLocaleString('en-GB') + " " + this.ticker + " with an age of " + nAge + " blocks, with " + (cAccount.unclaimed_balance / COIN).toLocaleString('en-GB') + " " + this.ticker + " in unclaimed stake rewards";
            } else {
                ret.note = "not staking, this account has transacted " + this.ticker + " tokens too recently, you must wait " + (this.minAge - nAge).toLocaleString('en-GB') + " blocks to earn stakes";
            }
        }
        return ret;
    }

    // Credit an SCP-2 account with an amount of tokens
    creditAccount(address, amount, tx) {
        // Ensure appended credit does not exceed the maximum supply
        if ((this.getSupply() + amount) > this.maxSupply) {
            console.error("SCP-" + this.version + ": Attempted credit of '" + amount + "' for token '" + this.name + "' exceeds maximum supply of '" + this.maxSupply + "'!");
            return false;
        }
        // Search for an already-existing acccount
        let accFound = false;
        for (const account of this.owners) {
            if (account.address === address) {
                accFound = account;
            }
        }
        // If no account was found, we create one on-the-fly, with their balance as the credit amount
        if (!accFound) {
            this.owners.push({
                address: address,
                balance: amount,
                unclaimed_balance: 0,
                lastTxBlock: tx.height,
                activity: [
                    { block: tx.height, type: "received", amount: amount }
                ]
            });
        }
        // Found existing account, append credit to the balance!
        else {
            accFound.balance += amount;
            accFound.lastTxBlock = tx.height;
            accFound.activity.push({ block: tx.height, type: "received", amount: amount });
            this.redeemRewards(address, tx);
        }
        console.log("SCP-" + this.version + ": Issuer for token '" + this.name + "' minted '" + amount + " " + this.ticker + "', new supply is '" + this.getSupply()  + " " + this.ticker + "'!");
        return true;
    }

    // Debits an SCP-2 account with an amount of tokens, resetting the available rewards
    debitAccount(address, amount, tx) {
        // Ensure expended debit does not bring the supply into the negative
        if ((this.getSupply() - amount) < 0) {
            console.error("SCP-" + this.version + ": Attempted burn of '" + amount + "' for token '" + this.name + "' brings the supply into the negative!");
            return false;
        }
        // Search for an already-existing acccount
        for (const account of this.owners) {
            if (account.address === address) {
                // Ensure the account does not spend more than it's available balance
                if ((account.balance - amount) >= 0) {
                    account.balance -= amount;
                    account.unclaimed_balance = 0;
                    account.lastTxBlock = tx.height;
                    account.activity.push({ block: tx.height, type: "sent", amount: amount });
                    console.log("SCP-" + this.version + ": User for token '" + this.name + "' burned '" + amount + " " + this.ticker + "', new balance is '" + account.balance + "', new supply is '" + this.getSupply()  + "'!");
                } else {
                    console.log("SCP-" + this.version + ": Attempted burn of token '" + this.name + "' of amount '" + amount + " " + this.ticker + "' failed due to insufficient funds!");
                    return false;
                }
            }
        }
        return true;
    }

    // Transfers an amount of SCP-2 tokens between the first account to the second account
    transfer(acc1, acc2, amount, tx) {
        // If this returns false, then the sender doesn't have enough funds
        if (!this.debitAccount(acc1, amount, tx)) return;
        // Credit the tokens to the second account
        this.creditAccount(acc2, amount, tx);
        console.log("SCP-" + this.version + ": User for token '" + this.name + "' transferred '" + amount + " " + this.ticker + "' to another account!\nFrom: (" + acc1 + "), To: (" + acc2 + ")");
        return true;
    }
}

function addToken(cToken = SCP1Token) {
    // First, ensure the token isn't already indexed in the current chain state.
    for (const token of stateTokens) {
        if (token.contract === cToken.contract) return { error: true, message: "SCP-" + token.version + " Token already indexed in current chain state.", id: 8 };
    }
    // Push the token into the SCP token state tracker.
    stateTokens.push(cToken);
    return true;
}

function getTokensPtr() {
    // Return the full list of tokens
    return stateTokens;
}

function getToken(txid = String) {
    // Find a token by it's contract TX-ID
    for (const token of stateTokens) {
        if (token.contract === txid) return token;
    }
    // If we reach here, no token contract found!
    return { error: true, message: "SCP Token is not indexed in current chain state.", id: 9 };
}


function getTokensByAccount(address) {
    // Find a list of token accounts via address
    let arrFoundAccounts = [];
    // Loop every token
    for (const token of stateTokens) {
        // Loop every account
        for (const account of token.owners) {
            if (account.address === address) {
                // Found account!
                arrFoundAccounts.push({token: token, account: account});
            }
        }
    }
    return arrFoundAccounts;
}

function getActivityByAccount(address) {
    let cTokens = getTokensByAccount(address);
    if (cTokens.length === 0) return [];
    let blocktimeSortedActivity = [];
    for (const cToken of cTokens) {
        for (const cActivity of cToken.account.activity) {
            let deepClonedActivity = JSON.parse(JSON.stringify(cActivity));
            deepClonedActivity.token = cToken.token;
            blocktimeSortedActivity.push(deepClonedActivity);
        }
    }
    blocktimeSortedActivity.sort(function(a, b){return a.block - b.block});
    return blocktimeSortedActivity;
}

// Class
exports.SCP1Token = SCP1Token;
exports.SCP2Token = SCP2Token;
// Funcs
exports.setDaemon            = setDaemon;
exports.setBlockHeight       = setBlockHeight;
exports.getTokensPtr         = getTokensPtr;
exports.addToken             = addToken;
exports.getToken             = getToken;
exports.getTokensByAccount   = getTokensByAccount;
exports.getActivityByAccount = getActivityByAccount;
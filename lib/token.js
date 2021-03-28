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

// The current chain state of SCP-1 tokens
let stateTokens = [];

// The class of each individual token, containing all pre-processed state data
class SCPToken {
    constructor(contract, name, ticker, maxSupply, creator, owners = []) {
        this.contract  = contract;
        this.name      = name;
        this.ticker    = ticker;
        this.maxSupply = maxSupply;
        this.creator   = creator;
        this.owners    = owners;
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
    creditAccount(address, amount) {
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
                balance: amount
            });
        }
        // Found existing account, append credit to the balance!
        else {
            accFound.balance += amount;
        }
        console.log("SCP-1: Issuer for token '" + this.name + "' minted '" + amount + " " + this.ticker + "', new supply is '" + this.getSupply()  + " " + this.ticker + "'!");
        return true;
    }

    // Debits an SCP-1 account with an amount of tokens
    debitAccount(address, amount) {
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
                    console.log("SCP-1: User for token '" + this.name + "' burned '" + amount + " " + this.ticker + "', new balance is '" + account.balance + "', new supply is '" + this.getSupply()  + "'!");
                } else {
                    console.log("SCP-1: Attempted burn of token '" + this.name + "' of amount '" + amount + " " + this.ticker + "' failed due to insufficient funds!");
                    return false;
                }
            }
        }
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
}

function addToken(cToken = SCPToken) {
    // First, ensure the token isn't already indexed in the current chain state.
    for (const token of stateTokens) {
        if (token.contract === cToken.contract) return { error: true, message: "SCP-1 Token already indexed in current chain state.", id: 8 };
    }
    // Push the token into the SCP-1 token state tracker.
    stateTokens.push(cToken);
    return true;
}

function getToken(txid = String) {
    // Find a token by it's contract TX-ID
    for (const token of stateTokens) {
        if (token.contract === txid) return token;
    }
    // If we reach here, no token contract found!
    return { error: true, message: "SCP-1 Token is not indexed in current chain state.", id: 9 };
}

function getTokensPtr() {
    // Return the full list of tokens
    return stateTokens;
}

// Class
exports.SCPToken = SCPToken;
// Funcs
exports.addToken  = addToken;
exports.getToken  = getToken;
exports.getTokensPtr = getTokensPtr;
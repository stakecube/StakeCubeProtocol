/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';
/*
    SCP VIRTUAL MACHINE FUNCTIONS
    -----------------------------
    This file hosts the constants, indexes and functionality of the
    SCP Virtual Machine, including opcode definitions and logic.
*/

const OP = {
    'deploy': 0xde, // 222
    'write': 0xdf // 223
};

const STATE = {
    // 'meta' is a reserved state key with key/value & array string storage for DApps
    'meta': []
};

// Run an SCP VM contract and return the results
async function run(tx, strContract = String()) {
    let success = false;
    try {
        // Sanity checks
        // Ensure there's some actual data
        if (!strContract || !strContract.length) return false;
        // Make sure there's at least 2 possible instructions
        const arrInput = strContract.split(' ');
        if (arrInput.length < 2) return false;

        // Execute the logic step-by-step
        let i; const len = arrInput.length; let stopExec = false;
        for (i = 0; i < len; i++) {
            // Prev. instruction asked us to stop running this contract
            if (stopExec) break;

            // Parse the opcode (this will throw if non-int)
            const op = parseInt(arrInput[i], 16);

            // Find the opcode instruction
            if (op === OP.deploy) {
                // Execute Deploy with the given params, if successful, end execution gracefully
                stopExec = true;
                if (deploy(tx, arrInput[i + 1])) {
                    success = true;
                } else {
                    success = false;
                }
            } if (op === OP.write) {
                // Execute Write with the given params, if successful, end execution gracefully
                stopExec = true;
                // Check we have all necessary params:
                // Identifier
                const check1 = arrInput[i + 1] && arrInput[i + 1].length === 64;
                const strID = arrInput[i + 1];
                // Data Type
                const check2 = arrInput[i + 2] && arrInput[i + 2].length;
                const strType = arrInput[i + 2];
                // Combined checks
                const check3 = check1 && check2;
                if (check3) {
                    if (strType === 'push') {
                        write(strID, strType, strContract);
                        success = true;
                    } else if (strType === 'key') {
                        // Map Key
                        const strKey = arrInput[i + 3];
                        if (strKey && strKey.length) {
                            write(strID, strType, strContract, strKey);
                            success = true;
                        } else {
                            success = false;
                        }
                    } else {
                        success = false;
                    }
                } else {
                    success = false;
                }
            } else {
                // Error logging is disabled here as this would be spammed in the logs due to non-bytecode TXs.
                // Should we refactor this somehow? More advanced 'TX type' detection?
                // I just fear degrading sync performance, these checks must be very low-resource / low CPU cycle.

                // console.error('VM: Interpretation failed, invalid opcode "' +
                //              op + '"!');
                return false;
            }
        }
    } catch(e) {
        console.error('VM: Execution failure, ' + e);
        success = false;
    }

    return success;
}

function deploy(tx, opt) {
    // Deploy has multiple deployment options, 'meta' is the first one
    if (opt === 'meta') {
        // Create a storage array using the TXID as the storage ID
        STATE.meta[tx.txid] = [];
        console.log('VM: Deployment (meta) successful, new ' +
                    'meta storage available at:\n' + tx.txid);
        return true;
    } else {
        console.error('VM: Deploy failed, invalid option "' + opt + '"!');
        return false;
    }
}

function write(id, opt, strInput, key = false) {
    // Ensure the storage ID exists
    const arrMetaPtr = getMetaStateByIdPtr(id);
    if (arrMetaPtr === undefined) return false;
    // Write has multiple options: 'push' and 'key'
    if (opt === 'push') {
        // Append our string data to the storage
        pushStr(id, strInput.substr(strInput.indexOf(opt) + 5));
        console.log('VM: Write push to (' + id.substr(0, 6) + '...)' +
                    ' successful!');
        return true;
    } else if (opt === 'key') {
        // Ensure we have a chosen key
        if (!key || !key.length) {
            console.error('VM: Write key failed, missing key!');
            return false;
        }
        const len = key.length + 1;
        setMetaKeyStr(id, key, strInput.substr(strInput.indexOf(key) + len));
        console.log('VM: Write key to (' + id.substr(0, 6) + '...)' +
                    ' successful!');
        return true;
    } else {
        console.error('VM: Write failed, invalid option "' + opt + '"!');
        return false;
    }
}

// Append a string to a metadata contract
function pushStr(id, str) {
    STATE.meta[id].push(str);
}

// Write (or overwrite) a key within a metadata contract
function setMetaKeyStr(id, strKey, strMeta) {
    STATE.meta[id][strKey] = strMeta;
}

// Return the value of a key within a metadata contract
function getMetaKeyStr(id, strKey) {
    return STATE.meta[id][strKey];
}

// Return the full state pointer of a metadata contract
function getMetaStateByIdPtr(id) {
    return STATE.meta[id];
}

// Return the full state pointer of the SCP VM
function getStatePtr() {
    return STATE;
}

// Returns the opcode definitions list
function getOpcodesPtr() {
    return OP;
}

// Returns the opcode in HEX
function getOpcode(code) {
    return OP[code].toString(16);
}

// Returns the opcode by it's value
function getOpcodeByValue(val) {
    for (const [key, value] of Object.entries(OP)) {
        if (value === val) return key;
    }
    return false;
}

// Returns the compiled script of a DApp Identifier Deployment
function createIdentifierScript(opt) {
    return OP.deploy.toString(16) + ' ' + opt;
}

// Returns the compiled script of a storage push
function createWritePushScript(id, data) {
    return OP.write.toString(16) + ' ' + id + ' push ' + data;
}

// Returns the compiled script of a storage key
function createWriteKeyScript(id, key, data) {
    return OP.write.toString(16) + ' ' + id + ' key ' + key + ' ' + data;
}

exports.run = run;
exports.pushStr = pushStr;
exports.setMetaKeyStr = setMetaKeyStr;
exports.getMetaKeyStr = getMetaKeyStr;
exports.getMetaStateByIdPtr = getMetaStateByIdPtr;
exports.getStatePtr = getStatePtr;
exports.getOpcodesPtr = getOpcodesPtr;
exports.getOpcode = getOpcode;
exports.getOpcodeByValue = getOpcodeByValue;
exports.createIdentifierScript = createIdentifierScript;
exports.createWritePushScript = createWritePushScript;
exports.createWriteKeyScript = createWriteKeyScript;

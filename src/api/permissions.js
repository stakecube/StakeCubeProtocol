/*
  # This Source Code Form is subject to the terms of the Mozilla Public
  # License, v. 2.0. If a copy of the MPL was not distributed with this
  # file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

'use strict';

let ptrDB;

// The cached API modules
let arrConfModules = [];

function init(context) {
    ptrDB = context.DB;
    // Load, parse and cache the API modules
    let strConfModules = ptrDB.getConfigValue("apimodules", false, false);
    if (strConfModules && strConfModules.length) {
        // Convert to lowercase, splice into an array using commas as seperators, then trim all input
        arrConfModules = strConfModules.toLowerCase().split(",");
        arrConfModules = arrConfModules.map((a)=> { return a.trim() });
    }
}

// Return if an API module is enabled or disabled in the REST interface, via config cache
function isModuleAllowed(strModule) {
    return arrConfModules.includes(strModule);
}

exports.init = init;
exports.isModuleAllowed = isModuleAllowed;
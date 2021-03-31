//Settings Defaults
var debug = false;
var explorer = 'explorer.dogec.io';
var networkEnabled = true;
//Users need not look below here.
//------------------------------
var publicKeyForNetwork;
var trx;
var amountOfTransactions;
var balance;
var fee;
var privateKeyForTransactions;
var walletAlreadyMade = 0;
var wallet_version = '1.02';
function setExplorer() {
  explorer = document.getElementById("explorer").value
  alert(`${explorer} has been set succesfully`);
}
function toggleDebug() {
  if (debug) {
    debug = false;
    document.getElementById('Debug').innerHTML = "";
  } else {
    debug = true;
    document.getElementById('Debug').innerHTML = "<i class=\"fas fa-bug\" style=\"padding-right: 5px;\"></i>Debug Mode";
  }
  alert(`Debug set to ${debug}`);
}
function toggleNetwork() {
  if (networkEnabled) {
    networkEnabled = false;
    document.getElementById('Network').innerHTML = "";
  } else {
    networkEnabled = true;
    document.getElementById('Network').innerHTML = "<i class=\"fas fa-wifi\" style=\"padding-right: 5px;\"></i>Network Enabled";
  }
  alert(`Network set to ${networkEnabled}`);
}

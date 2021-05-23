var githubRepo = 'https://api.github.com/repos/stakecube/StakeCubeProtocol/releases';
var getBlockCount = function() {
  // Play reload anim
  document.getElementById("balanceRefresh").className += " playAnim";
  var request = new XMLHttpRequest();
  request.open('GET', "https://stakecubecoin.net/web3/blocks", true);
  request.onload = function () {
    let data = Number(this.response);
    // If the block count has changed, refresh all of our data!
    if (data > cachedBlockCount) {
      console.log("New block detected! " + cachedBlockCount + " --> " + data);
      domBlock.innerText = data.toLocaleString('en-GB');
      if (pubkeyMain)
        getUnspentTransactions();
    } else {
      let reloader = document.getElementById("balanceRefresh");
      reloader.className = reloader.className.replace(/ playAnim/g, "");
    }
    cachedBlockCount = data;
  }
  request.send();
}
var getCoinValue = function() {
  var request = new XMLHttpRequest();
  request.open('GET', "https://stakecube.io/api/v2/exchange/spot/arbitrageInfo?ticker=SCC", true);
  request.onload = function () {
    let data = JSON.parse(this.response);
    if (data.success && data.result && data.result[0]) {
      // Pull the price from StakeCube.net
      for (const nMarket of data.result) {
        // BTC only
        if (nMarket.base !== "SCC" || nMarket.target !== "BTC") continue;
        // StakeCube Exchange only
        if (nMarket.market.identifier !== "stake_cube") continue;
        valueUSD = nMarket.converted_last.usd;
      }
    }
  }
  request.send();
}
var getCoinSupply = function() {
  var request = new XMLHttpRequest();
  request.open('GET', "https://stakecubecoin.net/api/supply/total", true);
  request.onload = function () {
    let data = Number(this.response);
    if (isFinite(data)) {
      currentSupply = data;
    }
  }
  request.send();
}
var getUnspentTransactions = function () {
  var request = new XMLHttpRequest()
  request.open('GET', "https://stakecubecoin.net/web3/getutxos?addr=" + pubkeyMain, true)
  request.onload = function () {
    let reloader = document.getElementById("balanceRefresh");
    reloader.className = reloader.className.replace(/ playAnim/g, "");
    data = JSON.parse(this.response)
    if (data.length === 0) {
      console.log('No unspent Transactions');
      cachedUTXOs = [];
      // Update SCP-1 token balances anyway!
      balance = getBalance(true);
    } else {
      cachedUTXOs = [];
      amountOfTransactions = data.length;
      if (amountOfTransactions > 0)
        //document.getElementById("errorNotice").innerHTML = '';
      if (amountOfTransactions <= 1000) {
        for (i = 0; i < amountOfTransactions; i++) {
          cachedUTXOs.push(data[i]);
        }
        // Update the GUI with the newly cached UTXO set
        balance = getBalance(true);
      } else {
        //Temporary message for when there are alot of inputs
        //Probably use change all of this to using websockets will work better
        //document.getElementById("errorNotice").innerHTML = '<div class="alert alert-danger" role="alert"><h4>Note:</h4><h5>This address has over 1000 UTXOs, which may be problematic for the wallet to handle, transact with caution!</h5></div>';
      }
    }
    console.log('Total Balance:' + balance);
  }
  request.send()
}
var getTokensByAccountLight = function (address) {
  var request = new XMLHttpRequest();
    request.open('GET', 'https://stakecubecoin.net/web3/scp/gettokensbyaccount/' + address, true);
    request.onload = function () {
      cachedTokens = JSON.parse(this.response);
    }
    request.send();
}
var getActivityByAccountLight = function (address) {
  var request = new XMLHttpRequest();
    request.open('GET', 'https://stakecubecoin.net/web3/scp/getallactivity/' + address, true);
    request.onload = function () {
      cachedActivity = JSON.parse(this.response).reverse();
    }
    request.send();
}
var getStakingStatusLight = function (contract, address) {
  var request = new XMLHttpRequest();
    request.open('GET', 'https://stakecubecoin.net/web3/scp/getstakingstatus/' + contract + '/' + address, true);
    request.onload = function () {
      guiStakingStatus = JSON.parse(this.response);
    }
    request.send();
}
var sendTransaction = function (hex) {
  if (typeof hex !== 'undefined') {
    var request = new XMLHttpRequest()
    request.open('GET', 'https://stakecubecoin.net/web3/submittx?tx=' + hex, true)
    request.onload = function () {
      data = this.response;
      if (data.length === 64) {
        console.log('Transaction sent! ' + data);
        M.toast({html: 'Transaction Sent!', displayLength: 2000});
        //document.getElementById("transactionFinal").innerHTML = ('<h4 style="color:green">Transaction sent! ' + data + '</h4>');
      } else {
        M.toast({html: 'Error sending transaction!', displayLength: 3000});
        //document.getElementById("transactionFinal").innerHTML = ('<h4 style="color:red">Error sending transaction: ' + data + "</h4>");
      }
    }
    request.send()
  } else {
    console.log("hex undefined");
  }
}
var calculatefee = function (bytes) {
  // TEMPORARY: Hardcoded fee per-byte
  fee = Number(((bytes * 250) / 100000000).toFixed(8)); // 250 sats/byte
  /*var request = new XMLHttpRequest()
  request.open('GET', url + '/api/v1/estimatefee/10', false)
  request.onload = function () {
    data = JSON.parse(this.response)
    console.log(data);
    console.log('current fee rate' + data['result']);
    fee = data['result'];
  }
  request.send()*/
}

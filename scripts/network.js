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
  request.open('GET', "https://stakecubecoin.net/web3/getutxos?addr=" + WALLET.getPubkey(), true)
  request.onload = function () {
    let reloader = document.getElementById("balanceRefresh");
    reloader.className = reloader.className.replace(/ playAnim/g, "");
    data = JSON.parse(this.response);
    // Convert explorer dataset into UTXO classes and merge with the current set
    let arrNewUTXOs = [];
    for (const rawUTXO of data) {
      arrNewUTXOs.push(new WALLET.UTXO(rawUTXO.txid, rawUTXO.outputIndex, rawUTXO.script, rawUTXO.satoshis));
    }
    getMempoolLight(arrNewUTXOs);
  }
  request.send()
}
var getMempoolLight = function (arrUTXOList) {
  var request = new XMLHttpRequest();
    request.open('GET', 'https://stakecubecoin.net/web3/scp/getrawmempool', true);
    request.onload = function () {
      let rawMempool = JSON.parse(this.response);
      // Fetch all mempool UTXOs (vouts) belonging to our pubkey
      for (rawTX of rawMempool) {
        // Search all VOUTs belonging to us, add them to our wallet
        for (rawVout of rawTX.vout) {
          if (rawVout.scriptPubKey && rawVout.scriptPubKey.addresses && rawVout.scriptPubKey.addresses.length > 0) {
            if (rawVout.scriptPubKey.addresses[0] === WALLET.getPubkey()) {
              // Found a mempool vout for our wallet!
              let cUTXO = new WALLET.UTXO(rawTX.txid, rawVout.n, rawVout.scriptPubKey.hex, rawVout.valueSat);
              cUTXO.mempool = true;
              arrUTXOList.push(cUTXO);
            }
          }
        }
      }
      // Merge our newly fetched UTXO set with our known in-wallet set
      WALLET.mergeUTXOs(arrUTXOList);
      // Search for all spent VINs for our wallet, and mark them as spent
      for (rawTX of rawMempool) {
        for (rawVin of rawTX.vin) {
          let spentVout = WALLET.getUTXO(rawVin.txid, rawVin.vout);
          if (spentVout) {
            // Mark this UTXO as spent!
            spentVout.spent = true;
          }
        }
      }
      // Update the GUI with the newly cached UTXO set
      getBalance(true);
      refreshSendBalance();
    }
    request.send();
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
var sendTransaction = function (hex, usedUTXOs = []) {
  if (typeof hex !== 'undefined') {
    var request = new XMLHttpRequest()
    request.open('GET', 'https://stakecubecoin.net/web3/submittx?tx=' + hex, true);
    request.onload = function () {
      data = this.response;
      if (data.length === 64) {
        console.log('Transaction sent! ' + data);
        M.toast({html: 'Transaction Sent!', displayLength: 2000});
        // Mark UTXOs as spent
        for (const cUTXO of usedUTXOs) {
          cUTXO.spent = true;
        }
        // Refresh UTXOs from on-chain and mempool
        getUnspentTransactions();
      } else {
        M.toast({html: 'Error sending transaction!', displayLength: 3000});
      }
    }
    request.send();
  } else {
    console.log("hex undefined");
  }
}
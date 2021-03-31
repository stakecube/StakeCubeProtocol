if (networkEnabled) {
  var url = 'https://' + explorer
  var githubRepo = 'https://api.github.com/repos/dogecash/dogecash-web-wallet/releases';
  var checkPubKey = function () {
    // Create a request variable and assign a new XMLHttpRequest object to it.
    var request = new XMLHttpRequest()
    // Open a new connection, using the GET request on the URL endpoint
    request.open('GET', url + '/api/v1/address/' + publicKeyForNetwork, true)
    request.onload = function () {
      var data = JSON.parse(this.response)
      document.getElementById("balance").innerHTML = data['balance'];
      document.getElementById("totalReceived").innerHTML = data['totalReceived'];
      document.getElementById("totalSent").innerHTML = data['totalSent'];
      var typeNumber = 4;
      var errorCorrectionLevel = 'L';
      var qr = qrcode(typeNumber, errorCorrectionLevel);
      qr.addData('scc:' + data['addrStr']);
      qr.make();
      document.getElementById("addrStrQR").innerHTML = qr.createImgTag();
      document.getElementById("addrStr").innerHTML = data['addrStr'];
      //Transactions
      document.getElementById("TransactionNumber").innerHTML = data['txApperances'];
      if (data['txApperances'] > 0) {
        var dataTransactions = JSON.stringify(data['transactions']).replace("[", "").replace("]", "").replace(/"/g, "");
        const splits = dataTransactions.split(',')
        var transactionLinks;
        for (i = 0; i < splits.length; i++) {
          if (i == 0) {
            transactionLinks = '<a href="' + url + '/api/v1/tx/' + splits[i] + '">' + splits[i] + '</a><br>';
          } else {
            transactionLinks += '<a href="' + url + '/api/v1/tx/' + splits[i] + '">' + splits[i] + '</a><br>';
          }
        }
        document.getElementById("Transactions").innerHTML = transactionLinks;
      }
      document.getElementById("NetworkingJson").innerHTML = this.response;
      console.log(data)
      console.log()
    }
    // Send request
    request.send()
  }
  var getBlockCount = function() {
    var request = new XMLHttpRequest();
    request.open('GET', "https://stakecubecoin.net/web3/blocks", true);
    request.onload = function () {
      let data = Number(this.response);
      // If the block count has changed, refresh all of our data!
      let reloader = document.getElementById("balanceReload");
      reloader.className = reloader.className.replace(/ playAnim/g, "");
      if (data > cachedBlockCount) {
        console.log("New block detected! " + cachedBlockCount + " --> " + data);
        if (publicKeyForNetwork)
          getUnspentTransactions();
      }
      cachedBlockCount = data;
    }
    request.send();
  }
  var getUnspentTransactions = function () {
    var request = new XMLHttpRequest()
    request.open('GET', "https://stakecubecoin.net/web3/getutxos?addr=" + publicKeyForNetwork, true)
    request.onload = function () {
      data = JSON.parse(this.response)
      if (data.length === 0) {
        console.log('No unspent Transactions');
        document.getElementById("errorNotice").innerHTML = '<div class="alert alert-danger" role="alert"><h4>Note:</h4><h5>You don\'t have any funds, get some coins first!</h5></div>';
        cachedUTXOs = [];
      } else {
        cachedUTXOs = [];
        amountOfTransactions = data.length;
        if (amountOfTransactions > 0)
          document.getElementById("errorNotice").innerHTML = '';
        if (amountOfTransactions <= 1000) {
          for (i = 0; i < amountOfTransactions; i++) {
            cachedUTXOs.push(data[i]);
          }
          // Update the GUI with the newly cached UTXO set
          balance = getBalance(true);
          document.getElementById("guiBalance").innerHTML = balance;
        } else {
          //Temporary message for when there are alot of inputs
          //Probably use change all of this to using websockets will work better
          document.getElementById("errorNotice").innerHTML = '<div class="alert alert-danger" role="alert"><h4>Note:</h4><h5>This address has over 1000 UTXOs, which may be problematic for the wallet to handle, transact with caution!</h5></div>';
        }
      }
      console.log('Total Balance:' + balance);
    }
    request.send()
  }
  var sendTransaction = function (hex) {
    if (typeof hex !== 'undefined') {
      var request = new XMLHttpRequest()
      request.open('GET', 'https://stakecubecoin.net/web3/submittx?tx=' + hex, true)
      request.onload = function () {
        data = this.response;
        if (data.length === 64) {
          console.log('Transaction sent! ' + data);
          document.getElementById("transactionFinal").innerHTML = ('<h4 style="color:green">Transaction sent! ' + data + '</h4>');
          document.getElementById("address1s").innerHTML = '';
          document.getElementById("value1s").innerHTML = '';
        } else {
          console.log('Error sending transaction: ' + data);
          document.getElementById("transactionFinal").innerHTML = ('<h4 style="color:red">Error sending transaction: ' + data + "</h4>");
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
  var versionCheck = function () {
    var request = new XMLHttpRequest()
    request.open('GET', githubRepo, true)
    request.onload = function () {
      data = JSON.parse(this.response)
      var currentReleaseVersion = (data[0]['tag_name']).replace("V", "")
      if (parseFloat(currentReleaseVersion) > parseFloat(wallet_version)) {
        console.log("out of date");
        document.getElementById("outdated").style.display = 'block';
      }
    }
    request.send()
  }
  //Call a version check if network is enabled:
  //versionCheck();
}

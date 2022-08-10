const getBlockCount = function() {
    // Play reload anim
    document.getElementById('balanceRefresh').className += ' playAnim';
    const request = new XMLHttpRequest();
    request.open('GET', 'https://stakecubecoin.net/web3/blocks', true);
    request.onload = function() {
        const data = Number(this.response);
        // If the block count has changed, refresh all of our data!
        if (data > cachedBlockCount) {
            domBlock.innerText = data.toLocaleString('en-GB');
        } else {
            const reloader = document.getElementById('balanceRefresh');
            reloader.className = reloader.className.replace(/ playAnim/g, '');
        }
        cachedBlockCount = data;
    };
    request.send();
};

// Flag to see if the SC Price API is down
let fPriceAPI = true;
const getCoinValue = () => {
    NET.getPrice().then(data => {
        if (data.success && data.result && data.result[0]) {
            // Pull the price from StakeCube.net
            for (const nMarket of data.result) {
                // BTC only
                if (nMarket.base !== 'SCC' || nMarket.target !== 'BTC') {
                    continue;
                }
                // StakeCube Exchange only
                if (nMarket.market.identifier !== 'stake_cube') {
                    continue;
                }
                valueUSD = nMarket.converted_last.usd;
                fPriceAPI = true;
            }
        } else {
            fPriceAPI = false;
        }
    }).catch(() => fPriceAPI = false);
};
const getCoinSupply = function() {
    const request = new XMLHttpRequest();
    request.open('GET', 'https://stakecubecoin.net/api/supply/total', true);
    request.onload = function() {
        const data = Number(this.response);
        if (isFinite(data)) {
            currentSupply = data;
        }
    };
    request.send();
};
const getUnspentTransactions = function() {
    const strAddr = WALLET.getActiveWallet().getPubkey();
    if (isFullnodePtr()) {
        getMempoolActivity(strAddr).then(arrRes => cachedActivityIS = arrRes);
    }
    WALLET.refreshUTXOs(strAddr).then(res => {
        const reloader = document.getElementById('balanceRefresh');
        reloader.className = reloader.className.replace(/ playAnim/g, '');
        // Update the GUI with the newly cached UTXO set
        if (!isFullnodePtr()) {
            NET.getMempoolActivityLight(strAddr).then(strRes => {
                cachedActivityIS = JSON.parse(strRes);
                getBalance(true);
                refreshSendBalance();
            });
        } else {
            getBalance(true);
            refreshSendBalance();
        }
    });
};
const getTokensByAccountLight = function(address) {
    const request = new XMLHttpRequest();
    request.open('GET', 'https://stakecubecoin.net/web3/scp/' +
                        'tokens/gettokensbyaccount/' + address, true);
    request.onload = function() {
        cachedTokens = JSON.parse(this.response);
    };
    request.send();
};
const getActivityByAccountLight = function(address) {
    const request = new XMLHttpRequest();
    request.open('GET', 'https://stakecubecoin.net/web3/scp/activity/getallactivity/' +
                        address, true);
    request.onload = function() {
        cachedActivity = JSON.parse(this.response).reverse();
    };
    request.send();
};
let fAskedForFaucet = false;
const getDeltasByAccountLight = function(address) {
    NET.getDeltasLight(address).then(res => {
        cachedCoinDeltas = JSON.parse(res).reverse();
        if (!fAskedForFaucet && !isFullnode && cachedCoinDeltas.length === 0) {
            fAskedForFaucet = true;
            NET.requestFaucet(WALLET.getActiveWallet().getPubkey()).then(res => {
                if (res == 'true') console.log('Faucet: Received some starter SCC, yahoo!');
            });
        }
    });
};
const getStakingStatusLight = function(contract, address) {
    const request = new XMLHttpRequest();
    request.open('GET', 'https://stakecubecoin.net/web3/scp/tokens/getstakingstatus/' +
                         contract + '/' + address, true);
    request.onload = function() {
        cStakingStatus = JSON.parse(this.response);
        // If the staking page is open still: render this data ASAP!
        if (domStakingPage.style.display === "block" && currentStakingToken) {
            refreshStakingStatus(contract, false);
        }
    };
    request.send();
};
const sendTransaction = function(hex, usedUTXOs = [], message = 'Transaction Sent!') {
    const request = new XMLHttpRequest();
    request.open('GET', 'https://stakecubecoin.net/web3/submittx?tx=' + hex,
        true);
    request.onload = function() {
        data = this.response;
        if (data.length === 64) {
            // Reset text inputs
            document.getElementById('sendAmount').value = '';
            document.getElementById('sendAddress').value = '';
            // Notify as a success
            if (message) {
                console.log(message + ' \nTX-ID: ' + data);
                M.toast({
                    'html': message,
                    'displayLength': 1000 + (message.length * 75)
                });
                // Mark UTXOs as spent
                usedUTXOs.forEach(cUTXO => cUTXO.spent = true);
            }
            // Refresh UTXOs from on-chain and mempool
            getUnspentTransactions();
        } else {
            M.toast({
                'html': 'Error sending transaction!',
                'displayLength': 3000
            });
        }
    };
    request.send();
};

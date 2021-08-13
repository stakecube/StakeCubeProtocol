'use strict';

var coinArray = [];
function refreshCoinSelector() {
  coinArray = [];
  $('.vodiapicker option').each(function () {
    var img = $(this).attr("data-thumbnail");
    var text = this.innerText;
    var value = $(this).val();
    var item = '<li onclick="setCoinSelector(\'' + img + '\', \'' + text + '\', \'' + value + '\')" style="cursor: pointer;"><img  src="' + img + '" value="' + value + '"/><span>' + text + '</span></li>';
    coinArray.push(item);
  });
  $('#a').html(coinArray);
}

// Initial refresh
refreshCoinSelector();


//Set the button value to the first el of the array
$('.btn-select').html(coinArray[0]);
$('.btn-select').attr('value', 'scc');

//change button stuff on click
function setCoinSelector(img, text, value) {
  const item = '<li><img src="' + img + '"/><span>' + text + '</span></li>';
  $('.btn-select').html(item);
  $('.btn-select').attr('value', value);
  $(".b").toggle();

  // Update available balance display
  const strPubkey = WALLET.getActiveWallet().getPubkey();
  let nSendBalanceDisplay = 0;
  if (value === "scc") {
    nSendBalanceDisplay = getBalance();
  } else {
    const strToken = value.substr(9); // Extract the token ID from the element, excluding "scptoken-"
    const cToken = isFullnode ? TOKENS.getToken(strToken) : getCachedToken(strToken);
    const cAccount = isFullnode ? cToken.getAccount(strPubkey) : getCachedAccount(cToken);
    nSendBalanceDisplay = cAccount.balance / COIN;
  }
  domSendingBalance.innerText = nSendBalanceDisplay.toLocaleString('en-GB', { maximumFractionDigits: 8 });
}

$(".btn-select").click(function () {
  $(".b").toggle();
});
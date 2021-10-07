'use strict';

function closeAllTabs() {
  domDashboardPage.style.display = "none";
  domReceivePage.style.display = "none";
  domSendPage.style.display = "none ";
  domLoginPage.style.display = "none";
  domAuthPage.style.display = "none";
  domStakingPage.style.display = "none";
  domSettingsPage.style.display = "none";
  domCreateTokenPage.style.display = "none";
  domCreateNftPage.style.display = "none";
  domViewCollection.style.display = "none";
  domCollections.style.display = "none";
  domViewNFT.style.display = "none";
}

function switchToLogin() {
  // Hide
  closeAllTabs();

  // Show
  domLoginPage.style.display = "block";

  // Focus on the password entry
  document.getElementById("pass1").focus();
}

function switchToSend() {
  // Hide
  closeAllTabs();

  // Show
  domSendPage.style.display = "block";
  domHeader.style.display = "block";
  getBalance(true);

  // Remove active
  domDashboardBtn.classList.remove('active');
  domReceiveBtn.classList.remove('active');
  dom2FABtn.classList.remove('active');
  domCreateTokenBtn.classList.remove('active');
  domNFTCollectionsBtn.classList.remove('active');

  // Add active
  domSendBtn.classList.add('active');

  // Refresh token selector and available balance
  refreshCoinSelector();
  refreshSendBalance();

  // Reset inputs
  document.getElementById("sendAmount").value = "";
  document.getElementById("sendAddress").value = "";
}

function switchToDashboard() {
  // Hide
  closeAllTabs();

  // Show
  domDashboardPage.style.display = "block";
  domHeader.style.display = "block";
  getBalance(true);

  // Remove active
  domSendBtn.classList.remove('active');
  domReceiveBtn.classList.remove('active');
  dom2FABtn.classList.remove('active');
  domCreateTokenBtn.classList.remove('active');
  domNFTCollectionsBtn.classList.remove('active');

  // Add active
  domDashboardBtn.classList.add('active');
}

let hasSetupRecvQR = false;
function switchToReceive() {
  // Hide
  closeAllTabs();

  // Show
  domReceivePage.style.display = "block";
  domHeader.style.display = "block";

  // QR setup
  if (!hasSetupRecvQR) {
    hasSetupRecvQR = true;
    let recvQR = qrcode(4, 'L');
    recvQR.addData('scc:' + WALLET.getActiveWallet().getPubkey());
    recvQR.make();
    document.getElementById('receiveQR').setAttribute('src', recvQR.createDataURL());
  }

  // Remove active
  domSendBtn.classList.remove('active');
  domDashboardBtn.classList.remove('active');
  dom2FABtn.classList.remove('active');
  domCreateTokenBtn.classList.remove('active');
  domNFTCollectionsBtn.classList.remove('active');

  // Add active
  domReceiveBtn.classList.add('active');
}

function switchToAuth() {
  // Hide
  closeAllTabs();

  // Show
  domAuthPage.style.display = "block";
  domHeader.style.display = "block";

  // Remove active
  domSendBtn.classList.remove('active');
  domDashboardBtn.classList.remove('active');
  domReceiveBtn.classList.remove('active');
  domCreateTokenBtn.classList.remove('active');
  domNFTCollectionsBtn.classList.remove('active');

  // Add active
  dom2FABtn.classList.add('active');
}

function switchToStaking(contract) {
  // Hide
  closeAllTabs();

  // Show
  domStakingPage.style.display = "block";
  domHeader.style.display = "block";

  currentStakingToken = contract;
}


function switchToSettings() {
  // Hide
  closeAllTabs();

  // Show
  domHeader.style.display = "block";
  domSettingsPage.style.display = "block";

  // Remove active
  domSendBtn.classList.remove('active');
  domDashboardBtn.classList.remove('active');
  domReceiveBtn.classList.remove('active');
  domCreateTokenBtn.classList.remove('active');
}

function switchToCreateToken(strToken = false) {
  // Hide
  closeAllTabs();

  // Show
  domHeader.style.display = "block";
  domCreateTokenPage.style.display = "block";

  // Pre-select a token, if one is given
  if (strToken !== false) {
    const domSelector = document.getElementById('scpDeploySelector');
    domSelector.value = strToken;
    // Emulate a manual input change
    changeTokenType(domSelector);
  }

  // Remove active
  domSendBtn.classList.remove('active');
  domDashboardBtn.classList.remove('active');
  domReceiveBtn.classList.remove('active');
  dom2FABtn.classList.remove('active');
  domNFTCollectionsBtn.classList.remove('active');

  // Add active
  domCreateTokenBtn.classList.add('active');
}

function switchToViewCollection() {
  // Hide
  closeAllTabs();

  // Remove active
  domSendBtn.classList.remove('active');
  domDashboardBtn.classList.remove('active');
  domReceiveBtn.classList.remove('active');
  dom2FABtn.classList.remove('active');
  domCreateTokenBtn.classList.remove('active');

  // Add active
  domNFTCollectionsBtn.classList.add('active');

  // Show
  domHeader.style.display = "block";
  domViewCollection.style.display = "block";
  getBalance(true);
  renderNFTs();
}


function switchToCollections() {
  // Hide
  closeAllTabs();

  // Show
  domHeader.style.display = "block";
  domCollections.style.display = "block";

  // Remove active
  domSendBtn.classList.remove('active');
  domDashboardBtn.classList.remove('active');
  domReceiveBtn.classList.remove('active');
  dom2FABtn.classList.remove('active');
  domCreateTokenBtn.classList.remove('active');

  // Add active
  domNFTCollectionsBtn.classList.add('active');
  getBalance(true);
}


function switchToViewNFT(strID) {
  // Hide
  closeAllTabs();

  // Show
  domHeader.style.display = "block";
  domViewNFT.style.display = "block";

  // Render
  renderDetailedNFT(strID);
}
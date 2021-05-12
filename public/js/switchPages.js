function switchToLogin() {
  // Hide
  domHeader.style.display = "none";
  domDashboardPage.style.display = "none";
  domReceivePage.style.display = "none";
  domSendPage.style.display = "none";
  domAuthPage.style.display = "none";
  domStakingPage.style.display = "none";

  // Show
  domLoginPage.style.display = "block";
}

function switchToSend() {
  // Hide
  domDashboardPage.style.display = "none";
  domReceivePage.style.display = "none";
  domLoginPage.style.display = "none";
  domAuthPage.style.display = "none";
  domStakingPage.style.display = "none";

  // Show
  domSendPage.style.display = "block";
  domHeader.style.display = "block";

  // Remove active
  domDashboardBtn.classList.remove('active');
  domReceiveBtn.classList.remove('active');
  dom2FABtn.classList.remove('active');

  // Add active
  domSendBtn.classList.add('active');

  // Refresh token selector
  refreshCoinSelector();
}

function switchToDashboard() {
  // Hide
  domSendPage.style.display = "none";
  domReceivePage.style.display = "none";
  domLoginPage.style.display = "none";
  domAuthPage.style.display = "none";
  domStakingPage.style.display = "none";

  // Show
  domDashboardPage.style.display = "block";
  domHeader.style.display = "block";

  // Remove active
  domSendBtn.classList.remove('active');
  domReceiveBtn.classList.remove('active');
  dom2FABtn.classList.remove('active');

  // Add active
  domDashboardBtn.classList.add('active');

}

function switchToReceive() {
  // Hide
  domSendPage.style.display = "none";
  domDashboardPage.style.display = "none";
  domLoginPage.style.display = "none";
  domAuthPage.style.display = "none";
  domStakingPage.style.display = "none";
  getBalance(true);

  // Show
  domReceivePage.style.display = "block";
  domHeader.style.display = "block";

  // Remove active
  domSendBtn.classList.remove('active');
  domDashboardBtn.classList.remove('active');
  dom2FABtn.classList.remove('active');

  // Add active
  domReceiveBtn.classList.add('active');
}

function switchToAuth() {
  // Hide
  domSendPage.style.display = "none";
  domDashboardPage.style.display = "none";
  domLoginPage.style.display = "none";
  domReceivePage.style.display = "none";
  domStakingPage.style.display = "none";

  // Show
  domAuthPage.style.display = "block";
  domHeader.style.display = "block";

  // Remove active
  domSendBtn.classList.remove('active');
  domDashboardBtn.classList.remove('active');
  domReceiveBtn.classList.remove('active');

  // Add active
  dom2FABtn.classList.add('active');
}

function switchToStaking(contract) {
  // Hide
  domSendPage.style.display = "none";
  domDashboardPage.style.display = "none";
  domLoginPage.style.display = "none";
  domReceivePage.style.display = "none";

  // Show
  domStakingPage.style.display = "block";
  domHeader.style.display = "block";

  currentStakingToken = contract;
  let cToken = isFullnode ? TOKENS.getToken(currentStakingToken) : getCachedToken(currentStakingToken);
  let cAccount = isFullnode ? cToken.getAccount(pubkeyMain) : getCachedAccount(cToken, pubkeyMain);
  domStakingRedeem.setAttribute('onclick', 'claimStakingRewards("' + cToken.contract + '")');
  if (cAccount.unclaimed_balance > 0) {
    domStakingRedeem.classList.remove('disabled');
    domStakingRedeem.innerText = 'Claim Rewards';
  }
}
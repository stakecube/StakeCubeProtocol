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

  let cToken = TOKENS.getToken(contract);
  let cAccount = cToken.getAccount(pubkeyMain);
  let cStatus = cToken.getStakingStatus(pubkeyMain);
  // put token + account info on the Staking Page on this refresh!
  domStakingTitle.innerText = cToken.name + " " + cToken.ticker;
  if (cStatus.enabled)
    domStakingSubtitle.innerHTML = "You've been staking for " + cStatus.age.toLocaleString('en-GB') + " blocks and earned...";
  else
    domStakingSubtitle.innerHTML = "You've transacted tokens recently, so you must wait another " + (cToken.minAge - cStatus.age).toLocaleString('en-GB') + " blocks before you can start receiving stakes again!";
  
  domStakingRewards.innerHTML = (cAccount.unclaimed_balance / COIN).toLocaleString('en-GB') + " " + cToken.ticker;
  domStakingRedeem.setAttribute('onclick', 'claimStakingRewards("' + cToken.contract + '")');
  if (cAccount.unclaimed_balance > 0) {
    domStakingRedeem.classList.remove('disabled');
    domStakingRedeem.innerText = 'Claim Rewards';
  }
}
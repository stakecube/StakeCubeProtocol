function switchToLogin() {
  // Hide
  domHeader.style.display = "none";
  domDashboardPage.style.display = "none";
  domReceivePage.style.display = "none";
  domSendPage.style.display = "none";
  domAuthPage.style.display = "none";

  // Show
  domLoginPage.style.display = "block";
}

function switchToSend() {
  // Hide
  domDashboardPage.style.display = "none";
  domReceivePage.style.display = "none";
  domLoginPage.style.display = "none";
  domAuthPage.style.display = "none";

  // Show
  domSendPage.style.display = "block";
  domHeader.style.display = "block";
}

function switchToDashboard() {
  // Hide
  domSendPage.style.display = "none";
  domReceivePage.style.display = "none";
  domLoginPage.style.display = "none";
  domAuthPage.style.display = "none";

  // Show
  domDashboardPage.style.display = "block";
  domHeader.style.display = "block";
}

function switchToReceive() {
  // Hide
  domSendPage.style.display = "none";
  domDashboardPage.style.display = "none";
  domLoginPage.style.display = "none";
  domAuthPage.style.display = "none";
  getBalance(true);

  // Show
  domReceivePage.style.display = "block";
  domHeader.style.display = "block";
}

function switchToAuth() {
  // Hide
  domSendPage.style.display = "none";
  domDashboardPage.style.display = "none";
  domLoginPage.style.display = "none";
  domReceivePage.style.display = "none";

  // Show
  domAuthPage.style.display = "block";
  domHeader.style.display = "block";
}
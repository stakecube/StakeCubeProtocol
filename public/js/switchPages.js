function switchToSend() {
  // Hide
  document.getElementById('dashboardPage').style.display = "none";
  document.getElementById('receivePage').style.display = "none";

  // Show
  document.getElementById('sendPage').style.display = "block";
}

function switchToDashboard() {
  // Hide
  document.getElementById('sendPage').style.display = "none";
  document.getElementById('receivePage').style.display = "none";

  // Show
  document.getElementById('dashboardPage').style.display = "block";
}

function switchToReceive() {
  // Hide
  document.getElementById('sendPage').style.display = "none";
  document.getElementById('dashboardPage').style.display = "none";

  // Show
  document.getElementById('receivePage').style.display = "block";
}
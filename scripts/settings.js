// Settings Defaults
var debug = false;

// TODO: The below variables need some serious cleanup!
//------------------------------
var trx;
var amountOfTransactions;
var balance;
var fee;
var walletAlreadyMade = 0;

/* Theme and UI settings */
var domTheme;
var domThemeButton;
var cssThemes = ["light", "dark"];

// Load the next CSS theme sheet from disk
function loadNextTheme() {
  // Update theme
  let curIndex = Number(domTheme.getAttribute("themeIndex"));
  let nextIndex = cssThemes[curIndex + 1] ? curIndex + 1 : 0;
  domTheme.href = "style/latest-style-" + cssThemes[nextIndex] + ".css";
  domTheme.setAttribute("themeIndex", nextIndex);
  // Update theme button
  if (domThemeButton.classList.contains("fa-sun")) {
    domThemeButton.classList.remove("fa-sun");
    domThemeButton.classList.add("fa-moon");
  } else {
    domThemeButton.classList.remove("fa-moon");
    domThemeButton.classList.add("fa-sun");
  }
}
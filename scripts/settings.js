// Settings Defaults
var debug = false;

// TODO: The below variables need some serious cleanup!
//------------------------------
var trx;

/* Theme and UI settings */
var domTheme;
var domThemeButton;
var cssThemes = ["light", "dark"];

// Loads the current theme from disk
function loadTheme() {
  let nThemeIndex = localStorage.getItem('themeIndex');
  if (nThemeIndex !== null && Number.isSafeInteger(Number(nThemeIndex))) {
    domTheme.href = "style/latest-style-" + cssThemes[nThemeIndex] + ".css";
    domTheme.setAttribute("themeIndex", nThemeIndex);
  } else {
    nThemeIndex = 0;
    console.log("No themes on disk, loading default! (" + cssThemes[0] + ")");
  }
  // Update theme button
  if (cssThemes[nThemeIndex].startsWith("dark")) {
    domThemeButton.classList.remove("fa-sun");
    domThemeButton.classList.add("fa-moon");
  } else {
    domThemeButton.classList.remove("fa-moon");
    domThemeButton.classList.add("fa-sun");
  }
}

// Load the next CSS theme sheet from disk
function loadNextTheme() {
  // Update theme
  let curIndex = Number(domTheme.getAttribute("themeIndex"));
  let nextIndex = cssThemes[curIndex + 1] ? curIndex + 1 : 0;
  domTheme.href = "style/latest-style-" + cssThemes[nextIndex] + ".css";
  domTheme.setAttribute("themeIndex", nextIndex);
  localStorage.setItem('themeIndex', nextIndex);
  // Update theme button
  if (cssThemes[nextIndex].startsWith("dark")) {
    domThemeButton.classList.remove("fa-sun");
    domThemeButton.classList.add("fa-moon");
  } else {
    domThemeButton.classList.remove("fa-moon");
    domThemeButton.classList.add("fa-sun");
  }
}
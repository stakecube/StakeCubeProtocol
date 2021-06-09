// Settings Defaults
var debug = false;         // Debugging for transactions, networking, etc.
var allowEnterKey = true;  // Allow the 'Enter' key to continue actions on dialogs & forms.
var display2FAMenu = true; // Displays the 2FA button in the header menu.

// Toggles a setting via a UI checkbox
function toggleSetting(evt) {
  if (!evt) return;
  let checked = evt.checked;
  let strSetting = evt.getAttribute('setting');
  // We know the toggle status & the setting, now let's apply it!
  if (strSetting === "allowEnterKey")  allowEnterKey = checked;
  if (strSetting === "display2FAMenu") {
    dom2FAMenu.style.display = checked ? "" : "none";
    display2FAMenu = checked;
  }
  // Now save to disk and log!
  localStorage.setItem(strSetting, checked);
  console.log("Settings: Set '" + strSetting + "' to " + checked);
}

// Loads all settings from disk
function loadSettings() {
  if (localStorage.length === 0) return;
  for (const dbKey of Object.keys(localStorage)) {
    let dbValue = localStorage[dbKey];
    let boolVal = dbValue === "true" ? true : false;
    if (dbKey === "allowEnterKey") {
      allowEnterKey = boolVal;
      document.getElementById(dbKey + "Setting").checked = boolVal;
    }
    if (dbKey === "display2FAMenu") {
      display2FAMenu = boolVal;
      document.getElementById(dbKey + "Setting").checked = boolVal;
    }
  }
}

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
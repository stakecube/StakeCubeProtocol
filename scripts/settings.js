// Settings Defaults
let allowEnterKey = true;   // Allow the 'Enter' key to continue actions on dialogs & forms.
let display2FAMenu = true;  // Displays the 2FA button in the header menu.
let minToTray = true;       // Allows the GUI to minimise to the Tray instead of the Taskbar.
let limitActivity = true;   // Limit the activity list to increase performance on large wallets.
let hideZeroBalance = true; // Hide wallets from view when they have no balance.
let displayDevMenu = false; // Displays the SCP Developer button in the header menu.

// Toggles a setting via a UI checkbox
function toggleSetting(evt) {
    if (!evt) return;
    const checked = evt.checked;
    const strSetting = evt.getAttribute('setting');
    // We know the toggle status & the setting, now let's apply it!
    if (strSetting === 'allowEnterKey') allowEnterKey = checked;
    if (strSetting === 'display2FAMenu') {
        dom2FAMenu.style.display = checked ? '' : 'none';
        display2FAMenu = checked;
    }
    if (strSetting === 'minToTray') {
        minToTray = checked;
        cElectron.ipcRenderer.send('changeMinToTray', checked);
    }
    if (strSetting === 'limitActivity') {
        limitActivity = checked;
        renderActivity();
    }
    if (strSetting === 'hideZeroBalance') hideZeroBalance = checked;
    if (strSetting === 'displayDevMenu') {
        domCreateTokenBtn.style.display = checked ? '' : 'none';
        displayDevMenu = checked;
    }
    // Now save to disk and log!
    localStorage.setItem(strSetting, checked);
    console.log("Settings: Set '" + strSetting + "' to " + checked);
}

// Loads all settings from disk
function loadSettings() {
    if (localStorage.length === 0) return;

    // TODO: Fix the 'checked' status being 'fixed' to true, ignoring the HTML 'checked=false' attribute.
    // ... I really don't know why it does this! Annoying.
    document.getElementById('displayDevMenuSetting').checked = false;

    for (const dbKey of Object.keys(localStorage)) {
        const dbValue = localStorage[dbKey];
        const boolVal = dbValue === 'true';
        if (dbKey === 'allowEnterKey') {
            allowEnterKey = boolVal;
        }
        if (dbKey === 'display2FAMenu') {
            display2FAMenu = boolVal;
        }
        if (dbKey === 'minToTray') {
            minToTray = boolVal;
        }
        if (dbKey === 'limitActivity') {
            limitActivity = boolVal;
        }
        if (dbKey === 'hideZeroBalance') {
            hideZeroBalance = boolVal;
        }
        if (dbKey === 'displayDevMenu') {
            displayDevMenu = boolVal;
        }
        // Set the UI element
        const domSwitch = document.getElementById(dbKey + 'Setting');
        if (domSwitch)
            domSwitch.checked = boolVal;
    }
}

/* Theme and UI settings */
let domTheme;
let domThemeButton;
const cssThemes = ['light', 'dark'];

// Loads the current theme from disk
function loadTheme() {
    let nThemeIndex = localStorage.getItem('themeIndex');
    if (nThemeIndex !== null && Number.isSafeInteger(Number(nThemeIndex))) {
        domTheme.href = 'style/latest-style-' + cssThemes[nThemeIndex] + '.css';
        domTheme.setAttribute('themeIndex', nThemeIndex);
    } else {
        nThemeIndex = 0;
        console.log('No themes on disk, loading default: ' + cssThemes[0]);
    }
    // Update theme button
    if (cssThemes[nThemeIndex].startsWith('dark')) {
        domThemeButton.classList.remove('fa-sun');
        domThemeButton.classList.add('fa-moon');
    } else {
        domThemeButton.classList.remove('fa-moon');
        domThemeButton.classList.add('fa-sun');
    }
}

// Load the next CSS theme sheet from disk
function loadNextTheme() {
    // Update theme
    const curIndex = Number(domTheme.getAttribute('themeIndex'));
    const nextIndex = cssThemes[curIndex + 1] ? curIndex + 1 : 0;
    domTheme.href = 'style/latest-style-' + cssThemes[nextIndex] + '.css';
    domTheme.setAttribute('themeIndex', nextIndex);
    localStorage.setItem('themeIndex', nextIndex);
    // Update theme button
    if (cssThemes[nextIndex].startsWith('dark')) {
        domThemeButton.classList.remove('fa-sun');
        domThemeButton.classList.add('fa-moon');
    } else {
        domThemeButton.classList.remove('fa-moon');
        domThemeButton.classList.add('fa-sun');
    }
}

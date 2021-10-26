'use strict';
const { app, BrowserWindow } = require('electron');
try {
    require('electron-reloader')(module);
} catch(_) {}

if (handleSquirrelEvent()) {
    // squirrel event handled and app will exit in 1000ms, so don't do anything else
    return;
}

function handleSquirrelEvent() {
    if (process.argv.length === 1) {
        return false;
    }

    const ChildProcess = require('child_process');
    const path = require('path');

    const appFolder = path.resolve(process.execPath, '..');
    const rootAtomFolder = path.resolve(appFolder, '..');
    const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
    const exeName = path.basename(process.execPath);

    const spawn = function(command, args) {
        let spawnedProcess, error;

        try {
            spawnedProcess = ChildProcess.spawn(command, args, { 'detached': true });
        } catch(error) {}

        return spawnedProcess;
    };

    const spawnUpdate = function(args) {
        return spawn(updateDotExe, args);
    };

    const squirrelEvent = process.argv[1];
    switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
        // Optionally do things such as:
        // - Add your .exe to the PATH
        // - Write to the registry for things like file associations and
        //   explorer context menus

        // Install desktop and start menu shortcuts
        spawnUpdate(['--createShortcut', exeName]);

        setTimeout(app.quit, 1000);
        return true;

    case '--squirrel-uninstall':
        // Undo anything you did in the --squirrel-install and
        // --squirrel-updated handlers

        // Remove desktop and start menu shortcuts
        spawnUpdate(['--removeShortcut', exeName]);

        setTimeout(app.quit, 1000);
        return true;

    case '--squirrel-obsolete':
        // This is called on the outgoing version of your app before
        // we update to the new version - it's the opposite of
        // --squirrel-updated

        app.quit();
        return true;
    }
}

const DB = require('./src/database/index.js');
const { platform } = require('os');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        'width': 1024,
        'height': 679,
        'minWidth': 480,
        'minHeight': 540,
        'webPreferences': {
            'nodeIntegration': true
        },
        // MacOS: png, others: ico
        'icon': 'public/imgs/scp.' + (platform() === 'darwin' ? 'png' : 'ico'),
        'backgroundColor': '#202225'
    });

    // disable default menu
    // mainWindow.setMenu(null)

    // If the user has a wallet, load the index app, otherwise load the 'setup/begin' app
    DB.init().then(() => {
        DB.getWallet().then(hasWallet => {
            if (hasWallet === null || !hasWallet) {
                mainWindow.loadFile('public/begin.html');
            } else {
                mainWindow.loadFile('public/index.html');
            }
        });
    });

    mainWindow.on('closed', function() {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function() {
    if (mainWindow === null) createWindow();
});

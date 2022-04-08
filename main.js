'use strict';
const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } = require('electron');
const path = require('path');

try {
    require('electron-reloader')(module);
} catch(_) {}

function handleSquirrelEvent() {
    if (process.argv.length === 1) return false;

    const ChildProcess = require('child_process');
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

if (handleSquirrelEvent()) {
    // squirrel event handled and app will exit in 1000ms, so don't do anything else
    return;
}

if (process.defaultApp) {
    if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('scp-wallet', process.execPath, [path.resolve(process.argv[1])]);
    }
} else {
    app.setAsDefaultProtocolClient('scp-wallet');
}

const fLockSuccess = app.requestSingleInstanceLock();

if (fLockSuccess) {
    const DB = require('./src/database/index.js');
    const { platform } = require('os');

    app.allowRendererProcessReuse = true;

    let mainWindow;
    let tray;
    let fMinToTray = true;
    function createWindow() {
        mainWindow = new BrowserWindow({
            'width': 1024,
            'height': 679,
            'minWidth': 480,
            'minHeight': 540,
            'webPreferences': {
                'nodeIntegration': true,
            },
            // Windows: ico, others: png
            'icon': path.join(__dirname, 'public', 'imgs', 'scp.' +
                             (platform() === 'win32' ? 'ico' : 'png')),
            'backgroundColor': '#202225'
        });

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
        
        // Setup native menus (tray, context menu, etc)
        Menu.setApplicationMenu(null);

        const icon = nativeImage.createFromPath(path.join(__dirname, 'public', 'imgs', 'scp.png'));
        tray = new Tray(icon);

        const trayMenu = Menu.buildFromTemplate([
            { label: 'SCP Wallet', type: 'normal', icon, enabled: false },
            { type: 'separator' },
            { label: 'Open', click: () => mainWindow.show() },
            { label: 'Minimise', role: 'minimize', type: 'normal' },
            { type: 'separator' },
            { label: 'Dev Tools', role: 'toggleDevTools', type: 'normal' },
            { type: 'separator' },
            { label: 'Quit', role: 'quit', type: 'normal' }
        ]);
        tray.setContextMenu(trayMenu);

        mainWindow.on('closed', () => {
            mainWindow = null;
        });

        mainWindow.on('minimize', () => {
            if (tray && fMinToTray) mainWindow.hide();
        });

        ipcMain.on('changeMinToTray', (evt, msg) => {
            fMinToTray = msg;
        });
    }

    app.on('ready', createWindow);

    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // A second intence was ran: let's check if there's any params to read.
        if (commandLine.length === 1) return;
        if (mainWindow) {
            if (mainWindow.isMinimized())
                mainWindow.restore();
            mainWindow.focus();
            mainWindow.webContents.send('cmd', commandLine[1].replace('scp-wallet://', ''));
        }
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
    });

    app.on('activate', () => {
        if (mainWindow === null) createWindow();
    });
} else {
    // Second Instance (we'll just nuke it, for now)
    if (process.platform !== 'darwin') app.quit();
}
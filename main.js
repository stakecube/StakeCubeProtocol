'use strict';
const {app, BrowserWindow} = require('electron')
const path = require('path')
try {
  require('electron-reloader')(module)
} catch (_) {}

let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1880, // Replace this value with 1024 when going into production!
    height: 679,
    minWidth: 960,
    minHeight: 540,
    webPreferences: {
      nodeIntegration: true
    },
    backgroundColor: "#f4f6f8"
  })

  // Remove this when going into production!
  mainWindow.openDevTools()

  mainWindow.loadFile('public/begin.html')
  
  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  if (mainWindow === null) createWindow()
})
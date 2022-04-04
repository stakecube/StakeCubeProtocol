// Interactive Forge Configuration

// A flag to use a flat name (e.g: no spaces, caps or symbols) on packagers that require such, like DEB and RPM.
// ... for simplicity, we'll assume anything that is not Windows or MacOS, is Linux.
const fUseFlatName = process.platform !== 'win32' &&
                     process.platform !== 'darwin';

console.log('\nGenerated Forge Config: (Flat Name: ' + fUseFlatName + ')');

module.exports = {
  // Packager Config
  "packagerConfig": {
    // Package name
    "name": fUseFlatName ? "stakecubeprotocol" : "SCP Wallet",
    // User-Facing name
    "productName": "SCP Wallet",
    // Icon Set
    "icon": "./public/imgs/scp",
    // File & Directories unnecessary in production
    "ignore": [
      "docs",
      ".github",
      ".gitignore",
      "linter.js",
      ".eslintrc.js"
    ]
  },
  // Forge Makers
  "makers": [
    {
      // Squirrel.Windows is a no-prompt, no-hassle, no-admin method of installing
      // Windows applications and is therefore the most user friendly you can get.
      "name": "@electron-forge/maker-squirrel",
      "config": {
        "setupExe": "SCP Installer.exe",
        "loadingGif": "public/imgs/spinner.gif",
        "iconUrl": "https://raw.githubusercontent.com/stakecube/StakeCubeProtocol/main/public/imgs/scp.ico",
        "setupIcon": "public/imgs/scp.ico"
      }
    },
    {
      // The Zip target builds basic .zip files containing your packaged application.
      // There are no platform specific dependencies for using this maker and it will run on any platform.
      "name": "@electron-forge/maker-zip",
      "platforms": [
        "darwin"
      ]
    },
    {
      // The deb target builds .deb packages, which are the standard package format for Debian-based
      // Linux distributions such as Ubuntu or Pop!_OS.
      "name": "@electron-forge/maker-deb",
      "config": {
        "name": "scp-wallet",
        "icon": "./public/imgs/scp.png",
        "categories": [
          "Office",
          "Finance"
        ],
        "genericName": "Cryptocurrency Wallet",
        "priority": "optional"
      }
    },
    {
      // The RPM target builds .rpm files, which is the standard package format for
      // RedHat-based Linux distributions such as Fedora.
      "name": "@electron-forge/maker-rpm",
      "config": {
        "name": "scp-wallet"
      }
    }
  ]
};
# Release Notes v1.1.3 - Genesis

SCP Wallet v1.1.3 - Genesis is now available from: https://github.com/stakecube/StakeCubeProtocol/releases/tag/v1.1.3

Please report bugs using the issue tracker at Github: https://github.com/stakecube/StakeCubeProtocol/issues

## Notable Changes

This original version of SCP Wallet will start with these features:
- A sleek, fast, non-overwhelming interface with Light & Dark themes.
- An SCC & SCP Tokens lightwallet with instant synchronisation.
- Full AES-GCM local wallet encryption, a portable vault in your PC.
- The ability to earn Stakes for eligible tokens in one click.
- An automatic staking APR & ROI calculator.
- In-house 2FA app to secure your StakeCube.net account in-wallet.

## Changelog

- `db76788` Initial commit  
- `a6036f6` State Processor + GUI framework  
- `56a8bf2` Implement token creation + CSP structure  
- `9144ef2` Refactor: modularize SCP-1 logic + classes  
- `00870b3` [SCP-1] Add ability for issuers to mint tokens  
- `cc18ca3` [SCP-1] Add ability for accounts to burn  
- `f2d3a54` [SCP-1] Add ability to transfer tokens  
- `5e45e85` [CSP] Sync the state continuously + add headless mode.  
- `0bb058d` [UI] Integrate webwallet as frontend  
- `0fcecd8` [CSP] Improve initial scan efficiency  
- `fa93398` [Temp][UI] Prep for SCP-1 UI integration  
- `5e6712f` New Webwallet GUI (non-functional)  
- `f5c43d0` [UI] Refactor startup screen  
- `5d3a4b4` [Wallet] Add initial Wallet code + SCP initialization  
- `a5b5d7c` [UI] [Wallet] Add (en/de)cryption, login screen & new address generation  
- `450f275` [UI] [Wallet] Add UTXO cache & balance display  
- `e4e9a38` [UI] Add 2FA implementation  
- `42df760` [UI] Add USD price, balance & marketcap displays  
- `5ac56fe` [Misc] Minor improvements & groundwork  
- `3f6b94c` [UI] [Wallet] Add SCC TXs, SCP-1 token list & UI polish  
- `4c676f4` [UI] [Wallet] Complete SCP-1 implementation  
- `7af7229` [CSP] Optimize SCP syncing process  
- `2849ef9` [Builds] Integrate Electron Forge for binary compiles  
- `dae9721` [UI] Add SCP syncing status  
- `754aa54` [UI] UX improvements  
- `ccbbfdf` [UI] Add copy button for receive address  
- `3f1f7b9` [UI] Add auto-fill button to sending page  
- `d70fd78` [UI] Show warning status if SCP isn't initialized  
- `9382999` [UI] Add copy button for 2FA  
- `6e0b8ab` [UI] Autofocus login input & update app title  
- `fdfafaf` [UI] Fix SCP initialization status  
- `1375efa` [UI] Add remove 2FA button  
- `da91a4b` [UI] Add titles to nav buttons  
- `1f07bce` [SCP] Minor initialization refactor  
- `d4a6a81` [UI] Mass UX improvements  
- `91d0aef` [UI] Fix sync status edge-cases  
- `c6c1282` [SCP] Fix transfers and patch addrCaller auth  
- `999bcfc` [Build] Implement Squirrel and bump version  
- `d72f3c7` [SCP] Implement SCP-2, the Staking Token (1/2)  
- `2d980b5` [SCP] Implement full SCP-2 Staking logic (2/2)  
- `8278192` [SCP] [UI] Finish SCP-2 & Add Staking GUI  
- `c9f15b4` [UI] Add staking APY & ROI displays  
- `884f194` [UI] [API] Add Activity list, SCP APIs & more  
- `aa1a7b6` [API] Add GetAllActivity endpoint  
- `27d93a3` [API] Add GetStakingStatus  
- `eda6855` [API] Add PoS weight to GetStakingStatus  
- `aa77d7c` [UI] [API] Integrate full Lightwallet  
- `a332ab1` [SCP] Add credits to the activity history  
- `62b1868` [API] Add GetBlockActivity endpoint  
- `185e230` [SCP] Add missing auth checks  
- `3689c04` [SCP-2] Only allow first-time issuer mints  
- `e1aa4d4` [UI] Display TX-type in activity entries  
- `0fc03eb` [UI] Activity colourcoding fix  
- `fad4034` [UI] Add last block Dashboard Overview  
- `3b17a06` [Build] Bump version (v1.0.4)  
- `1d042c3` [UI] [DB] Expose and display NPM version  
- `748adf1` [UI] Remove console by default  
- `86c4c64` [UI] Open Dashboard on logo clicks  
- `cf4ea99` [UI] Add password show/hide button  
- `9390c33` [Security] Wipe pass input post-login  
- `086a8ba` [API] Add TX-ID to Activity entries  
- `e7913f4` [UI] Add receive addr. QR  
- `f365b90` [SCP] Optimize PoS and Supply calculations  
- `6b0ea14` [SCP] Isolate state processing  
- `8a61e56` [SCP] Fix ordering of SEND checks  
- `0381fc4` [UI] Revamp Lightwallet + Staking  
- `539103a` [Trivial] Remove trivial testing logs  
- `dc11caf` [UI] Hide stakes if at max supply  
- `c4007b7` [SCP] Fix phantom-staking logic  
- `f039707` [SCP] Even more optimized supply calcs  
- `1c49061` [UI] Add materialize notifications & toasts  
- `557d7a2` [Build] Bump version (v1.0.6)  
- `96c8d5e` [SCP] Fix auto-claim overminting  
- `43c932e` [Trivial] Couple typo fixes  
- `c2911f1` [Cleanup] [UI] Code cleanup prep. for Themes  
- `49069ec` [UI] Add theme switcher  
- `afee10d` [SCP] Add deployment + mint commands  
- `238dbf6` [Cleanup] Remove unused libraries  
- `6100d3e` [UI] Fully implement themes + dark mode  
- `bf87860` [Build] Bump version (v1.0.7)  
- `b615d1a` [SCP] Fix deployment authentication  
- `265e768` [UI] Fix crash on first theme loads  
- `d1e0043` [UI] Enable scrolling + load all activity  
- `c49213b` [UI] Token balances in secondary colour  
- `b7b62d9` [UI] Add Import wallet ability  
- `e391341` [UI] Update available balance on send page  
- `380bad2` [Build] Bump + Upload new icons  
- `0dac54b` [Build] [UI] Installer, Icons & UX improvements  
- `c3183ec` [UI] Reset Send inputs on page switch  
- `1991d3a` [Stability] Further enable Strict Mode  
- `87cf0f5` [UI] Remove unnecessary logs  
- `ba1f2f1` [UI] Reduce default fee rate  
- `3d32906` [UI] Increase SCC balance size  
- `ce8fe9e` [API] Add GetRawMempool  
- `0c48fc9` [Wallet] Add wallet manager + Mempool integration  
- `2363af5` [Wallet] Sync spend states on-chain+mempool  
- `3fc3f36` [UI] Add SCP Burn command  
- `e2b1f3d` [Build] Bump version (v1.0.9)  
- `82d34a4` [SCP] Implement SCP Deployment fee  
- `b81a78d` [UI] Improve truncation, precision & frame size  
- `8f0e320` [SCP] Fix change address detection  
- `ec07305` [DB] Prepare new Appdata DB system  
- `191bf7e` [Trivial] Remove unnecessary dependency  
- `10b1f99` [Wallet] Refactor key-storage  
- `50abc6f` [Wallet] Balance, Fee & Settings refactor  
- `ef12189` [DB] [Wallet] Complete DB migration  
- `fbbc7dd` [UI] [Wallet] Fetch & Display pending TXs  
- `20b8b26` [Wallet] Add efficient Coin Control algo  
- `9678b6e` [Wallet] Use CC module for Token Sends  
- `10eb99c` [UI] Major efficiency + deps revamp  
- `40b16f2` [Wallet] Fix minor Coin Control bugs  
- `9afd2be` [UI] Add CCore URL to all Activity entries  
- `0d7dd05` [UI] [Build] Remove lodash, improve login, bump version (v1.1.0)  
- `b2cf39a` [Build] Remove lodash import  
- `7cd8f7e` [Wallet] Save DB after Derivations + Imports  
- `3a23814` [Build] Version bump (v1.1.1)  
- `4484be0` [UI] Dashboard improvements  
- `cab0d94` [UI] Fix SCP version aligning  
- `439554e` [Build] Version bump (v1.1.2)  
- `879a391` [SCP] Reset SCP for Mainnet  
- `a9cdf94` [Wallet] Remove min-UTXO-size from deploySCP  
- `fef2d0b` [Wallet] Allow multiple VINs for deployments

## Credits

Thanks to everyone who directly contributed to this release:

- @JSKitty - Lead-Development

As well as everyone the QA community that helped during Testing.
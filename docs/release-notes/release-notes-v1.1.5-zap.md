# Release Notes v1.1.5 - ⚡ Zap!

SCP Wallet v1.1.5 - ⚡ Zap! is now available from: https://github.com/stakecube/StakeCubeProtocol/releases/tag/v1.1.5

Please report bugs using the issue tracker at Github: https://github.com/stakecube/StakeCubeProtocol/issues

## Notable Changes

- **GUI InstantSend**, IS support for all available SCP standards has been implemented, enjoy truly instant, sub-second transactions.
- **Superior Scalability**, upgrades to SCP scalability has **increased TPS by +24.9%**, consequently **decreasing fees by -24.9%**.
- **Enhanced Stability**, the Electron GUI has had a large codebase optimization round; increasing the efficiency of the UI, thus increasing the responsiveness, update speeds, and reducing resource usage.
- **New DApp Developer Interfaces**, new IO module APIs have been added to allow extremely easy DApp development via four simple APIs, including on-chain storage, DApp contracts, identifiers, and duel-DB operations with Arrays or Maps.
- Increased Linux & MacOS speeds: System-specific dynamic package loading/unloading to save on both speed & resource usage on certain systems.

## Changelog

- `bc12a13` [UI] Notify when the wallet lacks gas
- `f39f6d0` [UI] Remove unused error dialog
- `d39bebb` [DB] Add SCP config, datadir options & more
- `3a055e3` [DB] Add CoreConfName option
- `c719af1` [UI] Cleaner wallet load/creation logging
- `5604a7c` [DB] [Trivial] Refactor DB & Dir. Structure
- `235a8d8` [Init] [UI] Refactor Fullnode/Lightwallet + Init
- `9dcf4ab` Merge pull request #9 from JSKitty/main
- `33bf33e` [docs] Add initial docs structure and files
- `be52656` [docs] Add release-notes for v1.1.3 and v1.1.4
- `d646c2e` [docs] Add known SCP Explorer to readme
- `b82d714` [docs] Add Dependencies
- `a757781` [docs] Add contributing guidelines
- `b562c7d` [docs] Add initial API Endpoint lists
- `34eda26` [docs] Minor updates on installation guide (de)
- `e68cfe9` [docs] Add burn syntax for token protocols
- `7b7a9ea` Merge branch 'docs' of https://github.com/stakecube/StakeCubeProtocol into docs
- `506340d` [API] Refactor index.js into route files
- `99b354d` Merge pull request #11 from JSKitty/api-refactor-step1
- `523c41a` [docs] Add installation guide (en)
- `6e8f495` [docs] Fix broken links in readme
- `adbfc61` [API] Final refactor (route/controller & endpoints)
- `16e1dd6` Merge pull request #13 from JSKitty/api-refactor-step2
- `9c8dc35` [API] Add 403s for non-fullnode indexed endpoints
- `e27b031` [Lint] Apply linting rules
- `81eb3ca` Merge pull request #14 from JSKitty/api-refactor-step3
- `f363658` [docs] Correct typos/grammar
- `4cb5078` [docs] Update api docs to reflect #11 #13 refactor
- `60f02c4` [docs] more detailed 'blockchain' api description
- `3428032` [docs] Expose blockchain api on new routes
- `7d105cd` [docs] more detailed 'tokens' api description
- `575d173` [docs] improve tokens api example res. format
- `a635e0e` [docs] update install guides to reflect renamed src dir
- `3eae8df` [docs] fix scp.conf location in install guides
- `b2071cc` [API] Add ability to enable/disable API modules + Ports
- `ac5a76c` [API] [Lint] GUI API Fixes + Apply linting rules
- `73b4e42` [docs] add scp config file description
- `4d62c55` [DB] Fix SCC datadir initialization
- `4ff0cef` Merge pull request #16 from JSKitty/fix-custom-directory
- `aaaa82c` [API] Reduce redundant Token data
- `6c9df46` [Lint] Apply linting rules
- `8ceab90` [UI] Display module statuses in terminal
- `06a10e4` Merge pull request #15 from JSKitty/api-refactor-step4
- `7089ef9` Merge pull request #17 from JSKitty/slimmer-token-activity
- `d5e1c40` [API] Use module for error strings
- `a226f8d` [API] Use more relevant param. descriptions
- `716e365` Merge pull request #18 from JSKitty/fix-api-consistency
- `3b7296d` [docs] match gettokensbyaccount ex. outp. with #17
- `7347d17` [docs] more detailed 'wallet' api description
- `918f01f` [docs] more detailed 'activity' api description
- `7fc3673` Merge pull request #12 from stakecube/docs
- `5b8a8de` [API] Enforce full-node-only on the wallet module
- `f3d5f69` [Wallet] Improve networking + source-switching
- `0267670` Merge pull request #19 from JSKitty/wallet-fullnode-only
- `952c745` [Init] Enhanced init, troubleshooting & auto-reconnect.
- `06e40ae` Merge pull request #20 from JSKitty/improved-headless-init
- `0ef2308` [API] Add IO module for on-chain read/write ops
- `84284ba` [API] Add byte-buffer length validation
- `d70a25c` Merge pull request #21 from JSKitty/new-io-api-module
- `4465151` [API] Improve controller module loading
- `b034e34` Merge pull request #22 from JSKitty/main
- `4dbd2a4` [docs] add detailed 'io' api description
- `c7b329f` [docs] guides updated to indexed BS on SCP repo
- `775ecc4` [API] [IO] Move /write/ to binary POSTs
- `1e2b163` [Lint] Apply linting rules
- `6792b18` Merge pull request #25 from JSKitty/improve-io-write
- `121dd38` [docs][api] change io/write to POST (#25)
- `c289025` Merge pull request #23 from stakecube/bootstrap
- `02b89f1` [docs] fix type in readme
- `b836d54` Merge pull request #24 from stakecube/docs_io
- `cb8b417` [SCP] [Consensus] SCP-2 Staking Upgrade
- `7392ead` [SCP] Fix & optimize TX processing logic
- `2d083f8` [API] Fix multiple GUI Lightwallet issues + GetStakingStatus
- `52b8fc9` [Docs] Update all endpoints to use scc.net node
- `e80e87e` [Docs] Revert wallet module endpoint
- `b5d19f6` Merge pull request #27 from JSKitty/fix-staking-api-bugs
- `8ea02e3` [SCP] Implement Token State Indexing
- `24577d2` [Lint] Apply linting rules
- `3e4ffab` [SCP] [Consensus] Finalize upgrade activation height
- `619f3c4` Merge pull request #26 from JSKitty/scp-upgrade1-staking-min-req
- `6392975` [UI] Add SCP InstantSend into the GUI
- `7659781` [Lint] Please the evil linter bot
- `38534d7` [UI] Add mock activity for multi-stakes
- `90e7b2d` Merge pull request #28 from JSKitty/add-gui-scp-instantsend
- `efb0915` [API] [UI] Add IS-SCP API & Lightwallet integration
- `284ec28` Merge branch 'main' of https://github.com/JSKitty/StakeCubeProtocol into main
- `559c7e0` [API] getMempoolActivity Fullnode fixes
- `064e24e` [API] Pointer & linter bugfixes
- `141d1d6` [Docs] Add GetMempoolActivity documentation
- `0355146` Merge pull request #29 from JSKitty/main
- `4088a77` [UI] Fix multiple Lightwallet IS bugs
- `5cf87fa` Merge pull request #30 from JSKitty/fix-lightwallet-bugs
- `5bd5c26` [NPM] Version bump (v1.1.5)
- `7da2f7b` Merge pull request #31 from JSKitty/version-bump-v1.1.5
- `1cf36a9` [Wallet] [API] Fix listaddresses unlock status
- `3b3f04c` Merge pull request #32 from JSKitty/main
- `b52394e` [UI] Fix full-node IS activity duplication
- `bd337f7` Merge pull request #33 from JSKitty/Fix-fullnode-IS-activity-dup
- `978f5f6` [VM] [SCP] [API] Add VM + Bytecode + Storage Contracts + Indexing
- `8f484df` [Lint] Please the Linter Gods
- `4bdef2e` Merge pull request #34 from JSKitty/dapp-state-indexing
- `478b040` [UI] [Wallet] [SCP] Major UI + Wallet + SCP optimizations
- `40ebec7` [UI] Lightwallet stability improvements
- `65ee34c` [UI] Fix some Send page bugs
- `d7ade8f` [Build] Ignore unnecessary files in user binaries

## Credits

Thanks to everyone who directly contributed to this release:

- @JSKitty - SCP Lead Developer.
- @sc-9310 - APIs & DApp architecture concepts & planning, NFT (SCP-4) development, Code Reviews.
- @Liquid369 - MacOS compiles & testing.

as well as the QA community that helped during Testing.
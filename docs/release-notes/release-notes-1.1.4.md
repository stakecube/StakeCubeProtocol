# Release Notes v1.1.4

SCP Wallet v1.1.4 is now available from: https://github.com/stakecube/StakeCubeProtocol/releases/tag/v1.1.4

Please report bugs using the issue tracker at Github: https://github.com/stakecube/StakeCubeProtocol/issues

## Notable Changes

- New Dark Theme, with higher contrasts and a vibrant neon blue colour palette, shiny!
- New Settings Menu, with personalization options and an easy wallet export feature.
- One-Click Staking, if you have multiple SCP-2 tokens staking, you can now claim all in a single click.
- Optimizations across the board: Faster startup, faster refreshing, faster transactions.
- A new, powerful **API system for 3rd-party integrations, including StakeCube.net.
- Many dependencies were replaced with internal, in-house libraries, reducing app size by ~3.25%.

## Changelog

- `ebcd351` [UI] Slight copy-to-clipboard improvement  
- `eb8b3c5` [Wallet] Add multi-wallet + SCC-js library switch  
- `82e0ab8` [Crypto] Update to Noble SCC-js modules  
- `574c2ac` [Cleanup] Delete unnecessary imgs, deps, scripts, css  
- `0a5bd66` [UI] Implement Settings menu  
- `e3cf55e` [UI] Settings improvements & wallet exports  
- `e51bc0b` [UI] Remove unnecessary template  
- `b8d0952` [Wallet] [DB] Add multi-wallet DB support  
- `bcd1d85` [Wallet] Integrate SCC-js lib, nuke prior libs  
- `3cceb6b` [UI] Improve GUI loading time  
- `c1bc963` [MacOS] Detect & use compatible icons  
- `f6a2009` various ui updates focusing on mobile responsive layout  
- `c0fbcc1` Merge branch 'main' of https://github.com/408796571/StakeCubeProtocol into ui-improvement  
- `a558f26` clean up  
- `957c3d9` send page responsive input  
- `3e6b12a` disable default window menu  
- `c972eab` lower min width to enable mobile view  
- `45e07f7` Merge PR #1 from 408796571/ui-improvement  
- `7d4beb3` [Net] [Wallet] Create network lib + wallet APIs  
- `02ab2be` [Wallet] Fix unencrypted wallet handling  
- `de7d2f9` [Wallet] [API] Add TX API & per-pubk UTXO coin control  
- `91834cd` [Cleanup] Mass-nuke unused JS & CSS  
- `3496c72` [NPM] Version bump (v1.1.4)  
- `eedc24f` [UI] Display loading page pre-load  
- `8c36eb7` [NPM] Update to SCC-js v1.2.5  
- `178626d` [UI] Dark Theme magic  
- `862e9a4` [UI] Minor CSS & Settings improvements  
- `60891bd` [RPC] Implement custom RPC lib  
- `aba9bff` [RPC] Make lib class like / host flexible  
- `39b376a` [TRIVIAL] Add and configure first linter ruleset  
- `3c02309` [TRIVIAL] First linter adjustments  
- `f4a0d50` [TRIVIAL] Linter custom keyword-spacing  
- `cebd9be` [TRIVIAL] Example linter fix  
- `85dd69f` [TRIVIAL] Clean-up linter conf  
- `8b4de7a` Merge pull request #2 from sc-9310/rpc_1  
- `81cadd4` [TRIVIAL] Add quote-props for strict mode  
- `515a3d4` Merge pull request #4 from sc-9310/main  
- `813fcbe` [Linter] Keyword spacing adjustments  
- `43668c2` [Linter] [NPM] Add semi-auto Lint command  
- `0352e25` [Lint] First round of mass-linting  
- `47219ba` [Lint] 2nd round, manual linting  
- `a7e64c3` [API] [Wallet] Headless UTXO Synchronization  
- `3ecde5a` [Refactor] [Lint] 3rd round of linting + refactoring  
- `a95f1c9` [Actions] Auto-Linter experimental commit  
- `2fedcd0` [Actions] eslint-action version correction  
- `0048b74` [Actions] Nuke old eslint workflow  
- `fd62389` [Actions] Upload new eslint workflow  
- `7d18357` [Actions] Nuke eslint again...  
- `20406a3` [Actions] Custom Linter test  
- `7317a91` [UI] [NPM] Add update checker & notifications  
- `a2d0334` [UI] Send page UX improvements  
- `2ebdd31` [UI] Check deploySCP params for safety  
- `0e4f70e` [API] Add Stake API + bugfixes  
- `f2f1d4b` [API] Add TX-ID to GetBlockActivity  
- `1fa8d68` [API] Add GetActivityByTXID  
- `a089b97` [API] GetActivityByTXID improvements  
- `45fc551` [API] Fix GetToken  
- `42a9483` [Net] Implement custom network library  
- `d08fdcd` [UI] Trim whitespace from Send page inputs  
- `d1d6365` [API] Add ListDeltas  
- `de0bb13` [UI] Add SCC Activity + Performance Settings  
- `8887dea` [Net] Improved error handling  
- `0cbc33f` [UI] Fix missing Activity seperator  
- `ef203b2` [UI] Optimize transaction notifications  
- `4862756` [SCP] Optimize SCP token logic  
- `2a44140` [SCP] Optimize Chain State Processor (CSP) logic  
- `d881dbf` [SCP] Final CSP logic optimizations  
- `ab07ad5` [UI] Add "Claim All Rewards" functionality  
- `a4c99c1` [UI] Hide empty wallets by default  
- `1c0563c` [UI] Fix empty Tokens list margin  
- `ae99eda` [NPM] Update to NPM 7.19.1 lockfile 

## Credits

Thanks to everyone who directly contributed to this release:

- @JSKitty - Lead-Development
- @sc-9310 - Linter / Minor improvements
- @408796571 - UI improvements
- @Liquid369 - MacOS compiles & testing

As well as everyone the QA community that helped during Testing.
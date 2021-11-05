# Release Notes v1.1.6 - Aeternum

SCP Wallet v1.1.6 - Aeternum is now available from: https://github.com/stakecube/StakeCubeProtocol/releases/tag/v1.1.6

Please report bugs using the issue tracker at Github: https://github.com/stakecube/StakeCubeProtocol/issues

## Notable Changes

- **SCP-4 NFTs**, powered by SCP, IPFS & Filecoin, allowing up-to **32GB of free decentralized content** to be embedded in NFTs.
- **SC v3 Rebrand**, SCP Wallet had a total makeover in preparation for the launch of SC v3, alongside the early release of the new brand.
- **SCP Developer Toolkit**, a new token-designer that allows even the least techy users to deploy their very own SCP tokens and DApps.
- Enhanced Stability, the Wallet system has been improved to allow for higher TX throughput, without encountering TX creation issues.
- Faster Full-nodes, a new "Sync Assist" feature enabling Full-nodes to bootstrap the SCP state over twice the previous speeds.

## Changelog

- `28e10ff` [UI] Add SCP Developer Toolkit  
- `dbf3145` Merge pull request #37 from JSKitty/new-scp-dev-ui  
- `cb28707` [SCP-4] Initial codebase  
- `6857b09` [SCP-4] Add max supply  
- `5eea7ac` [SCP-4] Add NFT minting function  
- `3693067` [SCP-4] Ref. 'NFT' to 'Collection' at 1st level  
- `6a1598c` [SCP-4] Implement transfer function  
- `074e3d6` [SCP-4] Add 'protected' flag to collections  
- `525a7b6` [SCP-4] Add 'destroy' for non protected collection  
- `7025c2f` [SCP-4][Logs] Adjust console levels  
- `5d2d7f1` [SCP-4] [Consensus] Add upgrade consensus rules  
- `ea200b4` [SCP-4] [API] Add NFT + Collection viewing APIs  
- `83fddf6` [SCP-4] [Trivial] Code cleanup  
- `41ef663` [SCP-4] Add fixes, full APIs and Documentation  
- `ce83717` [UI] Fix mintSCP and burnSCP commands  
- `30c5732` [Lint] Run the angry linter  
- `c930b0b` [SCP-4] [Docs] Fix collection descriptions  
- `184d8f4` Merge pull request #38 from stakecube/SCP4_proposal  
- `dbe9f0a` [SCP-4] [UI] Add full NFT & Collections UI  
- `4a8d4a9` [SCP-4] [UI] Add Collection + NFT creator screens  
- `01dd8b3` [Lint] Run the angry linter again  
- `b9dbdfa` [SCP-4] [UI] Set activation block + Minor UI polish  
- `cf56ef4` Merge pull request #39 from JSKitty/add-nft-ui  
- `6eb9bc8` [CSP] [DB] Add Sync Assist feature  
- `a97fbcf` [Lint] Lint it!  
- `a697abd` Merge pull request #40 from JSKitty/sync-assist  
- `8e331af` [SCP-4] [API] Add "GetAllCollectionHeaders"  
- `a8851e3` [Docs] Add getAllCollectionHeaders  
- `bcb2b88` Merge pull request #41 from JSKitty/collection-headers-api  
- `e3bf44d` [SCP-4] [API] Add total and burned NFT ints  
- `e362579` Merge pull request #42 from JSKitty/headers-improvement  
- `affe78a` [UI] Implement SCP-4 NFT lightwallet  
- `5f4192e` [NPM] Version bump (v1.1.6)  
- `b22ca42` [Lint] Nuke some whitespace  
- `f4d0c52` [UI] Improve NFT details font colours  
- `ceae1ff` [Wallet] Improve lightwallet NFT caching  
- `7023e9f` [UI] SCP-4 UX improvements - Round 1  
- `a410b2b` [UI] Using "NFTs" menu always brings to "My NFTs"  
- `926cefe` [UI] Fix token pointer bugs with 'mintSCP' and 'burnSCP'  
- `605d8a8` [UI] Add 'Mint' button to Collection view  
- `a226012` [UI] Improved NFT explorer opacity, icons, animations  
- `00e5393` [UI] Multitude of UX improvements  
- `06eded6` [UI] [Wallet] Further UX and Stability improvements  
- `81cd3c0` [UI] SC v3 Rebrand  
- `f3ebd7e` [UI] UX improvements, Search bars, favicon fix  
- `2254853` [UI] Fix wrongly hidden searchbar condition  
- `44078d4` [Docs] Add SCP-4 protocol specs  
- `ef4eefe` [Docs] Fix linebreaks  
- `67dae44` [Docs] Improved Protocol Standards list  
- `2d207ff` Merge pull request #43 from JSKitty/scp4-lightwallet  
- `f8649bc` [Docs] Change SCP-4 Token title to NFTs  
- `6955cfd` [UI] Fix light theme NFT + Collection search bg  
- `212bc20` [UI] Add Mint Index display + Create Collection btn  

## Credits

Thanks to everyone who directly contributed to this release:

- @JSKitty - SCP Lead Developer.
- @sc-9310 - NFT (SCP-4) protocol development, Code Reviews, providing coffee for JSKitty.
- @OfficialDevvCat - SCP Developer Toolkit and SCP-4 frontend designs.
- @Liquid369 - MacOS compiles & testing.

as well as the QA community that helped during Testing.

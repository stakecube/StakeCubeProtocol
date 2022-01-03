# Release Notes v1.1.7 - Aeternum (Patch 1)

SCP Wallet v1.1.7 - Aeternum is now available from: https://github.com/stakecube/StakeCubeProtocol/releases/tag/v1.1.7

Please report bugs using the issue tracker at Github: https://github.com/stakecube/StakeCubeProtocol/issues

## Notable Changes

- **Refined NFTs experience**, it's now easier to navigate NFTs, retrieve info from them, copy images, and mint new NFTs!
- **Optimized Full-nodes**, the SCP-2 PoS algorithm has been refined with a **3.8x speed boost** to synchronization, and a new cache system.
- **Hardened Security**, a new built-in, highly customizable firewall system has been added to the API, as well as 10+ dependency updates.
- Improved SCP-4 API, the collection headers API now supplies tons of pre-computed data, making it even easier for devs to utilize SCP-4 NFTs.

## Changelog

- `602fd5c` [SCP-2] Improve PoS performance w/ object reuse  
- `89d2e84` Merge pull request #44 from JSKitty/pos-performance-improvements  
- `50f8cd3` [API] Add new stats to GetAllCollectionHeaders  
- `995d124` [Docs] Update GetAllCollectionHeaders output  
- `1608861` Merge pull request #45 from JSKitty/main  
- `98e4a6a` [API] [Bugfix] Don't include 'null' owners in headers  
- `c512022` [UI] Light general UX design improvements  
- `3c14f96` Merge pull request #46 from JSKitty/ux-improvements-and-fixes  
- `4a446cc` [API] [Config] Add "allowedips" setting  
- `bab492a` [SCP] Add TX cache processor  
- `1ef3027` [SCP] Revise cache usage  
- `10096a7` [Lint] Get it over with, bot  
- `0d43f98` Merge pull request #47 from JSKitty/api-cache-and-opsec  
- `775564b` [UI] Display self-created collections first  
- `1539067` [UI] Do not auto-scroll on collection creation  
- `c2c7ed6` Merge pull request #48 from JSKitty/main  
- `b9e2790` [NPM] Bump to v1.1.7 & audit depends  
- `9321f04` Merge pull request #49 from JSKitty/main  
- `c8bb081` [UI] Fix race-condition for NFT rendering  
- `e3dec9c` Merge pull request #50 from JSKitty/main  

## Credits

Thanks to everyone who directly contributed to this release:

- @JSKitty - SCP Lead Developer.
- @Liquid369 - MacOS compiles & testing.

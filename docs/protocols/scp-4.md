# SCP-4 (Token)

SCP-4 is a token standard which enables NFTs on SCP by allowing the creation of "Collections", these are deployed contracts that are comprised of rules for NFTs made within the contract; such as the Maximum Mints that can be done, if the supply is infinite, or if NFTs within the contract are burnable or protected from burning. Once an SCP-4 collection contract is deployed, the creator may issue NFTs for no additional fees. The SCP-4 standard enforces the usage of IPFS as the image solution for SCP NFTs, ensuring that every NFT on StakeCube Protocol is completely safe from malicious tampering, from deletion, or any editing otherwise, making SCP-4 one of the toughest and trustworthy NFT ecosystems as of today.

## Deploying Fee
Deploying a SCP-4 token requires a static **10 SCC**, with transactions fees (~0.00002 SCC) additionally.

This fee is irrecoverably 'burned'.  
Address: sccburnaddressXXXXXXXXXXXXXXSfqakF

## Parameter

param 1 = NAME (string, no spaces)
param 2 = MAXMINTS (integer, use -1 for unlimited)
param 3 = PROTECTED (integer, 1 for true, 0 for false)

## Syntax

**Deploy/Create Collection**
```bash
deploySCP(4, ["COLLECTION_NAME", MAXMINTS, PROTECTED])
```
# SCP-2 (Token)

SCP-2 provides a greater degree of decentralization, allowing for more complex economic systems. This is thanks to the real-time, fairly distributed Proof of Stake mechanism. SCP-2 tokens also have a name, ticker and max supply, but the issuer may only use the minting function once. The token creator must also select a block reward, that will be regularly distributed to all token holders. With every new block and completely automatically, token holders will receive new coins in their wallets proportionally to their stake until the max supply is reached. Staking will then stop with no new issuance until coins are burnt and circulating supply is reduced below the maximum. Use cases that would benefit from a fair and decentralized distribution are possible with this standard. It is designed to avoid the possibility of rug-pulls, giving users peace-of-mind for their investments.

## Deploying Fee
Deploying a SCP-2 token requires a static **10 SCC**, with transactions fees (~0.00002 SCC) additionally.  

This fee is irrecoverably 'burned'.  
Address: sccburnaddressXXXXXXXXXXXXXXSfqakF

## Parameter

param 1 = NAME (string, no spaces)  
param 2 = TICKER (string, no spaces)  
param 3 = MAXSUPPLY (integer, satoshis)  
param 4 = INFLATION (integer, satoshis)  
param 5 = MINAGE (integer, blocks)

> Note:  
> Amounts expressed in *satoshis* can be converted to full coins using the * COIN syntax.  
>
> Examples:  
> 100 = 0.00000100  
> 100 * COIN = 100.00000000

## Syntax

**Deploy/Create Token**
```bash
deploySCP(2, ["NAME", "TICKER", MAXSUPPLY * COIN, INFLATION * COIN, MINAGE])
```

**Mint tokens**

```bash
mintSCP("contract-id", amount * COIN)
```

**Burn tokens**

```bash
burnSCP("contract-id", amount * COIN)
```
# SCP-1 (Token)

## Definition

SCP-1 is the most basic token standard. It allows to set a token name, a ticker, and a maximum supply. Upon creation, no tokens will be minted. The token creator can then use the
mint command on the console. The mint command allows the creator to mint new tokens, provided this doesn’t increase the existing supply above the maximum set at the start. This kind of token standard can be employed in usecases that require certain degree of centralization, such as stablecoins or tokenized services like MineCube workers.
SCP-1 tokens may also be burnt, which reduces the circulating supply without affecting the maximum.

## Deploying Fee
Deploying a SCP-1 token requires a static **10 SCC**, with transactions fees (~0.00002 SCC) additionally.

This fee is irrecoverable 'burned'.  
Address: sccburnaddressXXXXXXXXXXXXXXSfqakF

## Parameter

param 1 = NAME (string, no spaces)  
param 2 = TICKER (string, no spaces)  
param 3 = MAXSUPPLY (integer, satoshis)

> Note:  
> Amounts expressed in *satoshis* can be converted to full coins using the * COIN syntax.  
>
> Examples:  
> 100 = 0.00000100  
> 100 * COIN = 100.00000000

## Syntax

**Deploy/Create Token**
```bash
deploySCP(1, ["NAME", "TICKER", MAXSUPPLY * COIN])
```

**Mint tokens**

```bash
mintSCP("contract-id", amount * COIN)
```

**Burn tokens**

```bash
burnSCP("contract-id", amount * COIN)
```
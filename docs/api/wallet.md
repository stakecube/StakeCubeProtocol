# Wallet API

**Creates a new wallet address**

```bash
/api/v1/wallet/getnewaddress
```

---

**Gets a list of all addresses available to the wallet**

```bash
/api/v1/wallet/listaddresses
```

---

**Get the balances of all owned tokens by this account, including SCC**

```bash
/api/v1/wallet/getbalances/:address
```

---

**Gets a list of all changes related to the given address**

```bash
/api/v1/wallet/listdeltas/:address
```

---

**Creates an SCC transaction with the given wallet address**

```bash
/api/v1/wallet/send/:address/:currency/:to/:amount
```

---

**Creates a stake transaction to claim the pending rewards of a given account**

```bash
/api/v1/wallet/stake/:address/:currency
```

---

**Get an SCP-2 token's staking status for a single account**

```bash
/api/v1/getstakingstatus/:contract/:account
```
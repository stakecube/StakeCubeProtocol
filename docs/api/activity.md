# Activity API

**Get a single account's activity/history for all tokens**

```bash
/api/v1/getallactivity/:account
```

---

**Get a single account's activity/history for a single token**

```bash
/api/v1/getactivity/:contract/:account
```

---

**Gets all activity/history for all tokens, in one block, in a linear (flat) format with no nesting**

```bash
/api/v1/getblockactivity/:block
```

---

**Gets all activity/history for a specified TX-ID and a type**

```bash
/api/v1/getactivitybytxid/:txid/:type
```
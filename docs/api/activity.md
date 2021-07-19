# Activity API

**Account all tokens**

Get an account's activity/history for all tokens.

```bash
GET /api/v1/activity/getallactivity/:account
```

Example: `curl -X GET "https://stakecubecoin.net/web3/scp/activity/getallactivity/sJGLYknMNC6297Njfi8KXqQpMWwESgGJav"`

**Fullnode required**: YES

**Parameters**:

| Name | Mandatory | Description |
|---------|---------|---------|
| account | YES | The account address |

<details>
<summary><strong>Example Response</strong></summary>
<p>

```json
[
    {
        "id": "9187cf507ef15718562d53b3d08cd444fa3fa9d31e67402b3522cb8c4f4cb789",
        "block": 155086,
        "type": "received",
        "amount": 1000000000000000,
        "token": {
            "contract": "9c5c188e202eb3a987082653c27221a17a1ac407494c08aa8dc3e8f5be292805",
            "ticker": "Slug",
            "name": "SirSlugToken"
        }
    }, 
    ...
]
```

</p>
</details>  

---

**Account single token**

Get a single account's activity/history for a single token.

```bash
GET /api/v1/activity/getactivity/:contract/:account
```

Example: `curl -X GET "https://stakecubecoin.net/web3/scp/activity/getactivity/063d1363528d29670cd8b0541e31a9c2d53edfff6070490ba165d9569111bc26/sbQVsmW9uXsCXdd1YaRSLWYJfc4sn8msvv"`

**Fullnode required**: YES

**Parameters**:

| Name | Mandatory | Description |
|---------|---------|---------|
| contract | YES | The unique contract id |
| account | YES | The account address |

<details>
<summary><strong>Example Response</strong></summary>
<p>

```json
[
    {
        "id": "7e6d71f723fadcd5fc01faa574066a086b0196995547e29f5a8b0e01440b4b8e",
        "block": 174557,
        "type": "received",
        "amount": 100000000
    },
    {
        "id": "258303c8e359f4360471bffcae4b5e848042f803ff324a9009fafe29a2bb6aab",
        "block": 174583,
        "type": "sent",
        "amount": 50000000
    },
    {
        "id": "a03a06ce98a19c5ba68be56e4350dff519da48a112424297aec86c493d593fdb",
        "block": 175067,
        "type": "staked",
        "amount": 19549855155
    },
    ...
]
```

</p>
</details>  

---

**Block**

Gets all activity/history for all tokens, in one block, in a linear (flat) format with no nesting.

```bash
GET /api/v1/activity/getblockactivity/:block
```

Example: `curl -X GET "https://stakecubecoin.net/web3/scp/activity/getblockactivity/175067"`

**Fullnode required**: YES

**Parameters**:

| Name | Mandatory | Description |
|---------|---------|---------|
| block | YES | The block height |

<details>
<summary><strong>Example Response</strong></summary>
<p>

```json
[
    {
        "txid": "a03a06ce98a19c5ba68be56e4350dff519da48a112424297aec86c493d593fdb",
        "contract": "063d1363528d29670cd8b0541e31a9c2d53edfff6070490ba165d9569111bc26",
        "account": "sbQVsmW9uXsCXdd1YaRSLWYJfc4sn8msvv",
        "type": "staked",
        "amount": 19549855155
    },
    ...
]
```

</p>
</details>  

---

**By TX-ID and type**

Gets all activity/history for a specified TX-ID and a type.

```bash
GET /api/v1/activity/getactivitybytxid/:txid/:type
```

Example: `curl -X GET "https://stakecubecoin.net/web3/scp/activity/getactivitybytxid/a03a06ce98a19c5ba68be56e4350dff519da48a112424297aec86c493d593fdb/all"`

**Fullnode required**: YES

**Parameters**:

| Name | Mandatory | Description |
|---------|---------|---------|
| txid | YES | The transaction hash |
| type | YES | The transaction type (`all`, `received`, `sent`, `staked`) |

<details>
<summary><strong>Example Response</strong></summary>
<p>

```json
[
    {
        "txid": "a03a06ce98a19c5ba68be56e4350dff519da48a112424297aec86c493d593fdb",
        "contract": "063d1363528d29670cd8b0541e31a9c2d53edfff6070490ba165d9569111bc26",
        "account": "sbQVsmW9uXsCXdd1YaRSLWYJfc4sn8msvv",
        "type": "staked",
        "amount": 19549855155
    },
    ...
]
```

</p>
</details>  

---

**List Deltas**

Gets a list of all changes related to the given address.

```bash
GET /api/v1/activity/listdeltas/:address
```

Example: `curl -X GET "https://stakecubecoin.net/web3/scp/activity/listdeltas/sbQVsmW9uXsCXdd1YaRSLWYJfc4sn8msvv"`

**Fullnode required**: YES

**Parameters**:

| Name | Mandatory | Description |
|---------|---------|---------|
| address | YES | The SCC or Token address |

<details>
<summary><strong>Example Response</strong></summary>
<p>

```json
[
    {
        "satoshis": -2000000000,
        "txid": "a51269b6dd7a75dc7dc7ac63b98dead476c7c422f68906df6df9ec3721a35a35",
        "index": 0,
        "blockindex": 1,
        "height": 174905,
        "address": "sbQVsmW9uXsCXdd1YaRSLWYJfc4sn8msvv"
    },
    {
        "satoshis": 1999999364,
        "txid": "a51269b6dd7a75dc7dc7ac63b98dead476c7c422f68906df6df9ec3721a35a35",
        "index": 1,
        "blockindex": 1,
        "height": 174905,
        "address": "sbQVsmW9uXsCXdd1YaRSLWYJfc4sn8msvv"
    },
    {
        "satoshis": -1999999364,
        "txid": "b16c1ca622c8a94fa77cdf909c2f85cfc0a680c8593a25beca03a2f6b764f66e",
        "index": 0,
        "blockindex": 2,
        "height": 174905,
        "address": "sbQVsmW9uXsCXdd1YaRSLWYJfc4sn8msvv"
    },
    ...
]
```

</p>
</details>  

---
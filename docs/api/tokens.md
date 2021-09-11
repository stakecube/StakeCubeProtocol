# Tokens API

**All Tokens**

Returns the complete 'state' of non-divisible, SCP-1-Based tokens, including all their meta data, owners/accounts, activity and balances.

```bash
GET /api/v1/tokens/getalltokens
```

Example: `curl -X GET "https://stakecubecoin.net/web3/scp/tokens/getalltokens"`

**Fullnode required**: YES

**Parameters**: NONE

<details>
<summary><strong>Example Response</strong></summary>
<p>

```json
[
    {
        "version": 2,
        "contract": "063d1363528d29670cd8b0541e31a9c2d53edfff6070490ba165d9569111bc26",
        "name": "Moments",
        "ticker": "MMT",
        "maxSupply": 1000000000000000,
        "supply": 522113447567462,
        "creator": "sVJzD3nn4sFcadjZLXfo2UNMfTHqMd1B4W",
        "owners": [
            {
                "address": "sNVWSUa9tfNuPqeuUTjoUDo8tsbo355xej",
                "balance": 31615991124,
                "unclaimed_balance": 46880513,
                "lastTxBlock": 182409,
                "activity": [
                    {
                        "id": "104983ed44a50d2c02588f1a5a7640580760f03fe281c160fab00bc08e16962b",
                        "block": 178388,
                        "type": "received",
                        "amount": 25503850291
                    },
                    {
                        "id": "d4c4dc30d5f3eb5200205a6d1dfa4c31dddc2cbdc66aebe4cf140f8eccb2a010",
                        "block": 180286,
                        "type": "staked",
                        "amount": 34191380
                    },
                    {
                        "id": "4bd18b8a3a14185e82fb48808c7024601ff4c73046af9230f886c2fe21d86261",
                        "block": 180288,
                        "type": "sent",
                        "amount": 25538041671
                    },
                    ...
                ]
            }
        ],
        "inflation": 380000000,
        "minAge": 60
    },
    ...
]
```

</p>
</details>  

---

**Single Token**

Returns the complete 'state' of a single token with its meta data, owners/accounts, activity and balances.

```bash
GET /api/v1/tokens/gettoken/:contract
```

Example: `curl -X GET "https://stakecubecoin.net/web3/scp/tokens/gettoken/063d1363528d29670cd8b0541e31a9c2d53edfff6070490ba165d9569111bc26"`

**Fullnode required**: YES

**Parameters**:

| Name | Mandatory | Description |
|---------|---------|---------|
| contract | YES | The unique contract id |

<details>
<summary><strong>Example Response</strong></summary>
<p>

```json
{
    "version": 2,
    "contract": "063d1363528d29670cd8b0541e31a9c2d53edfff6070490ba165d9569111bc26",
    "name": "Moments",
    "ticker": "MMT",
    "maxSupply": 1000000000000000,
    "supply": 522113447567462,
    "creator": "sVJzD3nn4sFcadjZLXfo2UNMfTHqMd1B4W",
    "owners": [
        {
            "address": "sNVWSUa9tfNuPqeuUTjoUDo8tsbo355xej",
            "balance": 31615991124,
            "unclaimed_balance": 46880513,
            "lastTxBlock": 182409,
            "activity": [
                {
                    "id": "104983ed44a50d2c02588f1a5a7640580760f03fe281c160fab00bc08e16962b",
                    "block": 178388,
                    "type": "received",
                    "amount": 25503850291
                },
                {
                    "id": "d4c4dc30d5f3eb5200205a6d1dfa4c31dddc2cbdc66aebe4cf140f8eccb2a010",
                    "block": 180286,
                    "type": "staked",
                    "amount": 34191380
                },
                {
                    "id": "4bd18b8a3a14185e82fb48808c7024601ff4c73046af9230f886c2fe21d86261",
                    "block": 180288,
                    "type": "sent",
                    "amount": 25538041671
                },
                ...
            ]
        }
    ],
    "inflation": 380000000,
    "minAge": 60
}
```

</p>
</details>

---

**Tokens by Account**

Finds and returns the complete 'state' of SCP, including all tokens with their meta data, owners/accounts, activity and balances by a specified address.

```bash
GET /api/v1/tokens/gettokensbyaccount/:account
```

Example: `curl -X GET "https://stakecubecoin.net/web3/scp/tokens/gettokensbyaccount/sbQVsmW9uXsCXdd1YaRSLWYJfc4sn8msvv"`

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
        "token": {
            "version": 2,
            "contract": "69a3bd3c864b69390e02cc43a0f9725d2736f8129cea527e333af472bc92a05b",
            "name": "SCP-Faucet",
            "ticker": "TEST",
            "maxSupply": 5000000000000000,
            "supply": 52652787702025,
            "creator": "sY2NPdY7TSpmH3Es1Ao4cB8mB9odbT1S2g",
            "inflation": 500000000,
            "minAge": 2
        },
        "account": {
            "address": "sbQVsmW9uXsCXdd1YaRSLWYJfc4sn8msvv",
            "balance": 10022551565686,
            "unclaimed_balance": 932696376542,
            "lastTxBlock": 174704,
            "activity": [
                {
                    "id": "bbe9c893d2873f168beae6b13b2ce312ddacaea4bf79ec1bce5f058238ae777f",
                    "block": 174704,
                    "type": "received",
                    "amount": 10000000000000
                },
                {
                    "id": "a51269b6dd7a75dc7dc7ac63b98dead476c7c422f68906df6df9ec3721a35a35",
                    "block": 174905,
                    "type": "staked",
                    "amount": 19679146218
                },
                {
                    "id": "358dc2ca2ac7e1331d953868b3d1a9de07a4ab881e67d6f1facf73a70152a8fb",
                    "block": 174930,
                    "type": "staked",
                    "amount": 2476156000
                },
                {
                    "id": "32660d6f9ca16b9b003ca49c4965b5b59a55f39b0db41ad15d45cacb43b71b89",
                    "block": 174934,
                    "type": "staked",
                    "amount": 396263468
                }
            ]
        }
	},
    ...
]
```

</p>
</details>

---

**Staking status (SCP-2)**

Get the SCP-2 staking status of a given account and token.

```bash
GET /api/v1/tokens/getstakingstatus/:contract/:account
```

Example: `curl -X GET "https://stakecubecoin.net/web3/scp/tokens/getstakingstatus/69a3bd3c864b69390e02cc43a0f9725d2736f8129cea527e333af472bc92a05b/sgu2PRDZv9yeqco6ouVG5WvPegZ7iVHFod"`

**Fullnode required**: YES

**Parameters**:

| Name | Mandatory | Description |
|---------|---------|---------|
| contract | YES | The tokens unique contract id |
| address | YES | The account address |

<details>
<summary><strong>Example Response</strong></summary>
<p>

```json
{
    "enabled": true,
    "age": 11,
    "unclaimed_rewards": 18995484,
    "weight": 0.018995484582832304,
    "note": "currently staking 10,001.665 TEST with an age of 11 blocks, with 0.19 TEST in unclaimed stake rewards"
}
```

</p>
</details>

---

**Get All Collections (SCP-4)**

Returns the complete 'state' of SCP-4-Based NFT collections, along with all metadata and all NFTs for each collection.

```bash
GET /api/v1/tokens/getallcollections
```

Example: `curl -X GET "https://stakecubecoin.net/web3/scp/tokens/getallcollections"`

**Fullnode required**: YES

**Parameters**: NONE

<details>
<summary><strong>Example Response</strong></summary>
<p>

```json
[
  {
    "index": 0,
    "version": 4,
    "contract": "02f08b8cfc938a901ac939243bd091e48a650475d5d2f78baacef5f7c1cb899c",
    "collectionName": "test",
    "mints": 3,
    "maxMints": 1,
    "protected": false,
    "creator": "sDpkbWCCyh1zvAUHiJKGKr3h11ciaui3mP",
    "nfts": [
      {
        "id": "b617e7a5f236ecbd3a734c855dd5040e8bf589e35e0d4e42c0ccadf5363c6075",
        "name": "first_nft!",
        "imgUrl": "QmQC9Vz1kPoLBwn9zRADw1vrVdHAPooq9nDW4AgB43rzHa",
        "owner": "sY2NPdY7TSpmH3Es1Ao4cB8mB9odbT1S2g",
        "activity": [
          {
            "tx": "b617e7a5f236ecbd3a734c855dd5040e8bf589e35e0d4e42c0ccadf5363c6075",
            "type": "mint",
            "from": null,
            "to": "sDpkbWCCyh1zvAUHiJKGKr3h11ciaui3mP",
            "block": 222321
          },
          {
            "tx": "8981623655b1bd0e68eab4f83214d2a078880ba6ba833f0f6f293d266b7ccdcb",
            "type": "transfer",
            "from": "sDpkbWCCyh1zvAUHiJKGKr3h11ciaui3mP",
            "to": "sY2NPdY7TSpmH3Es1Ao4cB8mB9odbT1S2g",
            "block": 223763
          }
        ]
      }
    ]
  }
]
```

</p>
</details>

---

**Get Single Collection**

Returns the complete 'state' of a single SCP-4 Collection with its metadata, NFTs and activity.

```bash
GET /api/v1/tokens/getcollection/:contract
```

Example: `curl -X GET "https://stakecubecoin.net/web3/scp/tokens/getcollection/02f08b8cfc938a901ac939243bd091e48a650475d5d2f78baacef5f7c1cb899c"`

**Fullnode required**: YES

**Parameters**:

| Name | Mandatory | Description |
|---------|---------|---------|
| contract | YES | The unique collection id |

<details>
<summary><strong>Example Response</strong></summary>
<p>

```json
{
  "index": 0,
  "version": 4,
  "contract": "02f08b8cfc938a901ac939243bd091e48a650475d5d2f78baacef5f7c1cb899c",
  "collectionName": "test",
  "mints": 3,
  "maxMints": 1,
  "protected": false,
  "creator": "sDpkbWCCyh1zvAUHiJKGKr3h11ciaui3mP",
  "nfts": [
    {
      "id": "b617e7a5f236ecbd3a734c855dd5040e8bf589e35e0d4e42c0ccadf5363c6075",
      "name": "first_nft!",
      "imgUrl": "QmQC9Vz1kPoLBwn9zRADw1vrVdHAPooq9nDW4AgB43rzHa",
      "owner": "sY2NPdY7TSpmH3Es1Ao4cB8mB9odbT1S2g",
      "activity": [
        {
          "tx": "b617e7a5f236ecbd3a734c855dd5040e8bf589e35e0d4e42c0ccadf5363c6075",
          "type": "mint",
          "from": null,
          "to": "sDpkbWCCyh1zvAUHiJKGKr3h11ciaui3mP",
          "block": 222321
        },
        {
          "tx": "8981623655b1bd0e68eab4f83214d2a078880ba6ba833f0f6f293d266b7ccdcb",
          "type": "transfer",
          "from": "sDpkbWCCyh1zvAUHiJKGKr3h11ciaui3mP",
          "to": "sY2NPdY7TSpmH3Es1Ao4cB8mB9odbT1S2g",
          "block": 223763
        }
      ]
    }
  ]
}
```

</p>
</details>

---

**NFTs by Account**

Finds and returns all NFTs owned by the specified account, regardless of their collection.

```bash
GET /api/v1/tokens/getnftsbyaccount/:account
```

Example: `curl -X GET "https://stakecubecoin.net/web3/scp/tokens/getnftsbyaccount/sY2NPdY7TSpmH3Es1Ao4cB8mB9odbT1S2g"`

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
    "nft": "b617e7a5f236ecbd3a734c855dd5040e8bf589e35e0d4e42c0ccadf5363c6075",
    "name": "first_nft!",
    "imgUrl": "QmQC9Vz1kPoLBwn9zRADw1vrVdHAPooq9nDW4AgB43rzHa",
    "collection": "02308b8ccc938a901ac939243bd091e48a650475d5d2f78baacef5f7c1cb899c",
    "collectionIndex": 0,
    "collectionName": "teeest",
    "activity": [
      {
        "tx": "b617e7a5f236ecbd3a734c855dd5040e8bf589e35e0d4e42c0ccadf5363c6075",
        "type": "mint",
        "from": null,
        "to": "sDpkbWCCyh1zvAUHiJKGKr3h11ciaui3mP",
        "block": 222321
      },
      {
        "tx": "8981623655b1bd0e68eab4f83214d2a078880ba6ba833f0f6f293d266b7ccdcb",
        "type": "transfer",
        "from": "sDpkbWCCyh1zvAUHiJKGKr3h11ciaui3mP",
        "to": "sY2NPdY7TSpmH3Es1Ao4cB8mB9odbT1S2g",
        "block": 223763
      }
    ]
  }
]
```

</p>
</details>

---

**Get Single NFT**

Returns the a single SCP-4 NFT by it's ID.

```bash
GET /api/v1/tokens/getnft/:id
```

Example: `curl -X GET "https://stakecubecoin.net/web3/scp/tokens/getnft/b617e7a5f236ecbd3a734c855dd5040e8bf589e35e0d4e42c0ccadf5363c6075"`

**Fullnode required**: YES

**Parameters**:

| Name | Mandatory | Description |
|---------|---------|---------|
| contract | YES | The unique NFT id |

<details>
<summary><strong>Example Response</strong></summary>
<p>

```json
{
  "nft": "b617e7a5f236ecbd3a734c855dd5040e8bf589e35e0d4e42c0ccadf5363c6075",
  "name": "first_nft!",
  "imgUrl": "QmQC9Vz1kPoLBwn9zRADw1vrVdHAPooq9nDW4AgB43rzHa",
  "collection": "02308b8ccc938a901ac939243bd091e48a650475d5d2f78baacef5f7c1cb899c",
  "collectionIndex": 0,
  "collectionName": "teeest",
  "owner": "sY2NPdY7TSpmH3Es1Ao4cB8mB9odbT1S2g",
  "activity": [
    {
      "tx": "b617e7a5f236ecbd3a734c855dd5040e8bf589e35e0d4e42c0ccadf5363c6075",
      "type": "mint",
      "from": null,
      "to": "sDpkbWCCyh1zvAUHiJKGKr3h11ciaui3mP",
      "block": 222321
    },
    {
      "tx": "8981623655b1bd0e68eab4f83214d2a078880ba6ba833f0f6f293d266b7ccdcb",
      "type": "transfer",
      "from": "sDpkbWCCyh1zvAUHiJKGKr3h11ciaui3mP",
      "to": "sY2NPdY7TSpmH3Es1Ao4cB8mB9odbT1S2g",
      "block": 223763
    }
  ]
}
```

</p>
</details>
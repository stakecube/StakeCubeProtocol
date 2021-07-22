# IO API

**Write**

Write custom data to chain.

```bash
GET /api/v1/io/write/:address/:data
```

Example: `curl -X GET "localhost:3000/api/v1/io/write/sNrUeZJTQmXpi6uPMwBm1YNdw4VmrDPkg8/Hello SCP World"`

**Fullnode required**: YES

**Parameters**:

| Name | Mandatory | Description |
|---------|---------|---------|
| address | YES | The account address |
| data | YES | Data (up to 500 bytes) |

<details>
<summary><strong>Example Response</strong></summary>
<p>

```json
{
    "txid": "6d0d33529549181030344cac1efb5975734537003201ad7aec0e3386f40e98ed",
    "rawTx": "02000000011669AD08167176F389F42ED393B215C99F792853853109E5686C739008F5E456000000006A47304402205E2CC6483C4CA751F68960E254B8B6C8A75C42AF5E1EE61ADA93B3E09250E94B02207B616873DB4794B7180BB9B50E23D97164DB311157D71950A161E5850F95B6BD01210253C7014D50D9335D82E63C1359CF54AFD7A80FBE6B0F2E66937926C284236507FFFFFFFF020100000000000000126A4C0F48656C6C6F2053435020576F726C64E4949800000000001976A9143282E0236A1F2408847183F2DBFE483F8247A24788AC00000000"
}
```

</p>
</details>  

---

**Read**

Returns on-chain transaction data in any common format type.

```bash
GET /api/v1/io/read/:txid/:format
```

Example: `curl -X GET "http://localhost:3000/api/v1/io/read/6d0d33529549181030344cac1efb5975734537003201ad7aec0e3386f40e98ed/utf8"`

**Fullnode required**: YES

**Parameters**:

| Name | Mandatory | Description |
|---------|---------|---------|
| txid | YES | The transaction hash |
| format | YES | A common encoding format like `utf8`, `base64`, `hex` |

<details>
<summary><strong>Example Response</strong></summary>
<p>

```json
{
    "msg": "Hello SCP World",
    "tx": {
        "txid": "6d0d33529549181030344cac1efb5975734537003201ad7aec0e3386f40e98ed",
        "version": 2,
        "type": 0,
        "size": 218,
        "locktime": 0,
        "vin": [
            {
                "txid": "56e4f50890736c68e50931855328799fc915b293d32ef489f376711608ad6916",
                "vout": 0,
                "scriptSig": {
                    "asm": "304402205e2cc6483c4ca751f68960e254b8b6c8a75c42af5e1ee61ada93b3e09250e94b02207b616873db4794b7180bb9b50e23d97164db311157d71950a161e5850f95b6bd[ALL] 0253c7014d50d9335d82e63c1359cf54afd7a80fbe6b0f2e66937926c284236507",
                    "hex": "47304402205e2cc6483c4ca751f68960e254b8b6c8a75c42af5e1ee61ada93b3e09250e94b02207b616873db4794b7180bb9b50e23d97164db311157d71950a161e5850f95b6bd01210253c7014d50d9335d82e63c1359cf54afd7a80fbe6b0f2e66937926c284236507"
                },
                "sequence": 4294967295
            }
        ],
        "vout": [
            {
                "value": 1e-8,
                "valueSat": 1,
                "n": 0,
                "scriptPubKey": {
                    "asm": "OP_RETURN 48656c6c6f2053435020576f726c64",
                    "hex": "6a4c0f48656c6c6f2053435020576f726c64",
                    "type": "nulldata"
                }
            },
            {
                "value": 0.09999588,
                "valueSat": 9999588,
                "n": 1,
                "scriptPubKey": {
                    "asm": "OP_DUP OP_HASH160 3282e0236a1f2408847183f2dbfe483f8247a247 OP_EQUALVERIFY OP_CHECKSIG",
                    "hex": "76a9143282e0236a1f2408847183f2dbfe483f8247a24788ac",
                    "reqSigs": 1,
                    "type": "pubkeyhash",
                    "addresses": [
                        "sNrUeZJTQmXpi6uPMwBm1YNdw4VmrDPkg8"
                    ]
                }
            }
        ],
        "hex": "02000000011669ad08167176f389f42ed393b215c99f792853853109e5686c739008f5e456000000006a47304402205e2cc6483c4ca751f68960e254b8b6c8a75c42af5e1ee61ada93b3e09250e94b02207b616873db4794b7180bb9b50e23d97164db311157d71950a161e5850f95b6bd01210253c7014d50d9335d82e63c1359cf54afd7a80fbe6b0f2e66937926c284236507ffffffff020100000000000000126a4c0f48656c6c6f2053435020576f726c64e4949800000000001976a9143282e0236a1f2408847183f2dbfe483f8247a24788ac00000000",
        "blockhash": "00000000000005a9af4df63cb6d8a61ba45a3828d6c899da29a32e591d7173be",
        "height": 188624,
        "confirmations": 3,
        "time": 1626940609,
        "blocktime": 1626940609,
        "instantlock": true,
        "instantlock_internal": false,
        "chainlock": true
    }
}
```

</p>
</details>  
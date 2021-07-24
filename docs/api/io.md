# IO API

**Write**

Write custom data to chain. Files, text, binary, hex or any other encoded data is fully supported.

```bash
POST /api/v1/io/write/:address
```

Example: `curl -d "Hi SCP dApps" "https://stakecubecoin.net/web3/scp/io/write/sc49Bo2Y8NBy4ASB9Bb2Xh3kbqTtFfPrEw"`

**Fullnode required**: YES

**Parameters**:

| Name | Mandatory | Description |
|---------|---------|---------|
| address | YES | The account address |

**POST Body**:

| Name | Mandatory | Description |
|---------|---------|---------|
| data | YES | Data (up to 500 bytes) |

<details>
<summary><strong>Example Response</strong></summary>
<p>

```json
{
    "txid": "acf7e9f8081c053dd16b4e4afc5ea5f2feb4c9d5b5b8ad3fbb5b4291342b81f2",
    "rawTx": "020000000139EAF02107EAFD4DF7B1B57E4B4932631001B7AA9EFA85C063DEFD9BDFC635AF000000006B483045022100A2CAE4F4B961ECF23DEEB01B679DDCE3DC53CF418B591E42B724998E588BC61202202735D7C23B9E8BB5B9371F61547B38F73AD060FEAE31F9F8E206A4207AB09378012102649E331DBEE371E569E278189D15065F0C0C7C7E8A355DE64A02BF975882B32DFFFFFFFF0201000000000000000F6A4C0C48692053435020644170707370DFF505000000001976A914C35141B5DEF6FE8EDC8F806B7A3221DBC7C356BC88AC00000000"
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

Example: `curl -X GET "http://https://stakecubecoin.net/web3/scp/io/read/acf7e9f8081c053dd16b4e4afc5ea5f2feb4c9d5b5b8ad3fbb5b4291342b81f2/utf8"`

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
    "msg": "Hi SCP dApps",
    "tx": {
        "txid": "acf7e9f8081c053dd16b4e4afc5ea5f2feb4c9d5b5b8ad3fbb5b4291342b81f2",
        "version": 2,
        "type": 0,
        "size": 216,
        "locktime": 0,
        "vin": [
            {
                "txid": "af35c6df9bfdde63c085fa9eaab701106332494b7eb5b1f74dfdea0721f0ea39",
                "vout": 0,
                "scriptSig": {
                    "asm": "3045022100a2cae4f4b961ecf23deeb01b679ddce3dc53cf418b591e42b724998e588bc61202202735d7c23b9e8bb5b9371f61547b38f73ad060feae31f9f8e206a4207ab09378[ALL] 02649e331dbee371e569e278189d15065f0c0c7c7e8a355de64a02bf975882b32d",
                    "hex": "483045022100a2cae4f4b961ecf23deeb01b679ddce3dc53cf418b591e42b724998e588bc61202202735d7c23b9e8bb5b9371f61547b38f73ad060feae31f9f8e206a4207ab09378012102649e331dbee371e569e278189d15065f0c0c7c7e8a355de64a02bf975882b32d"
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
                    "asm": "OP_RETURN 486920534350206441707073",
                    "hex": "6a4c0c486920534350206441707073",
                    "type": "nulldata"
                }
            },
            {
                "value": 0.999996,
                "valueSat": 99999600,
                "n": 1,
                "scriptPubKey": {
                    "asm": "OP_DUP OP_HASH160 c35141b5def6fe8edc8f806b7a3221dbc7c356bc OP_EQUALVERIFY OP_CHECKSIG",
                    "hex": "76a914c35141b5def6fe8edc8f806b7a3221dbc7c356bc88ac",
                    "reqSigs": 1,
                    "type": "pubkeyhash",
                    "addresses": [
                        "sc49Bo2Y8NBy4ASB9Bb2Xh3kbqTtFfPrEw"
                    ]
                }
            }
        ],
        "hex": "020000000139eaf02107eafd4df7b1b57e4b4932631001b7aa9efa85c063defd9bdfc635af000000006b483045022100a2cae4f4b961ecf23deeb01b679ddce3dc53cf418b591e42b724998e588bc61202202735d7c23b9e8bb5b9371f61547b38f73ad060feae31f9f8e206a4207ab09378012102649e331dbee371e569e278189d15065f0c0c7c7e8a355de64a02bf975882b32dffffffff0201000000000000000f6a4c0c48692053435020644170707370dff505000000001976a914c35141b5def6fe8edc8f806b7a3221dbc7c356bc88ac00000000",
        "instantlock": true,
        "instantlock_internal": true,
        "chainlock": false
    }
}
```

</p>
</details>  
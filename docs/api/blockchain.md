# Blockchain API

**Raw mempool**

Returns the current raw mempool information.

```bash
GET /api/v1/blockchain/getrawmempool
```

Example: `curl -X GET "https://stakecubecoin.net/web3/scp/blockchain/getrawmempool"`

**Fullnode required**: YES

**Parameters**: NONE

<details>
<summary><strong>Example Response</strong></summary>
<p>

```json
[
    {
        "txid": "5a472cd62e7b7c3b83cefa85367b18e722ada2c10425ccb568f7b3ca7b1b9172",
        "version": 2,
        "type": 0,
        "size": 321,
        "locktime": 0,
        "vin": [
            {
                "txid": "99e754bdb68ea79932a1f72ef602da6bb80d218ac623643657a6c94e30a47c4e",
                "vout": 1,
                "scriptSig": {
                    "asm": "304402206520f2a4d8c6b5e5dfb587a3da375e7ae8186e0887e082b8722056379f2a0edc0220149b5d4692cb1b3d0780c4a921a34c5c24cd14bc7d852705c3e9b47c7acd2dd3[ALL] 03db40089f80199a5233368d7742d0370567f4c887ba9cc0c91980f4943b0a122f",
                    "hex": "47304402206520f2a4d8c6b5e5dfb587a3da375e7ae8186e0887e082b8722056379f2a0edc0220149b5d4692cb1b3d0780c4a921a34c5c24cd14bc7d852705c3e9b47c7acd2dd3012103db40089f80199a5233368d7742d0370567f4c887ba9cc0c91980f4943b0a122f"
                },
                "value": 19.99953984,
                "valueSat": 1999953984,
                "address": "sbQVsmW9uXsCXdd1YaRSLWYJfc4sn8msvv",
                "sequence": 4294967295
            }
        ],
        "vout": [
            {
                "value": 1e-8,
                "valueSat": 1,
                "n": 0,
                "scriptPubKey": {
                    "asm": "OP_RETURN 303633643133363335323864323936373063643862303534316533316139633264353365646666663630373034393062613136356439353639313131626332362073656e642033313138303232353039393530207351586645486a35634e7938377969386177566f796b3333776d484b6964736e3577",
                    "hex": "6a4c76303633643133363335323864323936373063643862303534316533316139633264353365646666663630373034393062613136356439353639313131626332362073656e642033313138303232353039393530207351586645486a35634e7938377969386177566f796b3333776d484b6964736e3577",
                    "type": "nulldata"
                }
            },
            {
                "value": 19.9995316,
                "valueSat": 1999953160,
                "n": 1,
                "scriptPubKey": {
                    "asm": "OP_DUP OP_HASH160 bc32b879df8c285ba703d64ffdcb8cc9fdfa9d07 OP_EQUALVERIFY OP_CHECKSIG",
                    "hex": "76a914bc32b879df8c285ba703d64ffdcb8cc9fdfa9d0788ac",
                    "reqSigs": 1,
                    "type": "pubkeyhash",
                    "addresses": [
                        "sbQVsmW9uXsCXdd1YaRSLWYJfc4sn8msvv"
                    ]
                }
            }
        ],
        "hex": "02000000014e7ca4304ec9a657366423c68a210db86bda02f62ef7a13299a78eb6bd54e799010000006a47304402206520f2a4d8c6b5e5dfb587a3da375e7ae8186e0887e082b8722056379f2a0edc0220149b5d4692cb1b3d0780c4a921a34c5c24cd14bc7d852705c3e9b47c7acd2dd3012103db40089f80199a5233368d7742d0370567f4c887ba9cc0c91980f4943b0a122fffffffff020100000000000000796a4c76303633643133363335323864323936373063643862303534316533316139633264353365646666663630373034393062613136356439353639313131626332362073656e642033313138303232353039393530207351586645486a35634e7938377969386177566f796b3333776d484b6964736e357708dd3477000000001976a914bc32b879df8c285ba703d64ffdcb8cc9fdfa9d0788ac00000000",
        "instantlock": true,
        "instantlock_internal": true,
        "chainlock": false
    },
    ...
]
```

</p>
</details>  
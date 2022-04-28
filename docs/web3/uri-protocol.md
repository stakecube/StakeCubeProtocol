# URI Protocol

Here you'll find documentation for all supported URI Requests for SCP Wallet; these can be used by Websites, DApps or even external desktop applications (games, apps, etc) to interact with a user's SCP Wallet.

From the browser, URI requests can be opened easily by navigating to the wallet's URI scheme, along with the request included.

So in a website, this would look like: `window.location = 'scp-wallet://'`, this request would simply open SCP Wallet without any further actions.

---

**Sign**

Prompts the user's SCP Wallet to sign a HEX-encoded message, this could be used to authenticate users into applications, or for proof of ownership over an NFT, or can be used simply as an 'agreement' method, a user signing a message will inherently agree to the message.

**Parameters**:

| Name | Mandatory | Description |
|---------|---------|---------|
| sign | YES | The HEX encoded message to sign |

Example: `scp-wallet://sign=68656c6c6f20776f726c6421`

Example Value: `hello world!`

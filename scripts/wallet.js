encryptWallet = async function(forcedPass = false) {
    // Encrypt the wallet WIF with AES-GCM and a user-chosen password - suitable for browser storage
    const cWallet = WALLET.getActiveWallet();
    const strWIF = cWallet.getPrivkey();
    const strEncWIF = await encrypt(strWIF, forcedPass);
    if (typeof strEncWIF !== 'string') return false;
    // Set the encrypted wallet and pubkey in DB
    const strPubkey = cWallet.getPubkey() || WALLET.sccjs.wallet.pubFromPriv(strWIF);
    cWallet.setKeys(strPubkey, null, strEncWIF);
    return strEncWIF;
};

decryptWallet = async function(forcedPass = false) {
    if (typeof forcedPass === 'string' && forcedPass.length === 0) return false;
    // Check if there's any encrypted WIF available, if so, prompt to decrypt it
    const cWallet = WALLET.getActiveWallet();
    const encWif = cWallet.getPrivkeyEnc();
    if (!encWif || encWif.length < 1) {
        console.log('No local encrypted wallet found!');
        return false;
    }
    const decWif = await decrypt(encWif, forcedPass);
    if (decWif === 'decryption failed!') {
        return false;
    }
    const pubkeyDeriv = cWallet.getPubkey() || WALLET.sccjs.wallet.pubFromPriv(decWif);
    cWallet.setKeys(pubkeyDeriv, decWif);
    return true;
};

hasEncryptedWallet = function() {
    return cWallet.getPrivkeyEnc().length > 0;
};

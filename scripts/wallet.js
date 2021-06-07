encryptWallet = async function (forcedPass = false) {
  // Encrypt the wallet WIF with AES-GCM and a user-chosen password - suitable for browser storage
  let cWallet = WALLET.getActiveWallet();
  let encWIF = await encrypt(cWallet.getPrivkey(), forcedPass);
  if (typeof encWIF !== "string") return false;
  // Set the encrypted wallet and pubkey in DB
  let pubkeyDeriv = cWallet.getPubkey() || WALLET.sccjs.pubFromPriv(cWallet.getPrivkey());
  cWallet.setKeys(pubkeyDeriv, null, encWIF);
  return encWIF;
}

decryptWallet = async function (forcedPass = false) {
  // Check if there's any encrypted WIF available, if so, prompt to decrypt it
  let cWallet = WALLET.getActiveWallet();
  let encWif = cWallet.getPrivkeyEnc();
  if (!encWif || encWif.length < 1) {
    console.log("No local encrypted wallet found!");
    return false;
  }
  let decWif = await decrypt(encWif, forcedPass);
  if (decWif === "decryption failed!") {
    return false;
  }
  let pubkeyDeriv = cWallet.getPubkey() || WALLET.sccjs.pubFromPriv(decWif);
  cWallet.setKeys(pubkeyDeriv, decWif);
  console.log("Decrypted Address: " + cWallet.getPubkey());
  return true;
}

hasEncryptedWallet = function () {
  return cWallet.getPrivkeyEnc().length > 0 ? true : false;
}
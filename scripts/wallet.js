//ByteToHexString Convertions
function byteToHexString(uint8arr) {
  if (!uint8arr) {
    return '';
  }
  var hexStr = '';
  for (var i = 0; i < uint8arr.length; i++) {
    var hex = (uint8arr[i] & 0xff).toString(16);
    hex = (hex.length === 1) ? '0' + hex : hex;
    hexStr += hex;
  }
  return hexStr.toUpperCase();
}
function hexStringToByte(str) {
  if (!str) {
    return new Uint8Array();
  }
  var a = [];
  for (var i = 0, len = str.length; i < len; i += 2) {
    a.push(parseInt(str.substr(i, 2), 16));
  }
  return new Uint8Array(a);
}

var MAP = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";//B58 Encoding Map
//B58 Encoding
var to_b58 = function (
  B,            //Uint8Array raw byte input
  A             //Base58 characters (i.e. "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz")
) {
  var d = [],   //the array for storing the stream of base58 digits
    s = "",   //the result string variable that will be returned
    i,        //the iterator variable for the byte input
    j,        //the iterator variable for the base58 digit array (d)
    c,        //the carry amount variable that is used to overflow from the current base58 digit to the next base58 digit
    n;        //a temporary placeholder variable for the current base58 digit
  for (i in B) { //loop through each byte in the input stream
    j = 0,                           //reset the base58 digit iterator
      c = B[i];                        //set the initial carry amount equal to the current byte amount
    s += c || s.length ^ i ? "" : 1; //prepend the result string with a "1" (0 in base58) if the byte stream is zero and non-zero bytes haven't been seen yet (to ensure correct decode length)
    while (j in d || c) {             //start looping through the digits until there are no more digits and no carry amount
      n = d[j];                    //set the placeholder for the current base58 digit
      n = n ? n * 256 + c : c;     //shift the current base58 one byte and add the carry amount (or just add the carry amount if this is a new digit)
      c = n / 58 | 0;              //find the new carry amount (floored integer of current digit divided by 58)
      d[j] = n % 58;               //reset the current base58 digit to the remainder (the carry amount will pass on the overflow)
      j++                          //iterate to the next base58 digit
    }
  }
  while (j--)        //since the base58 digits are backwards, loop through them in reverse order
    s += A[d[j]]; //lookup the character associated with each base58 digit
  return s          //return the final base58 string
}
//B58 Decoding
var from_b58 = function (
  S,            //Base58 encoded string input
  A             //Base58 characters (i.e. "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz")
) {
  var d = [],   //the array for storing the stream of decoded bytes
    b = [],   //the result byte array that will be returned
    i,        //the iterator variable for the base58 string
    j,        //the iterator variable for the byte array (d)
    c,        //the carry amount variable that is used to overflow from the current byte to the next byte
    n;        //a temporary placeholder variable for the current byte
  for (i in S) { //loop through each base58 character in the input string
    j = 0,                             //reset the byte iterator
      c = A.indexOf(S[i]);             //set the initial carry amount equal to the current base58 digit
    if (c < 0)                          //see if the base58 digit lookup is invalid (-1)
      return undefined;              //if invalid base58 digit, bail out and return undefined
    c || b.length ^ i ? i : b.push(0); //prepend the result array with a zero if the base58 digit is zero and non-zero characters haven't been seen yet (to ensure correct decode length)
    while (j in d || c) {               //start looping through the bytes until there are no more bytes and no carry amount
      n = d[j];                      //set the placeholder for the current byte
      n = n ? n * 58 + c : c;        //shift the current byte 58 units and add the carry amount (or just add the carry amount if this is a new byte)
      c = n >> 8;                    //find the new carry amount (1-byte shift of current byte value)
      d[j] = n % 256;                //reset the current byte to the remainder (the carry amount will pass on the overflow)
      j++                            //iterate to the next byte
    }
  }
  while (j--)               //since the byte array is backwards, loop through it in reverse order
    b.push(d[j]);      //append each byte to the result
  return new Uint8Array(b) //return the final byte array in Uint8Array format
}
var randArr = new Uint8Array(32) //create a typed array of 32 bytes (256 bits)
document.getElementById('dcfooter').innerHTML = '© Copyright StakeCube 2018-2021. All rights reserved. <br><a href="https://github.com/JSKitty/scc-web3">SCC Web Wallet - v' + wallet_version + '</a>';
//Wallet Import
importWallet = function (newWif = false) {
  if (walletAlreadyMade != 0) {
    var walletConfirm = window.confirm("Do you really want to import a new address? If you haven't saved the last private key, the key will get LOST forever alongside ANY funds with it.");
  } else {
    walletConfirm = true;
  }
  if (walletConfirm) {
    walletAlreadyMade++;
    //Wallet Import Format to Private Key
    var privateKeyWIF = newWif || document.getElementById("privateKey").value;
    privateKeyForTransactions = privateKeyWIF;
    if (!newWif) {
      document.getElementById("privateKey").value = "";
      toggleWallet();
    }
    var byteArryConvert = from_b58(privateKeyWIF, MAP)
    var droplfour = byteArryConvert.slice(0, byteArryConvert.length - 4);
    var key = droplfour.slice(1, droplfour.length);
    var privateKeyBytes = key.slice(0, key.length - 1);
    if (debug) {
      //WIF to Private Key
      console.log(byteToHexString(privateKeyWIF));
      console.log(byteToHexString(byteArryConvert));
      console.log(byteToHexString(droplfour));
      console.log(byteToHexString(privateKeyBytes));
    }
    //Public Key Generation
    var privateKeyBigInt = BigInteger.fromByteArrayUnsigned(Crypto.util.hexToBytes(byteToHexString(privateKeyBytes).toUpperCase()));
    var curve = EllipticCurve.getSECCurveByName("secp256k1");
    var curvePt = curve.getG().multiply(privateKeyBigInt);
    var x = curvePt.getX().toBigInteger();
    var y = curvePt.getY().toBigInteger();
    var publicKeyBytes = EllipticCurve.integerToBytes(x, 32);
    publicKeyBytes = publicKeyBytes.concat(EllipticCurve.integerToBytes(y, 32));
    publicKeyBytes.unshift(0x04);
    if (bitjs.compressed == true) {
      var publicKeyBytesCompressed = EllipticCurve.integerToBytes(x, 32)
      if (y.isEven()) {
        publicKeyBytesCompressed.unshift(0x02)
      } else {
        publicKeyBytesCompressed.unshift(0x03)
      }
      var pubKeyExtended = publicKeyBytesCompressed;
    } else {
      var pubKeyExtended = publicKeyBytes;
    }
    var publicKeyHex = byteToHexString(pubKeyExtended).toUpperCase()
    const pubKeyHashing = new jsSHA("SHA-256", "HEX", { "numRounds": 1 });
    pubKeyHashing.update(publicKeyHex);
    const pubKeyHash = pubKeyHashing.getHash("HEX");
    var pubKeyHashRipemd160 = byteToHexString(ripemd160(hexStringToByte(pubKeyHash))).toUpperCase()
    var pubKeyHashNetwork = PUBKEY_ADDRESS.toString(16) + pubKeyHashRipemd160;
    const pubKeyHashingS = new jsSHA("SHA-256", "HEX", { "numRounds": 2 });
    pubKeyHashingS.update(pubKeyHashNetwork);
    const pubKeyHashingSF = pubKeyHashingS.getHash("HEX").toUpperCase();
    var checksumPubKey = String(pubKeyHashingSF).substr(0, 8).toUpperCase()
    var pubKeyPreBase = pubKeyHashNetwork + checksumPubKey
    var pubKey = to_b58(hexStringToByte(pubKeyPreBase), MAP)
    publicKeyForNetwork = pubKey;
    console.log(pubKey);
    //Display Text
    document.getElementById('guiAddress').innerHTML = pubKey;
    document.getElementById('guiWallet').style.display = 'block';
    document.getElementById('PrivateTxt').innerHTML = privateKeyWIF;
    document.getElementById('guiAddress').innerHTML = pubKey;
    //QR Codes
    var typeNumber = 4;
    var errorCorrectionLevel = 'L';
    var qr = qrcode(typeNumber, errorCorrectionLevel);
    qr.addData(privateKeyWIF);
    qr.make();
    document.getElementById('PrivateQR').innerHTML = qr.createImgTag();
    var typeNumber = 4;
    var errorCorrectionLevel = 'L';
    var qr = qrcode(typeNumber, errorCorrectionLevel);
    qr.addData(pubKey);
    qr.make();
    document.getElementById('PublicQR').innerHTML = qr.createImgTag();
    document.getElementById('ModalQRLabel').innerHTML = 'scc:' + pubKey;
    let modalQR = document.getElementById('ModalQR');
    modalQR.innerHTML  = qr.createImgTag();
    modalQR.firstChild.style.width = "100%";
    modalQR.firstChild.style.height = "auto";
    modalQR.firstChild.style.imageRendering = "crisp-edges";
    document.getElementById('clipboard').value = pubKey;

    // Set view key as public and refresh QR code
    viewPrivKey = true;
    toggleKeyView();
    // Update identicon
    document.getElementById("identicon").dataset.jdenticonValue = publicKeyForNetwork;
    //jdenticon();
    if (!newWif) {
        // Hide the encryption warning
      document.getElementById('genKeyWarning').style.display = 'block';
    }
    // Load UTXOs from explorer
    if (networkEnabled)
      getUnspentTransactions();
  }
}

//Wallet Generation
generateWallet = async function (strPrefix = false) {
  if (walletAlreadyMade != 0 && strPrefix === false) {
    var walletConfirm = window.confirm("Do you really want to generate a new address? If you haven't saved the last private key the key will get lost forever and any funds with it.");
  } else {
    walletConfirm = true;
  }
  if (walletConfirm) {
    walletAlreadyMade++;
    if (debug) {
      var privateKeyBytes = hexStringToByte("FFE09E40CE1C5F7092801D2388347C552C408FC9056734E8273977E658BC201F");
    } else {
      var randArr = new Uint8Array(32)
      window.crypto.getRandomValues(randArr) //populate array with cryptographically secure random numbers
      var privateKeyBytes = []
      for (var i = 0; i < randArr.length; ++i)
        privateKeyBytes[i] = randArr[i]
    }
    //Private Key Generation
    var privateKeyHex = byteToHexString(privateKeyBytes).toUpperCase()
    var privateKeyAndVersion = SECRET_KEY.toString(16) + privateKeyHex + "01"
    const shaObj = new jsSHA("SHA-256", "HEX", { "numRounds": 2 });
    shaObj.update(privateKeyAndVersion);
    const hash = shaObj.getHash("HEX");
    var checksum = String(hash).substr(0, 8).toUpperCase()
    var keyWithChecksum = privateKeyAndVersion + checksum
    var privateKeyWIF = to_b58(hexStringToByte(keyWithChecksum), MAP)
    privateKeyForTransactions = privateKeyWIF;
    //Public Key Generation
    var privateKeyBigInt = BigInteger.fromByteArrayUnsigned(Crypto.util.hexToBytes(byteToHexString(privateKeyBytes).toUpperCase()));
    var curve = EllipticCurve.getSECCurveByName("secp256k1");
    var curvePt = curve.getG().multiply(privateKeyBigInt);
    var x = curvePt.getX().toBigInteger();
    var y = curvePt.getY().toBigInteger();
    var publicKeyBytes = EllipticCurve.integerToBytes(x, 32);
    publicKeyBytes = publicKeyBytes.concat(EllipticCurve.integerToBytes(y, 32));
    publicKeyBytes.unshift(0x04);
    if (bitjs.compressed == true) {
      var publicKeyBytesCompressed = EllipticCurve.integerToBytes(x, 32)
      if (y.isEven()) {
        publicKeyBytesCompressed.unshift(0x02)
      } else {
        publicKeyBytesCompressed.unshift(0x03)
      }
      var pubKeyExtended = publicKeyBytesCompressed;
    } else {
      var pubKeyExtended = publicKeyBytes;
    }
    var publicKeyHex = byteToHexString(pubKeyExtended).toUpperCase()
    const pubKeyHashing = new jsSHA("SHA-256", "HEX", { "numRounds": 1 });
    pubKeyHashing.update(publicKeyHex);
    const pubKeyHash = pubKeyHashing.getHash("HEX");
    var pubKeyHashRipemd160 = byteToHexString(ripemd160(hexStringToByte(pubKeyHash))).toUpperCase()
    var pubKeyHashNetwork = PUBKEY_ADDRESS.toString(16) + pubKeyHashRipemd160
    const pubKeyHashingS = new jsSHA("SHA-256", "HEX", { "numRounds": 2 });
    pubKeyHashingS.update(pubKeyHashNetwork);
    const pubKeyHashingSF = pubKeyHashingS.getHash("HEX").toUpperCase();
    var checksumPubKey = String(pubKeyHashingSF).substr(0, 8).toUpperCase()
    var pubKeyPreBase = pubKeyHashNetwork + checksumPubKey
    var pubKey = to_b58(hexStringToByte(pubKeyPreBase), MAP)
    publicKeyForNetwork = pubKey;
    //Debug Console
    if (debug && strPrefix === false) {
      console.log("Private Key")
      console.log(privateKeyHex)
      console.log("Private Key Plus Leading Digits")
      console.log(privateKeyAndVersion)
      console.log("Double SHA-256 Hash")
      console.log(hash)
      console.log('CheckSum')
      console.log(checksum)
      console.log('Key With CheckSum')
      console.log(keyWithChecksum)
      console.log('Private Key')
      console.log(privateKeyWIF)
      console.log('Public Key')
      console.log(publicKeyHex)
      console.log('Public Key Extened')
      console.log(byteToHexString(pubKeyExtended))
      console.log('SHA256 Public Key')
      console.log(pubKeyHash)
      console.log('RIPEMD160 Public Key')
      console.log(pubKeyHashRipemd160)
      console.log('PubKeyHash w/NetworkBytes')
      console.log(pubKeyHashNetwork)
      console.log('2x SHA256 Public Key Secound Time')
      console.log(pubKeyHashingSF)
      console.log("CheckSum Public Key")
      console.log(checksumPubKey)
      console.log("Pub Key with Checksum")
      console.log(pubKeyPreBase)
      console.log('Public Key Base 64')
      console.log(pubKey)
    }
    // VANITY ONLY: During a search, we don't update the DOM until a match is found, or the renderer consumes a shitload of resources.
    let nRet = {
      pubkey: null,
      privkey: null,
      vanity_match: false
    }
    if (strPrefix === false || (strPrefix !== false && pubKey.toLowerCase().startsWith(strPrefix))) {
      //Display Text
      document.getElementById('genKeyWarning').style.display = 'block';
      document.getElementById('PrivateTxt').innerHTML = privateKeyWIF;
      document.getElementById('guiAddress').innerHTML = pubKey;
      // New address... so there definitely won't be a balance
      document.getElementById('guiBalance').innerHTML = "0";
      document.getElementById('guiBalanceBox').style.fontSize = "x-large";
      //QR Codes
      var typeNumber = 4;
      var errorCorrectionLevel = 'L';
      var qr = qrcode(typeNumber, errorCorrectionLevel);
      qr.addData('scc:' + privateKeyWIF);
      qr.make();
      document.getElementById('PrivateQR').innerHTML = qr.createImgTag();
      document.getElementById('PrivateQR').style.display = 'none';
      var typeNumber = 4;
      var errorCorrectionLevel = 'L';
      var qr = qrcode(typeNumber, errorCorrectionLevel);
      qr.addData('scc:' + pubKey);
      qr.make();
      document.getElementById('PublicQR').innerHTML = qr.createImgTag();
      document.getElementById('PublicQR').style.display = 'block';
      document.getElementById('ModalQRLabel').innerHTML = 'scc:' + pubKey;
      let modalQR = document.getElementById('ModalQR');
      modalQR.innerHTML  = qr.createImgTag();
      modalQR.firstChild.style.width = "100%";
      modalQR.firstChild.style.height = "auto";
      modalQR.firstChild.style.imageRendering = "crisp-edges";
      document.getElementById('clipboard').value = pubKey;

      // Update identicon
      document.getElementById("identicon").dataset.jdenticonValue = publicKeyForNetwork;
      //jdenticon();
      
      document.getElementById('guiWallet').style.display = 'block';
      viewPrivKey = false;
      // VANITY ONLY: If we reached here during a vanity search, we found our match!
      nRet.pubkey       = pubKey;
      nRet.privkey      = privateKeyWIF;
      nRet.vanity_match = true;
    }
    return nRet;
  }
}

encryptWallet = async function () {
  // Encrypt the wallet WIF with AES-GCM and a user-chosen password - suitable for browser storage
  let encWIF = await encrypt(privateKeyForTransactions);
  if (typeof encWIF !== "string") return false;
  // Set the encrypted wallet in localStorage
  localStorage.setItem("encwif", encWIF);
  // Hide the encryption warning
  document.getElementById('genKeyWarning').style.display = 'none';
}

decryptWallet = async function () {
  // Check if there's any encrypted WIF available, if so, prompt to decrypt it
  let encWif = localStorage.getItem("encwif");
  if (!encWif || encWif.length < 1) {
    console.log("No local encrypted wallet found!");
    return false;
  }
  let decWif = await decrypt(encWif);
  if (decWif === "decryption failed!") {
    alert("Incorrect password!");
    return false;
  }
  importWallet(decWif);
  return true;
}

hasEncryptedWallet = function () {
  return localStorage.getItem("encwif") ? true : false;
}
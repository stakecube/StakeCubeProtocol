function createRawTransaction() {
  var trx = bitjs.transaction();
  var txid = document.getElementById("prevTrxHash").value;
  var index = document.getElementById("index").value;
  var script = document.getElementById("script").value;
  trx.addinput(txid,index,script);
  var address = document.getElementById("address1").value;
  var value = document.getElementById("value1").value;
  trx.addoutput(address,value);
  var address = document.getElementById("address2").value;
  var value = document.getElementById("value2").value;
  trx.addoutput(address,value);
  var wif = document.getElementById("wif").value;
  var textArea = document.getElementById("rawTrx");
  textArea.value = trx.sign(wif,1); //SIGHASH_ALL DEFAULT 1 
  
}
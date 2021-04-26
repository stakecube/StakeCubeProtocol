var coinArray = [];
function refreshCoinSelector() {
  coinArray = [];
  $('.vodiapicker option').each(function () {
    var img = $(this).attr("data-thumbnail");
    var text = this.innerText;
    var value = $(this).val();
    var item = '<li onclick="setCoinSelector(\'' + img + '\', \'' + text + '\', \'' + value + '\')" style="cursor: pointer;"><img  src="' + img + '" value="' + value + '"/><span>' + text + '</span></li>';
    coinArray.push(item);
  });
  $('#a').html(coinArray);
}

// Initial refresh
refreshCoinSelector();


//Set the button value to the first el of the array
$('.btn-select').html(coinArray[0]);
$('.btn-select').attr('value', 'scc');

//change button stuff on click
function setCoinSelector(img, text, value) {
  var item = '<li><img src="' + img + '"/><span>' + text + '</span></li>';
  $('.btn-select').html(item);
  $('.btn-select').attr('value', value);
  $(".b").toggle();
}

$(".btn-select").click(function () {
  $(".b").toggle();
});
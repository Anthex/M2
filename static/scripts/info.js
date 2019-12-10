var t1, t2; //timeouts for info and error displays

function displayInfo(text='Success', time=3000){
    clearTimeout(t1);
    clearTimeout(t2);
    [].forEach.call(document.querySelectorAll('.dialog'),function(e){
        e.parentNode.removeChild(e);
      });
    $('<div id="success" class="dialog"></div>').hide().appendTo('body')
    .html(text)
    .show();

    t1 = setTimeout(function() {
        $('#success').fadeOut('slow');
    }, time);
    t2 = setTimeout(function() {
        $('#success').remove();
    }, time+1000);
};

function displayError(text='Error', time=3000){
    clearTimeout(t1);
    clearTimeout(t2);
    [].forEach.call(document.querySelectorAll('.dialog'),function(e){
        e.parentNode.removeChild(e);
      });
    $('<div id="error" class="dialog"></div>').hide().appendTo('body')
    .html(text)
    .show();

    t1 = setTimeout(function() {
        $('#error').fadeOut('slow');
    }, time);
    t2 = setTimeout(function() {
        $('#error').remove();
    }, time+1000);
};
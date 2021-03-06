$("head").append('<script type="text/javascript" src="static/scripts/info.js"></script>');
$(document).ready(function(){
    $('#u2').focus();
    $('#s1, #p1, #u1').keypress(function(e){
      if(e.keyCode==13)
      $('#send_signup').click();
    });
    $('#s2, #u2').keypress(function(e){
        if(e.keyCode==13)
        $('#send_login').click();
      });
});

function signup(){
    var username = document.getElementById("u1").value;
    var pass1 = document.getElementById("p1").value;
    var pass2 = document.getElementById("s1").value;
    var enc;
    $("input").removeClass("false");

    if (username){
        if (pass1){
            if(pass1 == pass2){
                scrypt_module_factory(function (scrypt) {
                    enc = (scrypt.crypto_scrypt(scrypt.encode_utf8(pass1),
                    scrypt.encode_utf8("sel"),
                    16384, 8, 1, 64));
                    enc = scrypt.to_hex(enc);
                    $.ajax({
                        url: '/register?username='+username+'&pass_hash='+enc,
                        type: 'post',
                        success: function (data) {
                            displayInfo('Registered successfully');
                            setCookie("token", data);
                            document.getElementById("u2").value = username;
                            document.getElementById("s2").value = pass1;
                            login();
                        },
                        error: function (data) {
                            displayError('Could not register user : ' + data.responseText);
                        },
                    });
                });
            }else{
                displayError("Passwords don't match");
                $("#s1").addClass("false");
            }
        }else{
            displayError("Please enter a password");
            $("#p1").addClass("false");
        }
    }else{
        displayError("Username is empty");
        $("#u1").addClass("false");
    }
}

function login(){
    var username = document.getElementById("u2").value;
    var password = document.getElementById("s2").value;
    var enc;
    $("input").removeClass("false");
    
    if(username){
        if(password){
            scrypt_module_factory(function (scrypt) {
                enc = (scrypt.crypto_scrypt(scrypt.encode_utf8(password),
                scrypt.encode_utf8("sel"),
                16384, 8, 1, 64));
                enc = scrypt.to_hex(enc);
                $.ajax({
                    url: '/authenticate',
                    type: 'get',
                    data: $.param({
                        username:username,
                        password_hash:enc
                    }),
                    success: function (data) {
                        displayInfo('Logged in!');
                        setCookie("token", data, 1);
                        setCookie("username", username, 1);
                        setTimeout(function() {
                            window.location.href = "/"
                        }, 500);
                    },
                    error: function (data) {
                        displayError(data.responseText);
                    },
                });
            });
        }else{
            displayError("Please enter your password");
            $("#s2").addClass("false");
        }
    }else{
        displayError("Please enter your username");
        $("#u2").addClass("false");
    }
}
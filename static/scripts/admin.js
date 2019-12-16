$("head").append('<script type="text/javascript" src="static/scripts/info.js"></script>');
$.ajax({
    url: '/getUsers.json',
    type: 'get',
    success: function (data) {
        users = JSON.parse(data)
        displayUsers(users);
    },
    error: function (data) {
        displayError("Error : could not get number of notifications");
        console.log(data);
    },
});

function displayUsers(usersJSON){
    console.log(usersJSON);
    for (u in usersJSON){
        addColumn(usersJSON[u]);
    }
}

function addColumn(user){
    /*
    $('#usersDiv').append('<p id="' + user.id + '">' + 
        user.id + ' ' 
        + user.username 
        + ' permissions : ' + user.permissions['is_admin'] + user.permissions['can_view_map'] + user.permissions['can_edit_features'] + user.permissions['can_beep']  
        + ' requests : ' + user.requests['req_admin'] + user.requests['req_edit'] + user.requests['req_beep']
        +'</p>'); */

    $('#usersTable').append('<tr id="' + user.id + '"><td>' + 
        user.id + '</td><td style="font-weight:bold;"> ' 
        + user.username 
        + '</td><td>' + user.permissions['is_admin'] 
        //+ '</td><td>' +user.permissions['can_view_map'] 
        + '</td><td>' +user.permissions['can_edit_features'] 
        + '</td><td>' +user.permissions['can_beep']  
        + '</td><td>' + (user.requests['req_admin']?"<span class='perm'>Admin</span> ":"") + (user.requests['req_edit']?" <span class='perm'>Edit</span> ":"") + (user.requests['req_beep']?" <span class='perm'>Beep</span> ":"")
        +'</td></tr>');


    if (user.requests['req_admin'] + user.requests['req_edit'] + user.requests['req_beep']){
        $('#'+user.id).append('<td><a class="approve" href="javascript:void(0)" onClick="approveUser(' + user.id + ')"> approve </a>  <a class="deny" href="javascript:void(0)" onClick="denyUser(' + user.id + ')"> deny </a></td>');
    }else{
        $('#'+user.id).append('<td>no action needed</td');
    }
    $('#'+user.id).append('<td><a class="revoke" href="javascript:void(0)" onClick="revokeUserPrivileges(' + user.id + ')"> revoke </a><a class="delete" href="javascript:void(0)" onClick="deleteUser(' + user.id + ')"> delete </a></td>');

    
}

function approveUser(uid){
    $.ajax({
        url: '/approvePermissions?id=' + uid  + '&username=' + getCookie("username") + '&token=' + getCookie("token"),
        type: 'get',
        success: function (data) {
            displayInfo("Successfully accepted");
            window.location.reload();
        },
        error: function (data) {
            displayError("Error : could not approve user : " + data.statusText);
            console.log(data);
        },
    });
}

function denyUser(uid){
    $.ajax({
        url: '/denyPermissions?id=' + uid  + '&username=' + getCookie("username") + '&token=' + getCookie("token"),
        type: 'get',
        success: function (data) {
            displayInfo("Successfully denied");
            window.location.reload();
        },
        error: function (data) {
            displayError("Error : could not deny user : " + data.statusText);
            console.log(data);
        },
    });
}

function revokeUserPrivileges(uid){
    $.ajax({
        url: '/revokeUser?id=' + uid  + '&username=' + getCookie("username") + '&token=' + getCookie("token"),
        type: 'get',
        success: function (data) {
            displayInfo("Successfully revoked");
            window.location.reload();
        },
        error: function (data) {
            displayError("Error : could not revoke user : " + data.statusText);
            console.log(data);
        },
    });
}

function deleteUser(uid){
    $.ajax({
        url: '/deleteUser?id=' + uid  + '&username=' + getCookie("username") + '&token=' + getCookie("token"),
        type: 'get',
        success: function (data) {
            displayInfo("Successfully deleted");
            window.location.reload();
        },
        error: function (data) {
            displayError("Error : could not delete user : " + data.statusText);
            console.log(data);
        },
    });
}
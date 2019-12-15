//leaflet layers
var map = L.map('mapid',{zoomControl: false, attributionControl: false}).setView([47.6426253, 6.8431032], 18);
var heat;
var HistoryLayer;
var HistoryPathLayer;
var TMLayer;
var heatpoints = [];
var firstShow = true; //dirty hack because hasLayer doesn't work, see if better workaround possible

//load other js files
$("head").append('<script type="text/javascript" src="static/scripts/info.js"></script>');
$("head").append('<script type="text/javascript" src="static/scripts/cookies.js"></script>');

$(document).ready(function(){
    username = getCookie("username");
    if (username){
        displayInfo("Logged in as " + username + "<br/><a href='javascript:void(0)' onclick='logout()'>log out</a>");
        $('#controls').append('<a class="button" onclick="logout()" href="javascript:void(0)"> Log out </a>');
        $('#attr').append("Logged in as " + username);
        var nbNotifs = 9;
        if(username == 'admin'){
            $.ajax({
                url: '/getPendingUsersNumber',
                type: 'get',
                success: function (data) {
                    nbNotifs = data;
                    $('#controls').append('<a nn="'+data.toString()+'" id="btn_adm" class="button adminPanelShowButton" onclick="showAdminPanel()" href="javascript:void(0)"> Admin panel </a>');
                    if(data!=0) $('#btn_adm').addClass("new_notifications");
                },
                error: function (data) {
                    displayError("Error : could not get number of notifications");
                    console.log(data);
                },
            });

        }
    }else{
        displayError("You are not logged in<br/><a href='/login'>log in</a>");
        $('#controls').append('<a class="button" href="/login"> Login </a>');
        $('#attr').append("Not logged in");
    }
});

var mapboxlayer = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
    maxZoom: 24,
    id: 'mapbox.streets'
});

var mapboxlightlayer = L.tileLayer('https://api.mapbox.com/styles/v1/anthex/ck3vz7gim2dtk1cmw9fq9by6t/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiYW50aGV4IiwiYSI6ImNrMmhxczQyMjEyb3kzYnA1dGVyZXlmbWIifQ.aC6F9_xNFDHnRcN9Y4ML0g', {
    maxZoom: 24,
});

var osmlayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        maxZoom: 19
});


map.addLayer(mapboxlightlayer)
updateTMLocations();

function onEachTM(feature, layer) {
    //layer.bindPopup('Terminal #'.concat(feature.properties.id.toString(), '<br/>Name : ', feature.properties.name,'<br/><a href=javascript:void(0)', /*feature.properties.id.toString(),*/ '>Beep</a><br/>', feature.properties.timestamp));
    layer.on('click', function (e) {
        document.getElementById("info").innerHTML = 'Terminal #'.concat(feature.properties.id.toString(), 
        '<br/>Name : ', 
        feature.properties.name,'<br/>', 
        feature.properties.timestamp, 
        '<br/><a class="infoButton"href=javascript:void(0) onclick=changeTerminalName(', feature.properties.id, ') >Change terminal name</a>',
        '<br/><a class="infoButton"href=javascript:void(0) onclick=sendBeepDialog(', feature.properties.id, ') >Play sound</a>');
    });
    layer.bindTooltip(feature.properties.name, {
        permanent: false, 
        direction: 'left',
        className: "tt_tm",
        offset: [0,0]
    })
    layer.on({
        click: showHistory
    });
}

function onEachGateway(feature, layer) {
    layer.bindPopup('GW#' + feature.properties.id.toString() + '<br/><a class="button" id="updateLocation" onclick="updateGatewayLocations()" href="javascript:void(0)"> update GW locations </a>');
}

function onEachHistoryPoint(feature, layer) {
    //heat = L.heatLayer(geoJson2heat(feature)).addTo(map);
    heatpoints.push([feature.geometry.coordinates[1],feature.geometry.coordinates[0], feature.properties.record_id/7+.5]);
    //console.log(feature);
    layer.bindPopup('Terminal #'.concat(feature.properties.id.toString(),'<br/>record #',feature.properties.record_id, '<br/>',feature.properties.timestamp));
}

function showMB(){
    map.removeLayer(osmlayer);
    map.removeLayer(mapboxlayer);
    map.addLayer(mapboxlayer);
}

function darkMode(){
    map.removeLayer(mapboxlayer);
    map.removeLayer(osmlayer);
    map.addLayer(mapboxlightlayer);
}

function showOSM(){
    map.removeLayer(mapboxlayer);
    map.addLayer(osmlayer);
}


function updateGatewayLocations(message) {
    var username = getCookie("username");
    var token = getCookie("token");
    if (username && token){
        result = false;
        $('<div class="dialogBox"></div>').appendTo('body')
            .html('<div id="diagContent"><img src="static/images/caution.png", height=52px, width=52px></img>Any Available history for devices will be lost. This action cannot be undone.</div>')
            .dialog({
            title: 'Confirm Gateway repositionning',
            autoOpen: true,
            width: 400,
            resizable: false,
            buttons: {
                Confirm: function() {
                result = true;
                console.log(GWLayer._layers);
                var GWInfo = [];
                for (var i in GWLayer._layers) {
                    var l = GWLayer._layers[i].feature.properties.id;
                    var item = {l : GWLayer._layers[i].getLatLng()};
                    GWInfo.push(item);
                }
                console.log(JSON.stringify(GWInfo));
                $.ajax({
                    url: '/updateGWLocations?username='+username+'&token='+token,
                    type: 'post',
                    //dataType: 'json',
                    contentType: 'application/json',
                    success: function (data) {
                        displayInfo('Gateways positions successfully updated');
                    },
                    error: function (data) {
                        displayError('Could not update database : ' + data.responseText);
                    },
                    data: JSON.stringify(GWInfo)
                });
                $(this).dialog("close");
                },
                Cancel: function() {
                $(this).dialog("close");
                }
            },
            close: function(event, ui) {
                $(this).remove();
            }
            });
        }else{
            displayError("You need to be logged in to perform this action</br><a href='/login'>log in</a>");
        }
    };

function createCustomIcon (feature, latlng) {
    let myIcon = L.icon({
        iconUrl: 'static/images/gw.png',
        iconSize:     [25, 25], // width and height of the image in pixels
        iconAnchor:   [12, 12], // point of the icon which will correspond to marker's location
        popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
    })
    return L.marker(latlng, { icon: myIcon , draggable:true}).bindTooltip(feature.properties.id.toString(), {
        permanent: true, 
        direction: 'left',
        className: "tt",
        offset: [0,-15]
    })
    }

let options = {
    onEachFeature: onEachGateway,
    pointToLayer: createCustomIcon
    }


$.ajax({
    type: "GET",
    url: '/getGatewayPositions',
    dataType: 'json',
    success: function (response) {
        GWLayer = L.geoJson(response, options).addTo(map);
        map.fitBounds(GWLayer.getBounds());}
});

/* //alternative : use vector instead of icons

var GWStyle = {
"fillColor": "#00ffff",
"weight": 2,
"opacity": 0.5,
"radius": 5
};

$.ajax({
    type: "GET",
    url: '/getGatewayPositions',
    dataType: 'json',
    success: function (response) {
        GWLayer = L.geoJson(response, {
pointToLayer: function (feature, latlng) {
    return L.circleMarker(latlng, GWStyle);
}}
).addTo(map);}
});
*/

var TMStyle = {
"fillColor": "#0066ff",
"color": "transparent",
"weight": 40,
"opacity": 1,
"fillOpacity":1,
"radius": 8,
"className":"tm"
};

function updateTMLocations(){
    if (map.hasLayer(TMLayer)){
        map.removeLayer(TMLayer);
    }
    $.ajax({
        type: "GET",
        url: '/getTerminalPositions',
        dataType: 'json',
        success: function (response) {
            TMLayer = L.geoJson(response, {onEachFeature: onEachTM, 
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, TMStyle);
    }}
    ).addTo(map);
            //map.fitBounds(TMLayer.getBounds());
        }
    });
}



var historyStyle = {
    "fillColor": "#000",
    "opacity": .8,
    "fillOpacity":.3,
    "radius": 5,
    "className": "historyPoint",
    "color": "transparent",
    "weight": 10
    };

var pathStyle = {
    "color": "#0092cc",
    "weight": 4,
    "opacity": 0.7,
    "smoothFactor":1,
    "className":"historyPath"
    };

function showHistory(e) {
    if (!firstShow){
        map.removeLayer(heat);
        map.removeLayer(HistoryPathLayer);
        map.removeLayer(HistoryLayer);
    }else{
        firstShow = false;
    }
    heatpoints = [];
    $.ajax({
        type: "GET",
        url: '/history_path?id='.concat(e.target.feature.properties.id.toString()),
        dataType: 'json',
        success: function (response) {
        HistoryLayer = L.geoJson(response, {style:pathStyle});
        //map.fitBounds(TMLayer.getBounds());
        }});
    $.ajax({
        type: "GET",
        url: '/history?id='.concat(e.target.feature.properties.id.toString()),
        dataType: 'json',
        success: function (response) {
        HistoryPathLayer = L.geoJson(response, {onEachFeature: onEachHistoryPoint, 
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, historyStyle);
    }}
    );
    L.circleMarker(e.latlng, {"className": "activeTM"}).addTo(HistoryPathLayer);
    heat = L.heatLayer(heatpoints,{radius: 35, minOpacity:.2, blur:25, gradient:{0.4: '#0e85e7', 0.65: '#f9ffbf', 1: '#fa004b'}});
    //HistoryLayer.addTo(map);
    HistoryPathLayer.addTo(map);
    heat.addTo(map);

            //map.fitBounds(TMLayer.getBounds());
        }
    });

}
function onMapClick(e) {
    /*
    if (!firstShow){
        map.removeLayer(heat);
        map.removeLayer(HistoryPathLayer);
        map.removeLayer(HistoryLayer);
    }
    */
}

map.on('click', onMapClick);

function geoJson2heat(geojson, intensity) {
    return geojson.features.map(function(feature) {
        return [
        feature.geometry.coordinates[0][1],
        feature.geometry.coordinates[0][0],
        feature.properties[intensity]
        ];
    });
    }



function sendBeepDialog(id){
    getTMNameById(TMLayer);
    $('<div class="dialogBox"></div>').appendTo('body')
        .html('<div id="diagContent">Play sound on <span  style="font-weight:bold">' + getTMNameById(id) + '</span>?</div>')
        .dialog({
        title: 'Confirm sound request',
        autoOpen: true,
        width: 400,
        resizable: false,
        buttons: {
            Yes: function() {
                //SEND AJAX REQUEST HERE
                $(this).dialog("close");
                displayInfo("Sound request sent, the device will beep for 1 minute <br/><a href='#' onclick='cancelBeepRequest(" + id.toString() + ")'>cancel</a>", 10000);
            },
            No: function() {
                $(this).dialog("close");
            }
        },
        close: function(event, ui) {
            $(this).remove();
        }
        });
};

function cancelBeepRequest(id){
    displayError("Cancel requested on terminal " + id.toString() + "<br/>Not yet implemented", 5000);
}

function getTMNameById(id,layer=TMLayer){
    for(var feat in layer._layers){
        if(layer._layers[feat].feature.properties.id == id){
            return layer._layers[feat].feature.properties.name;
        }
    }
    return null;
}

function changeTerminalName(id){
    var username = getCookie("username");
    var token = getCookie("token");
    if (username && token){
    $('<div class="dialogBox"></div>').appendTo('body')
        .html('<div id="diagContent">Change name of <span  style="font-weight:bold">' + getTMNameById(id) + '</span> to : <input placeholder="New name" type="text" autocomplete="off" id="newName"></div>')
        .dialog({
        title: 'Confirm name Change',
        autoOpen: true,
        width: 400,
        resizable: false,
        buttons: {
            Confirm: function() {
                var newName = document.getElementById("newName").value;
                if (newName){
                    console.log(id, newName);
                    $.ajax({
                    url: '/updateName',
                    type: 'get',
                    data: $.param({
                        id:id,
                        newName:newName,
                        username:username,
                        token:token
                    }),
                    success: function (data) {
                        displayInfo('Name changed successfully');
                        setTimeout(function() {
                            updateTMLocations();
                        }, 0);
                    },
                    error: function (data) {
                        displayError('Could not change name : ' + data.responseText);
                    },
                });
                    $(this).dialog("close");
                }else{
                    displayError("Name must not be empty");
                }
            },
            Cancel: function() {
                $(this).dialog("close");
            }
        },
        close: function(event, ui) {
            $(this).remove();
        }
        });
    }else{
        displayError("You need to be logged in to perform this action</br><a href='/login'>log in</a>");
    }
}

function displaySettings(){
    var username = getCookie("username");
    var token = getCookie("token");
    $('<div class="dialogBox settings"></div>').appendTo('body')
        .html('<table><thead> <tr> <th>Key</th><th>Value</th> </tr></thead> ' + 
        '<tbody> <tr> <td>Setting</td><td>Value</td></tr><tr> ' + 
        '<td>Setting</td><td>Value</td></tr></tbody></table>' + 
        '<p style="font-weight:bold"> user : ' + username + '</p>' +
        '<p style="font-weight:bold" id="perm">Permissions : </p>' +
        '<a href="javascript:void(0)" class="infoButton" onclick="requestNewPermissions()">Request new permissions</a>' +
        '<div id="pending"></div>')
        .dialog({
        title: 'Settings',
        autoOpen: true,
        width: 400,
        resizable: false,
        buttons: {
            Apply: function() {
                displayInfo("No changes made");
                $(this).dialog("close");
            },
            Cancel: function() {
                $(this).dialog("close");
            }
        },
        close: function(event, ui) {
            $(this).remove();
        }
        });
        if (username && token){
    $.ajax({
        url: '/getPermissions?username='+username+'&token='+token,
        type: 'get',
        success: function (data) {
            $('#perm').append(data);
        },
        error: function (data) {
            $('#perm').append("Error : could not get permissions");
            console.log(data)
        },
    });
    $.ajax({
        url: '/getPermissionsPending?username='+username+'&token='+token,
        type: 'get',
        success: function (data) {
            if (data == '1'){
                $('#pending').append("<p style='font-weight:bold; color:#ff3c00'>New permissions pending approval by admin</p>");
            }else{
                //no nothing?
            }
            console.log(data);
        },
        error: function (data) {
            console.log("could not fetch permission pending status", data)
        },
    });}else{

    }
    }

function logout(){
    //send revocation request to server
    eraseCookie("username");
    eraseCookie("token");
    document.location.reload();
}

function requestNewPermissions(){
    var username = getCookie("username");
    var token = getCookie("token");
    if (username && token){
    $('<div class="dialogBox"></div>').appendTo('body')
            .html('<h3>Select the permissions you want to request</h3>' + 
            '<input type="checkbox" id="admin_checkbox"></input><label for="admin_checkbox">Administration</label><br/>' +
            '<input type="checkbox" id="edit_checkbox"></input><label for="edit_checkbox">Edition</label><br/>' +
            '<input type="checkbox" id="beep_checkbox"></input><label for="beep_checkbox">Sound request</label><br/>')
            .dialog({
            title: 'Request new Permissions',
            autoOpen: true,
            width: 400,
            resizable: false,
            buttons: {
                Request: function() {
                    var adminRequest = $('#admin_checkbox').is(":checked")
                    var editRequest = $('#edit_checkbox').is(":checked") 
                    var beepRequest = $('#beep_checkbox').is(":checked")
                $.ajax({
                    url: '/requestNewPermissions?username='+username+'&token='+token+'&admin='+adminRequest+'&edit='+editRequest+'&beep='+beepRequest,
                    type: 'post',
                    success: function (data) {
                        displayInfo('Request sent');
                    },
                    error: function (data) {
                        displayError('Could not send request : ' + data.responseText);
                    },
                });
                $(this).dialog("close");
                },
                Cancel: function() {
                $(this).dialog("close");
                }
            },
            close: function(event, ui) {
                $(this).remove();
            }
            });
        }else{
            displayError("You need to be logged in to perform this action</br><a href='/login'>log in</a>");
        }
}

function showAdminPanel(){
    document.location = "/adminPanel?username=" + getCookie("username") + "&token=" + getCookie("token");

}

console.log(getCookie("token"));
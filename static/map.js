
	var map = L.map('mapid',{attributionControl: false}).setView([47.6426253, 6.8431032], 18);
    
	var mapboxlayer = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
		maxZoom: 24,
		id: 'mapbox.streets'
    });
    
    var mapboxdarklayer = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
		maxZoom: 24,
		id: 'mapbox.dark'
	});
    
    var osmlayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            maxZoom: 19
    });
    

    map.addLayer(mapboxdarklayer)

    function onEachFeature(feature, layer) {
		layer.bindPopup('Terminal #'.concat(feature.properties.id.toString(), '<br/>Name : ', feature.properties.name,'<br/><a href=#"', feature.properties.id.toString(), '">Beep</a><br/>', feature.properties.timestamp));
        layer.on({
            click: showHistory
        });
    }
    
    function onEachGateway(feature, layer) {
		layer.bindPopup('GW#' + feature.properties.id.toString() + '<br/><a class="button" id="updateLocation" onclick="updateGatewayLocations()" href="javascript:void(0)"> update GW locations </a>');
	}
    
    function onEachHistoryPoint(feature, layer) {
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
        map.addLayer(mapboxdarklayer);
    }

    function showOSM(){
        map.removeLayer(mapboxlayer);
        map.addLayer(osmlayer);
    }
    
    
    function updateGatewayLocations(message) {
        result = false;
        $('<div class="dialogBox"></div>').appendTo('body')
          .html('<div id="diagContent"><img src="static/images/caution.png", height=52px, width=52px></img>Any Available history for devices will be lost. This action cannot be undone.</div>')
          .dialog({
            title: 'Confirm Gateway repositionning',
            autoOpen: true,
            width: 400,
            resizable: false,
            buttons: {
              Yes: function() {
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
                    url: '/updateGWLocations',
                    type: 'post',
                    dataType: 'json',
                    contentType: 'application/json',
                    success: function (data) {
                        $('#target').html(data.msg);
                    },
                    data: JSON.stringify(GWInfo)
                });
                $(this).dialog("close");
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

    function createCustomIcon (feature, latlng) {
        let myIcon = L.icon({
          iconUrl: 'static/images/gw.png',
          iconSize:     [25, 25], // width and height of the image in pixels
          iconAnchor:   [12, 12], // point of the icon which will correspond to marker's location
          popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
        })
        return L.marker(latlng, { icon: myIcon , draggable:true})
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
            GWLayer = L.geoJson(response, options).addTo(map);}
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
    "fillColor": "#34aeeb",
    "color": "#4a4a4a",
	"weight": 0,
    "opacity": 1,
    "fillOpacity":1,
    "radius": 6
    };
   

    $.ajax({
        type: "GET",
        url: '/getTerminalPositions',
        dataType: 'json',
        success: function (response) {
            TMLayer = L.geoJson(response, {onEachFeature: onEachFeature, 
	pointToLayer: function (feature, latlng) {
		return L.circleMarker(latlng, TMStyle);
    }}
    ).addTo(map);
            //map.fitBounds(TMLayer.getBounds());
        }
    });


    
    var historyStyle = {
        "fillColor": "#00aaaa",
        "color": "#4a4a4a",
        "weight": 0,
        "opacity": .5,
        "fillOpacity":.5,
        "radius": 3
        };
    
    var pathStyle = {
        "color": "#5eff64",
        "weight": 3,
        "opacity": 0.5,
        "smoothFactor":1
    };

    var firstShow = true; //dirty hack because hasLayer doesn't work, see if better workaround possible
    function showHistory(e) {
        if (!firstShow){
            map.removeLayer(HistoryLayer);
            map.removeLayer(HistoryPathLayer);
        }else{
            firstShow = false;
        }

        $.ajax({
            type: "GET",
            url: '/history_path?id='.concat(e.target.feature.properties.id.toString()),
            dataType: 'json',
            success: function (response) {
            HistoryLayer = L.geoJson(response, {style:pathStyle}).addTo(map);
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
        ).addTo(map);
                //map.fitBounds(TMLayer.getBounds());
            }
        });

    }
	function onMapClick(e) {
        //map.removeLayer(TMLayer);
	}

	map.on('click', onMapClick);

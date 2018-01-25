/**
 * Ryan Guinn and Brandon Jackson
 */
var map = null;	        // a Google Map object
var timer = null;       // an interval timer
var gmarkers = [];

$(document).ready(function() {      // when document loads, do some initialization
	  "use strict";
    var startPoint = new google.maps.LatLng(43.044240, -87.906446);// location of MSOE athletic field
    displayMap(startPoint); // map this starting location (see code below) using Google Maps
    addMarker(map, startPoint, "MSOE Athletic Field", "The place to be!", false);  // add a push-pin to the map

    // initialize button event handlers (note this shows an alternative to $("#id).click(handleClick)
    $("#update").on( "click", doAjaxRequest);
});

// Display a Google Map centered on the specified position. If the map already exists, update the center point of the map per the specified position
// param position - a google.maps.LatLng object containing the coordinates to center the map around
function displayMap(position) {
	  "use strict";
	      var mapOptions = {
        zoom: 13, // range 0 to 21 (the mouse can be used to zoom in and out)
        center: position, // the position at the center of the map
        mapTypeId: google.maps.MapTypeId.ROADMAP // ROADMAP, SATELLITE, or HYBRID
    };
    var mapDiv = $("#map").get(0); // get the DOM <div> element underlying the jQuery result
    if(map===null) { // create just once
        map = new google.maps.Map(mapDiv, mapOptions); // create a map if one doesn't exist
    }
    else {
        map.panTo(position); // otherwise, pan the existing map to the specified position
    }
}

// This function adds a "push-pin" marker to the existing map
// param map - the map to add the marker to
// param position - the google.maps.LatLng position of the marker on the map
// param title - the title of the marker
// param content - the text that appears when a user clicks on the marker
function addMarker(map, position, title, content) {
	  "use strict";
	      var markerOptions = {
              position: position, // position of the push-pin
              map: map,	// the map to put the pin into
              title: title, // title of the pin
              clickable: true // if true, enable info window pop-up
    };
    // create the push-pin marker
    var marker = new google.maps.Marker(markerOptions);
    gmarkers.push(marker);

    // now create the pop-up window that is displayed when you click the marker
    var infoWindowOptions = {
        content: content, // description
        position: position // where to put it
    };
    var infoWindow = new google.maps.InfoWindow(infoWindowOptions);
    google.maps.event.addListener(marker, "click", function() {
        infoWindow.open(map);
    });

    if(gmarkers.length > 10){
        gmarkers[0].setMap(null);
        gmarkers.shift();
    }
}


// This function executes a JSON request to the CPULoadServlet
function doAjaxRequest() {
	  "use strict";
    update++;
    $("#update").html(update);
    var route = $("#route").val();
    var params = "key=" + key  + "&rt=" + route;
    $.ajax({
        url : "http://sapphire.msoe.edu:8080/BusTrackerProxy/BusInfo", // the url of the servlet returning the Ajax response
        data : params, // key and route, for example "key=ABCDEF123456789&rt=31"
        async: true,
        dataType: "json",
        success: handleSuccess,
        error: handleError
    });

    if( timer === null )
        timer = setInterval(doAjaxRequest, 5000);
}

// This function is called if the Ajax request succeeds.
// The response from the server is a JavaScript object!
function handleSuccess( response, textStatus, jqXHR ) {
	  "use strict";
    if(response.hasOwnProperty("bustime-response")) {
        if(response["bustime-response"].hasOwnProperty("error")){
            $("#error").html(response["bustime-response"].error[0].msg);
            $("#error").show();
        } else {
            $("#error").html("");
            $("#error").hide();
            var innerhtml = "<tbody><tr><th>Bus</th><th>Route</th><th>latitude</th><th>longitude</th><th>speed(MPH)</th><th>dist(mi)</th></tr>";
            var vehicles = response["bustime-response"].vehicle;
            for (let i = 0; i < vehicles.length; i++) {
                var curBus = vehicles[i];
                var latitude = curBus.lat;
                var longitude = curBus.lon;
                var position = new google.maps.LatLng(latitude, longitude); // creates a Google position object
                innerhtml += "<tr><td>" + curBus.vid +
                    "</td><td>" + curBus.des +
                    "</td><td>" + Number(latitude).toFixed(4) +
                    "</td><td>" + Number(longitude).toFixed(4) +
                    "</td><td>" + curBus.spd +
                    "</td><td>" + Number(curBus.pdist / 5280).toFixed(4) + "</td></tr>";
                addMarker(map, position, "Bus Number: " + curBus.vid, curBus.des, true);
            }
            $("#table1").html(innerhtml + "</tbody>");
        }
    } else{
        $("#error").html(response.status);
        $("#error").show();
    }
}

// This function is called if the Ajax request fails (e.g. network error, bad url, server timeout, etc)
function handleError(jqXHR, textStatus, errorThrown) {
    "use strict";
    console.log("Error processing Ajax request!");
    $("#error").show();
    $("#error").html("Status: " + jqXHR.status + " " + jqXHR.statusText + " <em>" + textStatus + ": </em> Unable to retrieve response from the server.");
}

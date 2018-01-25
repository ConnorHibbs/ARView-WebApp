var counter; // number of times display is updated
var watchID; // id returned by location watcher object
var map;	 // a Google Map object
var positions;

$(document).ready(function() {           // when document loads...
    "use strict";
    $("#getloc").click(startWatch);
    $("#stop").click(stopWatch);
    $("#save").click(handleSave);
    watchID=null;     // reset
    counter=0;        // reset
    map = null;
    positions = [];

// To display an initial map for a default starting location before the "Get Location" button is pressed,
// uncomment the following lines:
    var start = { // an arbitrary location (in Cedarburg, WI)
        coords: {
            latitude: 43.295,
            longitude: -87.985,
            accuracy: 0
        }
    };
    displayMap(start); // map this starting location (see code below) using Google Maps
});

// This function gets the current location from the browser
function startWatch() {
    "use strict";
    // see https://developer.mozilla.org/en-US/docs/Web/API/PositionOptions
    var positionOptions = {
        enableHighAccuracy: true,      // cheap but fast response if false
        //timeout: 5000,    // default is Infinity - watchPosition() won't return until the position is acquired
        maximumAge: 0   // max age of a possibly-cached pos; 0 means return fresh pos, Infinity means return cached pos
    };

    // see https://developer.mozilla.org/en-US/docs/Web/API/Navigator/geolocation
    if( navigator.geolocation ) { //check for geolocation support by checking existence of geolocation object
        if( watchID == null )   // prevent re-watching
        // see https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition
            watchID = navigator.geolocation.watchPosition( handleSuccess, handleError, positionOptions ); // continuous pos request
    } else {
        alert("No geolocation support!");  // no navigator.geolocation object!
    }
}

// This function stops the watchPosition() updates
function stopWatch() {
    "use strict";
    if( watchID != null ) { // make sure the ID is not null!
        navigator.geolocation.clearWatch(watchID);
        watchID=null;
    }
}

// This event handler is called when an error occurs getting the geolocation
// @param error - see https://developer.mozilla.org/en-US/docs/Web/API/PositionError
function handleError( error ) {
    "use strict";
    // There are 4 error codes, corresponding to the following reasons:
    var errorType = {     // key/value map of error codes and meanings
        0: "unknown",
        1: "Sorry loser: permission denied",
        2: "I'm lost: location not available",
        3: "Find location request timed out"
    };
    var message = errorType[error.code];   //

    // Error codes 0 and 2 sometimes have additional error details supplied by the geolocation service
    if( error.code === 0 || error.code === 2 ) { // additional info available?
        message += ": " + error.message;
    }
    $("#display").html( message );
}


// This event handler is called when a geolocation is successfully computed
// @param position - see https://developer.mozilla.org/en-US/docs/Web/API/Position
function handleSuccess( position ) {
    "use strict";
    var lat = position.coords.latitude;
    var long = position.coords.longitude;
    var accuracy = position.coords.accuracy;
    counter++; // update the number of times this function has been called
    $("#display").html("Update: " + counter+ "<br> Lat: " + lat.toFixed(5) + "<br>Long: " + long.toFixed(5) + "<br> accuracy(m)= " + accuracy );
    displayMap(position);



    positions.push(position);
}

function handleSave() {
    console.log("Save was pressed");
    var route = $("#route").val();

    // let position;
    // for (position in positions) {
    let length = positions.length;
    for(let i = 0; i < length; i++){
        let position = positions[i];


        // This is the data we're sending to the server to be saved to mongo
        // CHALLENGE: The ajax call should really be a POST, not a GET, since we're SENDING data that will
        // change the state of the server (by adding data to the database). Change this to a POST if time permits.

        var params = {
            'route': route,
            'time': position.timestamp,
            'lat': position.coords.latitude,
            'lon': position.coords.longitude
        };
        $.ajax({
            type: "GET", // request should be done via HTTP POST, because we're sending data to the server
            url: "http://" + /*"192.168.2.7"*/ "155.92.68.54" /*"localhost"*/+ ":3003/gpsData", // the url of the route in the mongoGPSServer to post data to
            data: params,
            contentType: 'application/json; charset-utf-8',
            crossDomain: true,
            success: handleAjaxSuccess, // the function to call on success
            error: handleAjaxError // the function to call if an error occurs
        });
    }
}


// This function is called if the Ajax request above succeeds. We just log to the console in this case.
// The response from the server is a JavaScript object!
function handleAjaxSuccess( response, textStatus, jqXHR ) {
    console.log("response is " + textStatus );
    $("#message").html("Success executing Ajax request:  " + textStatus );
}

// This function is called if the Ajax request fails (e.g. network error, bad url, server timeout, etc)
function handleAjaxError(jqXHR, textStatus, errorThrown) {
    console.log("Error processing Ajax request!");
    $("#message").html("Error executing Ajax request:  " + textStatus );
}


// display a Google Map
// @param position - see https://developer.mozilla.org/en-US/docs/Web/API/Position
function displayMap(position) {
    "use strict";
    var googlePosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    var mapOptions = {
        zoom: 17, // range 0 to 21
        center: googlePosition, // the position at the center of the map
        mapTypeId: google.maps.MapTypeId.ROADMAP // ROADMAP, SATELLITE, or HYBRID
    };
    var mapDiv = $("#map").get(0); // get the DOM <div> element underlying the jQuery result
    $("#map").css("width", 0.9*$(document).width() );
    $("#map").css("height", 0.9*$(document).width() );
    if(map===null) { // create just once
        map = new google.maps.Map(mapDiv, mapOptions); // create a map if one doesn't exist
    }
    else {
        map.panTo(googlePosition); // otherwise, pan the existing map to the new location
    }
    var title = position.coords.latitude.toFixed(3) + ", " + position.coords.longitude.toFixed(3);
    addMarker(map, googlePosition, title, "You are here.");  // add a push-pin to the map
}

// Add a "push-pin" marker to the map
// @param map - the google map object created above
// @param position - see https://developer.mozilla.org/en-US/docs/Web/API/Position
// @param title - title of the marker/pin to add to the map
// @param content - description of the marker/pin to add to the map
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

    // now create the pop-up window that is displayed when you click the marker
    var infoWindowOptions = {
        content: content, // description
        position: position // where to put it
    };
    var infoWindow = new google.maps.InfoWindow(infoWindowOptions);
    google.maps.event.addListener(marker, "click", function() {
        infoWindow.open(map);
    });
}
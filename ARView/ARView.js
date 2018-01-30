/**
 * Ryan Guinn and Brandon Jackson
 */
var map = null;	        // a Google Map object
var timer = null;       // an interval timer
var gmarkers = [];

$(document).ready(function() {      // when document loads, do some initialization
    "use strict";
    var startPoint = new google.maps.LatLng(43.13093, -88.002939);// location of MSOE athletic field
    displayMap(startPoint); // map this starting location (see code below) using Google Maps
    //addMarker(map, startPoint, "MSOE Athletic Field", "The place to be!", false);  // add a push-pin to the map

    // initialize button event handlers (note this shows an alternative to $("#id).click(handleClick)
    $("#update").click(doAjaxRequest);//mockAjaxRequest());
});

// Display a Google Map centered on the specified position. If the map already exists, update the center point of the map per the specified position
// param position - a google.maps.LatLng object containing the coordinates to center the map around
function displayMap(position) {
	  "use strict";
	      var mapOptions = {
        zoom: 14, // range 0 to 21 (the mouse can be used to zoom in and out)
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

}

// This function executes a JSON request to the CPULoadServlet
function doAjaxRequest() {
	"use strict";

    gmarkers = [];

    let lat = $("#latField")[0].value;
    let lon = $("#lonField")[0].value;
    let radius = $("#radiusField")[0].value;

    console.log(lat, lon, radius);


    // $("#update").html(update);
    // var route = $("#route").val();
    $.ajax({
        url: "http://192.168.43.65:8080/graphql",  // the url of the servlet returning the Ajax response
        data: '{"query":"{ tagsByLocation(lat: ' + lat + ', lon: ' + lon + ', radius: ' + radius + ') { lat, lon, ele, title, text, dtg, userId}}"}',
        async: true,
        type: "POST",
        contentType: "application/json",
        success: handleSuccess,
        error: handleError
    });

    //if( timer === null )
    //    timer = setInterval(doAjaxRequest, 5000);
}

function mockAjaxRequest(){
    fetch('TestData.json')
        .then((response) => response.json())
        .then((response) => handleSuccess(response));
    //handleSuccess(JSON.parse(TestData));
    //var testTags = [{lat: 43.035523, lon: -87.910847}, {lat: 43.037593, lon: -87.934879}, {lat: 43.010172, lon: -87.896685}];
    //var testData = {data:{tags:testTags}};
}

// This function is called if the Ajax request succeeds.
// The response from the server is a JavaScript object!
function handleSuccess( response, textStatus, jqXHR ) {
	"use strict";

    console.log("Response:", response.data.tagsByLocation);


    if(response.hasOwnProperty("data")) {
        if(response["data"].hasOwnProperty("error")){
            $("#error").html(response["data"].error[0].msg);
            $("#error").show();
        } else {
            $("#error").html("");
            $("#error").hide();
            var tags = response["data"].tagsByLocation;
            for (let i = 0; i < tags.length; i++) {
                var curTag = tags[i];
                var latitude = curTag.lat;
                var longitude = curTag.lon;
                var title = curTag.title;
                var text = curTag.text;
                var date = curTag.dtg;
                var user = curTag.userId;
                var position = new google.maps.LatLng(latitude, longitude); // creates a Google position object

                addMarker(map, position, title, "Posted by: " + user + " on " + date + " - \"" + text + "\"");
            }
        }
    } else{
        $("#error").html(response.status);
        $("#error").show();
    }
}

// This function is called if the Ajax request fails (e.g. network error, bad url, server timeout, etc)
function handleError(jqXHR, textStatus, errorThrown) {
    "use strict";

    console.log("jqXHR", jqXHR);
    console.log("textStatus", textStatus);
    console.log("errorThrown", errorThrown);

    console.log("Error processing Ajax request!");
    $("#error").show();
    $("#error").html("Status: " + jqXHR.status + " " + jqXHR.statusText + " <em>" + textStatus + ": </em> Unable to retrieve response from the server.");
}
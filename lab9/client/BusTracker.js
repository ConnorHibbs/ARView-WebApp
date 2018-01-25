/**
 * Connor Hibbs
 */
var map = null;	        // a Google Map object
var timer = null;       // an interval timer
var update = 0;         // update counter
var tablehtml = "";     //html of the table
var recentPoints = [];  // array of bus markers currently on the map
var state = "stop";     // state of the timer, used to control pause button

$(document).ready(function() {      // when document loads, do some initialization
    "use strict";
    var startPoint = new google.maps.LatLng(43.044240, -87.906446);// location of MSOE athletic field
    displayMap(startPoint); // map this starting location (see code below) using Google Maps
    addMarker(map, startPoint, "MSOE Athletic Field", "The place to be!", null);  // add a push-pin to the map

    // initialize button event handlers (note this shows an alternative to $("#id).click(handleClick)

    let start = $("#start");
    let stop = $("#stop");
    let pause = $("#pause");

    start.on("click", startButton);
    stop.on( "click", stopButton);
    pause.on("click", pauseButton);
    pause.prop("disabled", true);

    // Add the enter key as a listener on the route text field
    // And 'click' the start button when enter is pressed
    $("#route").keyup(function(event) {
        if(event.keyCode == 0x0d /*<enter>*/) start.click();
    });

    $(window).keyup(function(event) {
        if(event.keyCode == 27/*<esc>*/) stop.click();
    });

});

// Display a Google Map centered on the specified position. If the map already exists, update the center point of the map per the specified position
// param position - a google.maps.LatLng object containing the coordinates to center the map around
function displayMap(position) {
    "use strict";
    let mapOptions = {
        zoom: 13, // range 0 to 21 (the mouse can be used to zoom in and out)
        center: position, // the position at the center of the map
        mapTypeId: google.maps.MapTypeId.ROADMAP // ROADMAP, SATELLITE, or HYBRID
    };
    let mapDiv = $("#map").get(0); // get the DOM <div> element underlying the jQuery result
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
// param busInfo
function addMarker(map, position, title, content, busInfo) {
    "use strict";
    if(busInfo !== null) var isBus = true;

    let busIcon = "https://mt.googleapis.com/vt/icon/name=icons/onion/25-bus.png&scale=1.0";
    let rocketIcon = "http://www.worldofbuzz.com/wp-content/uploads/2016/11/rocket-2.png?x82567";
    let stopIcon = "http://www.theregister.co.uk/Design/graphics/icons/comment/stop_32.png";

    //Set up the parameters to create a marker
    let markerOptions = {
        position: position, // position of the push-pin
        map: map,	// the map to put the pin into
        title: title, // title of the pin
        clickable: true, // if true, enable info window pop-up
    };

    //If the point being added is a bus, check the speed to change the icon
    if(isBus){
        if(Number(busInfo.spd) > 40) markerOptions.icon = rocketIcon;
        else if(Number(busInfo.spd) === 0) markerOptions.icon = stopIcon;
        else markerOptions.icon = busIcon;
    }

    // create the push-pin marker
    let marker = new google.maps.Marker(markerOptions);
    if(isBus) recentPoints.push(marker); //if it is a bus, track it

    // now create the pop-up window that is displayed when you click the marker
    let infoWindowOptions = {
        content: content, // description
        position: position // where to put it
    };
    let infoWindow = new google.maps.InfoWindow(infoWindowOptions);
    google.maps.event.addListener(marker, "click", function() {
        infoWindow.open(map);
    });
}

//simple function to reset the page before starting with a new route
function startButton(){
    "use strict";
    clearPage();
    startTime();

    state = "start";
    $("#pause").prop("disabled", false);
    $("#stop").prop("disabled", false);
}

// This function executes a JSON request to the CPULoadServlet
function doAjaxRequest() {
    "use strict";
    showError(""); //clear out the error

    let params = "key=" + key + "&rt=" + $("#route")[0].value;

    $.ajax({
        type: "GET",
        // url : "http://sapphire.msoe.edu:8080/BusTrackerProxy/BusInfo", // the url of the servlet returning the Ajax response
        url: "../data",
        data : params, // key and route, for example "key=ABCDEF123456789&rt=31"
        async: true,
        dataType: "json",
        success: handleSuccess,
        error: handleError
    });

    if(timer == null) startTime();
}

//starts the clock and schedules doAjaxRequest
function startTime(){
    "use strict";
    if(timer == null) {
        timer = setInterval(doAjaxRequest, 5000);
        doAjaxRequest(); //do 1 iteration right away
    }
}

//pauses the clock
function stopTime(){
    "use strict";
    clearInterval(timer);
    timer = null;
}

// This function stops the timer and nulls the reference
function stopButton() {
    "use strict";
    clearPage();
    stopTime();

    //disable stop and pause when the program stops
    state = "stop";
    $("#pause").prop("disabled", true);
    //$("#stop").prop("disabled", true);
}

//This function controls what happens when the pause button is pressed. The timer should stop but nothing is cleared
function pauseButton(){
    "use strict";

    if(state === "start"){
        state = "pause";
        stopTime();
        $("#pause").prop('value', 'Resume');
    } else if(state === "pause"){
        state = "start";
        startTime();
        $("#pause").prop("value", "Pause");
    }
}

// This function is called if the Ajax request succeeds.
// The response from the server is a JavaScript object!
function handleSuccess( response, textStatus, jqXHR ) {
    "use strict";
    if(response["bustime-response"]) {
        if (response["bustime-response"].vehicle) {
            update++;
            //$("#update")[0].innerHTML = "Update " + update;
            $("#update").html("Update " + update);
            processBuses(response);
        } else if (response["bustime-response"].error) {
            pauseButton(); //stop the timer (and preserve results) if there is an error
            let msg = response["bustime-response"].error[0].msg;
            showError(msg);
        }
    } else {
        pauseButton();
        let msg = "No data returned. Please check that route is valid and key supplied";
        if(response.status) msg = response.status;
        showError(msg);
    }
}

// This function processes the response from the server (if it is valid)
// by looping through the buses, and adding them to the map and the table
function processBuses(response){
    "use strict";

    let route = response["bustime-response"].vehicle[0].rt;
    tablehtml = ("<thead><tr><th>Bus</th><th>Route</th><th>Latitude</th><th>Longitude</th><th>Speed(MPH)</th><th>Distance(mi)</th></tr></thead>");
    tablehtml += "<tbody>";
    let bus;
    for(bus of response["bustime-response"].vehicle) {
        addRowToTable(bus);

        let position = new google.maps.LatLng(bus.lat, bus.lon); // creates a Google position object
        addMarker(map, position, bus.vid, bus.des, bus);

        //if the user doesn't want to add another point, for each point added one is removed
        if($("#keepThisMany").is(':checked')) {
            console.log("Removing a bus. Remaining: " + recentPoints.length);
            let marker = recentPoints.shift();
            marker.setMap(null);
        }
    }

    //if the user only wants so many points on the map, remove others
    if($("#limitMarkers").is(':checked')){
        let vehicles = response["bustime-response"].vehicle.length;
        let vehiclesToKeep = vehicles * Number($("#markersToKeep").value);

        console.log("Keep " + vehiclesToKeep + " buses");

        while(recentPoints.length > vehiclesToKeep){
            let marker = recentPoints.shift();
            marker.setMap(null);
        }

        console.log("Buses on map: " + recentPoints.length);
    }

    tablehtml += "</tbody>";
    $("#table1").html(tablehtml);
}

// This function constructs the table one row at a time
//(busData) object containing the data for a single bus
function addRowToTable(busData){
    "use strict";

    //Iterate through the response to create the table and markers for the map
    let rowHTML = "";
    rowHTML += "<tr>";
    rowHTML += "<td>" + busData.vid + "</td>";
    rowHTML += "<td>" + busData.rt + " " + busData.des + "</td>";
    rowHTML += "<td>" + Number(busData.lat).toFixed(3) + "</td>";
    rowHTML += "<td>" + Number(busData.lon).toFixed(3) + "</td>";
    rowHTML += "<td>" + busData.spd + "</td>";
    rowHTML += "<td>" + (Number(busData.pdist) / 5280).toFixed(2) + "</td>";
    rowHTML += "</tr>";

    tablehtml += rowHTML;
}

// This function is called if the Ajax request fails (e.g. network error, bad url, server timeout, etc)
function handleError(jqXHR, textStatus, errorThrown) {
    "use strict";
    pauseButton();
    showError("The MCTS server did not respond. Please try again later");
    console.log("Error processing Ajax request!");
}

// This function displays an error message to the top of the web page.
// (text) <String> message to be displayed next to "Error!"
function showError(text) {
    "use strict";
    let errorPopup = $(".alert")[0];
    if(text === ""){ //hide the error
        errorPopup.style.display = "none";
    } else {
        errorPopup.innerHTML = "<strong>Error!</strong> " + text;
        errorPopup.style.display = "block"; //show the error
    }
}

// This function removes all of the points from the map, and resets the table
// It also hides the error display
function clearPage(){
    "use strict";

    let marker;
    for(marker of recentPoints){
        marker.setMap(null);
    }
    $("#table1").html("");
    update = 0;
    $("#update").html("");
    recentPoints = []; //reset the array

    showError("");
}
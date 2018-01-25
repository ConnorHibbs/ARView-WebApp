/**
 * Connor Hibbs
 */
let map = null;	        // a Google Map object
let timer = null;       // an interval timer
let recentPoints = [];  // array of bus markers currently on the map
let state = "stop";     // state of the timer, used to control pause button

//Called when the document is ready - creates the map and adds a marker at the MSOE athletic field
angular.element(document).ready(function() {      // when document loads, do some initialization
    "use strict";
    let startPoint = new google.maps.LatLng(43.044240, -87.906446);// location of MSOE athletic field
    displayMap(startPoint); // map this starting location (see code below) using Google Maps
    addMarker(map, startPoint, "MSOE Athletic Field", "The place to be!", null);  // add a push-pin to the map
});

//Creates the Angular controller which runs in the background as a subject - observer pattern
let busTracker = angular.module('busTracker', ['ui.bootstrap']);
busTracker.controller("busController", function($scope, $http, $interval){
    "use strict";

    $scope.pauseText = "Pause"; //sets the text of the pause button to begin with

    //simple function to reset the page before starting with a new route
    $scope.startButton = function(){
        "use strict";
        clearPage();
        startTime();
        state = "start";
    };

    // This function stops the timer and nulls the reference
    $scope.stopButton = function() {
        "use strict";
        clearPage();
        stopTime();
        state = "stop";
    };

    //This function controls what happens when the pause button is pressed. The timer should stop but nothing is cleared
    $scope.pauseButton = function(){
        "use strict";
        if(state === "start"){
            state = "pause";
            stopTime();
            $scope.pauseText = "Resume";
        } else if(state === "pause"){
            state = "start";
            startTime();
            $scope.pauseText = "Pause";
        }
    };

    //starts the clock and schedules doAjaxRequest
    function startTime(){
        "use strict";
        if(timer == null) {
            timer = $interval(doAjaxRequest, 5000);
            doAjaxRequest();
        }
    }

    //pauses the clock
    function stopTime(){
        "use strict";
        $interval.cancel(timer);
        timer = null;
    }

    // This function executes a JSON request to the CPULoadServlet
    function doAjaxRequest(){
        "use strict";
        showError(""); //clear out the error
        $scope.tableIsVisible = true;
        $scope.updateIsVisible = true;

        let routeBox = document.getElementById("route");
        let params = {"rt": routeBox.value, "key": key};

        let data = {
            method: "GET",
            url: "http://sapphire.msoe.edu:8080/BusTrackerProxy/BusInfo",
            params: params
        };
        $http(data).then(handleSuccess, handleError);

        if(timer == null) startTime();
    }

    // This function is called if the Ajax request succeeds.
    // The response from the server is a JavaScript object!
    function handleSuccess(response) {
        "use strict";
        response = response.data["bustime-response"];

        let vehicles = null;
        if(response) vehicles = response.vehicle;

        if(response && vehicles) {
            $scope.buses = vehicles; // sets the bus data response to the global scope
            $scope.update++;
            var bus;
            for(bus of vehicles) {
                var position = new google.maps.LatLng(bus.lat, bus.lon); // creates a Google position object
                addMarker(map, position, bus.vid, bus.des, bus);
            }
        } else {
            $scope.pauseButton();
            let errorMsg = "No data returned. Please check that route is valid and key supplied";
            if(response && response.error) errorMsg = response.error[0].msg;
            else if(response && response.status) errorMsg = response.status;
            showError(errorMsg);
        }
    }

    // This function is called if the Ajax request fails (e.g. network error, bad url, server timeout, etc)
    function handleError(response) {
        "use strict";
        $scope.pauseButton();
        showError("The MCTS server did not respond. Please try again later");
    }

    // This function displays an error message to the top of the web page.
    // (text) <String> message to be displayed next to "Error!"
    function showError(text) { //TODO working
        "use strict";
        if(text === ""){ //hide the error
            $scope.errorIsVisible = false;
        } else {
            $scope.error = "Error! " + text;
            $scope.errorIsVisible = true;
        }
    }

    // This function removes all of the points from the map, and resets the table
    // It also hides the error display
    function clearPage(){
        "use strict";
        var marker;
        for(marker of recentPoints){
            marker.setMap(null);
        }
        $scope.pauseText = "Pause";

        $scope.tableIsVisible = false;
        $scope.update = 0;
        $scope.updateIsVisible = false;
        recentPoints = []; //reset the array

        showError("");
    }
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
    var mapDiv = document.getElementById('map');
    // var mapDiv = angular.element("#map");

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
    var marker = new google.maps.Marker(markerOptions);
    if(isBus) recentPoints.push(marker); //if it is a bus, track it

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





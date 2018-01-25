/**
 * Created by Connor Hibbs on 2/8/2017.
 */
let express = require('express'); // express web server framework from NPM
let favicon = require('serve-favicon');

let app = express(); // init the framework

//This route serves favicon - NOTE you must require the NPM package 'express-favicon'
app.use(favicon(__dirname + '\\webcontent\\images\\favicon.ico'));

// Start the server listening on port 3002
let server = app.listen(3002);

//This route handles requests to /
app.get('/', handleDefaultRoute );

//This route serves html (and other) files from the /client folder
app.use(express.static('client') );


// This is the default page
function handleDefaultRoute( request, response ) {
    // Note: this is a bad approach, but it's here for illustration purposes only.
    let html = '<html><body><p>Hello se2840</p>';
    html += '<p>The date is ' + new Date() + '</p>';
    html += '</body></html>';
    response.send(html); // see http://www.tutorialspoint.com/nodejs/nodejs_response_object.htm
    response.end();
}

//This route serves ajax requests to the /data route
app.get('/data', function( request, response ) {
    let ajax = require('request');

    let key = request.query.key;
    let route = request.query.rt;
    let url = "http://realtime.ridemcts.com/bustime/api/v2/getvehicles";
    let busData = {status:"Server Error; IOException during request to ridemcts.com: Simulated server error during request to ridemcts.com"}; // the default JSON response

    //look at the route and determine if things need to be modified
    if(route === '1000'){
        response.json(busData);
        return;
    } else if(route === '1001'){
        response.status(404);
        response.end();
        return;
    } else if(route === '1002'){
        busData = {status: "Key or route parameter empty"};
        //route = '';
        response.json(busData);
        return;
    } else if(route === '1003'){
        key = 'abc';
    }

    url += "?key=" + key;
    url += "&rt=" + route;
    url += "&format=json";

    ajax(url, function(error, ajaxRes, body) {
        if(error) console.log(error);
        if(!error && ajaxRes.statusCode == 200) {
            busData = JSON.parse(body);
        }
        response.json(busData);
    });
});



console.log("Express server running.");

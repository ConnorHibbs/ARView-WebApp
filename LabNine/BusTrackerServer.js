/**
 * Created by hornick on 5/10/2016.
 */
var express = require('express'); // express web server framework from NPM
var favicon = require('express-favicon');
var ajax = require('request');
var url = require('url');

var app = express(); // init the framework

var server = app.listen(3002);

//This route handles requests to /
app.get('/', handleDefaultRoute );

function handleDefaultRoute( request, response ) {
    // Note: this is a bad approach, but it's here for illustration purposes only.
    var html = '<html><body><p>Hello se2840</p>';
    html += '<p>The date is ' + new Date() + '</p>';
    html += '</body></html>';
    response.send(html); // see http://www.tutorialspoint.com/nodejs/nodejs_response_object.htm
    response.end();
}

app.get('/blah', function(request, response ) {
    var html = '<html><body><p>blah</p>';
    html += '</body></html>';
    response.send(html); // see http://www.tutorialspoint.com/nodejs/nodejs_response_object.htm
    response.end();
    });

//This route serves ajax requests to the /data route
app.get('/data', function( request, response ) {
    response.json({status: 'NodeJS OK'}); // no need to set content-type! Express handles it automatically
    response.end();
});

//This route serves favicon - NOTE you must require the NPM package 'express-favicon'
app.use(favicon(__dirname + '/favicon/favicon.ico'));

//This route serves html (and other) files from the /client folder
app.use(express.static('client') );


console.log("Express server running.");

/**
 * Created by hornick on 5/10/2016.
 * To use mongo:
 * 1. install mongo; see https://docs.mongodb.com/v3.0/tutorial/install-mongodb-on-windows/
 * 2. create folder for mongo db; e.g. D:\mongo\data
 * 3. start mongo server: "C:\Program Files\MongoDB\Server\3.2\bin\mongod.exe" --dbpath d:\mongo\data
 * 4. optional: run mongo shell to interactively access db: "C:\Program Files\MongoDB\Server\3.2\bin\mongo.exe"
 *    use "help" at command prompt for available commands (e.g. show dbs
 */
var express = require('express'); // express web server framework from NPM
var favicon = require('serve-favicon');
var mongoose = require('mongoose');

var app = express(); // init the framework

var server = app.listen(3003);
// db.gps
var connection = mongoose.connect('mongodb://localhost/gpstracker');
var gpsSchema = new mongoose.Schema(
    {
        'route': String,
        'time': String,
        'lat': String,
        'lon': String
    }
);
var GPSModel = mongoose.model('GPS', gpsSchema );

// This is the route that Geolocation.html uses to save gps data to mongo
// NOTE: Since data is being SENT here, this should really be a app.post method!!
// CHALLENGE: if time permits, change to a post() route
app.get('/gpsData', function( request, response ) {
    "use strict";
    var url = require('url');  // used for parsing request urls (in order to get params)
    var urlObject = url.parse(request.url,true); // see https://nodejs.org/api/url.html

    console.log("/gpsData was called");

    var gpsdata = new GPSModel( // create a new GPSModel object
        {
            'route': urlObject.query["route"],
            'time': urlObject.query["time"],
            'lat': urlObject.query["lat"],
            'lon': urlObject.query["lon"]
        });

    gpsdata.save(function (err) { // save the GPSModel object to Mongo
        //To retrieve entries, use (for example) db.gps.find()
        if (err !== null) {
            console.log(err); //
            response.sendStatus(500); // client gets an error if we can't save
        } else {
            response.sendStatus(200); // ...otherwise client gets "OK"
        }
    });
});

//This route serves favicon - NOTE you must require the NPM package 'express-favicon'
app.use(favicon(__dirname + '/webcontent/favicon.ico'));

//This route serves html (and other) files from the /client folder
app.use(express.static('client') );
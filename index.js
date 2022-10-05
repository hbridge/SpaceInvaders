"use strict"

const statik = require('node-static');

var fileServer = new statik.Server('./static');

require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        fileServer.serve(request, response);
    }).resume();
}).listen(8080);

console.log("listening on port 8080");
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

appGet("/", "/index.html");
appGet("/index.js", "/index.js");
appGet("/index.css", "/index.css");
appGet("/socket.js", "/socket.js");

io.on('connection', function (socket) {
    socket.on('answer', function (data) {
        io.emit('answer', data);
    });
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});

function appGet(urlPath, file) {
    app.get(urlPath, function (req, res) {
        res.sendFile(__dirname + file);
    });
}
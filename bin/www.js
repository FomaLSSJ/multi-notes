var config = require('../lib/config');
var cookie = require('cookie');
var cookieParser = require('cookie-parser');
var http = require('http');

var async = require('async');
var socketio = require('socket.io');

var app = require('../app');
var server = http.createServer(app);
var io = socketio.listen(server);

var messages = [];
var sockets = [];
var notes = [];
var owners = [];

var noteModel = require('../model/note').noteModel;
var sessionStore = require('../lib/store');

getNotes(function(res) {
    notes = res;
});

io.on('connection', function (socket) {
    sockets.push(socket);
    socket.emit('notes', notes);
    socket.emit('owners', owners);

    socket.on('disconnect', function () {
        droped(socket);
        sockets.splice(sockets.indexOf(socket), 1);
        
        updateRoster();
    });

    socket.on('message', function (msg) {
        var text = String(msg || '');
    
        if (!text)
        return;

        socket.get('name', function (err, name) {
            var data = {
                name: name,
                text: text
            };

            broadcast('message', data);
            messages.push(data);
        });
    });

    socket.on('identify', function () {
        setSessionName(socket);
    });
    
    socket.on('select', function(index) {
        owned(socket, index);
    });
    
    socket.on('dropOwned', function() {
        dropOwned(socket);
    });
});

function getNotes(callback) {
    noteModel.find({}, {__v: 0, created_at: 0, updated_at: 0}, function(err, notes, next) {
        if (err) {
            return next(err);
        } else {
            if (callback && typeof(callback) === "function") {
                callback(notes);
            }
        }
    });
}

function dropOwned(socket) {
    socket.get('name', function(err, name, next) {
        if (err) {
            return next(err);
        } else {
            owners.forEach(function(note, index, object) {
                if (note.owner == name) {
                    object.splice(index, 1);
                } else {
                    return;
                }
            });
            
            broadcast('owners', owners);
        }
    });
}

function owned(socket, id) {
    socket.get('name', function(err, name, next) {
        if (err) {
            return next(err);
        } else {
            var own = { id:id, owner:name };
            var already = null;
            
            owners.forEach(function(own, index, object) {
                if (own.id === id && own.owner === name) {
                    return;
                } else if (own.id === id && (own.owner !== null || own.owner !== name)) {
                    socket.emit('already', { id: id, message: 'Already owned ' + own.owner });
                    already = true;
                }
            });
            if (already) return;
            
            owners.forEach(function(own, index, object) {
                if (own.owner == name) {
                    object.splice(index, 1);
                }
            });
            
            owners.push(own);
            broadcast('owners', owners);
        }
    });
}

function droped(socket) {
    socket.get('name', function(err, name, next) {
        if (err) {
            return next(err);
        } else {
            owners.forEach(function(own, index, object) {
                if (own.owner == name) {
                    object.splice(index, 1);
                }
            });
            broadcast('owners', owners);
        }
    });
}

function setSessionName(socket) {
    var sidCookie = cookie.parse(socket.handshake.headers.cookie);
    var sid = cookieParser.signedCookie(sidCookie.sid, config.get('session:secret'));
    
    var store = sessionStore.get(sid, function(err, session, next) {
        if (!err) {
            if (typeof session.user !== 'undefined') {
                socket.set('name', String(session.user.username || 'Anonymous'), function (err) {
                   updateRoster();
                });
            }
        }
    });
}

function updateRoster() {
    async.map(sockets, function (socket, callback) {
        socket.get('name', callback);
    }, function (err, names) {
        broadcast('roster', names);
    });
}

function broadcast(event, data) {
    sockets.forEach(function (socket) {
        socket.emit(event, data);
    });
}

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
    var addr = server.address();
    console.log("Notes server listening at", addr.address + ":" + addr.port);
});
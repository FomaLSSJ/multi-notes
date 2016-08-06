var mongoose = require('mongoose'),
    config = require('./config');

mongoose.connect(config.get("mongoose:uri"));

var db = mongoose.connection;

db.on('error', function(err) {
   console.log('\x1b[33mConnection error: ' + err.message + '\x1b[0m');
});

db.once('open', function callback() {
   console.log('\x1b[35mConnection to DB\x1b[0m');
});

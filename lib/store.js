var config = require('./config');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session)

var store = new MongoStore({url:config.get("mongoose:uri"), collection:'session'});

module.exports = store;
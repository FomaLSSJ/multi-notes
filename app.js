var path = require('path');
var config = require('./lib/config');
var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');

var index = require('./routes/index');
var users = require('./routes/users');
var notes = require('./routes/notes');
var app = express();

var db = require('./lib/mongoose');
var sessionStore = require('./lib/store');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: config.get('session:secret'),
  key: config.get('session:key'),
  resave: config.get('session:resave'),
  saveUninitialized: config.get('session:saveUninitialized'),
  cookie: config.get('session:cookie'),
  store: sessionStore
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.resolve(__dirname, 'client')));
app.use('/', index);
app.use('/user', users);
app.use('/note', notes);

module.exports = app;

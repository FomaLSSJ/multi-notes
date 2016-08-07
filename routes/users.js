var express = require('express'),
    router = express.Router(),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

var userModel = require('../model/user').userModel;

passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function (user, done) {
  done(null, user);
});

passport.use(new LocalStrategy(function(email, password, done) {
  process.nextTick(function() {
    userModel.findOne({
      email: email
    }, function(err, user) {
      if (err) {
        return done(err);
      } else if (!user) {
        return done(null, false);
      } else if (user.isValidPassword(password)) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    });
  });
}));

router.post('/auth/login', passport.authenticate('local', {
  successRedirect: '/users/success',
  failureRedirect: '/users/failure'
}));

router.get('/auth/success', function(req, res, next) {
    return res.send({status: true, response:{
      message: 'Successfully authenticated'},
      user: {id: req.user.id, username: req.user.username, role: req.user.role}
    });
});

router.get('/auth/failure', function(req, res, next) {
    return res.send({status: false, response:{ message: 'Failed to authenticate'}});
});

router.post('/auth/logout', function(req, res, next) {
    return res.send({status: true, response: {message: 'You logout'}});
});

router.get('/', function(req, res, next) {
    userModel.find({}, {password: 0, salt: 0, email: 0}, function(err, users) {
        if (err) {
            return res.send({status: false, message:'error', error:err});
        } else {
            return res.send({status:true, message:'success', response:users});
        }
    });
});

module.exports = router;

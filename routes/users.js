var express = require('express'),
    router = express.Router(),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

var userModel = require('../model/user').userModel;

passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function (id, done) {
  userModel.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use('local', new LocalStrategy(function(username, password, done) {
  process.nextTick(function() {
    userModel.findOne({
      username: username
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

router.post('/login', passport.authenticate('local', {
  successRedirect: '/user/success',
  failureRedirect: '/user/failure'
}));

router.get('/success', function(req, res, next) {
  req.session.user = req.user;
  return res.redirect('/');
});

router.get('/failure', function(req, res, next) {
  return res.send({status: false, response:{ message: 'Failed to authenticate'}});
});

router.post('/logout', function(req, res, next) {
  req.session.destroy();
  return res.redirect('/');
});

router.get('/get', function(req, res, next) {
  userModel.find({}, {password: 0, salt: 0}, function(err, users) {
    if (err) {
      return res.send({status: false, message:'error', error:err});
    } else {
      return res.send({status:true, message:'success', response:users});
    }
  });
});

router.post('/create', function (req, res, next) {
  if (req.body.username && req.body.password) {
    var user = new userModel({
      username: req.body.username
    });
    user.setPassword(req.body.password);
  
    user.save(function(err) {
      if (err) {
        return res.send({status:false, message:'Failed', error:err});
      } else {
        return res.send({status:true, message:'User created'});
      }
    });
  } else {
    return res.send({status: false, message:'Field username and password required'});
  }
});

module.exports = router;

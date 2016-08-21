var express = require('express');
var router = express.Router();

var noteModel = require('../model/note').noteModel;

router.get('/', function(req, res, next) {
    noteModel.find({}, function(err, notes) {
        if (err) {
            return res.send({status:false, message:'error', error:err});
        } else {
            return res.send({status:true, message:'success', object:notes});
        }
    });
});

router.post('/create', function(req, res, next) {
    console.log('body');
    console.log(req.body.title);
    console.log('params');
    console.log(req.params.title);
    
    var note = new noteModel({
        title: req.body.title,
        text: req.body.text,
        type: req.body.type,
        owner: req.session.user._id
    });
    
    note.save(function(err, note) {
        if (err) {
            return next(err);
        } else {
            return res.send({status: true, message: 'success', note: note});
        }
    });
});

module.exports = router;
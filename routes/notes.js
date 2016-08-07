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

module.exports = router;
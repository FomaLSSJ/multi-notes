var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var note = Schema({
    title: {
        type: String,
        required: true
    },
    text: {
        type: String
    },
    type: {
        type: String,
        enum: ['public', 'private'],
        default: 'public',
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

var noteModel = mongoose.model('note', note);
module.exports.noteModel = noteModel;
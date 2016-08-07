var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    crypto = require('crypto'),
    uuid = require('node-uuid');

var user = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    salt: {
        type: String,
        required: true,
        default: uuid.v1
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

var hash = function(password, salt) {
    return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

user.methods.setPassword = function(password) {
    this.password = hash(password, this.salt);
}

user.methods.isValidPassword = function(password) {
    return this.password === hash(password, this.salt);
}

user.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});

var userModel = mongoose.model('user', user);
module.exports.userModel = userModel;
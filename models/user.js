const mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
    local: {
        username:String,
        password:String
    },
    facebook: {
        id: String,
        username:String,
        url:String
    }
});

var User = mongoose.model('User', UserSchema);
module.exports = User;
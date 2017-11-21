const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const md5 = require('md5');
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true, // save as lowercase
    trim: true,
    validate: [validator.isEmail, 'Invalid email address'], // 0 how to validate, 1 message
    required: 'Please supply an email address'
  },
  name: {
    type: String,
    required: 'Please supply a name',
    trim: true
  }
});

// add fields and/or methods needed for authentication
userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });

// better error messages
userSchema.plugin(mongodbErrorHandler);

module.exports = mongoose.model('User', userSchema);

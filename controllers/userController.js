const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

// const Store = mongoose.model('Store');
// const multer = require('multer');
// const jimp = require('jimp');
// const uuid = require('uuid');

exports.loginForm = (req, res) => {
  res.render('login', { title: 'Login' });
}

exports.registerForm = (req, res) => {
  res.render('register', { title: 'Register' });
}

// middleware
exports.validateRegister = (req, res, next) => {
  // from expressValidator package
  req.sanitizeBody('name');
  req.checkBody('name', 'You must supply a name').notEmpty();
  req.checkBody('email', 'That email is not valid').isEmail();
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false
  }); // deal with variations e.g. uppercase, dots, etc.
  req.checkBody('password', 'Password cannot be empty!').notEmpty();
  req.checkBody('password-confirm', 'Confirmed password cannot be empty!').notEmpty();
  req.checkBody('password-confirm', 'Oops! Your password do not match!').equals(req.body.password);

  const errors = req.validationErrors();
  if (errors) {
    req.flash('error', errors.map(err => err.msg));
    res.render('register', { title: 'Register', body: req.body, flashes: req.flash() });
    return;
  }

  next(); // No errors
}

// validateRegister passed, so we have name, email, password
// and password-confirm in the req body
exports.register = async (req, res, next) => {

  const user = new User({
    email: req.body.email,
    name: req.body.name
  });

  // NOTE: User.register method is added by passportLocalMongoose
  // User.register(user, req.body.password, function(err, user) {});
  // It uses callback, but we can promisify it to use async/await
  const register = promisify(User.register, User);
  await register(user, req.body.password); // will store the hash
  next(); // pass to login
}

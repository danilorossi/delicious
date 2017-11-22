const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed Login',
  successRedirect: '/',
  successFlash: 'You are now logged in!'
});

exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'You are now logged out!');
  res.redirect('/');
}

exports.isLoggedIn = (req, res, next) => {
  // check if user is authenticated
  if (req.isAuthenticated()) {
    return next(); // carry on
  }
  req.flash('error', 'Oops you must be logged in to do that!');
  res.redirect('/login');
}

// TODO validataion
exports.forgot = async (req, res) => {

  // see if a user exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    req.flash('error', 'No account with that email exists');
    return res.redirect('/login');
  }

  // we have a user => set reset tokens and expiry on their account
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = (Date.now() + 3600000); // One hour from now
  await user.save();

  // send an email with the token
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;

  await mail.send({
    user,
    subject: 'Password Reset',
    resetURL,
    filename: 'password-reset' // html template
  })

  req.flash('success', `You have been emailed a password reset link.`); // (${resetURL})

  // redirect to login page after the email has been sent
  res.redirect('/login');
};

exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() } // token still valid
  });

   // wrong user or token expired
  if (!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    return res.redirect('/login');
  }

  // if user, show reset password form
  res.render('reset', { title: 'Reset Your Password' });

}

// TODO should validate
exports.confirmedPassword = (req, res, next) => {

  if(req.body.password === req.body['password-confirm']) {
    return next();
  }
  req.flash('error', 'Passwords do not match!');
  res.redirect('back');
}

exports.update = async (req, res) => {
  // find the user and still within 1 hour token
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() } // token still valid
  });

  if (!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    return res.redirect('/login');
  }

  // update user's password
  const setPassword = promisify(user.setPassword, user);
  // save
  await setPassword(req.body.password);
  // remove reset fields
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  const updatedUser = await user.save();
  await req.login(updatedUser);
  req.flash('success', 'Nice! Your password has been reset! You are now logged in!');
  res.redirect('/');
}

const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

//Strategy in passport - local strategy

exports.userLogin = passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: 'Failure Login!',
    successRedirect: '/',
    successFlash: 'You now logged in',
});


exports.userLogOut = (req, res) => {
    req.logout();
    req.flash('success', 'You are now logged out ! ');
    res.redirect('/');

};


exports.isLoggedIn = (req, res, next) => {

    //first if user is authenticated
    if (req.isAuthenticated()) {
        next(); //they are logged in!
        return;
    }//else
    req.flash('error', 'You must be logged in!');
    res.redirect('/login')
};


//reset password

exports.forgot = async (req, res) => {
    // 1. See if a user with that email exists
    const user = await User.findOne({email: req.body.email});

    if (!user) {
        req.flash('error', 'A password reset has been mailed to you. If this email exist.');
        return res.redirect('/login');
    }
    // 2. Set reset tokens and expiry on their account
    user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
    await user.save();
    // 3. send Email with the token
    //req.headers.host will give local host or main site url
    const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;

     const file = `password-reset`;

    await mail.send({
        user: user,
        subject: 'Password Reset',
        resetURL,
        filename: file
    });

    req.flash('success', `You have been emailed a password reset link.`);


    // 4. redirect to email page
    res.redirect('/login')
};


exports.reset = async (req, res) => {

    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {$gt: Date.now()}
    });
    if (!user) {
        req.flash('error', 'Password reset is valid or has expired');
        return res.redirect('/login')
    }
    console.log(user);
    //if there is user, show the reset password form
    res.render('reset', {title: 'Reset your password'})
};


exports.confirmedPasswords = (req, res, next) => {
    //[] bracket because we used - dash
    if (req.body.password === req.body['password-confirm']) {
        next();
        return;
    }
    req.flash('error', 'Password do not match');
    res.redirect('back');

};


exports.update = async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {$gt: Date.now()}
    });
    if (!user) {
        req.flash('error', 'Password reset is valid or has expired');
        return res.redirect('/login')
    }
    //we chenging from callbackify to promesify to set new Password
    const setPassword = promisify(user.setPassword, user);
    await setPassword(req.body.password);
    //getting rid of resetPasswordToken and resetPasswordExpires
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    const updatedUser = await user.save();
    await req.login(updatedUser);
    req.flash('Success', 'Nice Your Password has been reset! You Are redirected to logged page!');
    res.redirect('/')
};






















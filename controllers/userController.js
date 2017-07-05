const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.loginForm = (req, res) => {
    res.render('login', {title: 'Login'});
};


exports.registerForm = (req, res) => {
    res.render('register', {title: 'register'})
};


exports.validateRegister = (req, res, next) => {
    // its expressValidator in app.js
    req.sanitizeBody('name');
    req.checkBody('name', 'You must supply name!').notEmpty();
    req.checkBody('email', 'That Email is not valid!').isEmail();
    //will make p.u.z.e.r.a.s@gmail.com to puzeras@gmail.com
    req.sanitizeBody('email').normalizeEmail({
        remove_dots: false,
        remove_extension: false,
        gmail_remove_subaddress: false
    });
    req.checkBody('password', 'Password Cannot be Blank!').notEmpty();
    req.checkBody('password-confirm', 'Confirm Password cannot be blank! ').notEmpty();
    req.checkBody('password-confirm', 'Oops! Your password do not match').equals(req.body.password);

    const errors = req.validationErrors();
    if(errors){
        req.flash('error', errors.map(err => err.msg));
        res.render('register', {title: 'Register', body: req.body, flashes: req.flash()});
        return;
    }
    next();
};


exports.userRegister = async (req,res,next) => {
    const user = new User({email: req.body.email, name: req.body.name});

    // User.register(user, req.body.password, function (err, user) {
    //
    // });
    const registerWithPromise = promisify(User.register, User);
    await registerWithPromise(user, req.body.password);
    next(); //pass to authenticate.login
};



exports.account = (req,res) => {
    res.render('account', {title: 'Edit your account'});
};


exports.updateAccount = async (req,res) => {
    const updates = {
        name: req.body.name,
        email: req.body.email
    };
    //(query, updates, options)
    const user = await User.findOneAndUpdate(
        {_id: req.user._id},
        { $set: updates},//set updates on top that already exist
        { new: true, runValidators: true, context: 'query' }
    );

    res.redirect('back');
};



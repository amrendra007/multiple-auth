const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const passport = require('passport');
const saltRounds = 10;

const User = require('../models/user');

router.get('/', function(req, res) {
    res.render('home', {title: 'home'})
});

router.get('/register', function(req, res) {
    res.render('register', {title: 'register'})
});

router.get('/profile', isLoggedIn ,(req, res, next) =>{
    console.log('req.user: ', req.user);
    res.render('profile', { localUser: req.user.local.username, fbUser: '', title: 'profile-page' });
});

router.get('/profileFb', isLoggedIn ,(req, res, next) =>{
    console.log('req.user: ', req.user);
    res.render('profile', { fbUser: req.user.facebook, localUser: '', title: 'profile-page' });
});

router.get('/logout', (req, res, next) => {
    req.logout();
    req.session.destroy();
    res.redirect('/');
});

//!  register post route
router.post('/register', function(req, res, next) {
    if (req.body.password === req.body.matchpassword) {

        bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
            if(err) {
                return next(err);
            }
            var user = new User();
            
            user.local.username = req.body.username;
            user.local.password =  hash;
            user.save(function(err, user) {
                if(err) {
                    return next(err);
                }
                req.login(user._id, function (err) {
                    if(err) {
                        return next(err);
                    }
                    res.redirect('/profile');
                });
            });
        });
    }
    else {
        const err = new Error('password match failed')
        next(err);
    }
});

//! login post route
router.post('/login',
    passport.authenticate('local', {
        successRedirect: '/profile',
        failureRedirect: '/',
    })
);


//!     ----------facebook auth----------

router.get('/auth/facebook', passport.authenticate('facebook'));

router.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        successRedirect: '/profileFb',
        failureRedirect: '/'
    }));


router.get('/auth/facebook', passport.authorize('facebook'));

router.get('/auth/facebook/callback',
    passport.authorize('facebook', {
        successRedirect: '/profileFb',
        failureRedirect: '/'
    }));



passport.serializeUser(function(id, done) {
    done(null, id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});


// passport.serializeUser(function (user, cb) {
//     cb(null, user);
// });

// passport.deserializeUser(function (obj, cb) {
//     cb(null, obj);
// });
// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}


module.exports = router;
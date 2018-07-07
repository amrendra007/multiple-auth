const fs = require('fs');
const path = require('path');
const https = require('https');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const passport = require('passport');
const LocalStrategy = require('passport-local');
const FacebookStrategy = require('passport-facebook').Strategy;

const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

require('dotenv').config();
const port = process.env.PORT || 8000;

const router = require('./routes/mainRoute');
const User = require('./models/user');
const app = express();


//database conn
mongoose.connect(process.env.DB_HOST + process.env.DB_USER + ':' + process.env.DB_PASS + 
    '@ds161459.mlab.com:61459/restful_blog_app');

const db = mongoose.connection;
db.once('open', function() {
    console.log('connected to db');
});

//app configure
app.use(express.static(path.join(__dirname + '/public')));
app.use(session({
    secret: 'fasgasfgasfgastrtsdsf',
    saveUninitialized: false,
    resave: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection })
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use('/', router);
app.set('view engine', 'ejs');

//!PASSPORT CONFIGRATION
passport.use(new LocalStrategy(
    function (username, password, done) {
        User.findOne({ 'local.username': username }, function (err, user) {
            if (err) { return done(err); }
            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }
            const hash = user.local.password;
            bcrypt.compare(password, hash, function (err, response) {
                if (response === true) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Incorrect password.' });
                }
            });
        });
    }
));

passport.use(new FacebookStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SEC,
    callbackURL: "https://localhost:8000/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'photos', 'email']
},
    function (accessToken, refreshToken, profile, done) {
        // console.log(profile);
        User.findOne({'facebook.id': profile.id }, function(err, user) {
            if(err) { 
                console.log('err db');
                return done(err);
            } 
            else {
                
                if(user) {
                    console.log('fetched fb user from db');
                    return done(null, user);
                }
                else {
                    var fbuser = new User();
                    fbuser.facebook.username = profile.displayName;
                    fbuser.facebook.id = profile.id;
                    fbuser.facebook.url =  profile.photos[0].value;
    
                    fbuser.save(function(err, newUser) {
                        if(err) {
                            console.log('err in saving');
                            return done(err);
                        }
                        console.log('newUser created', newUser);
                        done(null, newUser);
                    });
                }
            }

        })

    }
));



// error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error', { title: 'Error' });
});

const httpOptions = {
    cert: fs.readFileSync('./ssl/server.crt'),
    key: fs.readFileSync('./ssl/server.key'),
}
const server = https.createServer(httpOptions, app);
server.listen(port, function() {
    console.log('server running');
});
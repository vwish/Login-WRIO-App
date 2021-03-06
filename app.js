var express = require('express');
var app = require("./wrio_app.js").init(express);
var server = require('http').createServer(app).listen(5000);

var passport = require('passport');
var util = require('util');
var FacebookStrategy = require('passport-facebook').Strategy;
var session = require('express-session');
var cookieParser = require('cookie-parser');
var nconf = require("./wrio_nconf.js").init();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(session(
	{
		secret: 'keyboard cat',
		saveUninitialized: true,
		resave: true,
		key: 'sid'
	}
));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));


passport.serializeUser(function (user, done) {
	done(null, user);
});

passport.deserializeUser(function (obj, done) {
	done(null, obj);
});

passport.use(new FacebookStrategy({
		clientID: nconf.get('api:facebook:clientId'),
		clientSecret: nconf.get('api:facebook:clientSecret'),
		callbackURL: nconf.get('api:facebook:callbackUrl')
	},
	function (accessToken, refreshToken, profile, done) {
		process.nextTick(function () {
			return done(null, profile);
		});
	}
));

app.get('/', function (request, response) {
	response.render('index', {user: request.user});
});

app.get('/account', ensureAuthenticated, function (request, response) {
	response.render('account', {user: request.user});
});

app.get('/auth/facebook', passport.authenticate('facebook', {scope: 'email'}));

app.get('/auth/facebook/callback',
	passport.authenticate('facebook', {successRedirect: '/', failureRedirect: '/login'}),
	function (request, response) {
		response.redirect('/');
	});

app.get('/logout', function (request, response) {
	request.logout();
	response.redirect('/');
});

function ensureAuthenticated(request, response, next) {
	if (request.isAuthenticated()) {
		return next();
	}
	response.redirect('/login')
}
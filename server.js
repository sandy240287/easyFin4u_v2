// set up ======================================================================
var express  = require('express');
var app      = express(); 								// create our app w/ express
var mongoose = require('mongoose'); 					// mongoose for mongodb
var port  	 = process.env.PORT || 3000; 				// set the port
var morgan   = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var passport = require('passport');
var flash    = require('connect-flash');
var session      = require('express-session');
var cookieParser = require('cookie-parser');
var cron = require('node-schedule');
var path = require('path');

var database = require('./config/database'); 			// load the database config

// configuration ===============================================================
mongoose.connect(database.url); 	// connect to mongoDB database on modulus.io

require('./config/passport')(passport); // pass passport for configuration

//app.use(express.static(__dirname + '/public')); 		// set the static files location /public/img will be /img for users
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));
app.use('/include',  express.static(__dirname + '/include'));
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms

app.use(bodyParser.urlencoded({'extended':'true'})); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride('X-HTTP-Method-Override')); // override with the X-HTTP-Method-Override header in the request

// required for passport
app.use(session({ secret: 'easyFin4uApplicationSSCorp' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport
require('./app/depositRoute.js')(app, passport); // load our routes and pass in our app and fully configured passport
require('./app/portfolioRoute.js')(app); // load our routes and pass in our app and fully configured passport

//Cron Scheduler for Reminder Service Starts - Runs everyday at 3 AM
var reminderService = require('./app/reminderService.js');
var rule = new cron.RecurrenceRule();
rule.dayOfWeek = [1,2,3,4,5,6,0];
rule.hour = 3;
rule.minute = 0;
cron.scheduleJob(rule, function(){
    console.log(new Date(), 'Calling the Maturity Reminder Service');
    reminderService.reminderService();
});
//Cron Scheduler for Reminder Service Ends - Runs everyday at 3 AM

// listen (start app with node server.js) ======================================
app.listen(port);
console.log("App listening on port " + port);

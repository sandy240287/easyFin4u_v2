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
var cron1 = require('node-schedule');
var cron2 = require('node-schedule');
var path = require('path');
var config = require('konfig')({ path: './config' });

var log4js = require('log4js');
log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file('logs/easyfinancewatch.log'), 'easyfinancewatch');
var logger = log4js.getLogger('easyfinancewatch');
logger.setLevel('INFO');

var database = require('./config/database'); 			// load the database config

// configuration ===============================================================
mongoose.connect(database.url); 	// connect to mongoDB database on modulus.io
mongoose.set('debug', true);

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

//Scribe Logger
//app.use(scribe.express.logger()); //Log each request
//app.use('/logs', scribe.webPanel());

// routes ======================================================================
require('./app/routes.js')(app, passport,config); // load our routes and pass in our app and fully configured passport
require('./app/depositRoute.js')(app, passport, logger); // load our routes and pass in our app and fully configured passport
require('./app/portfolioRoute.js')(app, passport); // load our routes and pass in our app and fully configured passport

//Cron Scheduler for Reminder Service Starts - Runs everyday at 3 AM
var reminderService = require('./app/reminderService.js')();
var rule1 = new cron1.RecurrenceRule();
rule1.dayOfWeek = [1,2,3,4,5,6,0];
rule1.hour = 3;
rule1.minute = 0;
cron1.scheduleJob(rule1, function(){
    console.log(new Date(), 'Calling the Maturity Reminder Service');
    reminderService.reminderService(config);
});
//Cron Scheduler for Reminder Service Ends - Runs everyday at 3 AM

//Cron Scheduler for Profile Alert Service - Runs Mon-Fri every 30 mins
var portfolioAlertService = require('./app/portfolioAlertService.js')();
var rule2 = new cron2.RecurrenceRule();
rule2.minute = new cron2.Range(0, 59, 30);
cron2.scheduleJob(rule2, function(){
    console.log(new Date(), 'Calling the Portfolio Alerting Service');
    portfolioAlertService.portfolioAlertService(config);
});
//Cron Scheduler for Reminder Service Ends - Runs everyday at 3 AM

// listen (start app with node server.js) ======================================
app.listen(port);
console.log("App listening on port " + port);

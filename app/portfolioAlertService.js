var mongoose = require('mongoose');
var async = require('async');
var userPortfolio = require('./models/userPortfolio');
var User = require('./models/user');
var moment = require('moment');
var database = require('../config/database');
var NodeCache = require( "node-cache" );
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var request = require('request');

//var config = require('konfig')({ path: '../config' }); //Uncomment this line for Standalone execution
//mongoose.connect(database.url); //Uncomment this line for Standalone execution
//mongoose.set('debug', true);    //Uncomment this line for Standalone execution

var userCache = new NodeCache();
var alertDataCache = new NodeCache();

module.exports =  function (config) {    //Comment these lines for Standalone execution
var module = {};                         //Comment these lines for Standalone execution
module.portfolioAlertService = function(config){  //Comment these lines for Standalone execution

    async.waterfall([
      function createUserCache(done){

          User.find({},function(err, users) {
              //console.log("Inside createUserCache");
              // if there is an error retrieving, send the error.
              if (err){
                //console.log("Error:"+ err);
                done(err);
                //process.exit(1);
              }else{
                for(var user in users){
                    //console.log(users[user]._id+": "+users[user].local.email);
                    userCache.set(users[user]._id,users[user].local.email);
                }
                done(null,user);
              }
          });
        },function getAlertParticipants(user,done){
          //console.log("Inside getAlertParticipants");
          var query = {'alert_active_status' : 'true'};
          // use mongoose to get all with true alert_active_status in the database
          userPortfolio.find(query,function(err, userPortfolios) {
              // if there is an error retrieving, send the error. nothing after res.send(err) will execute
              if (err){
                console.log("Error:"+ err);
                done(err);
                //process.exit(1);
              }else{
                //console.log(userPortfolios);
                done(null,userPortfolios);
              }
          });
        },
        function gatherAlertData(userPortfolios,done){
          //console.log("Inside gatherAlertData");
          var updatedPortfolio;
          var updatedPortfolioList = [];

          var getCurrentEquityPrice = function(userPortfolio,done){

            var url = "http://finance.yahoo.com/webservice/v1/symbols/"+userPortfolio.symbol+"/quote?format=json&view=detail";

            request(url, function (error, response, body) {
              if (!error && response.statusCode == 200) {
                body = JSON.parse(body);
                //console.log(body.list.resources[0].resource.fields.price);

                if(body.list.resources[0].resource.fields.price <= userPortfolio.lower_limit){

                  updatedPortfolio = {
                    objectId : userPortfolio._id,
                    userid : userPortfolio.userid,
                    symbol : userPortfolio.symbol,
                    name : userPortfolio.name,
                    lastprice : parseFloat(body.list.resources[0].resource.fields.price).toFixed(3),
                    chg_percent : body.list.resources[0].resource.fields.chg_percent,
                    shares_qty : userPortfolio.shares_qty,
                    cost_per_share : parseFloat(userPortfolio.cost_per_share).toFixed(3),
                    cost_basis : parseFloat(userPortfolio.cost_per_share * userPortfolio.shares_qty).toFixed(3) ,
                    mkt_value : parseFloat(userPortfolio.shares_qty*body.list.resources[0].resource.fields.price).toFixed(3),
                    gain : (parseFloat(parseInt(userPortfolio.shares_qty)*parseInt(body.list.resources[0].resource.fields.price)).toFixed(3)) -
                    (parseFloat(parseInt(userPortfolio.cost_per_share) * parseInt(userPortfolio.shares_qty)).toFixed(3)),
                    gain_percent : parseFloat(((parseFloat(parseInt(userPortfolio.shares_qty)*parseInt(body.list.resources[0].resource.fields.price)).toFixed(3) -
                    parseFloat(parseInt(userPortfolio.cost_per_share) * parseInt(userPortfolio.shares_qty)).toFixed(3))/
                    (parseInt(userPortfolio.cost_per_share) * parseInt(userPortfolio.shares_qty)))*100).toFixed(3),
                    lower_limit : userPortfolio.lower_limit,
                    upper_limit : userPortfolio.upper_limit,
                    lower_alert_sent_counter : parseInt(userPortfolio.lower_alert_sent_counter)+1,
                    lower_alert_sent_dt : new Date(),
                    lower_alert_sent_price : parseFloat(body.list.resources[0].resource.fields.price).toFixed(3),
                    upper_alert_sent_counter : Number,
                    upper_alert_sent_dt : String,
                    upper_alert_sent_price : String
                  };
                  //console.log("Inside 1");

                }else if(body.list.resources[0].resource.fields.price >= userPortfolio.upper_limit){

                  updatedPortfolio = {
                    objectId : userPortfolio._id,
                    userid : userPortfolio.userid,
                    symbol : userPortfolio.symbol,
                    name : userPortfolio.name,
                    lastprice : parseFloat(body.list.resources[0].resource.fields.price).toFixed(3),
                    chg_percent : body.list.resources[0].resource.fields.chg_percent,
                    shares_qty : userPortfolio.shares_qty,
                    cost_per_share : parseFloat(userPortfolio.cost_per_share).toFixed(3),
                    cost_basis : parseFloat(userPortfolio.cost_per_share * userPortfolio.shares_qty).toFixed(3) ,
                    mkt_value : parseFloat(userPortfolio.shares_qty*body.list.resources[0].resource.fields.price).toFixed(3),
                    gain : (parseFloat(parseInt(userPortfolio.shares_qty)*parseInt(body.list.resources[0].resource.fields.price)).toFixed(3)) -
                    (parseFloat(parseInt(userPortfolio.cost_per_share) * parseInt(userPortfolio.shares_qty)).toFixed(3)),
                    gain_percent : parseFloat(((parseFloat(parseInt(userPortfolio.shares_qty)*parseInt(body.list.resources[0].resource.fields.price)).toFixed(3) -
                    parseFloat(parseInt(userPortfolio.cost_per_share) * parseInt(userPortfolio.shares_qty)).toFixed(3))/
                    (parseInt(userPortfolio.cost_per_share) * parseInt(userPortfolio.shares_qty)))*100).toFixed(3),
                    lower_limit : userPortfolio.lower_limit,
                    upper_limit : userPortfolio.upper_limit,
                    upper_alert_sent_counter : parseInt(userPortfolio.upper_alert_sent_counter)+1,
                    upper_alert_sent_dt : new Date(),
                    upper_alert_sent_price : parseFloat(body.list.resources[0].resource.fields.price).toFixed(3)
                  };
                  //console.log("Inside 2");
                }else{
                  //console.log("Inside 3");
                }
                //console.log("Yahoo Data"+ JSON.stringify(updatedPortfolio));

                if(updatedPortfolioList !== undefined)
                  alertDataCache.set(updatedPortfolio.objectId,updatedPortfolio);

                done(null,updatedPortfolioList);
              }
              if (error){
                console.log("ERROR"+error);
                done(error);
              }
            });
          }

          async.each(userPortfolios, getCurrentEquityPrice, function(err){
            //console.log(alertDataCache);
            if ( err){
              console.log("Inside Error");
              done(err);// either file1, file2 or file3 has raised an error, so you should not use results and handle the error
            } else {
              done(null,alertDataCache);
            }
          });

      },
        function sendReminderMail(alertDataCache,done){
          //console.log("Inside sendReminderMail");

          var alertKeys = alertDataCache.keys();
          //console.log(alertKeys);
          if(alertKeys.length === 0){
            console.log("No mail to send for alerts");
            done(null);
            //process.exit(); //Comment for Standalone
          }else{
          for (key in alertKeys){
            //console.log(alertKeys[key]);
            if(alertDataCache.get(alertKeys[key]) !== undefined){
              var userEmail = userCache.get(alertDataCache.get(alertKeys[key]).userid);
              //console.log(userEmail);
              var options = {
                            service: config.appconfig.senderService,
                            auth: {
                              user: config.appconfig.senderEmail,
                              pass: config.appconfig.senderPass
                            }
                          };
              var smtpTransporter = nodemailer.createTransport(smtpTransport(options));
              var mailOptions = {
                to: userEmail,
                from: 'portfolioAlert@easyfinancewatch.com',
                subject: 'Portfolio Alert - Easy Finance Watch',
                text: 'Hello,\n\n' +
                  'You are recieving this mail because you have subscribed for the alert service of www.easyfinancewatch.com. \n\n' +
                  'We have noticed a change in the prices of the stock that you have subscribed. Below are the details : \n\n' +
                  'Stock Symbol            : '+ alertDataCache.get(alertKeys[key]).symbol + '\n\n' +
                  'Stock Name              : '+ alertDataCache.get(alertKeys[key]).name + '\n\n' +
                  'Stock Quantity          : '+ alertDataCache.get(alertKeys[key]).shares_qty + '\n\n' +
                  'Lower Limit Subscribed  : '+ alertDataCache.get(alertKeys[key]).lower_limit + '\n\n' +
                  'Upper Limit Subscribed  : '+ alertDataCache.get(alertKeys[key]).upper_limit + '\n\n' +
                  'Current Market Price    : '+ alertDataCache.get(alertKeys[key]).lastprice + '\n\n' +
                  'Gain Amount             : '+ alertDataCache.get(alertKeys[key]).gain + '\n\n' +
                  'Gain Percent            : '+ alertDataCache.get(alertKeys[key]).gain_percent + '\n\n' +
                  'Thanks for using our services.'
              };
              smtpTransporter.sendMail(mailOptions, function(err) {
                console.log("Alert mail sent to : "+ userEmail);
                done(err);
                //process.exit(); //Uncomment this line for Standalone execution
              });
            }
          }
        }
        }
    ], function (error) {
        if (error) {
            console.log(error);
            //process.exit(1);
        }
    });

  }     //Comment these lines for Standalone execution
  return module;  //Comment these lines for Standalone execution
}      //Comment these lines for Standalone execution

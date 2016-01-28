var mongoose = require('mongoose');
var async = require('async');
var Deposit = require('./models/deposit');
var User = require('./models/user');
var moment = require('moment');
var database = require('../config/database');
var NodeCache = require( "node-cache" );
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

//mongoose.connect(database.url); //Uncomment this line for Standalone execution
var userCache = new NodeCache();

module.exports = {reminderService: function() {
  //function reminderService(){
    async.waterfall([
      function createUserCache(done){

          User.find({},function(err, users) {
              //console.log("Inside createUserCache");
              // if there is an error retrieving, send the error.
              if (err){
                //console.log("Error:"+ err);
                done(err);
                process.exit(1);
              }else{
                for(var user in users){
                    //console.log(users[user]._id+": "+users[user].local.email);
                    userCache.set(users[user]._id,users[user].local.email);
                }
                done(null,user);
              }
          });
        },
        function getMaturityData(user,done){
          //console.log("Inside getMaturityData");
          var now = new Date();
          var reminderDays = 5;
          now.setDate(now.getDate()+reminderDays);
          //console.log(now.toISOString());
          var query = {'maturityDate' : { $lte : new Date(now.toISOString()) }};
          // use mongoose to get all deposits in the database
          Deposit.find(query,function(err, deposits) {
              // if there is an error retrieving, send the error. nothing after res.send(err) will execute
              if (err){
                //console.log("Error:"+ err);
                done(err);
                process.exit(1);
              }else{
                //console.log(deposits);
                done(null,deposits,user);
              }
          });
        },
        function sendReminderMail(deposits,user,done){
          //console.log("Inside sendReminderMail");
          for(var deposit in deposits){
                  var userEmail = userCache.get(deposits[deposit].userid);
                  //console.log(userEmail);
                  var options = {
                                service: 'SendGrid',
                                auth: {
                                  user: '<email>',
                                  pass: '<password>'
                                }
                              };
                  var smtpTransporter = nodemailer.createTransport(smtpTransport(options));
                  var mailOptions = {
                    to: userEmail,
                    from: 'maturityReminder@easyFin4u.com',
                    subject: 'Deposit Maturity Reminder - Easy Finance Manager',
                    text: 'Hello,\n\n' +
                      'This is a reminder mail for the maturity of your Deposit with the below details. \n\n' +
                      'Bank            : '+ deposits[deposit].bank + '\n\n' +
                      'Deposit Number  : '+ deposits[deposit].number + '\n\n' +
                      'Deposit Amount  : '+ deposits[deposit].amount + '\n\n' +
                      'Creation Date   : '+ deposits[deposit].createDate + '\n\n' +
                      'Maturity Date   : '+ deposits[deposit].maturityDate + '\n\n' +
                      'Deposit Type    : '+ deposits[deposit].type + '\n\n' +
                      'Maturity Amount : '+ deposits[deposit].maturityAmount + '\n\n' +
                      'Thanks for using our services.'
                  };
                  smtpTransporter.sendMail(mailOptions, function(err) {
                    console.log("Mail Sent for Maturity");
                    done(err);
                    //process.exit(); //Uncomment this line for Standalone execution
                  });

              }
        }
    ], function (error) {
        if (error) {
            console.log(error);
            process.exit(1);
        }
    });
  //}
  }
}

var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

// load up the user model
var User            = require('../app/models/user');

module.exports = function(app, passport) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
//Commented to Angular Implementation
    // app.get('/', function(req, res) {
    //     res.render('index.ejs'); // load the index.ejs file
    // });

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form

//Commented to Angular Implementation
    app.get('/login', function(req, res) {
      res.redirect('/');
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
            failureFlash : true // allow flash messages
          }),function(req, res) {
            console.log("Inside Response");
              res.send({
                user : req.user,
                message: req.flash('loginMessage')
              });
          });

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {
      res.redirect('/');
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        failureFlash : true // allow flash messages
    }),function(req, res) {
        res.send({
          user : req.user,
          message: req.flash('signupMessage')
        });
    });

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)

    app.get('/profile', isLoggedIn, function(req, res) {
        res.redirect('/');
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    // =====================================
    // FD ==============================
    // =====================================
    // show the FD form

//Commented to Angular Implementation
    app.get('/fdDetails',reLogin, function(req, res) {

        // render the page and pass in any flash data if it exists
        //res.render('fdDetails.ejs', { message: req.flash('loginMessage') , user : req.user });
    });

    app.get('/forgot', function(req, res) {
        res.redirect('/');
    });

    // Process the Reset Password request
        app.post('/forgot', function(req, res, next) {
            async.waterfall([
              function(done) {
                crypto.randomBytes(20, function(err, buf) {
                  var token = buf.toString('hex');
                  done(err, token);
                });
              },
              function(token, done) {
                User.findOne({ 'local.email': req.body.email }, function(err, user) {
                  if (!user) {
                    req.flash('error', 'No account with that email address exists.');
                    return res.redirect('/forgot');
                  }
                  user.local.resetPasswordToken = token;
                  user.local.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                  user.save(function(err) {
                    done(err, token, user);
                  });
                });
              },
              function(token, user, done) {
                var options = {
                              service: 'SendGrid',
                              auth: {
                                user: 'sandeep.saini.cs@gmail.com',
                                pass: 'Sandeep@1987'
                              }
                            };
                var smtpTransporter = nodemailer.createTransport(smtpTransport(options));
                var mailOptions = {
                  to: user.local.email,
                  from: 'passwordreset@easyFin4u.com',
                  subject: 'Easy Finance Manager Password Reset',
                  text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                    'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                    'If you did not request this, please ignore this email and your password will remain unchanged.\n'
                };
                smtpTransporter.sendMail(mailOptions, function(err) {
                  done(err, 'done',
                      { message: req.flash('loginMessage','An e-mail has been sent to ' + user.local.email + ' with further instructions.')});
                });
              }
            ], function(err) {
              if (err) return next(err);
                //res.redirect('/');
                next();
            });
          }, function (req, res, err){
            var message = req.flash('loginMessage').toString();
            res.send(message);
          });

        // RESET PASSWORD HANDLER FOR TOKEN ROUTING
        app.get('/reset/:token', function(req, res) {
          User.findOne({ 'local.resetPasswordToken': req.params.token,
                         'local.resetPasswordExpires': { $gt: Date.now() } }, function(err, user) {
            if (!user) {
              req.flash('error', 'Password reset token is invalid or has expired.');
              return res.redirect('/forgot');
            }
            res.render('resetPassword.ejs', {token: req.params.token,message: req.flash('loginMessage') });
          });
        });

        //RESET PASSWORD HANDLER FOR PASSWORD CHANGE ROUTING
        app.post('/reset', function(req, res) {
          async.waterfall([
            function(done) {
              User.findOne({ 'local.resetPasswordToken': req.body.token,
                             'local.resetPasswordExpires': { $gt: Date.now() } }, function(err, user) {
                if (!user) {
                  req.flash('error', 'Password reset token is invalid or has expired.');
                  return res.redirect('back');
                }
                var newUser = new User();
                user.local.password = newUser.generateHash(req.body.password);
                user.local.resetPasswordToken = undefined;
                user.local.resetPasswordExpires = undefined;
                user.save(function(err) {
                  if (err)
                      throw err;
                  return done(null, user);
                });
              });
            },
            function(user, done) {
              var options = {
                            service: 'SendGrid',
                            auth: {
                              user: 'sandeep.saini.cs@gmail.com',
                              pass: 'Sandeep@1987'
                            }
                          };
              var smtpTransporter = nodemailer.createTransport(smtpTransport(options));
              var mailOptions = {
                to: user.local.email,
                from: 'passwordreset@easyFin4u.com',
                subject: 'Your password has been changed',
                text: 'Hello,\n\n' +
                  'This is a confirmation that the password for your account ' + user.local.email + ' has just been changed.\n'
              };
              smtpTransporter.sendMail(mailOptions, function(err) {
                done(err,{ message: req.flash('loginMessage', 'Success! Your password has been changed.')});
              });
            }
          ], function(err) {
            res.redirect('/');
          });
        });




};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
    //res.send(401);
}

function reLogin(req, res) {

    // if they aren't redirect them to the home page
    res.redirect('/');
    //res.send(401);
}

var userPortfolio = require('./models/userPortfolio');
var moment = require('moment');
const http = require('http');
const apiHttp = require('http');
var request = require('request');
var async = require('async');


module.exports = function(app) {
  app.get('/api/userPortfolio', function(req, res) {

    getUserPortfolioData(req,res);

    });

    app.post('/api/userPortfolio', function(req, res) {
      //console.log("POST"+JSON.stringify(req.body, null, 2));
      if((req.body.oper === 'add') || (req.body.oper === 'edit')){

        // create a Portfolio Data, information comes from AJAX request from Angular
        var query = { $and: [ { userid: req.user._id }, { symbol: req.body.symbol } ]};
        //var query = { symbol: req.body.symbol };
        var options = { upsert: 'true' };
        userPortfolio.findOneAndUpdate(query, { $set: {
          symbol : req.body.symbol,
          shares_qty : req.body.shares_qty,
          cost_per_share : req.body.cost_per_share,
          userid : req.user._id
        }}, options, function(err, deposit) {
          if (err){
            console.log("Error in Upserting:" + err);
            res.send(err);
          }else{
            getUserPortfolioData(req,res);
          }

        });
      }else if(req.body.oper === 'del'){

        var query = { $and: [ { userid: req.user._id }, { symbol: req.body.id } ]}; //Here id is the Key in the table
        //console.log("inside del :"+JSON.stringify(query, null, 2));
          userPortfolio.remove(query, function(err, deposit) {
            if (err){
              console.log("Error in Deleting:" + err);
              res.send(err);
            }
            else{
              getUserPortfolioData(req,res);
            }
              });
        }
      });

      app.get('/api/symbolSearch', function(req, res) {

        

      });







var getUserPortfolioData = function(req,res,done){

  var query = {userid: req.user._id};

  async.waterfall([

    function findPortfolioData(done){
      userPortfolio.find(query,function(err, userPortfolios) {
        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
        if (err){
          console.log("Error:"+ err);
          res.send(err);
        }
        done(null,userPortfolios);

      })
    },
    function updateLiveData(userPortfolios,done){

      var returnData = [];
      var profileData = {};

      var getSymbolData = function(userPortfolio,done){

        var url = "http://finance.yahoo.com/webservice/v1/symbols/"+userPortfolio.symbol+"/quote?format=json&view=detail";

        request(url, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            body = JSON.parse(body);
            //console.log(data.list.resources[1].fields.price);
            profileData = {

              symbol : userPortfolio.symbol,
              name : userPortfolio.name,
              lastprice : body.list.resources[0].resource.fields.price,
              chg_percent : body.list.resources[0].resource.fields.chg_percent,
              shares_qty : userPortfolio.shares_qty,
              cost_per_share : userPortfolio.cost_per_share,
              cost_basis : userPortfolio.cost_per_share * userPortfolio.shares_qty ,
              mkt_value : userPortfolio.shares_qty*body.list.resources[0].resource.fields.price,
              gain : (parseInt(userPortfolio.cost_per_share) * parseInt(userPortfolio.shares_qty)) -
              (parseInt(userPortfolio.shares_qty)*parseInt(body.list.resources[0].resource.fields.price)),
              gain_percent : (((parseInt(userPortfolio.cost_per_share) * parseInt(userPortfolio.shares_qty)) -
              (parseInt(userPortfolio.shares_qty)*parseInt(body.list.resources[0].resource.fields.price)))/
              (parseInt(userPortfolio.cost_per_share) * parseInt(userPortfolio.shares_qty)))*100

            };

            returnData.push(profileData);
            // console.log(returnData);
            done(null,returnData);
          }
          if (error){
            console.log("ERROR"+error);
            //done(error);
          }
        });
      }

      async.each(userPortfolios, getSymbolData, function(err){
        if ( err){
          done(err);// either file1, file2 or file3 has raised an error, so you should not use results and handle the error
        } else {
          res.json(returnData);
          done(null,returnData);
        }
      });

    }],function(err,returnData){
      if (err)
        console.log("ERROR"+err);
      });

}

}

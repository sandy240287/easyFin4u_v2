var userPortfolio= require('./models/userPortfolio');
var userPortfolio2 = require('./models/userPortfolio');
var moment = require('moment');
const http = require('http');
const apiHttp = require('http');
var request = require('request');
var async = require('async');


module.exports = function(app,passport) {
  app.get('/api/userPortfolio', function(req, res) {

    /* To Handle server re-starts */
    if(req.user === undefined)
      res.redirect('/');
      /* To Handle server re-starts */

    getUserPortfolioData(req,res);

    });

    app.post('/api/userPortfolio', function(req, res) {

      /* To Handle server re-starts */
      if(req.user === undefined)
        res.redirect('/');
        /* To Handle server re-starts */

      //console.log("POST"+JSON.stringify(req.body, null, 2));
      if((req.body.oper === 'add') || (req.body.oper === 'edit')){

        // create a Portfolio Data, information comes from AJAX request from Angular
        var query = { $and: [ { userid: req.user._id }, { symbol: req.body.symbol } ]};

        var options = { upsert: 'true' };
        console.log(JSON.stringify(query));
        console.log(JSON.stringify(userPortfolio));

        userPortfolio.findOneAndUpdate(query, { $set: {
          symbol : req.body.symbol,
          name : req.body.name,
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

        /* To Handle server re-starts */
        if(req.user === undefined)
          res.redirect('/');
          /* To Handle server re-starts */

            var returnData = [];
            var symbolData = {};
            var solrDocs = [];
            //console.log("Request: "+JSON.stringify(req.query.term));
            var url = "http://localhost:8983/solr/symbol_core/select?q="+req.query.term+"*&wt=json&indent=true&rows=50";
            //console.log(url);
            request(url, function (error, response, body) {
              if (!error && response.statusCode == 200) {
                body = JSON.parse(body);
                solrDocs = body.response.docs; //Extract the response docs
                for(doc in solrDocs){
                  //console.log(data.list.resources[1].fields.price);
                  symbolData = {
                    value : solrDocs[doc].SYMBOL[0],
                    label : "( "+solrDocs[doc].SYMBOL[0]+" )"+" - " + solrDocs[doc].NAME[0]
                  };
                  returnData.push(symbolData);
                }
                //console.log(returnData);
                res.json(returnData);
              }
              if (error){
                console.log("ERROR"+error);
                //done(error);
              }
            });
      });

      app.get('/api/getDistributionData', function(req, res) {

        /* To Handle server re-starts */
        if(req.user === undefined)
          res.redirect('/');
          /* To Handle server re-starts */


        var query = {userid: req.user._id};
        var distributionLabel = [];
        var distributionData = [];
        var completeData = {};
        var totalStockQty = 0, percentShare = 0;
        //console.log(JSON.stringify(query));

        userPortfolio2.find(query,function(err, userPortfolios) {
          // if there is an error retrieving, send the error. nothing after res.send(err) will execute
          if (err){
            console.log("Error:"+ err);
            res.send(err);
          }
          for (porData in userPortfolios){
            totalStockQty = parseInt(totalStockQty) + parseInt(userPortfolios[porData].shares_qty);
          }
          //console.log(JSON.stringify(totalStockQty));
          for (porData in userPortfolios){
            distributionLabel.push(userPortfolios[porData].name);
            //Convert Share Distribution to Percent
            percentShare = parseFloat((parseFloat(userPortfolios[porData].shares_qty).toFixed(2)/totalStockQty)*100).toFixed(2);
            distributionData.push(percentShare);
          }
          completeData = {label :  distributionLabel, data : distributionData };
          //console.log(JSON.stringify(completeData));
          res.json(completeData);
        });
      });



var getUserPortfolioData = function(req,res,done){

  var query = {userid: req.user._id};

  console.log(JSON.stringify(query));

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
              (parseInt(userPortfolio.cost_per_share) * parseInt(userPortfolio.shares_qty)))*100).toFixed(3)

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

var userPortfolio= require('./models/userPortfolio');
var userPortfolio2 = require('./models/userPortfolio');
var historicalstock = require('./models/historicalstock');
var monthly_historicalstock = require('./models/monthly_historicalstock');
var weekly_historicalstock = require('./models/weekly_historicalstock');
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

      // Provides Data for 1 year and more (in months)
      app.get('/api/getMonthlyPerformanceData', function(req, res) {

        var period = req.query.period;
        //var period = 9;
        var userQuery = {userid: req.user._id};
        //var userQuery = {userid: "56a1580276bee8ddc9295706"};
        var d = new Date();
        var performanceLabel = [];
        var performanceSeries = [];
        var performanceData = [];
        var completeData = {};
        var fomatted_date = moment(d).format('YYYY-MM-DD');
        var fomatted_month = moment(d).format('YYYY-MM');
        var fomatted_year = moment(d).format('YYYY');

        async.waterfall([
            function getUserData(done){
                var q1 = { $and: [] };
                var q2 = { $or: [] };
                var q3 = { $or: [] };
                for(var i=0;i<=period;i++){
                  fomatted_month = moment(d).subtract(i, 'months').format('YYYY-MM');
                  var reg = new RegExp(fomatted_month,"i");
                  q2.$or.push({date: reg});
              }
                //console.log(q2);
                userPortfolio2.find(userQuery,function(err, userPortfolios) {
                  // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                  if (err){
                    console.log("Error:"+ err);
                    res.send(err);
                  }
                  for (porData in userPortfolios){
                    q3.$or.push({symbol: userPortfolios[porData].symbol});
                  }
                  //console.log(q3);
                  q1.$and.push(q2);
                  q1.$and.push(q3);

                  done(null,q1);
                });
            },function getMonthlyData(q1,done){
                      //var test = {symbol: 'GOOG'};
                      //console.log(q1);
                      monthly_historicalstock.find(q1,function(err, stockValues) {
                          // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                          if (err){
                            console.log("Error:"+ err);
                            res.send(err);
                          }
                          //console.log(JSON.stringify(stockValues));

                          for (stockValue in stockValues){
                            performanceData.push(stockValues[stockValue].day_end_adjusted);
                            performanceSeries.push(stockValues[stockValue].symbol);
                            performanceLabel.push(stockValues[stockValue].date);
                          }
                          //console.log(JSON.stringify(totalStockQty));
                          // for (porData in userPortfolios){
                          //   distributionLabel.push(userPortfolios[porData].name);
                          //   //Convert Share Distribution to Percent
                          //   percentShare = parseFloat((parseFloat(userPortfolios[porData].shares_qty).toFixed(2)/totalStockQty)*100).toFixed(2);
                          //   distributionData.push(percentShare);
                          // }
                          performanceLabelUnique = performanceLabel.filter(function(elem, pos) {
                              return performanceLabel.indexOf(elem) == pos;
                          });

                          performanceSeriesUnique = performanceSeries.filter(function(elem, pos) {
                              return performanceSeries.indexOf(elem) == pos;
                          });

                          // TODO: Reverse arrays all
                          performanceLabelUnique = performanceLabelUnique.reverse();
                          performanceSeriesUnique = performanceSeriesUnique.reverse();
                          performanceData = performanceData.reverse();

                          var performanceDataSpliced = [], size = performanceLabelUnique.length;

                          while (performanceData.length > 0)
                                performanceDataSpliced.push(performanceData.splice(0, size));

                          //console.log(performanceDataSpliced);

                          completeData = {label :  performanceLabelUnique, series: performanceSeriesUnique,data : performanceDataSpliced };
                          //console.log(JSON.stringify(completeData));
                          res.json(completeData);
                      });
              }],function(err){
                if (err)
                  console.log("ERROR"+err);
              });

      });

      // Provides Data for 2 Months, 3 months ,6 months (in weeks)
      app.get('/api/getWeeklyPerformanceData', function(req, res) {

        var period = req.query.period;  // Period shall come in multiple of 4. (4,8,12)
        period = (period/4)-1;  //Converting the Weeks to months duration
        //var period = 9;
        var userQuery = {userid: req.user._id};
        //var userQuery = {userid: "56a1580276bee8ddc9295706"};
        var d = new Date();
        var performanceLabel = [];
        var performanceSeries = [];
        var performanceData = [];
        var completeData = {};
        var fomatted_date = moment(d).format('YYYY-MM-DD');
        var fomatted_month = moment(d).format('YYYY-MM');
        var fomatted_year = moment(d).format('YYYY');

        async.waterfall([
            function getUserData(done){
                var q1 = { $and: [] };
                var q2 = { $or: [] };
                var q3 = { $or: [] };
                for(var i=0;i<=period;i++){
                  fomatted_month = moment(d).subtract(i, 'months').format('YYYY-MM');
                  var reg = new RegExp(fomatted_month,"i");
                  q2.$or.push({date: reg});
              }
                //console.log(q2);
                userPortfolio2.find(userQuery,function(err, userPortfolios) {
                  // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                  if (err){
                    console.log("Error:"+ err);
                    res.send(err);
                  }
                  for (porData in userPortfolios){
                    q3.$or.push({symbol: userPortfolios[porData].symbol});
                  }
                  //console.log(q3);
                  q1.$and.push(q2);
                  q1.$and.push(q3);

                  done(null,q1);
                });
            },function getMonthlyData(q1,done){
                      //var test = {symbol: 'GOOG'};
                      //console.log(q1);
                      weekly_historicalstock.find(q1,function(err, stockValues) {
                          // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                          if (err){
                            console.log("Error:"+ err);
                            res.send(err);
                          }
                          //console.log(JSON.stringify(stockValues));

                          for (stockValue in stockValues){
                            performanceData.push(stockValues[stockValue].day_end_adjusted);
                            performanceSeries.push(stockValues[stockValue].symbol);
                            performanceLabel.push(stockValues[stockValue].date);
                          }
                          //console.log(JSON.stringify(totalStockQty));
                          // for (porData in userPortfolios){
                          //   distributionLabel.push(userPortfolios[porData].name);
                          //   //Convert Share Distribution to Percent
                          //   percentShare = parseFloat((parseFloat(userPortfolios[porData].shares_qty).toFixed(2)/totalStockQty)*100).toFixed(2);
                          //   distributionData.push(percentShare);
                          // }
                          performanceLabelUnique = performanceLabel.filter(function(elem, pos) {
                              return performanceLabel.indexOf(elem) == pos;
                          });

                          performanceSeriesUnique = performanceSeries.filter(function(elem, pos) {
                              return performanceSeries.indexOf(elem) == pos;
                          });

                          // TODO: Reverse arrays all
                          performanceLabelUnique = performanceLabelUnique.reverse();
                          performanceSeriesUnique = performanceSeriesUnique.reverse();
                          performanceData = performanceData.reverse();

                          var performanceDataSpliced = [], size = performanceLabelUnique.length;

                          while (performanceData.length > 0)
                                performanceDataSpliced.push(performanceData.splice(0, size));

                          //console.log(performanceDataSpliced);

                          completeData = {label :  performanceLabelUnique, series: performanceSeriesUnique,data : performanceDataSpliced };
                          //console.log(JSON.stringify(completeData));
                          res.json(completeData);
                      });
              }],function(err){
                if (err)
                  console.log("ERROR"+err);
              });

      });

      // Provides Data for 2 weeks and 1 month (in days)
      app.get('/api/getDailyPerformanceData', function(req, res) {

        var period = req.query.period;
        //var period = 9;
        var userQuery = {userid: req.user._id};
        //var userQuery = {userid: "56a1580276bee8ddc9295706"};
        var d = new Date();
        var performanceLabel = [];
        var performanceSeries = [];
        var performanceData = [];
        var completeData = {};
        var fomatted_date = moment(d).format('YYYY-MM-DD');
        var fomatted_month = moment(d).format('YYYY-MM');
        var fomatted_year = moment(d).format('YYYY');

        async.waterfall([
            function getUserData(done){
                var q1 = { $and: [] };
                var q2 = { $or: [] };
                var q3 = { $or: [] };
                for(var i=0;i<=period;i++){
                  fomatted_date = moment(d).subtract(i, 'days').format('YYYY-MM-DD');
                  var reg = new RegExp(fomatted_date,"i");
                  q2.$or.push({date: reg});
              }
                //console.log(q2);
                userPortfolio2.find(userQuery,function(err, userPortfolios) {
                  // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                  if (err){
                    console.log("Error:"+ err);
                    res.send(err);
                  }
                  for (porData in userPortfolios){
                    q3.$or.push({symbol: userPortfolios[porData].symbol});
                  }
                  //console.log(q3);
                  q1.$and.push(q2);
                  q1.$and.push(q3);

                  done(null,q1);
                });
            },function getData(q1,done){
                      //var test = {symbol: 'GOOG'};
                      //console.log(q1);
                      historicalstock.find(q1,function(err, stockValues) {
                          // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                          if (err){
                            console.log("Error:"+ err);
                            res.send(err);
                          }
                          //console.log(JSON.stringify(stockValues));

                          for (stockValue in stockValues){
                            performanceData.push(stockValues[stockValue].day_end_adjusted);
                            performanceSeries.push(stockValues[stockValue].symbol);
                            performanceLabel.push(stockValues[stockValue].date);
                          }
                          //console.log(JSON.stringify(totalStockQty));
                          // for (porData in userPortfolios){
                          //   distributionLabel.push(userPortfolios[porData].name);
                          //   //Convert Share Distribution to Percent
                          //   percentShare = parseFloat((parseFloat(userPortfolios[porData].shares_qty).toFixed(2)/totalStockQty)*100).toFixed(2);
                          //   distributionData.push(percentShare);
                          // }
                          performanceLabelUnique = performanceLabel.filter(function(elem, pos) {
                              return performanceLabel.indexOf(elem) == pos;
                          });

                          performanceSeriesUnique = performanceSeries.filter(function(elem, pos) {
                              return performanceSeries.indexOf(elem) == pos;
                          });

                          // TODO: Reverse arrays all
                          performanceLabelUnique = performanceLabelUnique.reverse();
                          performanceSeriesUnique = performanceSeriesUnique.reverse();
                          performanceData = performanceData.reverse();

                          var performanceDataSpliced = [], size = performanceLabelUnique.length;

                          while (performanceData.length > 0)
                                performanceDataSpliced.push(performanceData.splice(0, size));

                          //console.log(performanceDataSpliced);

                          completeData = {label :  performanceLabelUnique, series: performanceSeriesUnique,data : performanceDataSpliced };
                          //console.log(JSON.stringify(completeData));
                          res.json(completeData);
                      });
              }],function(err){
                if (err)
                  console.log("ERROR"+err);
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

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
var NodeCache = require( "node-cache" );

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
      if(req.body.oper === 'add'){

        // create a Portfolio Data, information comes from AJAX request from Angular
        console.log(JSON.stringify(req.body));

        var userPortfolioObj = new userPortfolio();

        userPortfolioObj.symbol = req.body.symbol,
        userPortfolioObj.name = req.body.name,
        userPortfolioObj.shares_qty = req.body.shares_qty,
        userPortfolioObj.cost_per_share = req.body.cost_per_share,
        userPortfolioObj.userid = req.user._id,
        userPortfolioObj.alert_active_status = "false";
        userPortfolioObj.lower_limit = 0;
        userPortfolioObj.lower_alert_sent_counter = 0;
        userPortfolioObj.lower_alert_sent_dt = new Date();
        userPortfolioObj.lower_alert_sent_price = 0;
        userPortfolioObj.upper_limit = 0;
        userPortfolioObj.upper_alert_sent_counter = 0;
        userPortfolioObj.upper_alert_sent_dt = new Date();
        userPortfolioObj.upper_alert_sent_price = 0;

        userPortfolioObj.save(function(err,userPor) {
                if (err){
                    throw err;
                    console.log("Error in inserting alert:"+ err);
                  }
                    getUserPortfolioData(req,res);
            });
      }else if(req.body.oper === 'edit'){

        // create a Portfolio Data, information comes from AJAX request from Angular
        var query = { $and: [ { userid: req.user._id }, { _id: req.body.id } ]};

        var options = { upsert: 'true' };
        console.log(JSON.stringify(query));
        console.log(JSON.stringify(req.body));

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

        var query = { $and: [ { userid: req.user._id }, { _id: req.body.id } ]}; //Here id is the Key in the table
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

      app.get('/api/getOriginalDistributionData', function(req, res) {

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
            totalStockQty = parseInt(totalStockQty) +
                            (parseInt(userPortfolios[porData].shares_qty)*parseInt(userPortfolios[porData].cost_per_share));
          }
          //console.log(JSON.stringify(totalStockQty));
          for (porData in userPortfolios){
            distributionLabel.push(userPortfolios[porData].name);
            //Convert Share Distribution to Percent
            percentShare = parseFloat(((parseInt(userPortfolios[porData].shares_qty)*parseInt(userPortfolios[porData].cost_per_share)).toFixed(2)/totalStockQty)*100).toFixed(2);
            distributionData.push(percentShare);
          }
          completeData = {label :  distributionLabel, data : distributionData };
          //console.log(JSON.stringify(completeData));
          res.json(completeData);
        });
      });

      app.get('/api/getCurrentDistributionData', function(req, res) {
        /* To Handle server re-starts */
        if(req.user === undefined)
          res.redirect('/');
          /* To Handle server re-starts */

        var query = {userid: req.user._id};

        //var query = { userid: "56b13abdd5921d263cb3ffb3"};
        var distributionLabel = [];
        var distributionData = [];
        var completeData = {};
        var stockMap = new NodeCache();

        userPortfolio2.find(query,function(err, userPortfolios) {
          // if there is an error retrieving, send the error. nothing after res.send(err) will execute
          //console.log(JSON.stringify(userPortfolios));
          if (err){
            console.log("Error:"+ err);
            res.send(err);
          }
          for (porData in userPortfolios){
            stockMap.set(userPortfolios[porData].symbol,userPortfolios[porData].shares_qty);
          }

          async.waterfall([
            function A(done){
              var count = 0;
              var totalStockQty = 0, percentShare = 0;
              var userPortfolios1  = userPortfolios;
              var stockqty = 0;
              for (porData in userPortfolios){
                var url = "http://finance.yahoo.com/webservice/v1/symbols/"+userPortfolios[porData].symbol+"/quote?format=json&view=detail";
                var headers = {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.76 Mobile Safari/537.36'
                };
                request({ url: url, headers: headers }, function (error, response, body) {
                  count++;
                  if (!error && response.statusCode == 200) {
                    body = JSON.parse(body);
                    //console.log(JSON.stringify(body));
                    stockqty = stockMap.get(body.list.resources[0].resource.fields.symbol);
                    totalStockQty = parseInt(totalStockQty) + (parseInt(stockqty)*parseInt(body.list.resources[0].resource.fields.price));
                    //console.log("Total"+totalStockQty);
                    if(count === userPortfolios.length){
                      //console.log("Calling Done" + count + ":" + userPortfolios.length +" : " + totalStockQty);
                      done(null,totalStockQty,userPortfolios);
                    }
                  }
                  if (error){
                    console.log("ERROR"+error);
                    //done(error);
                  }
                });
              }

            },function B(totalStockQty,userPortfolios,done){
              var getCurrentData = function(userPortfolio,done){
                  var url = "http://finance.yahoo.com/webservice/v1/symbols/"+userPortfolio.symbol+"/quote?format=json&view=detail";
                  var headers = {
                      'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.76 Mobile Safari/537.36'
                  };
                  request({ url: url, headers: headers }, function (error, response, body) {
                  if (!error && response.statusCode == 200) {
                      body = JSON.parse(body);
                      distributionLabel.push(userPortfolio.name);
                      percentShare = parseFloat((parseFloat(parseInt(userPortfolio.shares_qty)*parseInt(body.list.resources[0].resource.fields.price)).toFixed(2)/
                                      totalStockQty)*100).toFixed(2);
                      distributionData.push(percentShare);
                      done(null,distributionData,distributionLabel);
                    }
                    if (error){
                      console.log("ERROR"+error);
                    }
                  });
              }

              async.each(userPortfolios, getCurrentData, function(err){
                if (err){
                  console.log("Error"+err);
                  done(err);// either file1, file2 or file3 has raised an error, so you should not use results and handle the error
                } else {
                  completeData = {label :  distributionLabel, data : distributionData };
                  res.json(completeData);
                  //done(null,completeData);
                }
              });

            }
          ],function(err,completeData){
            console.log("Error:"+ err);
            res.send(err);
          });

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

                  done(null,q1,q2,q3);
                });
            },function getMonthlyData(q1,q2,q3,done){
                      if(q2.$or.length > 0 && q3.$or.length > 0){
                        monthly_historicalstock.find(q1,function(err, stockValues) {
                            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                            if (err){
                              console.log("Error:"+ err);
                              res.send(err);
                            }

                            /*Changes for Sorting by Name and then Date to take care of Daildy data updates*/
                            stockValues.sort(SortByName);

                            var performanceSeriesForCount = [], stockValueSorted = [];
                            for (stockValue in stockValues){
                              performanceSeriesForCount.push(stockValues[stockValue].symbol);
                            }
                            performanceLabelUnique = performanceSeriesForCount.filter(function(elem, pos) {
                                return performanceSeriesForCount.indexOf(elem) == pos;
                            });

                            var stockValueSplit = createGroupedArray(stockValues,(stockValues.length/performanceLabelUnique.length));

                            for (stockValueDateSort in stockValueSplit){
                              stockValueSplit[stockValueDateSort] = stockValueSplit[stockValueDateSort].sort(comp);
                              stockValueSorted.push(stockValueSplit[stockValueDateSort]);
                            }

                            stockValues = [].concat.apply([], stockValueSorted);
                            /*Changes for Sorting by Name and then Date to take care of Daildy data updates*/

                            for (stockValue in stockValues){
                              performanceData.push(stockValues[stockValue].day_end_adjusted);
                              performanceSeries.push(stockValues[stockValue].symbol);
                              performanceLabel.push(stockValues[stockValue].date);
                            }

                            performanceLabelUnique = performanceLabel.filter(function(elem, pos) {
                                return performanceLabel.indexOf(elem) == pos;
                            });

                            performanceSeriesUnique = performanceSeries.filter(function(elem, pos) {
                                return performanceSeries.indexOf(elem) == pos;
                            });

                            // TODO: Reverse arrays all
                            // performanceLabelUnique = performanceLabelUnique.reverse();
                            // performanceSeriesUnique = performanceSeriesUnique.reverse();
                            // performanceData = performanceData.reverse();

                            var performanceDataSpliced = [], size = performanceLabelUnique.length;

                            while (performanceData.length > 0)
                                  performanceDataSpliced.push(performanceData.splice(0, size));

                            //console.log(performanceDataSpliced);

                            completeData = {label :  performanceLabelUnique, series: performanceSeriesUnique,data : performanceDataSpliced };
                            //console.log(JSON.stringify(completeData));
                            res.json(completeData);
                        });
                      }else{
                        res.json("");
                        done(null);
                      }
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

                  done(null,q1,q2,q3);
                });
            },function getMonthlyData(q1,q2,q3,done){
                      if(q2.$or.length > 0 && q3.$or.length > 0){
                        weekly_historicalstock.find(q1,function(err, stockValues) {
                            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                            if (err){
                              console.log("Error:"+ err);
                              res.send(err);
                            }

                            var periodList = getSortedDateList(stockValues);

                            /* Commenting the Unique Stock List logic due to Performance issues of approx 100ms for 1 yr data*/
                            //var uniqueStockList = getSortedStockList(stockValues);
                            //stockValues = weeklyDataCorrectionUtil(stockValues,periodList,uniqueStockList);

                            stockValues = weeklyDataCorrectionUtil(stockValues,periodList,stockValues);

                            /*Changes for Sorting by Name and then Date to take care of Daily data updates*/
                            stockValues.sort(SortByName);
                            //console.log(stockValues);
                            var performanceSeriesForCount = [], stockValueSorted = [];
                            for (stockValue in stockValues){
                              performanceSeriesForCount.push(stockValues[stockValue].symbol);
                            }
                            performanceLabelUnique = performanceSeriesForCount.filter(function(elem, pos) {
                                return performanceSeriesForCount.indexOf(elem) == pos;
                            });

                            var stockValueSplit = createGroupedArray(stockValues,(stockValues.length/performanceLabelUnique.length));
                            //console.log(stockValueSplit);
                            for (stockValueDateSort in stockValueSplit){
                              stockValueSplit[stockValueDateSort] = stockValueSplit[stockValueDateSort].sort(comp);
                              stockValueSorted.push(stockValueSplit[stockValueDateSort]);
                            }
                            //console.log(stockValueSorted);
                            stockValues = [].concat.apply([], stockValueSorted);
                            /*Changes for Sorting by Name and then Date to take care of Daildy data updates*/

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
                            // performanceLabelUnique = performanceLabelUnique.reverse();
                            // performanceSeriesUnique = performanceSeriesUnique.reverse();
                            // performanceData = performanceData.reverse();

                            var performanceDataSpliced = [], size = performanceLabelUnique.length;

                            while (performanceData.length > 0)
                                  performanceDataSpliced.push(performanceData.splice(0, size));

                            //console.log(performanceDataSpliced);

                            completeData = {label :  performanceLabelUnique, series: performanceSeriesUnique,data : performanceDataSpliced };
                            //console.log(JSON.stringify(completeData));
                            res.json(completeData);3
                      });
                    }else{
                      res.json("");
                      done(null);
                    }
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
        var d2 = new Date();
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
                //var q2 = { $or: [] };
                var q2 = { date: {$gte : 0, $lte: 0}};
                var q3 = { $or: [] };
                // for(var i=0;i<=period;i++){
                //   fomatted_date = moment(d).subtract(i, 'days').format('YYYY-MM-DD');
                //   var reg = new RegExp(fomatted_date,"i");
                //   q2.$or.push({date: reg});
                // }

                current_date = moment().format('YYYY-MM-DD');
                history_date = moment().subtract(parseInt(period), 'days').format('YYYY-MM-DD');
                q2.date.$gte = history_date;
                q2.date.$lte = current_date;

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

                  done(null,q1,q2,q3);
                });
            },function getData(q1,q2,q3,done){
                      //console.log(q2.$or.length + "     :     " + q3.$or.length);
                      //console.log(q1);
                      if(q3.$or.length > 0){
                        //console.log(q1);
                        historicalstock.find(q1,null,function(err, stockValues) {
                            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                            if (err){
                              console.log("Error:"+ err);
                              res.send(err);
                            }
                            //console.log(JSON.stringify(stockValues));
                            if(stockValues === undefined || stockValues.length===0){
                              //console.log("JSON EMPTY");
                              res.json(stockValues);
                              done(null,stockValues);
                            }
                            else{
                                  // Data Correction utility to correct the missing data points.
                                  stockValues = dailyDataCorrectionUtil(stockValues,q2.date.$gte,q2.date.$lte);

                                  /*Changes for Sorting by Name and then Date to take care of Daily data updates*/
                                  stockValues.sort(SortByName);

                                  var performanceSeriesForCount = [], stockValueSorted = [];
                                  for (stockValue in stockValues){
                                    performanceSeriesForCount.push(stockValues[stockValue].symbol);
                                  }
                                  performanceLabelUnique = performanceSeriesForCount.filter(function(elem, pos) {
                                      return performanceSeriesForCount.indexOf(elem) == pos;
                                  });

                                  var stockValueSplit = createGroupedArray(stockValues,(stockValues.length/performanceLabelUnique.length));

                                  for (stockValueDateSort in stockValueSplit){
                                    stockValueSplit[stockValueDateSort] = stockValueSplit[stockValueDateSort].sort(comp);
                                    stockValueSorted.push(stockValueSplit[stockValueDateSort]);
                                  }

                                  stockValues = [].concat.apply([], stockValueSorted);
                                  /*Changes for Sorting by Name and then Date to take care of Daildy data updates*/

                                  for (stockValue in stockValues){
                                    performanceData.push(stockValues[stockValue].day_end_adjusted);
                                    performanceSeries.push(stockValues[stockValue].symbol);
                                    performanceLabel.push(stockValues[stockValue].date);
                                  }

                                  performanceLabelUnique = performanceLabel.filter(function(elem, pos) {
                                      return performanceLabel.indexOf(elem) == pos;
                                  });

                                  performanceSeriesUnique = performanceSeries.filter(function(elem, pos) {
                                      return performanceSeries.indexOf(elem) == pos;
                                  });

                                  // TODO: Reverse arrays all
                                  // performanceLabelUnique = performanceLabelUnique.reverse();
                                  // performanceSeriesUnique = performanceSeriesUnique.reverse();
                                  // performanceData = performanceData.reverse();

                                  var performanceDataSpliced = [], size = performanceLabelUnique.length;

                                  while (performanceData.length > 0)
                                        performanceDataSpliced.push(performanceData.splice(0, size));

                                  //console.log(performanceDataSpliced);

                                  completeData = {label :  performanceLabelUnique, series: performanceSeriesUnique,data : performanceDataSpliced };
                                  //console.log(JSON.stringify(completeData));
                                  res.json(completeData);
                                  done(null,completeData);
                                }

                        });
                      }else{
                        res.json("");
                        done(null);
                      }
              }],function(err){
                if (err)
                  console.log("ERROR"+err);
              });

      });

      var createGroupedArray = function(arr, chunkSize) {
          var groups = [], i;
          for (i = 0; i < arr.length; i += chunkSize) {
              groups.push(arr.slice(i, i + chunkSize));
          }
          return groups;
      }
      function comp(a, b) {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
      }

      function SortByName(x,y) {
        return ((x.symbol == y.symbol) ? 0 : ((x.symbol > y.symbol) ? 1 : -1 ));
      }

      function SortByStringValue(x,y) {
        return ((x == y) ? 0 : ((x > y) ? 1 : -1 ));
      }


var getUserPortfolioData = function(req,res,done){

  var query = {userid: req.user._id};

  //console.log(JSON.stringify(query));

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
        var headers = {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.76 Mobile Safari/537.36'
        };
        request({ url: url, headers: headers }, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            body = JSON.parse(body);
            //console.log(data.list.resources[1].fields.price);
            profileData = {
              objectId : userPortfolio._id,
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
              alert_active_status : userPortfolio.alert_active_status,
              lower_limit : userPortfolio.lower_limit,
              upper_limit : userPortfolio.upper_limit

            };

            returnData.push(profileData);
            //console.log("Yahoo Data"+ returnData);
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
          //console.log("Final Return"+ JSON.stringify(returnData));
          res.json(returnData);
          done(null,returnData);
        }
      });

    }],function(err,returnData){
      if (err)
        console.log("ERROR"+err);
      });

}



app.post('/api/userPortfolioManageAlert', function(req, res) {

  /* To Handle server re-starts */
  if(req.user === undefined)
    res.redirect('/');
    /* To Handle server re-starts */

    // create a Portfolio Data, information comes from AJAX request from Angular
    var query = { $and: [ { userid: req.user._id }, { _id: req.body.objectId } ]};

    var options = { upsert: 'true' };
    console.log(JSON.stringify(query));
    console.log(JSON.stringify(req.body));

    userPortfolio.findOneAndUpdate(query, { $set: {
      lower_limit : req.body.lower_limit,
      upper_limit : req.body.upper_limit,
      alert_active_status : req.body.alert_active_status
    }}, options, function(err, userPortfolio) {
      if (err){
        console.log("Error in Upserting Alert:" + err);
        res.send(err);
      }else{
        res.send(userPortfolio);
      }
    });

  });



/*
OSCILLATING SEARCH APPROXIMATE DATA CORRECTION ALGORITHM
Data Correction Utility for generating data for missing data points for the specified period.
It works in the following way:-
1. Loops through the Original Stock Values from Mongo to create a Map of all the available values with key (symbol_date);
2. Loops through the Period of Data Displayed from History to Current Date , creates a dynamic key for symbol_date and checks for the
   value in the Map. If the data is not present then it checks for the nearest date's data for the stock by performing a oscillating
   search between historic dates and future dates.
3. Once the data is found in any of the historic or future date , the Map is updated of the missing date data with the data found of the
   historic or future date.
4. After iterating through the complete Date and Equity possibilities. The map is transformed into an array of values and returned.
*/
function dailyDataCorrectionUtil(stockValues,history_date,current_date) {
  var correctionCache = new NodeCache();
  var correctionData = undefined;
  var correctionDataList = [];
  var correctionDate;
  var key, value, correctionKey;
  for (stockValue in stockValues){
    key = stockValues[stockValue].symbol + "_" + stockValues[stockValue].date;
    value = stockValues[stockValue];
    correctionCache.set(key,value);
  }
  //console.log("Initial Correction Cache :" + JSON.stringify(correctionCache.getStats()));
  while(history_date <= current_date){
    // TODO: The Loop for Stock Values is un-necessary.
    //       It is going through all the stock values, it should rather only go through unique stock values.
    for (stockValue in stockValues){
      correctionKey = stockValues[stockValue].symbol + "_" + history_date;
      //console.log("Correction Data Key:"+ correctionKey);
      value = correctionCache.get(correctionKey);
      if ( value == undefined ){
        // handle miss!
        var historySearch = true;
        var counter = 1,period = 1;
        do{
          if(historySearch === true){
            correctionDate = moment(history_date).subtract(period, 'days').format('YYYY-MM-DD');
            fillerDataKey = stockValues[stockValue].symbol + "_" + correctionDate;
            //console.log("Filler Data Key:"+ fillerDataKey);
            correctionData = correctionCache.get(fillerDataKey);
            historySearch = false;
          }else{
            correctionDate = moment(history_date).add(period, 'days').format('YYYY-MM-DD');
            fillerDataKey = stockValues[stockValue].symbol + "_" + correctionDate;
            //console.log("Filler Data Key:"+ fillerDataKey);
            correctionData = correctionCache.get(fillerDataKey);
            historySearch = true;
          }
          //console.log("Counter:"+counter);
          //console.log("Period:"+period);
          if(counter%2 === 0){
            period++;
          }
          counter++;
        }while(correctionData === undefined);

        correctionData.date = history_date;
        correctionCache.set(correctionKey,correctionData);

      }
    }
    history_date = moment(history_date).add(1, 'days').format('YYYY-MM-DD');
  }
  //console.log("Final Correction Cache :" + JSON.stringify(correctionCache.getStats()));
  allCorrectionkeys = correctionCache.keys();

  for (key in allCorrectionkeys){
    correctionDataList.push(correctionCache.get(allCorrectionkeys[key]));
  }
  //console.log("Final Correction List :" + JSON.stringify(correctionDataList));
  return correctionDataList;

}

function getSortedDateList(stockValues){
  var periodList = [], periodListUnique = [];
  for (stockValue in stockValues){
    periodList.push(stockValues[stockValue].date);
  }
  periodListUnique = periodList.filter(function(elem, pos) {
      return periodList.indexOf(elem) == pos;
  });

  periodListUnique = periodListUnique.sort(comp);
  //console.log("periodListUnique:"+periodListUnique);
  return periodListUnique;
}

function getSortedStockList(stockValues){
  var stockList = [], stockListUnique = [];
  for (stockValue in stockValues){
    stockList.push(stockValues[stockValue].symbol);
  }
  stockListUnique = stockList.filter(function(elem, pos) {
      return stockList.indexOf(elem) == pos;
  });

stockValues.sort(SortByStringValue);

return stockValues;

}

function weeklyDataCorrectionUtil(stockValues,periodList,uniqueStockList){
  var correctionCache = new NodeCache();
  var correctionData = undefined;
  var correctionDataList = [];
  var correctionDate;
  var key, value, correctionKey;
  for (stockValue in stockValues){
    key = stockValues[stockValue].symbol + "_" + stockValues[stockValue].date;
    value = stockValues[stockValue];
    correctionCache.set(key,value);
  }
  //console.log("Initial Correction Cache :" + JSON.stringify(correctionCache.getStats()));
  for (dt in periodList){
    history_date = periodList[dt];
    // TODO: The Loop for Stock Values is un-necessary.
    //       It is going through all the stock values, it should rather only go through unique stock values.
    for (stockValue in uniqueStockList){
      correctionKey = uniqueStockList[stockValue].symbol + "_" + history_date;
      //console.log("Correction Data Key:"+ correctionKey);
      value = correctionCache.get(correctionKey);
      if ( value == undefined ){
        // handle miss!
        var historySearch = true;
        var counter = 1,period = 1;
        do{
          if(historySearch === true){
            correctionDate = moment(history_date).subtract(period, 'days').format('YYYY-MM-DD');
            fillerDataKey = uniqueStockList[stockValue].symbol + "_" + correctionDate;
            //console.log("Filler Data Key:"+ fillerDataKey);
            correctionData = correctionCache.get(fillerDataKey);
            historySearch = false;
          }else{
            correctionDate = moment(history_date).add(period, 'days').format('YYYY-MM-DD');
            fillerDataKey = uniqueStockList[stockValue].symbol + "_" + correctionDate;
            //console.log("Filler Data Key:"+ fillerDataKey);
            correctionData = correctionCache.get(fillerDataKey);
            historySearch = true;
          }
          //console.log("Counter:"+counter);
          //console.log("Period:"+period);
          if(counter%2 === 0){
            period++;
          }
          counter++;
        }while(correctionData === undefined);

        correctionData.date = history_date;
        correctionCache.set(correctionKey,correctionData);

      }
    }
    //history_date = moment(history_date).add(1, 'days').format('YYYY-MM-DD');
  }
  //console.log("Final Correction Cache :" + JSON.stringify(correctionCache.getStats()));
  allCorrectionkeys = correctionCache.keys();

  for (key in allCorrectionkeys){
    correctionDataList.push(correctionCache.get(allCorrectionkeys[key]));
  }
  //console.log("Final Correction List :" + JSON.stringify(correctionDataList));
  return correctionDataList;
}


}

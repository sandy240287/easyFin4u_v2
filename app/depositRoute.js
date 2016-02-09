var Deposit = require('./models/deposit');
var moment = require('moment');

module.exports = function(app, passport,logger) {

  app.get('/api/deposits', function(req, res) {
    logger.info("Entering get Deposit  : /api/delDeposits/");

        var query = {userid: req.user._id};
        logger.debug("Query:"+ JSON.stringify(query));
        // use mongoose to get all deposits in the database
        Deposit.find(query,function(err, deposit) {

            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err){
              logger.error("Error:"+ err);
              res.send(err);
            }
            logger.debug("List of Deposits:"+ JSON.stringify(deposit));
            res.json(deposit); // return all deposits in JSON format
        });
        logger.info("Exiting get Deposit  : /api/delDeposits/");
    });

    // create Deposit and send back all deposits after creation
    app.post('/api/deposits', function(req, res) {
        logger.info("Entering post Deposit  : /api/delDeposits/");
        logger.debug("Post Body - Deposits "+ JSON.stringify(req.body));
        if((req.body.oper === 'add') || (req.body.oper === 'edit')){

            var fomatted_create_date = moment(req.body.createDate).format('YYYY-MM-DD');
            var fomatted_maturity_date = moment(req.body.maturityDate).format('YYYY-MM-DD');

            // create a Deposit, information comes from AJAX request from Angular
            var query = { $and: [ { userid: req.user._id }, { number: req.body.number } ]};
            logger.debug("Query:"+ JSON.stringify(query));
            var options = { upsert: 'true' };
            Deposit.findOneAndUpdate(query, { $set: {
                bank : req.body.bank,
                number : req.body.number,
                amount : req.body.amount,
                createDate : fomatted_create_date,
                maturityDate : fomatted_maturity_date,
                type : req.body.type,
                maturityAmount : req.body.maturityAmount,
                done : false
            }}, options, function(err, deposit) {
                if (err){
                    logger.error("Error:"+ err);
                    res.send(err);
                  }

                // get and return all the deposits after you create another
                Deposit.find(function(err, deposit) {
                    if (err){
                        logger.error("Error:"+ err);
                        res.send(err);
                      }
                      res.json(deposit);
                });
            });
        }else if(req.body.oper === 'del'){
            var query = { $and: [ { userid: req.user._id }, { number: req.body.id } ]};
            Deposit.remove(query, function(err, deposit) {
                if (err){
                    logger.error("Error:"+ err);
                    res.send(err);
                  }

                // get and return all the deposits after you create another
                Deposit.find(function(err, deposit) {
                    if (err){
                        logger.error("Error:"+ err);
                        res.send(err);
                      }
                    res.json(deposit);
                });
            });
        }
    });

    // delete a Deposit
    app.post('/api/delDeposits/', function(req, res) {
      logger.info("Entering Deposit Delete : /api/delDeposits/");
      logger.debug("Delete Post Body:" + JSON.stringify(req.body));
        Deposit.remove({
            _id : req.params.Deposit_id
        }, function(err, Deposit) {
            if (err){
                logger.error("Error:"+ err);
                res.send(err);
              }

            // get and return all the deposits after you create another
            Deposit.find(function(err, deposit) {
                if (err){
                    logger.error("Error:"+ err);
                    res.send(err);
                  }
                logger.debug("Getting Deposits after Delete:" + JSON.stringify(deposit));
                res.json(deposit);
            });
        });
        logger.info("Exiting Deposit Delete : /api/delDeposits/");
    });

}

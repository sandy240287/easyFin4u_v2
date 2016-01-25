var Deposit = require('./models/deposit');
var moment = require('moment');

module.exports = function(app, passport) {
  app.get('/api/deposits', function(req, res) {
        var query = {userid: req.user._id};
        console.log(query);
        // use mongoose to get all deposits in the database
        Deposit.find(query,function(err, deposit) {

            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err){
              console.log("Error:"+ err);
              res.send(err);
            }
            res.json(deposit); // return all deposits in JSON format
        });
    });

    // create Deposit and send back all deposits after creation
    app.post('/api/deposits', function(req, res) {
      console.log(req.body);
        if((req.body.oper === 'add') || (req.body.oper === 'edit')){

            var fomatted_create_date = moment(req.body.createDate).format('YYYY-MM-DD');
            var fomatted_maturity_date = moment(req.body.maturityDate).format('YYYY-MM-DD');
            console.log(fomatted_create_date);
            console.log(fomatted_maturity_date);
            // create a Deposit, information comes from AJAX request from Angular
            var query = { $and: [ { userid: req.user._id }, { number: req.body.number } ]};
            var options = { upsert: 'true' };
            Deposit.findOneAndUpdate(query, { $set: {
                bank : req.body.bank,
                number : req.body.number,
                amount : req.body.amount,
                createDate : fomatted_create_date,
                maturityDate : fomatted_maturity_date,
                //createDate : req.body.createDate,
                //maturityDate : req.body.maturityDate,
                type : req.body.type,
                maturityAmount : req.body.maturityAmount,
                done : false
            }}, options, function(err, deposit) {
                if (err){
                    console.log("Error:" + err);
                    res.send(err);
                  }

                // get and return all the deposits after you create another
                Deposit.find(function(err, deposit) {
                    if (err)
                        res.send(err)
                    res.json(deposit);
                });
            });
        }else if(req.body.oper === 'del'){
            var query = { $and: [ { userid: req.user._id }, { number: req.body.id } ]};
            Deposit.remove(query, function(err, deposit) {
                if (err)
                    res.send(err);

                // get and return all the deposits after you create another
                Deposit.find(function(err, deposit) {
                    if (err)
                        res.send(err)
                    res.json(deposit);
                });
            });
        }
    });

    // delete a Deposit
    app.post('/api/delDeposits/', function(req, res) {
        console.log(req.body);
        Deposit.remove({
            _id : req.params.Deposit_id
        }, function(err, Deposit) {
            if (err)
                res.send(err);

            // get and return all the deposits after you create another
            Deposit.find(function(err, deposit) {
                if (err)
                    res.send(err)
                res.json(deposit);
            });
        });
    });

}

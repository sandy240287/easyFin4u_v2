var mongoose = require('mongoose');
//var encrypt = require('mongoose-encryption');
//var secret = "hardToCrack@101";

var userPortfolio = new mongoose.Schema({
  symbol : String,
  name : String,
  lastprice : String,
  shares_qty : String,
  cost_per_share : String,
  reminder_status : String,
  lower_limit : String,
  higher_limit : String,
  userid : String
});

//depositSchema.plugin(encrypt, { secret: secret });

module.exports = mongoose.model('userPortfolio',userPortfolio);

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
  userid : String,
  alert_active_status : String,
  lower_limit : String,
  lower_alert_sent_counter : Number,
  lower_alert_sent_dt : String,
  lower_alert_sent_price : String,
  upper_limit : String,
  upper_alert_sent_counter : Number,
  upper_alert_sent_dt : String,
  upper_alert_sent_price : String
});

//depositSchema.plugin(encrypt, { secret: secret });

module.exports = mongoose.model('userPortfolio',userPortfolio);

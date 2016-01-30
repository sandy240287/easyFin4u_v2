var mongoose = require('mongoose');
//var encrypt = require('mongoose-encryption');
//var secret = "hardToCrack@101";

var weekly_historicalstock = new mongoose.Schema({
  symbol : String,
  date : String,
  day_high: String,
  day_low: String,
  day_open : String,
  day_close : String,
  day_end_adjusted : String
});

//depositSchema.plugin(encrypt, { secret: secret });

module.exports = mongoose.model('weekly_historicalstock',weekly_historicalstock);

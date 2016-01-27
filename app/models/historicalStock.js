var mongoose = require('mongoose');
//var encrypt = require('mongoose-encryption');
//var secret = "hardToCrack@101";

var historicalStock = new mongoose.Schema({
  symbol : String,
  date : Date,
  value : String,
  day_high: String,
  day_low: String,
  year_high : String,
  year_low : String
});

//depositSchema.plugin(encrypt, { secret: secret });

module.exports = mongoose.model('historicalStock',historicalStock);

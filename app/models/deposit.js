var mongoose = require('mongoose');
//var encrypt = require('mongoose-encryption');
//var secret = "hardToCrack@101";

var depositSchema = new mongoose.Schema({
  bank : String,
  number : String,
  amount : String,
  createDate : Date,
  maturityDate : Date,
  type : String,
  maturityAmount : String,
  userid : String
});

//depositSchema.plugin(encrypt, { secret: secret });

module.exports = mongoose.model('deposit',depositSchema);

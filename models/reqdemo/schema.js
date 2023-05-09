const mongoose = require('mongoose');

const { Schema } = mongoose;

const feedbackSchema = new Schema({
  name: {
    type: String
  },
  email: {
    type: String,
  },
  phone: {
    type: String
  },
  address : {
    type : String
  },
  building : {
    type : String
  },
  city : {
    type : String
  },
  date : {
    type : Date
  }
});

module.exports = mongoose.model('reqdemo', feedbackSchema);

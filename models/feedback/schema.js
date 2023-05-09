const mongoose = require('mongoose');

const { Schema } = mongoose;

const feedbackSchema = new Schema({
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String },
  phone: { type: String },
  message: { type: String }
});

module.exports = mongoose.model('feedbacks', feedbackSchema);

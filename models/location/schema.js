const mongoose = require('mongoose');
const _ = require('lodash');
const fileUtil = require('../../utils/file');
const { Schema } = mongoose;


const locationSchema = new Schema({
  locationName : { type : String },
  locationCode : { type : String },
  machineIds : [{ type : String}]
});

module.exports = mongoose.model('location', locationSchema);

locationSchema.set('toJSON', {
  virtuals: true
});

locationSchema.set('toObject', {
  virtuals: true
});


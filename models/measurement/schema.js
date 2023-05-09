const mongoose = require('mongoose');

const { Schema } = mongoose;

const measurementSchema = new Schema({
  name: { type: String, required: [true, 'Name is required'], unique: true, min: 2, max: 25 },
  slug: { type: String, required: [true, 'Slug is required'], unique: true, min: 1, max: 10 }
});

module.exports = mongoose.model('measurement', measurementSchema);

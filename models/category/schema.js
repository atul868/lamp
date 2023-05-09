const mongoose = require('mongoose');
const fileUtil = require('../../utils/file');
const { Schema } = mongoose;

const categorySchema = new Schema({
  name: { type: String, required: [true, 'Category name is required'], unique: true, min: 2, max: 25 },
  image: { type: String },
  tags: [{ type: String }],
  order: { type: Number },
  visible: { type: Boolean, default: true }
});

module.exports = mongoose.model('category', categorySchema);


categorySchema.set('toJSON', {
  virtuals: true
});

categorySchema.set('toObject', {
  virtuals: true
});

categorySchema.virtual('signedUrl').get(function() {
  if (this.image) {
    return fileUtil.getSignedUrl(this.image);
  }
});
const mongoose = require('mongoose');
const fileUtil = require('../../utils/file');
const { Schema } = mongoose;
// TODO: rename model name to subCategory
const categorySchema = new Schema({
  name: { type: String, required: [true, 'Category name is required'], min: 2, max: 25 },
  image: { type: String },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'category' },
  tags: [{ type: String }],
  order: { type: Number },
  visible: { type: Boolean, default: true }
});

module.exports = mongoose.model('sub-category', categorySchema);

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

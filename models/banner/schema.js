const mongoose = require('mongoose');
const fileUtil = require('../../utils/file');

const { Schema } = mongoose;

const bannerSchema = new Schema({
  image: { type: String },
  order: { type: Number },
  type: {
    type: String,
    required: [true, 'Target Type Is Required'],
    enum: ['Category', 'SubCategory', 'Product', 'ParentProduct']
  },
  categoryId: { type: Schema.Types.ObjectId, ref: 'category' },
  subCategoryId: { type: Schema.Types.ObjectId, ref: 'sub-category' },
  activatedAt: { type: Date },
  expiredAt: { type: Date },
  color: { type: String },
  useFor: { type: String, default: 'TOP' },
  parentProductId: { type: Schema.Types.ObjectId, ref: 'parentProduct' },
  productId: { type: Schema.Types.ObjectId, ref: 'product' },
  searchTerm: { type: String }
});

bannerSchema.set('toJSON', {
  virtuals: true
});

bannerSchema.set('toObject', {
  virtuals: true
});

bannerSchema.virtual('signedUrl').get(function() {
  if (this.image) {
    return fileUtil.getSignedUrl(this.image);
  }
});
module.exports = mongoose.model('sliders', bannerSchema);

const mongoose = require('mongoose');
const _ = require('lodash');
const fileUtil = require('../../utils/file');
const { Schema } = mongoose;

const parentProductSchema = new Schema({
  name: { type: String, required: true, min: 2, max: 25 },
  category: [{ type: Schema.Types.ObjectId, ref: 'category' }],
  subCategory: [{ type: Schema.Types.ObjectId, ref: 'sub-category' }],
  products: [{ type: Schema.Types.ObjectId, ref: 'product' }],
  images: [{ isPrimary: { type: Boolean }, path: { type: String } }],
  description: { type: String },
  primaryProduct: { type: Schema.Types.ObjectId, ref: 'product' },
  spellingMistakes: [{ type: String }],
  competitorNames: [{ type: String }],
  salts: [{ type: String }],
  dosage: { type: String, default: 'As prescribed by the physician' },
  warning: { type: String },
  storageInstructions: {
    type: String,
    default:
      'Store in cool, dark and dry places also away from moisture. Keep the medicine away from the reach of the children'
  },
  indications: {
    type: String
  },
  isDeleted: { type: Boolean, default: false },
  details: { type: Schema.Types.Mixed }
});

module.exports = mongoose.model('parentProduct', parentProductSchema);

parentProductSchema.set('toJSON', {
  virtuals: true
});

parentProductSchema.set('toObject', {
  virtuals: true
});

parentProductSchema.virtual('signedUrl').get(function() {
  if (!_.isEmpty(this.images)) {
    const images = [];
    for (const image of this.images) {
      image.path = fileUtil.getSignedUrl(image.path);
      images.push(image);
    }
    return images;
  }
});

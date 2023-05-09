const mongoose = require('mongoose');
const _ = require('lodash');
const fileUtil = require('../../utils/file');
const { Schema } = mongoose;

const schemeSchema = new Schema(
  {
    name: { type: String },
    description: { type: String },
    tagLine: { type: String },
    productId: [{ type: Schema.Types.ObjectId, ref: 'product' }],
    relatedProductId: { type: Schema.Types.ObjectId, ref: 'product' },
    discountPercentage: { type: Number },
    discountAmount: { type: Number },
    requiredQuantity: { type: Number },
    requiredAmount: { type: Number },
    additionalPoints: { type: Number },
    type: {
      type: String,
      enum: [
        'Points Multiplier', // Get 2x points on purchase of this product , req fields - productId, pointTimes
        'Couple Discounts', // Buy X Product and get Y Product at some % off, req field- productId,relatedProductId,discount percentage
        'Points Added', // On Shopping of more than some amount get some points, req field - additionalPoints, requiredAmount, relatedProductId
        'Overall Free', // On shopping of more than some amount get a product for free, req field- requiredAmount,RelatedProductId
        'Quantity Discount', // On more than some quantity get discount,req field -  productId,relatedProductId,requiredQuantity,discountAmount/discountPercentage
        'One Rupee', // On Shopping of above some points get a product for 1 rupee, req field- requiredAmount, relatedProductId
        'First User', // First Users to get this product will get additionalPoints, req field - users, productId,
        'Reward on amount' // For eg scheme is On purchase of 5000, get mixer free
      ],
      required: [true, 'Scheme Type Is Required']
    },
    pointTimes: {
      type: Number
    },
    redeemed: { type: Number, default: 0 },
    users: { type: Number, default: 50 },
    images: [{ isPrimary: { type: Boolean }, url: { type: String } }],
    descriptionImage: { type: String },
    displayedAt: { type: Date },
    activatedAt: { type: Date },
    expiredAt: { type: Date },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'member' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'member' }
  },
  {
    versionKey: false,
    timestamps: true
  }
);
module.exports = mongoose.model('schemes', schemeSchema);

schemeSchema.set('toJSON', {
  virtuals: true
});

schemeSchema.set('toObject', {
  virtuals: true
});

schemeSchema.virtual('descriptionImageSignedUrl').get(function() {
  if (this.descriptionImage) {
    return fileUtil.getSignedUrl(this.descriptionImage);
  }
});

schemeSchema.virtual('signedUrl').get(function() {
  if (!_.isEmpty(this.images)) {
    const images = [];
    for (const image of this.images) {
      // if (!image.url) continue;
      image.url = fileUtil.getSignedUrl(image.url);
      images.push(image);
    }
    return images;
  }
});

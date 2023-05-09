const mongoose = require('mongoose');
const _ = require('lodash');
const fileUtil = require('../../utils/file');
const { Schema } = mongoose;

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      min: 2,
      max: 25
    },
    productCode: {
      type: String,
    },
    points: {
      type: Number
    },
    isPrimary: {
      type: Boolean,
      default: false
    },
    defaultPoints: {
      type: Number
    },
    locationCode : [{type : String}],
    measuringUnit: { type: Schema.Types.ObjectId, ref: 'measurement' },
    inStockQuantity: {
      type: Number,
      default: 10000
    },
    visible: {
      type: Boolean,
      required: [true, 'tell the product visibility'],
      default: true
    },
    parentProduct: { type: Schema.Types.ObjectId, ref: 'parentProduct' },
    isDeleted: {
      type: Boolean,
      default: false
    },
    dosageSize: {
      type: String,
      required: [true, 'Dosage Size is Required']
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: 0,
      default: 0
    },
    images: [{ isPrimary: { type: Boolean }, url: { type: String } }],
    scheme: [
      {
        type: Schema.Types.ObjectId,
        ref: 'schemes'
      }
    ],
    discountedPrice: { type: Number },
    pieces: {
      type: Number
    },
    composition: {
      type: String
    },
    description: {
      type: String
    },
    packagingSize: [
      {
        type: Number,
        required: [true, 'Packaging Size is required']
      }
    ],
    discount: {
      discountId: { type: Schema.Types.ObjectId, ref: 'discount' },
      amount: Number,
      activatedAt: Date,
      expiredAt: Date
    },
    tax: { type: Number, default: 12 },
    cgst: { type: String, default: "0" },
    sgst: { type: String, default: "0" },
    igst: { type: String, default: "0" },
    taxTotal : { type: Number, default: 0 },
    oneRuppeeScheme: { type: Boolean, default: false },
    relatedProduct: { type: Schema.Types.ObjectId, ref: 'product' }
  },
  { timestamps: true }
);
productSchema.set('toJSON', {
  virtuals: true
});

productSchema.set('toObject', {
  virtuals: true
});

productSchema.virtual('signedUrl').get(function() {
  if (!_.isEmpty(this.images)) {
    const images = [];
    for (const image of this.images) {
      if (!image.url) continue;
      image.url = fileUtil.getSignedUrl(image.url);
      images.push(image);
    }
    return images;
  }
});
productSchema.pre('save', function(next) {
  if (!this.points) {
    this.points = _.round(this.price / 4);
    this.defaultPoints = _.round(this.price / 4);
  }
  if (!this.discountedPrice) this.discountedPrice = this.price;
  next();
});

module.exports = mongoose.model('product', productSchema);

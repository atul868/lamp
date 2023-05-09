const mongoose = require('mongoose');

const { Schema } = mongoose;

const cartSchema = new Schema(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'member' },
    productId: { type: Schema.Types.ObjectId, ref: 'product' },
    productName: { type: String },
    category: { type: Schema.Types.ObjectId, ref: 'category' },
    quantity: { type: Number },
    price: { type: Number }, // product price with out any thing
    taxAmount: { type: Number }, // tax amount on subAmount
    discountedPrice: { type: Number }, // total applied discount on product original amount
    dosageSize: { type: String },
    points: { type: Number },
    packagingSize: { type: Number },
    discount: {
      discountId: { type: Schema.Types.ObjectId, ref: 'discount' },
      amount: Number,
      activatedAt: Date,
      expiredAt: Date
    },
    suggestedProduct: { type: Schema.Types.ObjectId, ref: 'product' }
  },
  {
    versionKey: false,
    timestamps: true
  }
);

module.exports = mongoose.model('cart', cartSchema);

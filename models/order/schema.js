const mongoose = require('mongoose');
const { Schema } = mongoose;

const timeLineSchema = new Schema(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: 'member' },
    status: {
      type: String,
      enum: [
        'PLACED',
        'ACCEPTED',
        'REJECTED',
        'CONFIRMED',
        'DELIVERED',
        'SHIPPED',
        'PENDING',
        'CANCELLED',
        'RETURN',
        'INCOMPLETE',
        'PAYMENT_CONFIRMED'
      ]
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
);
const orderSchema = new Schema(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'member' },
    stockistId: { type: Schema.Types.ObjectId, ref: 'member' },
    mrId: { type: Schema.Types.ObjectId, ref: 'member' },
    orderId: { type: String },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'product' },
        productName: { type: String },
        cartId: { type: String },
        price: { type: Number },
        points: { type: Number },
        discount: {
          discountId: { type: Schema.Types.ObjectId, ref: 'discount' },
          amount: Number,
          activatedAt: Date,
          expiredAt: Date
        },
        packagingSize: { type: Number },
        quantity: { type: Number },
        isAccepted: { type: Boolean, default: true },
        dosageSize: { type: String },
        discountedPrice: { type: Number },
        taxAmount: { type: Number }
      }
    ],
    totalOriginalAmount: { type: Number }, // without any thing
    totalSubAmount: { type: Number }, // amount after Subtracting discount
    totalDiscountedAmount: { type: Number }, // total of all discounted prices
    totalGivenDiscount: { type: Number }, // total Given Discount
    totalTaxAmount: { type: Number },
    totalAmountBeforePromo: { type: Number }, // discounted price + tax amount
    totalAmount: { type: Number }, // discounted price + tax amount - promo code amount
    address: {
      _id: { type: String },
      line1: { type: String },
      line2: { type: String },
      pincode: { type: Number },
      city: { type: String },
      state: { type: String },
      isPrimary: { type: Boolean, default: false },
      location: {
        type: { type: String },
        coordinates: []
      },
      name: { type: String }
    },
    promoCode: {
      promoCodeId: { type: Schema.Types.ObjectId, ref: 'promoCode' },
      name: String,
      amount: Number,
      activatedAt: Date,
      expiredAt: Date
    },
    bill: { type: String },
    isBillApproved: { type: Boolean, default: false },
    notes: [{ type: String }],
    razorPayTransactionId: { type: String },
    firstOrder: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: [
        'PLACED', // placed by Retailer
        'ACCEPTED', // Accepted by stockist even if one item is accepted
        'REJECTED', // All items Rejected by stockist
        'CONFIRMED', // confirmed by retailer after Acceptance
        'DELIVERED',
        'SHIPPED',
        'PENDING',
        'CANCELLED',
        'RETURN',
        'INCOMPLETE',
        'PAYMENT_CONFIRMED'
      ],
      default: 'PLACED'
    },
    paymentMethod: { type: String, enum: ['COD', 'ONLINE'] },
    timeLine: [timeLineSchema]
  },
  {
    versionKey: false,
    timestamps: true
  }
);

module.exports = mongoose.model('order', orderSchema);

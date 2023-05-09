const mongoose = require('mongoose');

const { Schema } = mongoose;

const promoCodeSchema = new Schema(
  {
    name: { type: String, unique: true },
    percentage: { type: Number },
    amount: { type: Number },
    minAmount: { type: Number }, // Min amount required to apply promo code
    maxDiscount: { type: Number }, // Max Discount applicable in case of percentage
    activatedAt: { type: Date },
    expiredAt: { type: Date },
    isDisabled: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'member' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'member' }
  },
  {
    versionKey: false,
    timestamps: true
  }
);

module.exports = mongoose.model('promoCode', promoCodeSchema);

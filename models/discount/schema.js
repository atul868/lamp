const mongoose = require('mongoose');

const { Schema } = mongoose;

const discountSchema = new Schema(
  {
    name: { type: String },
    categoryIds: [{ type: Schema.Types.ObjectId, ref: 'category' }],
    subCategoryIds: [{ type: Schema.Types.ObjectId, ref: 'sub-category' }],
    parentProductIds: [{ type: Schema.Types.ObjectId, ref: 'parentProduct' }],
    productIds: [{ type: Schema.Types.ObjectId, ref: 'product' }],
    percentage: { type: Number },
    amount: { type: Number },
    maxAmount: { type: Number },
    activatedAt: { type: Date },
    expiredAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'member' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'member' }
  },
  {
    versionKey: false,
    timestamps: true
  }
);

module.exports = mongoose.model('discount', discountSchema);

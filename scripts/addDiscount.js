const Promise = require('bluebird');
const moment = require('moment-timezone').tz.setDefault('Asia/Kolkata');
const _ = require('lodash');
const DiscountModel = require('../models/discount/schema');
const ProductModel = require('../models/product/schema');

const path = {
  path: 'parentProduct',
  select: {
    _id: 1,
    name: 1,
    category: 1,
    subCategory: 1
  },
  populate: [
    {
      path: 'category',
      select: {
        _id: 1,
        name: 1
      }
    },
    {
      path: 'subCategory',
      select: {
        _id: 1,
        name: 1
      }
    }
  ]
};

const run = discount =>
  new Promise(async (resolve, reject) => {
    const startDate = moment()
      .startOf('day')
      .toISOString();
    const endDate = moment()
      .endOf('day')
      .toISOString();
    let allProducts;
    // let where = {};
    // if (discount) where = { _id: discount._id };
    try {
      allProducts = await ProductModel.find({ isDeleted: false }).populate(path);
    } catch (error) {
      console.log(error);
      reject(error);
    }

    for (const product of allProducts) {
      const categoryIds = _.map(product.parentProduct.category, '_id');
      const suCategoryIds = _.map(product.parentProduct.subCategory, '_id');
      const discounts = await DiscountModel.find({
        $or: [
          { categoryIds: { $in: categoryIds } },
          { subCategoryIds: { $in: suCategoryIds } },
          { parentProductIds: product.parentProduct._id },
          { productIds: product._id }
        ],
        $and: [{ activatedAt: { $lte: startDate } }, { expiredAt: { $gte: endDate } }, { isDeleted: false }]
      });
      const maxDiscount = _.maxBy(discounts, d => {
        let amount = 0;
        if (d.percentage) {
          amount = (product.price * d.percentage) / 100;
        } else if (d.amount) {
          ({ amount } = d);
        }
        d.amount = amount;
        return amount;
      });
      if (maxDiscount) {
        let discountedPrice = product.price - maxDiscount.amount;
        if (discountedPrice >= product.price) discountedPrice = product.price;
        try {
          await ProductModel.updateOne(
            { _id: product._id },
            {
              discount: {
                discountId: maxDiscount._id,
                amount: maxDiscount.amount,
                expiredAt: maxDiscount.expiredAt,
                activatedAt: maxDiscount.activatedAt
              },
              discountedPrice
            }
          );
        } catch (error) {
          reject(error);
        }
      }
    }
    resolve();
  });

// run();
module.exports = run;

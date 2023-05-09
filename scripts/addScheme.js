const Promise = require('bluebird');
const moment = require('moment-timezone').tz.setDefault('Asia/Kolkata');
const _ = require('lodash');
const SchemeModel = require('../models/scheme/schema');
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

const run = scheme =>
  new Promise(async (resolve, reject) => {
    const startDate = moment()
      .startOf('day')
      .toISOString();
    const endDate = moment()
      .endOf('day')
      .toISOString();
    let allProducts;
    try {
      allProducts = await ProductModel.find({ isDeleted: false }).populate(path);
    } catch (error) {
      console.log(error);
      reject(error);
    }

    //

    for (const product of allProducts) {
      const schemes = await SchemeModel.find({
        $or: [{ productId: product._id }],
        $and: [{ activatedAt: { $lte: startDate } }, { expiredAt: { $gte: endDate } }],
        type: 'Points Multiplier'
      });

      if (!schemes) {
        try {
          await ProductModel.updateOne(
            { _id: product._id },
            {
              points: product.defaultPoints,
              schemes: []
            }
          );
        } catch (error) {
          reject(error);
        }
      }

      const maxReward = _.maxBy(schemes, s => {
        return s.pointTimes;
      });

      if (maxReward) {
        try {
          await ProductModel.updateOne(
            { _id: product._id },
            {
              points: _.round(product.defaultPoints * maxReward.pointTimes)
            }
          );
        } catch (error) {
          reject(error);
        }
      }
      const discountSchemes = await SchemeModel.findOne({
        $or: [{ productId: product._id }],
        $and: [{ activatedAt: { $lte: startDate } }, { expiredAt: { $gte: endDate } }],
        type: {
          $in: ['Couple Discounts', 'Points Added', 'Overall Free', 'Quantity Discount', 'One Rupee', 'First User']
        }
      });
      if (discountSchemes) {
        try {
          await ProductModel.updateOne(
            { _id: product._id },
            {
              $addToSet: {
                scheme: discountSchemes._id
              }
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

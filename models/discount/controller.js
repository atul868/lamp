const config = require('config');
const _ = require('lodash');
const discountFacade = require('./facade');
const DiscountModel = require('./schema');
const applyDiscount = require('../../scripts/addDiscount');

class DiscountController {
  async create(req, res, next) {
    let discount;
    const {
      name,
      amount,
      percentage,
      productIds,
      categoryIds,
      parentProductIds,
      subCategoryIds,
      activatedAt,
      expiredAt
    } = req.body;
    const { member } = req;
    if ((!amount && !percentage) || (amount && percentage)) {
      const error = new Error('Amount or Percentage only one at a time is required');
      error.statusCode = 400;
      return next(error);
    }
    try {
      discount = await discountFacade.create({
        name,
        amount,
        percentage,
        productIds,
        categoryIds,
        parentProductIds,
        subCategoryIds,
        createdBy: member._id,
        activatedAt,
        expiredAt
      });
    } catch (err) {
      return next(err);
    }
    await applyDiscount(discount);
    res.send(discount);
  }

  async get(req, res, next) {
    let promoCodes;
    let { page, limit, sortBy } = req.query;
    let meta;
    let skip = 0;
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || config.get('pagination').size;
    skip = (page - 1) * limit;

    sortBy = sortBy || '_id';
    try {
      promoCodes = await DiscountModel.find({})
        .populate('categoryIds subCategoryIds parentProductIds productIds')
        .sort(sortBy)
        .skip(skip)
        .lean(true)
        .limit(limit);
    } catch (error) {
      return next(error);
    }
    const dataToSend = { data: promoCodes };
    if (page === 1) {
      meta = {
        currentPage: page,
        recordsPerPage: limit,
        totalRecords: await DiscountModel.countDocuments()
      };
      meta.totalPages = Math.ceil(meta.totalRecords / meta.recordsPerPage);
      dataToSend.meta = meta;
    }
    res.send(dataToSend);
  }

  async update(req, res, next) {
    let discount;
    const { discountId } = req.params;
    const d = {
      name: null,
      amount: null,
      percentage: null,
      productIds: null,
      categoryIds: null,
      parentProductIds: null,
      subCategoryIds: null,
      activatedAt: null,
      expiredAt: null
    };
    for (const key in d) {
      d[key] = req.body[key];
    }

    const obj = _.pickBy(d, h => !_.isUndefined(h));
    try {
      discount = await DiscountModel.find({ _id: discountId });
    } catch (error) {
      return next(error);
    }
    if (!discount) {
      const error = new Error('No Discount Found');
      error.statusCode = 404;
      return next(error);
    }
    obj.updatedBy = req.member._id;
    try {
      discount = await discountFacade.update({ _id: discountId }, obj);
    } catch (error) {
      return next(error);
    }
    res.json({ message: 'Updated' });
    await applyDiscount();
  }

  async delete(req, res, next) {
    const { discountId } = req.params;

    try {
      await DiscountModel.updateOne({ _id: discountId }, { isDeleted: true });
    } catch (error) {
      return next(error);
    }
    res.json({ message: 'Deleted' });
  }
}

module.exports = new DiscountController(discountFacade);

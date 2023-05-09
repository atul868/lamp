const moment = require('moment-timezone').tz.setDefault('Asia/Calcutta|Asia/Kolkata');
const config = require('config');
const _ = require('lodash');
const promoCodeFacade = require('./facade');
const PromoCodeModel = require('./schema');

class PromoCodeController {
  async create(req, res, next) {
    let promoCode;
    const { amount, percentage, maxDiscount, minAmount, activatedAt, expiredAt, name } = req.body;
    const { member } = req;
    if ((!amount && !percentage) || (amount && percentage)) {
      const error = new Error('Amount or Percentage only one at a time is required');
      error.statusCode = 400;
      return next(error);
    }
    if (percentage && !maxDiscount) {
      const error = new Error('Max Discount is required in case of percentage');
      error.statusCode = 400;
      return next(error);
    }
    if (
      moment(expiredAt).isBefore(moment()) ||
      moment()
        .subtract(1, 'minute')
        .isAfter(moment(activatedAt))
    ) {
      const error = new Error('Expired At or Activated At can not be in past');
      error.statusCode = 400;
      return next(error);
    }
    try {
      promoCode = await promoCodeFacade.create({
        name,
        amount,
        percentage,
        maxDiscount,
        minAmount,
        activatedAt,
        expiredAt,
        createdBy: member._id
      });
    } catch (error) {
      return next(error);
    }
    res.send(promoCode);
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
      promoCodes = await PromoCodeModel.find({})
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
        totalRecords: await PromoCodeModel.countDocuments()
      };
      meta.totalPages = Math.ceil(meta.totalRecords / meta.recordsPerPage);
      dataToSend.meta = meta;
    }
    res.send(dataToSend);
  }

  async update(req, res, next) {
    const { promoCodeId, amount, percentage, activatedAt, expiredAt } = req.body;

    if (amount && percentage) {
      const error = new Error('Amount or Percentage only one at a time is required');
      error.statusCode = 400;
      return next(error);
    }

    if (
      (expiredAt && moment(expiredAt).isBefore(moment())) ||
      (activatedAt &&
        moment()
          .subtract(1, 'minute')
          .isAfter(moment(activatedAt)))
    ) {
      const error = new Error('Expired At or Activated At can not be in past');
      error.statusCode = 400;
      return next(error);
    }
    const d = {
      name: null,
      amount: null,
      percentage: null,
      maxDiscount: null,
      minAmount: null,
      activatedAt: null,
      gstDoc: null,
      expiredAt: null,
      isDisabled: null
    };

    for (const key in d) {
      d[key] = req.body[key];
    }
    const obj = _.pickBy(d, h => !_.isUndefined(h));
    obj.updatedBy = req.member._id;
    try {
      await promoCodeFacade.update({ _id: promoCodeId }, obj);
    } catch (error) {
      return next(error);
    }
    res.json({ message: 'Updated Successfully' });
  }

  async getById(req, res, next) {
    let promoCode;
    const { promoCodeId } = req.params;

    try {
      promoCode = await promoCodeFacade.findOne({ _id: promoCodeId });
    } catch (error) {
      return next(error);
    }

    res.send(promoCode);
  }

  // check name availability
  async checkName(req, res, next) {
    let promoCode;
    const { name } = req.query;
    let message = 'Available';
    try {
      promoCode = await promoCodeFacade.findOne({ name });
    } catch (error) {
      return next(error);
    }
    if (promoCode) message = 'Not Available';
    res.json({ message });
  }
}

module.exports = new PromoCodeController(promoCodeFacade);

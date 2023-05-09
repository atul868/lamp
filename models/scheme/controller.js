const _ = require('lodash');
const config = require('config');
const SchemeModel = require('./schema');
const schemeFacade = require('./facade');
const applyScheme = require('../../scripts/addScheme');

class SchemeController {
  async create(req, res, next) {
    let scheme;
    const {
      type,
      pointTimes,
      name,
      displayedAt,
      images,
      productId,
      relatedProductId,
      discountPercentage,
      discountAmount,
      requiredQuantity,
      requiredAmount,
      additionalPoints,
      activatedAt,
      expiredAt,
      description,
      tagLine,
      descriptionImage
    } = req.body;
    const { member } = req;
    try {
      scheme = await schemeFacade.create({
        name,
        type,
        pointTimes,
        displayedAt,
        images,
        productId,
        relatedProductId,
        discountPercentage,
        discountAmount,
        requiredQuantity,
        requiredAmount,
        additionalPoints,
        activatedAt,
        expiredAt,
        createdBy: member._id,
        description,
        tagLine,
        descriptionImage
      });
    } catch (err) {
      return next(err);
    }
    if (type !== 'Reward on amount') await applyScheme(scheme);
    res.send(scheme);
  }

  async get(req, res, next) {
    let schemes;
    let { page, limit } = req.query;

    const query = {};
    let skip = 0;
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || config.get('pagination').size;
    skip = (page - 1) * limit;
    try {
      schemes = await SchemeModel.find({})
        .populate('productId relatedProductId')
        .skip(skip)
        .limit(limit)
        .sort(req.query.sortBy);
    } catch (err) {
      return next(err);
    }
    const dataToSend = {
      schemes
    };

    const meta = {
      currentPage: page,
      recordsPerPage: limit,
      totalRecords: await SchemeModel.find(query).count()
    };
    meta.totalPages = Math.ceil(meta.totalRecords / meta.recordsPerPage);
    dataToSend.meta = meta;
    res.send(dataToSend);
  }

  async getScheme(req, res, next) {
    let scheme;
    const { SchemeId } = req.params;
    try {
      scheme = await SchemeModel.findById(SchemeId).populate('productId relatedProductId');
    } catch (err) {
      return next(err);
    }
    if (!scheme) {
      const e = new Error('Scheme Does Not exists');
      e.statusCode = 400;
      return next(e);
    }
    res.send(scheme);
  }

  async remove(req, res, next) {
    const { SchemeId } = req.params;
    let scheme;
    try {
      scheme = await SchemeModel.findById(SchemeId);
    } catch (err) {
      return next(err);
    }
    if (!scheme) {
      const e = new Error('Scheme Does Not exists');
      e.statusCode = 400;
      return next(e);
    }
    try {
      await SchemeModel.deleteOne({ _id: SchemeId });
    } catch (err) {
      return next(err);
    }
    res.json({ message: 'Scheme Deleted' });
  }

  async edit(req, res, next) {
    const { SchemeId } = req.params;
    let scheme;
    const d = {
      name: null,
      type: null,
      pointTimes: null,
      displayedAt: null,
      images: null,
      productId: null,
      relatedProductId: null,
      discountPercentage: null,
      discountAmount: null,
      requiredQuantity: null,
      requiredAmount: null,
      additionalPoints: null,
      activatedAt: null,
      expiredAt: null,
      description: null,
      tagLine: null,
      descriptionImage: null
    };

    for (const key in d) {
      d[key] = req.body[key];
    }
    const obj = _.pickBy(d, h => !_.isUndefined(h));

    try {
      scheme = await SchemeModel.findOneAndUpdate({ _id: SchemeId }, obj);
    } catch (err) {
      return next(err);
    }
    if (scheme.type !== 'Reward on amount') {
      try {
        await applyScheme(scheme);
      } catch (error) {
        return next(error);
      }
    }
    res.json({ message: 'Scheme Updated' });
  }
}

module.exports = new SchemeController(schemeFacade);

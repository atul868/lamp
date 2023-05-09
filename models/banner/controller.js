const _ = require('lodash');
const config = require('config');
const BannerModel = require('./schema');

const bannerFacade = require('./facade');

class BannerController {
  async create(req, res, next) {
    let newslider;
    const {
      image,
      type,
      categoryId,
      subCategoryId,
      parentProductId,
      productId,
      activatedAt,
      expiredAt,
      color,
      useFor,
      searchTerm
    } = req.body;
    let { order } = req.body;
    if (!order) {
      try {
        const highestOrderCat = await BannerModel.find({})
          .sort({ order: -1 })
          .limit(1);
        if (highestOrderCat[0]) {
          order = highestOrderCat[0].order + 1;
        } else {
          order = 1;
        }
      } catch (err) {
        return next(err);
      }
    }
    try {
      newslider = await BannerModel.create({
        image,
        order,
        type,
        categoryId,
        subCategoryId,
        parentProductId,
        productId,
        activatedAt,
        expiredAt,
        color,
        useFor,
        searchTerm
      });
    } catch (err) {
      console.log(err);
      return next(err);
    }
    res.send(newslider);
  }

  async edit(req, res, next) {
    const { SliderId } = req.params;
    let slider;
    try {
      slider = await BannerModel.findById(SliderId);
    } catch (err) {
      return next(err);
    }
    const d = {
      image: null,
      order: null,
      type: null,
      categoryId: null,
      subCategoryId: null,
      parentProductId: null,
      productId: null,
      activatedAt: null,
      expiredAt: null,
      color: null,
      useFor: null,
      searchTerm: null
    };

    for (const key in d) {
      d[key] = req.body[key];
    }

    if (d.order) {
      if (slider.order < d.order) {
        try {
          await BannerModel.updateMany(
            {
              _id: { $ne: slider._id },
              $and: [
                {
                  order: { $gt: slider.order }
                },
                {
                  order: { $lte: d.order }
                }
              ]
            },
            {
              $inc: { order: -1 }
            }
          );
        } catch (err) {
          return next(err);
        }
      } else {
        try {
          await BannerModel.updateMany(
            {
              _id: { $ne: slider._id },
              $and: [
                {
                  order: { $gte: d.order }
                },
                {
                  order: { $lt: slider.order }
                }
              ]
            },
            {
              $inc: { order: 1 }
            }
          );
        } catch (err) {
          return next(err);
        }
      }
    }

    const obj = _.pickBy(d, h => !_.isUndefined(h));

    try {
      await BannerModel.updateOne({ _id: SliderId }, obj);
    } catch (err) {
      return next(err);
    }
    res.json({ message: 'Slider Updated' });
  }

  async getSlider(req, res, next) {
    let slider;
    const { SliderId } = req.params;
    try {
      slider = await BannerModel.findById(SliderId).populate('categoryId subCategoryId parentProductId productId');
    } catch (err) {
      return next(err);
    }
    if (!slider) {
      const e = new Error('Slider Does Not exists');
      e.statusCode = 400;
      return next(e);
    }
    res.send(slider);
  }

  async select(req, res, next) {
    let sliders;
    let { page, limit, sortBy } = req.query;
    const { name, useFor } = req.query;
    let meta;
    const query = {};
    let skip = 0;
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || config.get('pagination').size;
    skip = (page - 1) * limit;

    sortBy = sortBy || '_id';

    if (name) {
      query.name = {
        $regex: new RegExp(name.toLowerCase().replace(/\s+/g, '\\s+'), 'gi')
      };
    }
    // doing this because it looks like we have a bug mongoose with filter on default value
    if (useFor === 'TOP') {
      query.useFor = { $ne: 'SLIDER' };
    } else if (useFor) {
      query.useFor = useFor;
    }
    try {
      sliders = await BannerModel.find(query)
        .populate('categoryId subCategoryId parentProductId productId')
        .sort(sortBy)
        .skip(skip)
        .limit(limit);
    } catch (err) {
      return next(err);
    }
    const dataToSend = {
      data: sliders
    };
    if (page === 1) {
      meta = {
        currentPage: page,
        recordsPerPage: limit,
        totalRecords: await BannerModel.find(query).count()
      };
      meta.totalPages = Math.ceil(meta.totalRecords / meta.recordsPerPage);
      dataToSend.meta = meta;
    }
    res.send(dataToSend);
  }

  async remove(req, res, next) {
    const { SliderId } = req.params;
    let slider;
    try {
      slider = await BannerModel.findById(SliderId);
    } catch (err) {
      return next(err);
    }
    if (!slider) {
      const e = new Error('Slider Does Not exists');
      e.statusCode = 400;
      return next(e);
    }
    try {
      await BannerModel.deleteOne({ _id: SliderId });
    } catch (err) {
      return next(err);
    }
    res.json({ message: 'Slider Deleted' });
  }
}

module.exports = new BannerController(bannerFacade);

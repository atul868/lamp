const _ = require('lodash');
const config = require('config');
const SubCategoryModel = require('./schema');
const ParentProductModel = require('../parent-product/schema');
const subCategoryFacade = require('./facade');

class SubCategoryController {
  async create(req, res, next) {
    let subCategory;
    const { name, image, tags, visible, parent } = req.body;
    let { order } = req.body;
    try {
      subCategory = await SubCategoryModel.findOne({ parent, name });
    } catch (err) {
      return next(err);
    }
    if (subCategory) {
      const e = new Error('SubCategory Already exists');
      e.statusCode = 400;
      return next(e);
    }
    if (!order) {
      try {
        const highestOrderCat = await SubCategoryModel.find({})
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
      subCategory = await SubCategoryModel.create({
        name,
        image,
        tags,
        visible,
        order,
        parent
      });
    } catch (err) {
      return next(err);
    }
    res.send(subCategory);
  }

  async edit(req, res, next) {
    const { SubCategoryId } = req.params;
    let subCategory;
    try {
      subCategory = await SubCategoryModel.findById(SubCategoryId);
    } catch (err) {
      return next(err);
    }
    const d = {
      name: null,
      image: null,
      visible: null,
      tags: null,
      order: null,
      parent: null
    };

    for (const key in d) {
      d[key] = req.body[key];
    }

    if (d.order) {
      if (subCategory.order < d.order) {
        try {
          await SubCategoryModel.updateMany(
            {
              _id: { $ne: subCategory._id },
              $and: [
                {
                  order: { $gt: subCategory.order }
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
          await SubCategoryModel.updateMany(
            {
              _id: { $ne: subCategory._id },
              $and: [
                {
                  order: { $gte: d.order }
                },
                {
                  order: { $lt: subCategory.order }
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
      await SubCategoryModel.update({ _id: SubCategoryId }, obj);
    } catch (err) {
      return next(err);
    }
    if (d.name) {
      try {
        await ParentProductModel.updateMany(
          { 'details.subCategory': subCategory.name },
          {
            $push: {
              'details.subCategory': obj.name
            }
          }
        );
        await ParentProductModel.updateMany(
          { 'details.subCategory': subCategory.name },
          {
            $pull: {
              'details.subCategory': subCategory.name
            }
          }
        );
      } catch (error) {
        return next(error);
      }
    }
    res.json({ message: 'SubCategory Updated' });
  }

  async getSubCategory(req, res, next) {
    let subCategory;
    const { SubCategoryId } = req.params;
    try {
      subCategory = await SubCategoryModel.findById(SubCategoryId).populate('parent');
    } catch (err) {
      return next(err);
    }
    if (!subCategory) {
      const e = new Error('SubCategory Does Not exists');
      e.statusCode = 400;
      return next(e);
    }
    res.send(subCategory);
  }

  async select(req, res, next) {
    let subCategories;
    let { page, limit, sortBy } = req.query;
    const { name } = req.query;
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
    try {
      subCategories = await SubCategoryModel.find(query)
        .populate('parent')
        .sort(sortBy)
        .skip(skip)
        .limit(limit);
    } catch (err) {
      return next(err);
    }
    const dataToSend = {
      data: subCategories
    };
    if (page === 1) {
      meta = {
        currentPage: page,
        recordsPerPage: limit,
        totalRecords: await SubCategoryModel.find(query).count()
      };
      meta.totalPages = Math.ceil(meta.totalRecords / meta.recordsPerPage);
      dataToSend.meta = meta;
    }
    res.send(dataToSend);
  }

  async remove(req, res, next) {
    const { SubCategoryId } = req.params;
    let subCategory;
    try {
      subCategory = await SubCategoryModel.findById(SubCategoryId);
    } catch (err) {
      return next(err);
    }
    if (!subCategory) {
      const e = new Error('SubCategory Does Not exists');
      e.statusCode = 400;
      return next(e);
    }
    try {
      await SubCategoryModel.deleteOne({ _id: SubCategoryId });
    } catch (err) {
      return next(err);
    }
    res.json({ message: 'SubCategory Deleted' });
  }
}

module.exports = new SubCategoryController(subCategoryFacade);

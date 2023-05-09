const _ = require('lodash');
const config = require('config');
const ProductModel = require('./schema');
const ParentProduct = require('../parent-product/schema');

const productFacade = require('./facade');

class ProductController {
  async create(req, res, next) {
    let product;
    let parent;
    const {
      name,
      measuringUnit,
      inStockQuantity,
      contentQuantity,
      visible,
      parentProduct,
      isPrimary,
      dosageSize,
      description,
      price,
      pieces,
      packagingSize,
      images
    } = req.body;
    try {
      parent = await ParentProduct.findById(parentProduct);
    } catch (err) {
      return next(err);
    }
    if (!parent) {
      const e = new Error('Parent Does Not exists');
      e.statusCode = 400;
      return next(e);
    }
    try {
      product = await ProductModel.findOne({ name, dosageSize });
    } catch (err) {
      return next(err);
    }
    if (product) {
      const e = new Error('Product Already exists');
      e.statusCode = 400;
      return next(e);
    }
    try {
      product = await ProductModel.create({
        name,
        measuringUnit,
        inStockQuantity,
        contentQuantity,
        visible,
        parentProduct,
        isPrimary,
        dosageSize,
        description,
        price,
        pieces,
        packagingSize,
        images
      });
    } catch (err) {
      return next(err);
    }
    parent.products.push(product._id);
    if (isPrimary) {
      parent.primaryProduct = product._id;
    }
    await parent.save();
    res.send(product);
  }

  async edit(req, res, next) {
    const { ProductId } = req.params;
    let parent;
    const d = {
      name: null,
      measuringUnit: null,
      inStockQuantity: null,
      contentQuantity: null,
      visible: null,
      parentProduct: null,
      isPrimary: null,
      dosageSize: null,
      description: null,
      price: null,
      pieces: null,
      packagingSize: null,
      images: null
    };

    for (const key in d) {
      d[key] = req.body[key];
    }
    const obj = _.pickBy(d, h => !_.isUndefined(h));

    try {
      await ProductModel.update({ _id: ProductId }, obj);
    } catch (err) {
      return next(err);
    }
    if (req.body.isPrimary) {
      try {
        parent = await ParentProduct.findById(req.body.parentProduct);
      } catch (err) {
        return next(err);
      }
      parent.primaryProduct = ProductId;
      try {
        await ProductModel.updateMany(
          { _id: { $ne: ProductId }, isPrimary: true, parentProduct: parent._id },
          { isPrimary: false }
        );
        await parent.save();
      } catch (error) {
        return next(error);
      }
    }
    res.json({ message: 'Product Updated' });
  }

  async getProduct(req, res, next) {
    let product;
    const { ProductId } = req.params;
    try {
      product = await ProductModel.findOne({ _id: ProductId, isDeleted: false }).populate(
        'measuringUnit parentProduct scheme'
      );
    } catch (err) {
      return next(err);
    }
    if (!product) {
      const e = new Error('Product Does Not exists');
      e.statusCode = 400;
      return next(e);
    }
    res.send(product);
  }

  async select(req, res, next) {
    let products;
    let { page, limit, sortBy } = req.query;
    const { search, categoryId, subCategoryId, visible, min, max } = req.query;
    let meta;
    const query = {};
    let skip = 0;
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || config.get('pagination').size;
    skip = (page - 1) * limit;

    if (sortBy) {
      sortBy = sortBy || req.query.sortBy;
    } else {
      sortBy = sortBy || { '_id': -1 };
    }

    if (search) {
      query.name = {
        $regex: new RegExp(search.toLowerCase().replace(/\s+/g, '\\s+'), 'gi')
      };
    }

    if (min || max) {
      query.price = { $gte: parseInt(min), $lte: parseInt(max) };
    }

    if (visible) query.visible = true;
    if (categoryId) query.category = categoryId;
    if (subCategoryId) query.subCategory = subCategoryId;
    query.isDeleted = {
      $ne: true
    };
    try {
      products = await ProductModel.find(query)
        .populate('measuringUnit parentProduct scheme')
        .sort(sortBy)
        .skip(skip)
        .limit(limit);
    } catch (err) {
      return next(err);
    }
    const dataToSend = {
      data: products
    };
    if (page === 1) {
      meta = {
        currentPage: page,
        recordsPerPage: limit,
        totalRecords: await ProductModel.find(query).count()
      };
      meta.totalPages = Math.ceil(meta.totalRecords / meta.recordsPerPage);
      dataToSend.meta = meta;
    }
    res.send(dataToSend);
  }

  async remove(req, res, next) {
    const { ProductId } = req.params;
    let product;
    try {
      product = await ProductModel.findById(ProductId);
    } catch (err) {
      return next(err);
    }
    if (!product) {
      const e = new Error('Product Does Not exists');
      e.statusCode = 400;
      return next(e);
    }
    try {
      await ProductModel.updateOne(
        { _id: ProductId },
        {
          $set: {
            isDeleted: true
          }
        }
      );
    } catch (err) {
      return next(err);
    }
    res.json({ message: 'Product Deleted' });
  }
}

module.exports = new ProductController(productFacade);

const _ = require('lodash');
const config = require('config');
const fs = require('fs');
const XLSX = require('xlsx');
const path = require('path');
const CategoryModel = require('./schema');
const SubCategoryModel = require('../sub-category/schema');
const ParentProductModel = require('../parent-product/schema');
const ProductModel = require('../product/schema');

const categoryFacade = require('./facade');

class CategoryController {
  async create(req, res, next) {
    let category;
    const { name, image, tags, visible } = req.body;
    let { order } = req.body;
    try {
      category = await CategoryModel.findOne({ name });
    } catch (err) {
      return next(err);
    }
    if (category) {
      const e = new Error('Category Already exists');
      e.statusCode = 400;
      return next(e);
    }
    if (!order) {
      try {
        const highestOrderCat = await CategoryModel.find({})
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
    } else {
      // Increase all category order by one if order already exists
      let sameOrder;
      try {
        sameOrder = await CategoryModel.findOne({ order });
      } catch (error) {
        return next(error);
      }
      if (sameOrder) {
        try {
          await CategoryModel.updateMany({ order: { $gte: order } }, { $inc: { order: 1 } });
        } catch (err) {
          return next(err);
        }
      }
    }
    try {
      category = await CategoryModel.create({
        name,
        image,
        tags,
        visible,
        order
      });
    } catch (err) {
      return next(err);
    }
    res.send(category);
  }

  async edit(req, res, next) {
    const { CategoryId } = req.params;
    let category;
    try {
      category = await CategoryModel.findById(CategoryId);
    } catch (err) {
      return next(err);
    }
    const d = {
      name: null,
      image: null,
      visible: null,
      tags: null,
      order: null
    };

    for (const key in d) {
      d[key] = req.body[key];
    }

    if (d.order) {
      if (category.order < d.order) {
        try {
          await CategoryModel.updateMany(
            {
              _id: { $ne: category._id },
              $and: [
                {
                  order: { $gt: category.order }
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
          await CategoryModel.updateMany(
            {
              _id: { $ne: category._id },
              $and: [
                {
                  order: { $gte: d.order }
                },
                {
                  order: { $lt: category.order }
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
      await CategoryModel.update({ _id: CategoryId }, obj);
    } catch (err) {
      return next(err);
    }
    if (d.name) {
      try {
        await ParentProductModel.updateMany(
          { 'details.category': category.name },
          {
            $push: {
              'details.category': obj.name
            }
          }
        );
        await ParentProductModel.updateMany(
          { 'details.category': category.name },
          {
            $pull: {
              'details.category': category.name
            }
          }
        );
      } catch (error) {
        return next(error);
      }
    }
    res.json({ message: 'Category Updated' });
  }

  async getCategory(req, res, next) {
    let category;
    const { CategoryId } = req.params;
    try {
      category = await CategoryModel.findById(CategoryId);
    } catch (err) {
      return next(err);
    }
    if (!category) {
      const e = new Error('Category Does Not exists');
      e.statusCode = 400;
      return next(e);
    }
    res.send(category);
  }

  async bulkUpload(req, res, next) {
    const workbook = XLSX.readFile(path.resolve(req.files[0].path));
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    let lastCategory;
    lastCategory = undefined;
    for (const record of data) {
      let category;
      let subCategory;
      let parentProduct;
      let product;
      if (!record.Category) {
        record.Category = lastCategory;
      }
      if (record.Category || lastCategory) {
        try {
          category = await CategoryModel.findOne({ name: record.Category });
        } catch (error) {
          console.log('Category', error);
        }
        if (!category) {
          try {
            category = await CategoryModel.create({
              name: record.Category
            });
          } catch (error) {
            console.log('Category', error);
          }
        }
        lastCategory = record.Category;
        try {
          subCategory = await SubCategoryModel.findOne({ name: 'All', parent: category._id });
        } catch (error) {
          return next(error);
        }
        if (!subCategory) {
          try {
            subCategory = await SubCategoryModel.create({
              name: 'All',
              parent: category._id
            });
          } catch (error) {
            console.log('Category', error);
          }
        }
        try {
          parentProduct = await ParentProductModel.findOne({
            name: record['Parent Product'],
            category: [category._id],
            subCategory: [subCategory._id]
          });
        } catch (error) {
          console.log('Category', error);
        }
        if (!parentProduct) {
          try {
            parentProduct = await ParentProductModel.create({
              name: record['Parent Product'],
              category: [category._id],
              subCategory: [subCategory._id],
              salts: record.Salts ? record.Salts.split(',') : []
            });
            parentProduct.details = {};
            if (category._id) {
              if (!parentProduct.details.category) {
                parentProduct.details.category = [];
              }
              const productCategory = await CategoryModel.findById(category._id);
              if (productCategory) {
                parentProduct.details.category.push(productCategory.name);
              }
            }
            if (subCategory._id) {
              if (!parentProduct.details.subCategory) {
                parentProduct.details.subCategory = [];
              }
              const productSubCategory = await SubCategoryModel.findById(subCategory._id);
              if (productSubCategory) {
                parentProduct.details.subCategory.push(subCategory.name);
              }
            }
            await parentProduct.save();
          } catch (error) {
            console.log('Category', error);
          }
        }
        try {
          product = await ProductModel.findOne({
            name: record['Product Name'],
            category: category._id,
            subCategory: subCategory._id,
            parentProduct: parentProduct._id
          });
        } catch (error) {
          console.log('Category', error);
        }
        if (!product) {
          const array = [];
          const packagingSize = record['Packaging size'] ? record['Packaging size'] : 1;
          array.push(packagingSize);
          let isPrimary = false;
          if (!parentProduct.primaryProduct) {
            isPrimary = true;
          }
          try {
            product = await ProductModel.create({
              name: record['Product Name'],
              category: category._id,
              subCategory: subCategory._id,
              parentProduct: parentProduct._id,
              description: record.Description,
              packagingSize: array,
              tax: record['GST%'],
              price: record.Price,
              pieces: record['no.of tablets'] ? record['no.of tablets'] : 1,
              dosageSize: record['Product Name'],
              composition: record.Composition,
              isPrimary
            });
          } catch (error) {
            console.log('Category', error);
          }
          if (product) {
            parentProduct.products.push(product._id);
            if (!parentProduct.primaryProduct) parentProduct.primaryProduct = product._id;
          }
          try {
            await parentProduct.save();
          } catch (error) {
            console.log('Category', error);
          }
        }
      }
    }
    console.log('This File Is Deleted', req.files[0].path);
    fs.unlink(req.files[0].path, (err, data) => {});
    res.json({ message: 'Records Updated SuccessFully' });
  }

  async select(req, res, next) {
    let categories;
    let { page, limit, sortBy } = req.query;
    const { name, visible } = req.query;
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
    if(visible) query.visible = true;
    try {
      categories = await CategoryModel.find(query)
        .sort(sortBy)
        .skip(skip)
        .limit(limit);
    } catch (err) {
      return next(err);
    }
    const dataToSend = {
      data: categories
    };
    if (page === 1) {
      meta = {
        currentPage: page,
        recordsPerPage: limit,
        totalRecords: await CategoryModel.find(query).count()
      };
      meta.totalPages = Math.ceil(meta.totalRecords / meta.recordsPerPage);
      dataToSend.meta = meta;
    }
    res.send(dataToSend);
  }

  async remove(req, res, next) {
    const { CategoryId } = req.params;
    let category;
    try {
      category = await CategoryModel.findById(CategoryId);
    } catch (err) {
      return next(err);
    }
    if (!category) {
      const e = new Error('Category Does Not exists');
      e.statusCode = 400;
      return next(e);
    }
    try {
      await CategoryModel.deleteOne({ _id: CategoryId });
    } catch (err) {
      return next(err);
    }
    res.json({ message: 'Category Deleted' });
  }
}

module.exports = new CategoryController(categoryFacade);

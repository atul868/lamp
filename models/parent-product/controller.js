const _ = require('lodash');
const config = require('config');
const ParentProductModel = require('./schema');
const ProductModel = require('../product/schema');
const CategoryModel = require('../category/schema');
const SubCategoryModel = require('../sub-category/schema');
const locationModel = require("../location/schema");
const parentProductFacade = require('./facade');
const fileUtil = require('../../utils/file');
const memberFacade = require('../member/facade');
const s3Bucket = config.get('s3Bucket');
var XLSX = require('xlsx')

async function uploadAproduct(body) {
  let product;
  let parent;
  const {
    name,
    measuringUnit,
    inStockQuantity,
    visible,
    parentProduct,
    isPrimary,
    dosageSize,
    description,
    price,
    pieces,
    packagingSize,
    images,
    cgst,
    sgst,
    igst,
    taxTotal,
    locationCode,
    productCode
  } = body;
  parent = await ParentProductModel.findById(parentProduct);
  if (!parent) {
    return
  }
  try {
    product = await ProductModel.findOne({ name, dosageSize });
  } catch (err) {
    return;
  }
  if (product) {
    const e = new Error('Product Already exists');
    return;
  }
  product = await ProductModel.create({
    name,
    measuringUnit,
    inStockQuantity,
    visible,
    parentProduct,
    isPrimary,
    dosageSize,
    description,
    price,
    pieces,
    packagingSize,
    images,
    cgst,
    sgst,
    igst,
    taxTotal,
    locationCode,
    productCode
  });
  parent.products.push(product._id);
  if (isPrimary) {
    parent.primaryProduct = product._id;
  }
  await parent.save();
  return;
}

async function uploadParentProduct(body) {
  let parentProduct;
  const {
    name,
    category,
    subCategory,
    image,
    description,
    primaryProduct,
    spellingMistakes,
    competitorNames,
    salts,
    products,
    images,
    indications,
    dosage,
    warning,
    storageInstructions
  } = body;
  try {
    parentProduct = await ParentProductModel.findOne({ name });
  } catch (err) {
    return next(err);
  }
  if (parentProduct) {
    const e = new Error('Parent Product Already exists');
    e.statusCode = 400;
    return next(e);
  }
  let newProduct;
  const newProducts = [];

  try {
    parentProduct = await ParentProductModel.create({
      name,
      category,
      subCategory,
      image,
      description,
      primaryProduct,
      spellingMistakes,
      competitorNames,
      salts,
      images,
      indications,
      dosage,
      warning,
      storageInstructions
    });
    parentProduct.details = {};
    if (category) {
      if (!parentProduct.details.category) {
        parentProduct.details.category = [];
      }
      for (const cat of category) {
        const productCategory = await CategoryModel.findById(cat);
        if (productCategory) {
          parentProduct.details.category.push(productCategory.name);
        }
      }
    }
    if (subCategory) {
      if (!parentProduct.details.subCategory) {
        parentProduct.details.subCategory = [];
      }
      for (const subcat of subCategory) {
        const productSubCategory = await SubCategoryModel.findById(subcat);
        if (productSubCategory) {
          parentProduct.details.subCategory.push(productSubCategory.name);
        }
      }
    }
    await parentProduct.save();
  } catch (err) {
    return next(err);
  }

  if (products) {
    try {
      for (const product of products) {
        product.parentProduct = parentProduct._id;
        if (product._id) {
          newProduct = await ProductModel.updateOne(
            { _id: product._id },
            {
              $set: product
            }
          );
          if (!product.isDeleted) {
            newProducts.push(product._id);
          }
          if (product.isPrimary) {
            parentProduct.primaryProduct = product._id;
          }
        } else {
          newProduct = await ProductModel.create(product);
          newProducts.push(newProduct._id);
          if (product.isPrimary) {
            parentProduct.primaryProduct = newProduct._id;
          }
        }
      }
    } catch (err) {
      return next(err);
    }
    parentProduct.products = newProducts;
    await parentProduct.save();
  }

  res.send(parentProduct);
}


class ParentProductController {
  async create(req, res, next) {
    let parentProduct;
    const {
      name,
      category,
      subCategory,
      image,
      description,
      primaryProduct,
      spellingMistakes,
      competitorNames,
      salts,
      products,
      images,
      indications,
      dosage,
      warning,
      storageInstructions
    } = req.body;
    try {
      parentProduct = await ParentProductModel.findOne({ name });
    } catch (err) {
      return next(err);
    }
    if (parentProduct) {
      const e = new Error('Parent Product Already exists');
      e.statusCode = 400;
      return next(e);
    }
    let newProduct;
    const newProducts = [];

    try {
      parentProduct = await ParentProductModel.create({
        name,
        category,
        subCategory,
        image,
        description,
        primaryProduct,
        spellingMistakes,
        competitorNames,
        salts,
        images,
        indications,
        dosage,
        warning,
        storageInstructions
      });
      parentProduct.details = {};
      if (category) {
        if (!parentProduct.details.category) {
          parentProduct.details.category = [];
        }
        for (const cat of category) {
          const productCategory = await CategoryModel.findById(cat);
          if (productCategory) {
            parentProduct.details.category.push(productCategory.name);
          }
        }
      }
      if (subCategory) {
        if (!parentProduct.details.subCategory) {
          parentProduct.details.subCategory = [];
        }
        for (const subcat of subCategory) {
          const productSubCategory = await SubCategoryModel.findById(subcat);
          if (productSubCategory) {
            parentProduct.details.subCategory.push(productSubCategory.name);
          }
        }
      }
      await parentProduct.save();
    } catch (err) {
      return next(err);
    }

    if (products) {
      try {
        for (const product of products) {
          product.parentProduct = parentProduct._id;
          if (product._id) {
            newProduct = await ProductModel.updateOne(
              { _id: product._id },
              {
                $set: product
              }
            );
            if (!product.isDeleted) {
              newProducts.push(product._id);
            }
            if (product.isPrimary) {
              parentProduct.primaryProduct = product._id;
            }
          } else {
            newProduct = await ProductModel.create(product);
            newProducts.push(newProduct._id);
            if (product.isPrimary) {
              parentProduct.primaryProduct = newProduct._id;
            }
          }
        }
      } catch (err) {
        return next(err);
      }
      parentProduct.products = newProducts;
      await parentProduct.save();
    }

    res.send(parentProduct);
  }

  async edit(req, res, next) {
    const { ParentProductId } = req.params;
    const d = {
      name: null,
      category: null,
      subCategory: null,
      products: null,
      images: null,
      description: null,
      primaryProduct: null,
      spellingMistakes: null,
      competitorNames: null,
      salts: null,
      indications: null,
      dosage: null,
      warning: null,
      storageInstructions: null
    };

    for (const key in d) {
      d[key] = req.body[key];
    }
    const obj = _.pickBy(d, h => !_.isUndefined(h));

    let newProduct;
    const newProducts = [];
    if (obj.products) {
      try {
        for (const product of obj.products) {
          product.parentProduct = ParentProductId;
          if (product._id) {
            newProduct = await ProductModel.updateOne(
              { _id: product._id },
              {
                $set: product
              }
            );
            if (!product.isDeleted) {
              newProducts.push(product._id);
            }
          } else {
            newProduct = await ProductModel.create(product);
            newProducts.push(newProduct._id);
          }
        }
      } catch (err) {
        return next(err);
      }
      obj.products = newProducts;
    }

    try {
      await ParentProductModel.update({ _id: ParentProductId }, obj);
    } catch (err) {
      return next(err);
    }
    try {
      if (obj.category || obj.subCategory) {
        const parentProduct = await ParentProductModel.findById(ParentProductId);
        if (!parentProduct.details) {
          parentProduct.details = {};
        }
        if (obj.category) {
          parentProduct.details.category = [];
          for (const category of parentProduct.category) {
            const productCategory = await CategoryModel.findById(category);
            if (productCategory) {
              parentProduct.details.category.push(productCategory.name);
            }
          }
        }
        if (obj.subCategory) {
          parentProduct.details.subCategory = [];
          for (const subCategory of parentProduct.subCategory) {
            const productSubCategory = await SubCategoryModel.findById(subCategory);
            if (productSubCategory) {
              parentProduct.details.subCategory.push(productSubCategory.name);
            }
          }
        }
        await ParentProductModel.update(
          { _id: ParentProductId },
          {
            $set: {
              details: parentProduct.details
            }
          }
        );
      }
    } catch (error) {
      return next(error);
    }
    res.json({ message: 'Parent Product Updated' });
  }

  async getParentProduct(req, res, next) {
    let parentProduct;
    const { ParentProductId } = req.params;
    const path = [
      {
        path: 'products',
        populate: [
          {
            path: 'measuringUnit'
          },
          {
            path: 'scheme'
          }
        ]
      },
      {
        path: 'subCategory'
      },
      {
        path: 'category'
      }
    ];
    try {
      parentProduct = await ParentProductModel.findOne({ _id: ParentProductId, isDeleted: false }).populate(path);
    } catch (err) {
      return next(err);
    }
    if (!parentProduct) {
      const e = new Error('Parent Product Does Not exists');
      e.statusCode = 400;
      return next(e);
    }
    res.send(parentProduct);
    try {
      await memberFacade.recentlyViewed(req.member, parentProduct);
    } catch (error) {
      return console.log(error);
    }
  }

  async select(req, res, next) {
    let parentProducts;
    let products;
    let { page, limit, sortBy } = req.query;
    const { search, category, subCategory, categoryName } = req.query;
    console.log("Select Parent Product hit change", req.query);
    let meta;
    const query = {};
    let skip = 0;
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || config.get('pagination').size;
    skip = (page - 1) * limit;
    const path = [
      {
        path: 'products',
        populate: [
          {
            path: 'scheme'
          }
        ]
      },
      {
        path: 'subCategory'
      },
      {
        path: 'category'
      }
    ];
    sortBy = sortBy || '_id';

    if (search) {
      query.name = {
        $regex: new RegExp(search.toLowerCase().replace(/\s+/g, '\\s+'), 'gi')
      }
    }
    if (category) query.category = category;
    if (subCategory) query.subCategory = subCategory;
    query.isDeleted = false;
    if (categoryName) {
      let category;
      try {
        category = await CategoryModel.findOne({ name: categoryName });
      } catch (error) {
        return next(error);
      }
      if (!category) return res.send([]);
      query.category = category._id;
    }
    try {
      parentProducts = await ParentProductModel.find(query)
        .populate(path)
        .sort(sortBy)
        .skip(skip)
        .limit(limit);
    } catch (err) {
      return next(err);
    }

    try {
      products = await ProductModel.find(query)
        .populate('category subCategory products scheme')
        .sort(sortBy)
        .skip(skip)
        .limit(limit);
    } catch (error) {
      return next(error);
    }
    for(let i in parentProducts){
      for(let j in parentProducts[i].products){
        parentProducts[i].products[j].category = await parentProducts[i].category[0].name || '';
        // console.log(parentProducts[i].products[j].category)
      }
    }
    const dataToSend = await {
      parentProducts: {
        data: parentProducts
      },
      products: {
        data: products
      }
    };

    meta = {
      currentPage: page,
      recordsPerPage: limit,
      totalRecords: await ParentProductModel.find(query).count()
    };
    meta.totalPages = Math.ceil(meta.totalRecords / meta.recordsPerPage);
    dataToSend.parentProducts.meta = meta;
    meta = {
      currentPage: page,
      recordsPerPage: limit,
      totalRecords: await ProductModel.find(query).count()
    };
    meta.totalPages = Math.ceil(meta.totalRecords / meta.recordsPerPage);
    dataToSend.products.meta = meta;
    console.log("Sending data back");
    res.send(dataToSend);
  }

  async remove(req, res, next) {
    const { ParentProductId } = req.params;
    let parentProduct;
    try {
      parentProduct = await ParentProductModel.findById(ParentProductId);
    } catch (err) {
      return next(err);
    }
    if (!parentProduct) {
      const e = new Error('Parent Product Does Not exists');
      e.statusCode = 400;
      return next(e);
    }
    try {
      await ParentProductModel.updateOne({ _id: ParentProductId }, { isDeleted: true });
    } catch (err) {
      return next(err);
    }
    try {
      await ProductModel.updateMany({ parentProduct: ParentProductId }, { isDeleted: true });
    } catch (error) {
      return next(error);
    }
    res.json({ message: 'Parent Product Deleted' });
  }

  async uploadImages(req, res, next) {
    let files;
    try {
      files = await fileUtil.uploadFile(req, res);
    } catch (error) {
      return next(error);
    }
    const data = [];
    for (const file of files) {
      const fileName = file.key;
      const filePath = file.location.split(`${s3Bucket}/`).pop();
      const signedUrl = fileUtil.getSignedUrl(file.key);
      data.push({ fileName, filePath, signedUrl });
    }
    res.json(data);
  }
  async import(req, res, next) {
    try {
      var workbook = XLSX.readFile(req.file.path);
      var sheet_name_list = workbook.SheetNames;
      var xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
      //   {
      //     "Location": "Mumbai-BRD",
      //     "Location Code": 400072,
      //     "Equipment Code": "PRD04567",
      //     "Equipment Name": "WHEELCHAIR   (1x1)",
      //     "HSN/SAC": "- None -",
      //     "Units": "PCS",
      //     "Quantity": -1,
      //     "MRP": 0,
      //     "Rack Rate": 54285.71,
      //     "Amount": 54285.71,
      //     "SGST": 0,
      //     "CGST": 0,
      //     "IGST": 0,
      //     "GST Rate": "",
      //     "Transaction Tax Total": 0,
      //     "Transaction Amount With Tax": 54285.71
      // },
      //
      for (let i in xlData) {
        let Location = xlData[i]['Location'];
        let LocationCode = xlData[i]['Location Code'];
        let EquipmentCode = xlData[i]['Equipment Code'];
        let EquipmentName = xlData[i]['Equipment Name'];
        let HSN_SAC = xlData[i]['HSN/SAC'];
        let Units = xlData[i]['Units'];
        let Quantity = xlData[i]['Quantity'];
        let MRP = xlData[i]['MRP'];
        let RackRate = xlData[i]['Rack Rate'];
        let Amount = xlData[i]['Amount'];
        let SGST = xlData[i]['SGST'];
        let CGST = xlData[i]['CGST'];
        let IGST = xlData[i]['IGST'];
        let category = xlData[i]['Category'];
        let GSTRate = xlData[i]['GST Rate'];
        let TransactionTaxTotal = xlData[i]['Transaction Tax Total'];
        let TransactionAmountWithTax = xlData[i]['Transaction Amount With Tax'];
        let machineCode = xlData[i]['MachineCode'];
        let parentProduct = await ParentProductModel.findOne({ name: EquipmentName });

        let location = await locationModel.findOne({ locationCode: LocationCode });
        if (!location) {
          location = new locationModel({
            locationCode: LocationCode,
            location: Location
          });
          await location.save();
        }

        let body = {
          name: EquipmentName,
          inStockQuantity: Quantity,
          contentQuantity: Quantity,// remove
          visible: true,
          productCode : EquipmentCode,
          parentProduct: parentProduct,
          isPrimary: true,
          dosageSize: "1x1",
          description: "",
          price: Amount,
          pieces: 1,
          packagingSize: [1],
          locationCode : LocationCode,
          images: [],
          cgst: CGST,
          sgst: SGST,
          igst: IGST,
          taxTotal : TransactionTaxTotal,
        }
        let parent = await ParentProductModel.findOne({ name: EquipmentName });
        if (!parent) {
          // name,
          // category,
          // subCategory,
          // image,
          // description,
          // primaryProduct,
          // spellingMistakes,
          // competitorNames,
          // salts,
          // products,
          // images,
          // indications,
          // dosage,
          // warning,
          // storageInstructions
          const catego = await CategoryModel.findOne({ name: category });
          if (!catego) {
            catego = new CategoryModel({
              name: category
            });
            await catego.save();
          }
          const sub = await SubCategoryModel.findOne();
          let parent =  await ParentProductModel.create({
            name : EquipmentName,
            category: catego,
            subCategory: sub._id,
          });
          body.parentProduct = parent._id;
          
        }
        await uploadAproduct(body);
      }
      res.send(xlData);
    }
    catch (e) {
      console.log(e);
    }

  }
}

module.exports = new ParentProductController(parentProductFacade);

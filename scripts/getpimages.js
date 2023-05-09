const Promise = require('bluebird');
const fs = require('fs');

const ProductModel = require('../models/product/schema');
const ParentProductModel = require('../models/parent-product/schema');

const run = discount =>
  new Promise(async (resolve, reject) => {
    let allProducts;
    let allParentProducts;
    console.log('hererer');

    try {
      allProducts = await ProductModel.find({ images: { $exists: true, $not: { $size: 0 } } });
    } catch (error) {
      console.log(error);
      reject(error);
    }
    try {
      allParentProducts = await ParentProductModel.find({ images: { $exists: true, $not: { $size: 0 } } });
    } catch (error) {
      console.log(error);
      reject(error);
    }
    const products = [];
    const parentProducts = [];
    console.log(allProducts.length);
    for (const product of allProducts) {
      products.push({ _id: product._id, name: product.name });
    }
    for (const product of allParentProducts) {
      parentProducts.push({ _id: product._id, name: product.name });
    }
    // fs.writeFile('parentProduct.js', JSON.stringify(parentProducts), function(err) {
    //   if (err) {
    //     return console.log(err);
    //   }
    //   console.log('The file was saved!');
    // });
    fs.writeFile('product.json', JSON.stringify(products), function(err) {
      if (err) {
        return console.log(err);
      }
      console.log('The file was saved!');
    });
    resolve();
  });

// run();
module.exports = run;

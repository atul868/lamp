const config = require('config');
const _ = require('lodash');
const moment = require('moment-timezone').tz.setDefault('Asia/Kolkata');
const CartModel = require('./schema');
const cartFacade = require('./facade');
const schemeFacade = require('../scheme/facade');
const ProductModel = require('../product/schema');

const validDiscount = discount => {
  if (moment(discount.activatedAt).isBefore(moment()) && moment(discount.expiredAt).isAfter(moment())) {
    return true;
  }
  return false;
};
class CartController {
  async create(req, res, next) {
    let cart;
    let product;
    const { quantity, productId, packagingSize } = req.body;
    const { member } = req;

    try {
      product = await ProductModel.findOne({ _id: productId, packagingSize });
    } catch (err) {
      console.log(err, 'err 27')
      return next(err);
    }

    if (!product) {
      const error = new Error('Product Not Found');
      error.statusCode = 404;
      return next(error);
    }
    try {
      cart = await CartModel.findOne({ productId, memberId: member._id, packagingSize }).populate(
        'discount.discountId'
      );
    } catch (err) {
      return next(err);
    }
    if (cart) {
      cart.quantity += 1;
      if (cart.discount && !validDiscount(cart.discount)) {
        delete cart.discount;
      }
      cart.points = product.points * cart.quantity * packagingSize;

      cart.price = product.price * cart.quantity * packagingSize; // with out discount

      const discountedPrice = product.discountedPrice ? product.discountedPrice : product.price;
      cart.discountedPrice = discountedPrice * cart.quantity * cart.packagingSize;
      cart.taxAmount = (cart.discountedPrice * product.tax) / 100;
      try {
        await cart.save();
      } catch (error) {
        return next(error);
      }
      return res.send(cart);
    }
    let discountedPrice;
    const price = product.price * quantity * packagingSize;
    let discountedP = product.discountedPrice ? product.discountedPrice : product.price;
    discountedP = product.price - discountedP;
    if (discountedP === product.price) {
      discountedPrice = price;
    } else {
      discountedPrice = price - discountedP * quantity * packagingSize;
    }
    const points = product.points * quantity * packagingSize;
    const cartData = {
      quantity,
      productId,
      productName: product.name,
      memberId: member._id,
      price,
      discount: null,
      packagingSize,
      points,
      dosageSize: product.dosageSize,
      taxAmount: (discountedPrice * product.tax) / 100,
      discountedPrice
    };
    if (product.discount && validDiscount(product.discount)) {
      const discount = {
        discountId: product.discount.discountId,
        amount: product.discount.amount,
        expiredAt: product.discount.expiredAt,
        activatedAt: product.discount.activatedAt
      };
      cartData.discount = discount;
    }
    try {
      cart = await cartFacade.create(cartData);
    } catch (err) {
      return next(err);
    }
    schemeFacade.applyScheme(member._id);
    res.send(cart);
  }

  async getCart(req, res, next) {
    let cart;
    let meta;
    let { page, limit, sortBy } = req.query;
    const { promoCodeCoupon } = req.query;
    let skip = 0;
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || config.get('pagination').size;
    skip = (page - 1) * limit;

    sortBy = sortBy || '_id';
    if (req.query.memberId) {
      try {
        cart = await CartModel.find({ memberId: req.query.memberId })
          .populate('discount.discountId productId')
          .sort(sortBy)
          .skip(skip)
          // .lean(true)
          .limit(limit);
      } catch (err) {
        return next(err);
      }
    } else {
      try {
        cart = await CartModel.find({ memberId: req.member._id })
          .populate('discount.discountId productId')
          .sort(sortBy)
          .skip(skip)
          // .lean(true)
          .limit(limit);
      } catch (err) {
        return next(err);
      }
    }
    for (const c of cart) {
      if (c.discount && !validDiscount(c.discount)) {
        c.price = c.price;
        c.discountedPrice = 0;
        delete c.discount;
        await CartModel.updateOne({ _id: c._id }, c);
      }
      if (c.productId && c.productId.discount && validDiscount(c.productId.discount) && !c.discount) {
        const product = c.productId;
        c.price = product.price * c.quantity * c.packagingSize;
        c.points = product.points * c.quantity * c.packagingSize;

        const discountedP = product.discountedPrice ? product.discountedPrice : product.price;
        const discountedPrice = discountedP * c.quantity * c.packagingSize;
        c.taxAmount = (c.discountedPrice * product.tax) / 100;
        c.discountedPrice = discountedPrice;
        await CartModel.updateOne({ _id: c._id }, c);
      }
    }
    let shippingCharge = 100;
    const mappedData = {
      cart,
      originalAmount: _.sumBy(cart, 'price'),
      totalDiscountedAmount: _.sumBy(cart, 'discountedPrice'),
      totalGivenDiscount: _.sumBy(cart, 'price') - _.sumBy(cart, 'discountedPrice'),
      shippingCharges: shippingCharge,
      totalTaxAmount: _.sumBy(cart, 'taxAmount'),
      totalAmountBeforePromo: _.sumBy(cart, 'discountedPrice') + _.sumBy(cart, 'taxAmount'),
      totalAmount: _.sumBy(cart, 'price') - _.sumBy(cart, 'discountedPrice') + _.sumBy(cart, 'taxAmount') + shippingCharge,
      subAmount: _.sumBy(cart, 'discountedPrice')
    };
    // calculate promo code
    if (promoCodeCoupon) {
      let appliedPromoAmount;
      try {
        appliedPromoAmount = await cartFacade.applyPromoCode(promoCodeCoupon, mappedData.totalAmount);
      } catch (error) {
        return next(error);
      }
      if (appliedPromoAmount) {
        mappedData.totalAmount -= appliedPromoAmount;
        mappedData.promoCodeAmount = appliedPromoAmount;
      }
    }
    const dataToSend = { data: mappedData };
    if (page === 1) {
      meta = {
        currentPage: page,
        recordsPerPage: limit,
        totalRecords: await CartModel.countDocuments({ memberId: req.member._id })
      };
      meta.totalPages = Math.ceil(meta.totalRecords / meta.recordsPerPage);
      dataToSend.meta = meta;
    }
    res.send(dataToSend);
  }

  async emptyCart(req, res, next) {
    try {
      await CartModel.deleteMany({ memberId: req.member._id });
    } catch (err) {
      return next(err);
    }
    res.json({ message: 'cart Deleted' });
  }

  async deleteProductFromCart(req, res, next) {
    const { productId } = req.body;
    const { quantity, packagingSize, promoCodeCoupon } = req.query;
    console.log(quantity);
    if (quantity) {
      req.query.memberId = req.member._id;
      let cart;
      try {
        cart = await CartModel.findOne({ productId: productId, memberId: req.member._id }).populate(
          'productId'
        );
      } catch (err) {
        return next(err);
      }
      if (!cart) {
        const error = new Error('No Cart Found');
        error.statusCode = 404;
        return next(error);
      }
      if (cart.quantity > quantity) {
        cart.quantity -= quantity;
        // await CartModel.updateOne({ _id: cart._id }, cart);
      }
      else {
        await CartModel.deleteOne({ _id: cart._id });
        res.json({ message: 'Deleted' });
      }
      const product = cart.productId;
      if (cart.discount && !validDiscount(cart.discount)) {
        delete cart.discount;
      }
      // cart.quantity = quantity;
      cart.price = product.price * cart.quantity * cart.packagingSize;
      cart.points = product.points * cart.quantity * cart.packagingSize;
      let discountedP = product.discountedPrice ? product.discountedPrice : product.price;
      discountedP = product.price - discountedP;
      let discountedPrice;
      if (discountedP === product.price) {
        discountedPrice = cart.price;
      } else {
        let p = packagingSize;
        if (!p) {
          p = 1;
        }
        discountedPrice = cart.price - discountedP * quantity * p;
        console.log(discountedPrice, discountedP);
      }
      console.log(discountedPrice);
      cart.discountedPrice = discountedPrice;
      cart.taxAmount = (cart.discountedPrice * product.tax) / 100;
      // calculate promo code
      if (promoCodeCoupon) {
        let appliedPromoAmount;
        try {
          appliedPromoAmount = await cartFacade.applyPromoCode(promoCodeCoupon, discountedPrice);
        } catch (error) {
          // do nothing
        }
        if (appliedPromoAmount) cart.discountedPrice -= appliedPromoAmount;
      }

      try {
        await cart.save();
      } catch (err) {
        console.log(err);
        return next(err);
      }
    } else {
      try {
        await CartModel.deleteOne({ productId, memberId: req.member._id });
      } catch (err) {
        return next(err);
      }
    }

    res.json({ message: 'Deleted' });
  }

  // async applyScheme(scheme) {
  //   const { productId, relatedProductId, discountPercentage } = scheme;
  //   if (scheme.type === 'Couple Disounts') {
  //     try {
  //       const product = await ProductModel.findById(productId);
  //     } catch (error) {
  //       console.log(error);
  //     }
  //     try {
  //       const relatedProduct = await ProductModel.findById(relatedProductId);
  //     } catch (error) {
  //       console.log(error);
  //     }

  //   }
  // }
}

module.exports = new CartController(cartFacade);

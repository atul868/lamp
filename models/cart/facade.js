const moment = require('moment-timezone').tz.setDefault('Asia/Calcutta|Asia/Kolkata');
const Promise = require('bluebird');
const Facade = require('../../lib/facade');
const cartSchema = require('./schema');
const PromoCodeModel = require('../promoCode/schema');

const validPromoCode = discount => {
  if (moment(discount.activatedAt).isBefore(moment()) && moment(discount.expiredAt).isAfter(moment())) {
    return true;
  }
  return false;
};
class CartFacade extends Facade {
  async applyPromoCode(promoCodeCoupon, totalAmount, promoCode) {
    return new Promise(async (resolve, reject) => {
      if (!promoCode) promoCode = await PromoCodeModel.findOne({ name: promoCodeCoupon });
      if (!promoCode) {
        const error = new Error('Promo Code Not Found');
        error.statusCode = 404;
        return reject(error);
      }
      if (!validPromoCode(promoCode)) {
        const error = new Error('Promo Code is Expired');
        error.statusCode = 400;
        return reject(error);
      }
      if (promoCode.minAmount && promoCode.minAmount > totalAmount) {
        const error = new Error(`Minimum amount to apply this promo code is ${promoCode.minAmount}`);
        error.statusCode = 400;
        return reject(error);
      }
      if (promoCode.amount) {
        return resolve(promoCode.amount);
      }
      let amount = (totalAmount * promoCode.percentage) / 100;
      if (amount > promoCode.maxDiscount) {
        amount = promoCode.maxDiscount;
      }
      return resolve(amount);
    });
  }
}

module.exports = new CartFacade(cartSchema);

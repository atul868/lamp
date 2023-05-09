const RazorPay = require('razorpay');
const config = require('config');
const OrderModel = require('../order/schema');
const paymentFacade = require('./facade');

const razorPay = new RazorPay({
  key_id: config.get('RAZOR_PAY_KEY_ID'),
  key_secret: config.get('RAZOR_PAY_KEY_SECRET')
});

class PaymentController {
  async createOrder(req, res, next) {
    let response;
    const { orderId } = req.params;
    let order;

    try {
      order = await OrderModel.findById({ _id: orderId, paymentMethod: 'ONLINE' }).populate('memberId items.productId');
    } catch (error) {
      console.log(error);
      return next(error);
    }
    if (!order) {
      const e = new Error("Order Doesn't Exist");
      e.statusCode = 400;
      return next(e);
    }
    if (order.status !== 'PLACED') {
      const e = new Error('Order is Not Placed');
      e.statusCode = 400;
      return next(e);
    }
    let total = 0;
    order.items.forEach(item => {
      total += item.productId.price * item.quantity;
      let igst = Math.floor(item.productId.igst);
      let cgst = Math.floor(item.productId.cgst);
      let sgst = Math.floor(item.productId.sgst);
      if(isNaN(igst)){
        igst = 0;
      }
      if(isNaN(cgst)){
        cgst = 0;
      }
      if(isNaN(sgst)){
        sgst = 0;
      }
      // tax
      total += cgst + sgst + igst;
    }
    );
    const options = {
      amount: Math.round(total * 100),
      currency: 'INR',
      receipt: orderId, // any unique id
      payment_capture: 1 // optional
    };
    console.log(options);
    try {
      response = await razorPay.orders.create(options);
    } catch (error) {
      console.log(error);
      const e = new Error("Amount should be greater than 5 Lac.");
      e.error = error;
      e.statusCode = 400;
      return next(e);
    }
    try {
      await OrderModel.updateOne(
        { _id: orderId },
        {
          $set: {
            razorPayTransactionId: response.id
          }
        }
      );
    } catch (error) {
      console.log(error);
      error.error = "Amount is greater then 5 Lac.";
      return next(error);
    }
    res.json({
      razorPayTransactionId: response.id,
      currency: response.currency,
      amount: response.amount,
      order
    });
  }

  async paymentCapture(req, res, next) {
    const { orderId } = req.params;
    let response;
    let order;
    try {
      order = await OrderModel.findById({ _id: orderId });
    } catch (error) {
      console.log(error);
      return next(error);
    }
    if (!order) {
      const e = new Error("Order Doesn't Exist");
      e.statusCode = 400;
      return next(e);
    }
    if (!order.razorPayTransactionId) {
      const e = new Error('Transaction is not initiated');
      e.statusCode = 400;
      return next(e);
    }
    try {
      response = await razorPay.orders.fetch(order.razorPayTransactionId);
    } catch (error) {
      return next(error);
    }
    if (response.status === 'paid') {
      try {
        await OrderModel.updateOne(
          { _id: orderId },
          {
            $set: {
              status: 'PAYMENT_CONFIRMED'
            }
          }
        );
      } catch (error) {
        return next(error);
      }
      res.json({ message: 'Payment Completed' });
    }
    const e = new Error('Transaction is not initiated');
    e.statusCode = 400;
    return next(e);
  }
}

module.exports = new PaymentController(paymentFacade);

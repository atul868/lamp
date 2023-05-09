const _ = require('lodash');
const moment = require('moment-timezone').tz.setDefault('Asia/Kolkata');
const config = require('config');
const orderFacade = require('./facade');
const CartModel = require('../cart/schema');
const OrderModel = require('./schema');
const MemberModel = require('../member/schema');
const memberFacade = require('../member/facade');
const exportExcel = require('../../utils/exportExcel');
const promoCodeFacade = require('../promoCode/facade');
const cartFacade = require('../cart/facade');

const validDiscount = discount => {
  if (moment(discount.activatedAt).isBefore(moment()) && moment(discount.expiredAt).isAfter(moment())) {
    return true;
  }
  return false;
};

const getTotal = items => {
  const totalOriginalAmount = _.sumBy(items, 'price'); // total price without any thing
  const totalDiscountedAmount = _.sumBy(items, 'discountedPrice'); // sum of discounted price
  const totalSubAmount = totalDiscountedAmount;
  const totalTaxAmount = _.sumBy(items, 'taxAmount'); // total tax amount
  const totalAmount = totalSubAmount + totalTaxAmount; // discounted amount + tax
  const totalGivenDiscount = totalOriginalAmount - totalDiscountedAmount; // total given discount on the order
  return {
    totalOriginalAmount,
    totalDiscountedAmount,
    totalSubAmount,
    totalTaxAmount,
    totalAmount,
    totalGivenDiscount
  };
};

const getFilter = async req => {
  const { startDate, endDate, status, search, role } = req.query;
  let filter = {};
  if ((startDate && !endDate) || (!startDate && endDate)) {
    const error = new Error('Bad Request invalid request');
    error.statusCode = 400;
    return error;
  }

  if (startDate) {
    filter = {
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    };
  }
  if (status) filter.status = status;
  if (search) {
    let members;
    try {
      members = await memberFacade.findAll({
        $or: [
          { userId: { $regex: new RegExp(`^${search.toLowerCase()}`, 'i') } },
          { phone: { $regex: new RegExp(`^${search.toLowerCase()}`, 'i') } },
          { name: { $regex: new RegExp(`^${search.toLowerCase()}`, 'i') } }
        ]
      });
    } catch (error) {
      return error;
    }
    const memberIds = _.map(members, '_id');
    if (role === 'retailer' && !_.isEmpty(memberIds)) {
      filter.memberId = { $in: memberIds };
    } else if (!_.isEmpty(memberIds)) {
      filter.stockistId = { $in: memberIds };
    }
    filter.orderId = { $regex: new RegExp(search.toLowerCase(), 'gi') };
  }
  // remove null values
  filter = _.pickBy(filter, h => h);
  return filter;
};
class OrderController {
  // create order
  async create(req, res, next) {
    let carts;
    let order;
    const { addressId, promoCodeCoupon, paymentMethod } = req.body;
    const { notes } = req.body;
    const items = [];
    let existingOrder;
    let firstOrder;
    if (!req.member.isApproved) {
      const error = new Error('Your Account is not Activated yet please contact to admin');
      error.statusCode = 403;
      return next(error);
    }
    const address = _.find(req.member.address, a => a._id.toString() === addressId);
    if (!address) {
      const error = new Error('Not a Valid Address');
      error.statusCode = 400;
      return next(error);
    }
    const stockist = _.find(req.member.stockist, o => o.isPrimary === true);
    const mr = _.find(req.member.mr, o => o.isPrimary === true);
    // if (!stockist) {
    //   const error = new Error('No Stockist Found');
    //   error.statusCode = 400;
    //   return next(error);
    // }
    try {
      carts = await CartModel.find({ memberId: req.member._id }).lean(true);
    } catch (err) {
      return next(err);
    }
    if (!carts || carts.length <= 0) {
      const e = new Error('Cart is Empty Please add some product in your cart');
      e.statusCode = 404;
      return next(e);
    }
    for (const cart of carts) {
      if (cart.discount && !validDiscount(cart.discount)) {
        delete cart.discount;
        await CartModel.updateOne({ _id: cart._id }, cart);
      }
      // map order data for every product
      items.push({
        quantity: cart.quantity,
        productId: cart.productId,
        productName: cart.productName,
        price: cart.price,
        discount: cart.discount,
        cartId: cart._id,
        points: cart.points,
        packagingSize: cart.packagingSize,
        taxAmount: cart.taxAmount,
        dosageSize: cart.dosageSize,
        discountedPrice: cart.discountedPrice
      });
    }
    const {
      totalOriginalAmount,
      totalDiscountedAmount,
      totalSubAmount,
      totalTaxAmount,
      totalAmount,
      totalGivenDiscount
    } = getTotal(items);
    const orderId = await orderFacade.orderId();
    try {
      existingOrder = await OrderModel.findOne({ memberId: req.member.id });
    } catch (error) {
      return next(error);
    }
    if (existingOrder) {
      firstOrder = false;
    } else {
      firstOrder = true;
    }
    const data = {
      orderId,
      items,
      memberId: req.member.id,
      stockistId: stockist ? stockist.stockistId : null,
      mrId: mr ? mr.mrId : null,
      address,
      totalOriginalAmount,
      totalDiscountedAmount,
      totalSubAmount,
      totalTaxAmount,
      totalAmountBeforePromo: totalAmount,
      totalAmount,
      totalGivenDiscount,
      notes,
      firstOrder,
      paymentMethod
    };
    if (promoCodeCoupon) {
      let promoCode;
      try {
        promoCode = await promoCodeFacade.findOne({ name: promoCodeCoupon });
      } catch (error) {
        return next(error);
      }
      if (promoCode) {
        const promoCodeData = {
          name: promoCode.name,
          promoCodeId: promoCode._id,
          expiredAt: promoCode.expiredAt,
          activatedAt: promoCode.activatedAt
        };
        let appliedPromoAmount;
        try {
          appliedPromoAmount = await cartFacade.applyPromoCode(promoCodeCoupon, data.totalDiscountedAmount);
        } catch (error) {
          return next(error);
        }
        if (appliedPromoAmount) {
          data.totalAmount -= appliedPromoAmount;
          promoCodeData.amount = appliedPromoAmount;
          data.promoCode = promoCodeData;
        }
      }
    }
    try {
      order = await orderFacade.create(data);
    } catch (error) {
      return next(error);
    }
    res.send(order);
    try {
      await CartModel.deleteMany({ memberId: req.member._id });
    } catch (error) {
      return next(error);
    }
    try {
      await orderFacade.createTimeline(order, req.member._id);
    } catch (error) {
      return next(error);
    }
  }

  // get all orders
  async get(req, res, next) {
    let orders;
    let meta;
    let { page, limit, sortBy } = req.query;
    const { excel } = req.query;
    let skip = 0;
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || config.get('pagination').size;
    skip = (page - 1) * limit;

    sortBy = sortBy || '_id';
    let filter;
    try {
      filter = await getFilter(req);
    } catch (error) {
      return next(error);
    }
    if (!req.query.status) {
      filter.status = {
        $nin: ['REJECTED', 'DELIVERED', 'PENDING', 'CANCELLED', 'RETURN', 'INCOMPLETE']
      };
    }

    if (req.member.role === 'stockist') {
      filter.stockistId = req.member._id;
    } else if (req.member.role === 'retailer') {
      filter.memberId = req.member._id;
    }
    try {
      orders = await OrderModel.find(filter)
        .populate('memberId stockistId items.productId')
        .sort(sortBy)
        .skip(skip)
        .limit(limit);
    } catch (err) {
      return next(err);
    }
    if (excel) {
      const formattedData = [];
      for (const order of orders) {
        const data = {
          orderId: order.orderId,
          status: order.status,
          member: order.memberId ? order.memberId.name : undefined,
          stockist: order.stockist ? order.stockist.name : undefined,
          totalOriginalAmount: order.totalOriginalAmount,
          totalSubAmount: order.totalSubAmount,
          totalDiscountedAmount: order.totalDiscountedAmount,
          totalGivenDiscount: order.totalGivenDiscount,
          totalTaxAmount: order.totalTaxAmount,
          totalAmount: order.totalAmount
        };
        formattedData.push(data);
      }
      exportExcel(formattedData, res);
    } else {
      const dataToSend = {
        data: orders
      };
      if (page === 1) {
        meta = {
          currentPage: page,
          recordsPerPage: limit,
          totalRecords: await OrderModel.count(filter)
        };
        meta.totalPages = Math.ceil(meta.totalRecords / meta.recordsPerPage);
        dataToSend.meta = meta;
      }
      res.send(orders);
    }
  }

  // get all past orders
  async pastOrders(req, res, next) {
    let orders;
    let meta;
    let { page, limit, sortBy } = req.query;
    let skip = 0;
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || config.get('pagination').size;
    skip = (page - 1) * limit;

    sortBy = sortBy || '_id';
    const filter = await getFilter(req);
    if (!req.query.status) {
      filter.status = {
        $in: ['REJECTED', 'DELIVERED', 'PENDING', 'CANCELLED', 'RETURN', 'INCOMPLETE']
      };
    }
    if (req.member.role === 'stockist') {
      filter.stockistId = req.member._id;
    } else if (req.member.role === 'retailer') {
      filter.memberId = req.member._id;
    }
    try {
      orders = await OrderModel.find(filter)
        .populate('memberId stockistId')
        .sort(sortBy)
        .skip(skip)
        .limit(limit);
    } catch (err) {
      return next(err);
    }
    const dataToSend = {
      data: orders
    };
    if (page === 1) {
      meta = {
        currentPage: page,
        recordsPerPage: limit,
        totalRecords: await OrderModel.count(filter)
      };
      meta.totalPages = Math.ceil(meta.totalRecords / meta.recordsPerPage);
      dataToSend.meta = meta;
    }
    res.send(orders);
  }

  // get order by member id
  async getOrderById(req, res, next) {
    let orders;
    let meta;
    let { page, limit, sortBy } = req.query;
    const { type } = req.query;
    const { memberId } = req.params;
    let skip = 0;
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || config.get('pagination').size;
    skip = (page - 1) * limit;

    sortBy = sortBy || '_id';
    const filter = await getFilter(req);
    if (req.query.role === 'stockist') {
      filter.stockistId = memberId;
    } else if (req.query.role === 'retailer') {
      filter.memberId = memberId;
    }
    if (type === 'CURRENT') {
      filter.status = { $nin: ['DELIVERED', 'CANCELLED', 'RETURN', 'COMPLETED'] };
    } else if (type === 'PAST') {
      filter.status = { $in: ['DELIVERED', 'CANCELLED', 'RETURN', 'COMPLETED'] };
    }
    try {
      orders = await OrderModel.find(filter)
        .populate('memberId stockistId items.productId')
        .sort(sortBy)
        .skip(skip)
        .limit(limit);
    } catch (err) {
      return next(err);
    }
    const dataToSend = {
      data: orders
    };
    if (page === 1) {
      meta = {
        currentPage: page,
        recordsPerPage: limit,
        totalRecords: await OrderModel.count(filter)
      };
      meta.totalPages = Math.ceil(meta.totalRecords / meta.recordsPerPage);
      dataToSend.meta = meta;
    }
    res.send(dataToSend);
  }

  // update order items
  async update(req, res, next) {
    const { orderId } = req.params;
    let { items } = req.body;
    const validStatus = ['PLACED', 'REJECTED'];
    if (!req.member.isApproved) {
      const error = new Error('Your Account is not Activated yet please contact to admin');
      error.statusCode = 403;
      return next(error);
    }
    let order;
    if (req.member.role !== 'stockist') {
      const error = new Error('Access Denied');
      error.statusCode = 403;
      return next(error);
    }
    try {
      order = await OrderModel.findOne({ _id: orderId, stockistId: req.member._id });
    } catch (error) {
      return next(error);
    }
    if (!order) {
      const error = new Error('No Order Found');
      error.statusCode = 404;
      return next(error);
    }
    if (!validStatus.includes(order.status)) {
      const error = new Error('Permission Denied');
      error.statusCode = 403;
      return next(error);
    }
    order.items = items;
    items = _.filter(items, o => o.isAccepted === true);
    if (_.isEmpty(items)) {
      order.status = 'REJECTED';
    } else {
      const {
        totalOriginalAmount,
        totalDiscountedAmount,
        totalSubAmount,
        totalTaxAmount,
        totalAmount,
        totalGivenDiscount
      } = getTotal(items);

      order.totalOriginalAmount = totalOriginalAmount;
      order.totalDiscountedAmount = totalDiscountedAmount;
      order.totalTaxAmount = totalTaxAmount;
      order.totalSubAmount = totalSubAmount;
      order.totalAmount = totalAmount;
      order.totalGivenDiscount = totalGivenDiscount;
    }

    try {
      await order.save();
    } catch (error) {
      return next(error);
    }
    res.send(order);
    // try {
    //   await orderFacade.createTimeline(order, req.member._id);
    // } catch (error) {
    //   return next(error);
    // }
  }

  // stockist accept order
  async acceptOrder(req, res, next) {
    const { orderId } = req.params;
    if (req.member.isDisabled) {
      const error = new Error('Your Account is not Activated yet please contact to admin');
      error.statusCode = 403;
      return next(error);
    }
    let order;

    try {
      order = await OrderModel.findOne({ _id: orderId, stockistId: req.member._id });
    } catch (error) {
      return next(error);
    }
    if (!order) {
      const error = new Error('No Order Found');
      error.statusCode = 404;
      return next(error);
    }
    if (order.status !== 'PLACED') {
      const error = new Error('Permission Denied');
      error.statusCode = 403;
      return next(error);
    }
    order.status = 'ACCEPTED';
    try {
      await order.save();
    } catch (error) {
      return next(error);
    }
    res.send(order);
    try {
      await orderFacade.createTimeline(order, req.member._id);
    } catch (error) {
      return next(error);
    }
  }

  // confirmed  order
  async confirmOrder(req, res, next) {
    const { orderId } = req.params;
    const { status } = req.body;
    let user;
    if (req.member.isDisabled) {
      const error = new Error('Your Account is not Activated yet please contact to admin');
      error.statusCode = 403;
      return next(error);
    }
    let order;

    try {
      order = await OrderModel.findOne({ _id: orderId, memberId: req.member._id });
    } catch (error) {
      return next(error);
    }
    if (!order) {
      const error = new Error('No Order Found');
      error.statusCode = 404;
      return next(error);
    }
    if (order.status !== 'ACCEPTED') {
      const error = new Error('Permission Denied');
      error.statusCode = 403;
      return next(error);
    }
    if (status === 'CONFIRMED' && order.firstOrder) {
      try {
        user = await MemberModel.findById(order.memberId);
      } catch (error) {
        return next(error);
      }
      if (user.referredCode) {
        try {
          await MemberModel.updateOne(
            { referralCode: user.referredCode },
            {
              $inc: {
                points: 100
              }
            }
          );
        } catch (error) {
          return next(error);
        }
      }
    }
    order.status = status;
    try {
      await order.save();
    } catch (error) {
      return next(error);
    }
    res.send(order);
    try {
      await orderFacade.createTimeline(order, req.member._id);
    } catch (error) {
      return next(error);
    }
  }

  // get order by id
  async getOrder(req, res, next) {
    const { orderId } = req.params;
    let where = { _id: orderId };
    if (req.member.role === 'retailer') {
      where = { _id: orderId, memberId: req.member._id };
    } else if (req.member.role === 'stockist') {
      where = { _id: orderId, stockistId: req.member._id };
    }
    let order;
    try {
      order = await OrderModel.findOne(where).populate('memberId stockistId items.productId');
    } catch (error) {
      return next(error);
    }

    if (!order) {
      const error = new Error('No Order Found');
      error.statusCode = 404;
      return next(error);
    }

    res.send(order);
  }

  // Upload Bill
  async uploadBill(req, res, next) {
    const { orderId } = req.params;
    const { bill } = req.body;
    let order;
    try {
      order = await orderFacade.findOne({ _id: orderId });
    } catch (error) {
      return next(error);
    }

    if (!order) {
      const error = new Error('No Order Found');
      error.statusCode = 404;
      return next(error);
    }
    order.bill = bill;
    try {
      await order.save();
    } catch (error) {
      return next(error);
    }
    res.json({ message: 'Bill Approved' });
  }

  // Approve Bill
  async approveBill(req, res, next) {
    const { orderId, points } = req.params;
    let order;
    try {
      order = await orderFacade.findOne({ _id: orderId });
    } catch (error) {
      return next(error);
    }

    if (!order) {
      const error = new Error('No Order Found');
      error.statusCode = 404;
      return next(error);
    }

    if (!order.bill) {
      const error = new Error('Upload Bill First');
      error.statusCode = 400;
      return next(error);
    }
    order.isBillApproved = true;
    try {
      await order.save();
    } catch (error) {
      return next(error);
    }
    const itemPoints = _.sumBy(order.items, 'points');
    if (itemPoints < points) {
      const error = new Error('Points can not be greater than acutal amount');
      error.statusCode = 400;
      return next(error);
    }
    try {
      await memberFacade.update({ _id: req.member._id }, { points });
    } catch (error) {
      return next(error);
    }
    res.json({ message: 'Bill Approved' });
  }

  // get all orders
  async getOrderForCard(req, res, next) {
    let orders = {
      placed: null,
      accepted: null,
      rejected: null,
      confirmed: null,
      delivered: null,
      shipped: null,
      pending: null,
      cancelled: null,
      return: null,
      incomplete: null,
      payment_confirmed: null
    };
    let { page, limit, sortBy } = req.query;
    let skip = 0;
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || config.get('pagination').size;
    skip = (page - 1) * limit;

    sortBy = sortBy || '_id';
    let filter;
    try {
      filter = await getFilter(req);
    } catch (error) {
      return next(error);
    }
    for (const key in orders) {
      filter.status = key.toUpperCase();
      if (req.query.status && req.query.status !== filter.status) continue;
      try {
        orders[key] = await OrderModel.find(filter)
          .populate('memberId stockistId')
          .sort(sortBy)
          .skip(skip)
          .limit(limit);
        const totalRecords = await OrderModel.count(filter);
        orders[key].push({ totalRecords });
      } catch (err) {
        return next(err);
      }
    }
    orders = _.pickBy(orders, o => o);
    res.send(orders);
  }
}

module.exports = new OrderController(orderFacade);

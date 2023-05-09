/* eslint-disable prefer-destructuring */
const { expect } = require('chai');
const moment = require('moment');
const config = require('config');
const version = config.get('version');
const categoryData = {
  tags: ['Medicine'],
  visible: true,
  name: 'New Cat For Order',
  order: 4
};
const subCategoryData = {
  tags: ['Medicine'],
  visible: true,
  name: 'New Sub Category For Order'
};
const data = {
  inStockQuantity: 1000,
  visible: false,
  isPrimary: true,
  spellingMistakes: ['Cipla', 'Changs'],
  competitorNames: ['Cipla', 'Changs'],
  name: 'Di Elita Order',
  measuringUnit: 'Grams',
  contentQuantity: 150,
  subCategory: [],
  category: [],
  dosage: [
    {
      dosageSize: '250 mg',
      price: 1500,
      pieces: 100,
      description: '10x10',
      packagingSize: [20, 40, 60]
    }
  ]
};
const productData = {
  inStockQuantity: 20,
  price: 600.25,
  packagingSize: [10, 20, 30, 40],
  name: 'Cacity 20mg FOR ORDER',
  measuringUnit: null,
  dosageSize: '20mg',
  description: '10x10',
  pieces: 100,
  tax: 14.5
};
let parentProduct;
const address = {
  location: { type: 'Point', coordinates: [76.717873, 30.704649] },
  city: 'CHD',
  state: 'CHD',
  pincode: 140603,
  line1: 'Sec 43',
  line2: 'Near Dominos',
  isPrimary: true
};

const retailerData = {
  name: 'Retailer',
  phone: '8931097383',
  email: 'nikhil@kilobytetech.com',
  role: 'retailer'
};
const mrData = {
  name: 'MR',
  phone: '8931097384',
  email: 'nikhil+1@kilobytetech.com',
  role: 'mr'
};
const stockistData = {
  name: 'Stockist',
  phone: '8931097385',
  email: 'nikhil+2@kilobytetech.com',
  role: 'stockist'
};
let token;
let retailer;
let adminToken;
let product;
let cartId;
let memberFacade;
let mrToken;
let stockistToken;
let stockist;
let mr;
let discount;
let promo;
let order;
let measurement;
describe('ORDER', () => {
  before(async () => {
    const memberFacade = require('../../models/member/facade');
    const member = await memberFacade.findOne({ _id: pMember._id });
    adminToken = await member.createAccessToken();
  });
  it('Should be able to signUp', async () => {
    await request
      .post(`/${version}/Member`)
      .send(retailerData)
      .expect(200);
  });
  it('Should be able to signUp', async () => {
    const res = await request
      .post(`/${version}/Member`)
      .send(mrData)
      .expect(200);
    mr = res.body;
  });
  it('Should be able to signUp', async () => {
    const res = await request
      .post(`/${version}/Member`)
      .send(stockistData)
      .expect(200);
    stockist = res.body;
  });
  it('Should be able to verify email', async () => {
    memberFacade = require('../../models/member/facade');
    retailer = await memberFacade.findOne({ email: 'nikhil@kilobytetech.com' });
    await memberFacade.update({ email: 'nikhil+1@kilobytetech.com' }, { emailStatus: 'verified' });
    await memberFacade.update({ email: 'nikhil+2@kilobytetech.com' }, { emailStatus: 'verified' });
    await request
      .post(`/${version}/Member/VerifyEmail`)
      .send({ token: retailer.token, memberId: retailer._id })
      .expect(200);
  });
  it('Retailer should be able to login account', async () => {
    const res = await request
      .post(`/${version}/Member/UserLogin`)
      .send({
        phone: 8931097383,
        otp: retailer.otp
      })
      .expect(200);
    token = res.body;
  });
  it('MR should be able to login account', async () => {
    const res = await request
      .post(`/${version}/Member/UserLogin`)
      .send({
        phone: 8931097384,
        otp: mr.otp
      })
      .expect(200);
    mrToken = res.body;
  });
  it('Stockist should be able to login account', async () => {
    const res = await request
      .post(`/${version}/Member/UserLogin`)
      .send({
        phone: 8931097385,
        otp: stockist.otp
      })
      .expect(200);
    stockistToken = res.body;
  });
  it('Normal User should be able to add address', async () => {
    await request
      .post(`/${version}/Member/Address`)
      .set({ Authorization: token.accessToken })
      .send(address)
      .expect(200);
  });
  it('MR should be able to add address', async () => {
    await request
      .post(`/${version}/Member/Address`)
      .set({ Authorization: mrToken.accessToken })
      .send(address)
      .expect(200);
  });
  it('Stockist should be able to add address', async () => {
    await request
      .post(`/${version}/Member/Address`)
      .set({ Authorization: stockistToken.accessToken })
      .send(address)
      .expect(200);
  });

  it('Admin should be able to approve mr account', async () => {
    await request
      .post(`/${version}/Member/Approve/${token.memberId}`)
      .set({ Authorization: adminToken.accessToken })
      .expect(200);
  });
  it('it should be able to create category ', async () => {
    const res = await request
      .post(`/${version}/Category/`)
      .set({ Authorization: adminToken.accessToken })
      .send(categoryData)
      .expect(200);
    data.category.push(res.body._id);
    subCategoryData.parent = res.body._id;
  });
  it('it should be able to create subcategory ', async () => {
    const res = await request
      .post(`/${version}/SubCategory/`)
      .set({ Authorization: adminToken.accessToken })
      .send(subCategoryData)
      .expect(200);
    data.subCategory.push(res.body._id);
  });
  it('it should be able to create parent product ', async () => {
    const res = await request
      .post(`/${version}/ParentProduct/`)
      .set({ Authorization: adminToken.accessToken })
      .send(data)
      .expect(200);
    parentProduct = res.body;
  });
  it('it should be able to create measurement ', async () => {
    const res = await request
      .post(`/${version}/Measurement/`)
      .set({ Authorization: adminToken.accessToken })
      .send({ name: 'lt', slug: 'lt' })
      .expect(200);
    measurement = res.body;
  });
  it('it should be able to create product ', async () => {
    productData.parentProduct = parentProduct._id;
    productData.measuringUnit = measurement._id;
    const res = await request
      .post(`/${version}/Product/`)
      .set({ Authorization: adminToken.accessToken })
      .send(productData)
      .expect(200);
    product = res.body;
  });

  it('Admin should be able to add discount ', async () => {
    const data = {
      name: 'First Discount For Order',
      categoryIds: parentProduct.category,
      productIds: [product._id],
      percentage: 50,
      activatedAt: moment().subtract(1, 'day'),
      expiredAt: moment().add(2, 'day')
    };
    const res = await request
      .post(`/${version}/Discount/`)
      .set({ Authorization: adminToken.accessToken })
      .send(data)
      .expect(200);
    discount = res.body;
  });
  it('Admin Should be able to add promo code', async () => {
    const res = await request
      .post(`/${version}/PromoCode`)
      .set({ Authorization: adminToken.accessToken })
      .send({
        name: 'First Promo Code For Order',
        percentage: 30,
        maxDiscount: 3000,
        activatedAt: moment(),
        expiredAt: moment().add(2, 'hour'),
        minAmount: 5000
      })
      .expect(200);
    promo = res.body;
  });
  it('Admin should be able to add discount ', async () => {
    const data = {
      name: 'First Discount For Order',
      subCategoryIds: parentProduct.subCategory,
      amount: 300,
      activatedAt: moment().subtract(1, 'day'),
      expiredAt: moment().add(2, 'day')
    };
    const res = await request
      .post(`/${version}/Discount/`)
      .set({ Authorization: adminToken.accessToken })
      .send(data)
      .expect(200);
    discount = res.body;
  });

  it('Admin should be able to add discount ', async () => {
    const data = {
      name: 'First Discount For Order',
      productIds: [product._id],
      amount: 200,
      activatedAt: moment().subtract(1, 'day'),
      expiredAt: moment().add(2, 'day')
    };
    await request
      .post(`/${version}/Discount/`)
      .set({ Authorization: adminToken.accessToken })
      .send(data)
      .expect(200);
  });

  it('it should be able to add product in cart', async () => {
    await request
      .post(`/${version}/Cart/`)
      .set({ Authorization: token.accessToken })
      .send({ productId: product._id, quantity: 10, packagingSize: 10 })
      .expect(200);
  });
  it('it should be able to get cart', async () => {
    const res = await request
      .get(`/${version}/Cart/?promoCodeCoupon=${promo.name}`)
      .set({ Authorization: token.accessToken })
      .expect(200);
    cartId = res.body.data.cart[0]._id;
    expect(res.body.data.cart.length).to.be.equal(1);
  });
  it('Only quantity should increase if user tried to add same product in cart', async () => {
    const res = await request
      .post(`/${version}/Cart/`)
      .set({ Authorization: token.accessToken })
      .send({ productId: product._id, quantity: 1, packagingSize: 10 })
      .expect(200);
    expect(res.body._id).to.be.equal(cartId);
  });
  it('Only quantity should increase if user tried to add same product in cart', async () => {
    await request
      .delete(`/${version}/Cart/${product._id}?quantity=5&packagingSize=10`)
      .set({ Authorization: token.accessToken })
      .expect(200);
  });
  it('it should be able to create order', async () => {
    const member = await memberFacade.findOne({ _id: token.memberId });
    await request
      .post(`/${version}/Order?addressId=${member.address[0]._id}&promoCodeCoupon=${promo.name}`)
      .set({ Authorization: token.accessToken })
      .expect(200);
  });
  it('it should be able to get orders', async () => {
    const res = await request
      .get(`/${version}/Order/`)
      .set({ Authorization: token.accessToken })
      .expect(200);
    order = res.body[0];
  });
  it('stockist should not be able to update his orders if his account is not activated yet', async () => {
    order.items[0].isAccepted = false;
    await request
      .put(`/${version}/Order/${order._id}`)
      .send({ items: order.items })
      .set({ Authorization: stockistToken.accessToken })
      .expect(403);
  });
  it('Admin should be able to approve stockist account', async () => {
    await request
      .post(`/${version}/Member/Approve/${stockistToken.memberId}`)
      .set({ Authorization: adminToken.accessToken })
      .expect(200);
  });
  it('stockist should be able to update his orders', async () => {
    order.items[0].isAccepted = true;
    await request
      .put(`/${version}/Order/${order._id}`)
      .send({ items: order.items })
      .set({ Authorization: stockistToken.accessToken })
      .expect(200);
  });
  it('retailer should not be able to confirm his order until stockist have not accepted this', async () => {
    order.items[0].isAccepted = false;
    await request
      .put(`/${version}/Order/Confirm/${order._id}`)
      .set({ Authorization: token.accessToken })
      .send({ status: 'CONFIRMED' })
      .expect(403);
  });
  it('stockist should be able to accepted his order', async () => {
    await request
      .put(`/${version}/Order/Accept/${order._id}`)
      .set({ Authorization: stockistToken.accessToken })
      .expect(200);
  });
  it('retailer should be able to confirm his order once stockist have accepted this', async () => {
    order.items[0].isAccepted = false;
    await request
      .put(`/${version}/Order/Confirm/${order._id}`)
      .set({ Authorization: token.accessToken })
      .send({ status: 'CONFIRMED' })
      .expect(200);
  });
  it('once retailer confirmed the order stockist should not be able to accepted his order', async () => {
    await request
      .put(`/${version}/Order/Accept/${order._id}`)
      .set({ Authorization: stockistToken.accessToken })
      .expect(403);
  });
  it('it should be able to again add product in cart', async () => {
    await request
      .post(`/${version}/Cart/`)
      .set({ Authorization: token.accessToken })
      .send({ productId: product._id, quantity: 1, packagingSize: 10 })
      .expect(200);
  });
  it('it should be able to create order', async () => {
    const member = await memberFacade.findOne({ _id: token.memberId });
    await request
      .post(`/${version}/Order?addressId=${member.address[0]._id}`)
      .set({ Authorization: token.accessToken })
      .expect(200);
  });
  it('Admin should not be able to approve bill if bill is not uploaded', async () => {
    await request
      .put(`/${version}/Order/ApproveBill/${order._id}`)
      .set({ Authorization: adminToken.accessToken })
      .expect(400);
  });
  it('retailer should be able to upload his bill', async () => {
    await request
      .put(`/${version}/Order/UploadBill/${order._id}`)
      .set({ Authorization: stockistToken.accessToken })
      .send({ bill: 'https://hackbuddy.in' })
      .expect(200);
  });
  it('Admin should not be able to approve bill', async () => {
    await request
      .put(`/${version}/Order/ApproveBill/${order._id}`)
      .set({ Authorization: adminToken.accessToken })
      .expect(200);
  });
  it('it should be able to get past orders', async () => {
    await request
      .get(`/${version}/Order/PastOrders`)
      .set({ Authorization: token.accessToken })
      .expect(200);
  });
  it('it should be able to get order by id', async () => {
    await request
      .get(`/${version}/Order/${order._id}`)
      .set({ Authorization: token.accessToken })
      .expect(200);
  });
  it('Admin should be able to get order by stockist id', async () => {
    const res = await request
      .get(`/${version}/Order/GetById/${stockistToken.memberId}?role=stockist&type=CURRENT`)
      .set({ Authorization: adminToken.accessToken })
      .expect(200);
    expect(res.body.data.length).to.to.equal(2);
  });
  it('Admin should be able to get order by retailer id', async () => {
    const res = await request
      .get(`/${version}/Order/GetById/${token.memberId}?role=retailer&type=CURRENT`)
      .set({ Authorization: adminToken.accessToken })
      .expect(200);
    expect(res.body.data.length).to.to.equal(2);
  });
  it('Admin should not be able to get order by stockist id with stockist name search', async () => {
    const res = await request
      .get(`/${version}/Order/GetById/${token.memberId}?role=retailer&type=CURRENT&search=CONFIRMED`)
      .set({ Authorization: adminToken.accessToken })
      .expect(200);
    expect(res.body.data.length).to.to.equal(0);
  });
  it('Admin should be able to get order by stockist id with stockist name search', async () => {
    const res = await request
      .get(`/${version}/Order/GetById/${token.memberId}?role=retailer&type=CURRENT&search=SE`)
      .set({ Authorization: adminToken.accessToken })
      .expect(200);
    expect(res.body.data.length).to.to.equal(2);
  });
  it('Admin should be able to get order for card', async () => {
    await request
      .get(`/${version}/Order/Admin/GetByCard?role=retailer&search=SE`)
      .set({ Authorization: adminToken.accessToken })
      .expect(200);
    // expect(res.body.data.length).to.to.equal(2);
  });
  it('Admin should be able to get order for card on one status', async () => {
    await request
      .get(`/${version}/Order/Admin/GetByCard?role=retailer&status=PLACED`)
      .set({ Authorization: adminToken.accessToken })
      .expect(200);
  });
});

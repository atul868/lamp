const { expect } = require('chai');
const moment = require('moment-timezone').tz.setDefault('Asia/Calcutta|Asia/Kolkata');
const config = require('config');
const version = config.get('version');
let adminToken;

const promoCodeData = {
  name: 'First Promo Code',
  amount: 100,
  activatedAt: moment(),
  expiredAt: moment().add(2, 'hour'),
  minAmount: 50
};
let promo;
describe('PROMO_CODE', () => {
  before(async () => {
    const memberFacade = require('../../models/member/facade');
    const member = await memberFacade.findOne({ _id: pMember._id });
    adminToken = await member.createAccessToken();
  });

  it('Admin Should be able to add promo code', async () => {
    const res = await request
      .post(`/${version}/PromoCode`)
      .set({ Authorization: adminToken.accessToken })
      .send(promoCodeData)
      .expect(200);
    promo = res.body;
  });
  it('Admin Should be able to add promo code', async () => {
    promoCodeData.expiredAt = moment().subtract(1, 'hour');
    await request
      .post(`/${version}/PromoCode`)
      .set({ Authorization: adminToken.accessToken })
      .send(promoCodeData)
      .expect(400);
  });
  it('Admin Should be able to add promo code', async () => {
    promoCodeData.expiredAt = moment().add(4, 'hour');
    promoCodeData.activatedAt = moment().subtract(4, 'hour');
    await request
      .post(`/${version}/PromoCode`)
      .set({ Authorization: adminToken.accessToken })
      .send(promoCodeData)
      .expect(400);
  });
  it('Admin Should be able to add another promo code', async () => {
    promoCodeData.expiredAt = moment().add(4, 'days');
    promoCodeData.activatedAt = moment().add(6, 'hour');
    delete promoCodeData.amount;
    promoCodeData.percentage = 30;
    promoCodeData.maxDiscount = 300;
    promoCodeData.name = 'Second Promo Code With Percentage';
    await request
      .post(`/${version}/PromoCode`)
      .set({ Authorization: adminToken.accessToken })
      .send(promoCodeData)
      .expect(200);
  });
  it('Admin Should not be able to add percentage promo code without max discount', async () => {
    delete promoCodeData.maxDiscount;
    promoCodeData.name = 'Second Promo Code With Percentage';
    await request
      .post(`/${version}/PromoCode`)
      .set({ Authorization: adminToken.accessToken })
      .send(promoCodeData)
      .expect(400);
  });
  it('Admin Should be able to add promo code', async () => {
    await request
      .get(`/${version}/PromoCode`)
      .set({ Authorization: adminToken.accessToken })
      .send(promoCodeData)
      .expect(200);
  });
  it('Admin Should be able to update promo code', async () => {
    await request
      .put(`/${version}/PromoCode/${promo._id}`)
      .set({ Authorization: adminToken.accessToken })
      .send({ name: 'First Promo Code Updated' })
      .expect(200);
  });
  it('Admin Should be able to get promo code by id', async () => {
    await request
      .get(`/${version}/PromoCode/${promo._id}`)
      .set({ Authorization: adminToken.accessToken })
      .send({ name: 'First Promo Code Updated' })
      .expect(200);
  });
  it('Admin Should be able to check name availability promo code by id', async () => {
    const res = await request
      .get(`/${version}/PromoCode/Check/NameAvailability?promoCodeId=${promo._id}`)
      .set({ Authorization: adminToken.accessToken })
      .expect(200);
    expect(res.body.message).to.be.equal('Available');
  });
});

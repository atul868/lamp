/* eslint-disable global-require */
const config = require('config');
const version = config.get('version');

let token;
const data = {
  name: 'Nikhil',
  email: 'nikhilmisra63+1@gmail.com',
  emailStatus: 'verified',
  phone: 8931097382,
  otp: 1234567,
  token: '123456789sdfgh',
  role: 'mr',
  createdAt: new Date(),
  updatedAt: new Date()
};
let member;
let adminToken;
let memberFacade;
let otp;
let mr;

describe('MEMBER', () => {
  before(async () => {
    const memberFacade = require('../../models/member/facade');
    const member = await memberFacade.findOne({ _id: pMember._id });
    adminToken = await member.createAccessToken();
  });
  it('Should be able to signUp', async () => {
    const res = await request
      .post(`/${version}/Member`)
      .send(data)
      .expect(200);
    mr = res.body;
  });
  it('Should not be able to signUp with same phone number', async () => {
    data.email = 'nikhilmisra63+4@gmail.com';
    await request
      .post(`/${version}/Member`)
      .send(data)
      .expect(400);
  });
  it('it should not be able to login account if email is not verify', async () => {
    await request
      .post(`/${version}/Member/Login`)
      .send({
        email: 'nikhilmisra63+1@gmail.com',
        password: 'zxcvbnms',
        deviceType: 'web'
      })
      .expect(403);
  });
  it('Should be able to verify email', async () => {
    memberFacade = require('../../models/member/facade');
    member = await memberFacade.findOne({ email: 'nikhilmisra63+1@gmail.com' });
    await request
      .post(`/${version}/Member/VerifyEmail`)
      .send({ token: member.token, memberId: member._id })
      .expect(200);
  });
  it('Should be able to resend phone otp', async () => {
    await request
      .post(`/${version}/Member/ResendVerifyNumber`)
      .send({ phone: '8931097382' })
      .expect(200);
  });
  it('Member should not be able to login with invalid otp', async () => {
    await request
      .post(`/${version}/Member/UserLogin`)
      .send({
        phone: '8931097382',
        otp: 123456789
      })
      .expect(401);
  });
  it('it should be able to login account', async () => {
    member = await memberFacade.findOne({ email: 'nikhilmisra63+1@gmail.com' });
    const res = await request
      .post(`/${version}/Member/UserLogin`)
      .send({
        phone: '8931097382',
        otp: member.otp
      })
      .expect(200);
    token = res.body;
  });
  it('Mr should be able to create retailer', async () => {
    await request
      .post(`/${version}/Member/Mr/Retailer`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .send({
        name: 'Nikhil',
        email: 'nikhilmisra63+10@gmail.com',
        emailStatus: 'verified',
        phone: 8931097398
      })
      .expect(200);
  });
  it('Mr should be able to create retailer', async () => {
    await request
      .get(`/${version}/Member/Mr/Retailer`)
      .set({ Authorization: token.accessToken })
      .expect(200);
  });
  it('it should be able to get your own profile ', async () => {
    await request
      .get(`/${version}/Member/`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(200);
  });
  it('Should be able to send forgot password email', async () => {
    await request
      .put(`/${version}/Member/ForgotPassword`)
      .send({ email: 'nikhilmisra63+1@gmail.com' })
      .expect(200);
  });
  it('Should be able to Reset password', async () => {
    member = await memberFacade.findOne({ email: 'nikhilmisra63+1@gmail.com' });
    await request
      .put(`/${version}/Member/ResetPassword`)
      .send({ password: '1234567890', token: member.token, memberId: member._id })
      .expect(200);
  });
  it('it should be able to login account with new password', async () => {
    const res = await request
      .post(`/${version}/Member/Login`)
      .send({
        email: 'nikhilmisra63+1@gmail.com',
        password: '1234567890',
        deviceType: 'web'
      })
      .expect(200);
    token = res.body;
  });

  it('it should be able to Change Password', async () => {
    await request
      .put(`/${version}/Member/ChangePassword`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .send({ oldPassword: '1234567890', newPassword: 'zxcvbnmss' })
      .expect(200);
  });

  it('it should be able to get your own profile ', async () => {
    await request
      .get(`/${version}/Member/`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .expect(200);
  });

  it('Should be able to update profile', async () => {
    data.name = 'Nik';
    data.gst = '12345679';
    data.gstDoc = 'https://hackbuddy.in';
    await request
      .put(`/${version}/Member`)
      .set('Accept', 'application/json')
      .set({ Authorization: token.accessToken, id: token.memberId })
      .send(data)
      .expect(200);
  });
  it('Normal User should be able to get login otp with phone number', async () => {
    const res = await request.get(`/${version}/Member/User/Get/Otp?phone=${member.phone}`).expect(200);
    ({ otp } = res.body);
  });
  it('Normal User should be able to login with phone number', async () => {
    await request
      .post(`/${version}/Member/UserLogin`)
      .send({ phone: member.phone, otp })
      .expect(200);
  });
  it('Account can not be verified if user does not have any address', async () => {
    await request
      .post(`/${version}/Member/Approve/${mr._id}`)
      .set({ Authorization: adminToken.accessToken })
      .expect(403);
  });
  it('Normal User should be able to add address', async () => {
    await request
      .post(`/${version}/Member/Address`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .send({
        location: { type: 'Point', coordinates: [76.717873, 30.704649] },
        city: 'CHD',
        state: 'CHD',
        pincode: 140603,
        line1: 'Sec 43',
        line2: 'Near Dominos',
        isPrimary: true
      })
      .expect(200);
  });
  it('Admin should be able to approve mr account', async () => {
    await request
      .post(`/${version}/Member/Approve/${mr._id}`)
      .set({ Authorization: adminToken.accessToken })
      .expect(200);
  });
  it('Normal User should be able to add more than one address', async () => {
    await request
      .post(`/${version}/Member/Address`)
      .set({ Authorization: token.accessToken, id: token.memberId })
      .send({
        location: { type: 'Point', coordinates: [76.717873, 30.704649] },
        city: 'CHD',
        state: 'CHD',
        pincode: 140603,
        line1: 'Sec 43',
        line2: 'Near Dominos',
        isPrimary: true
      })
      .expect(200);
  });
  it('Admin should be able to enable or disable all member', async () => {
    await request
      .post(`/${version}/Member/Admin/DisableOrEnable`)
      .set({ Authorization: adminToken.accessToken })
      .send({ memberId: token.memberId, action: 'disable' })
      .expect(200);
  });
  // it('User should be able to get all users ', async () => {
  //   await request
  //     .get(`/${version}/Member/Users`)
  //     .set({ Authorization: googleLoginToken.accessToken, id: googleLogintoken.memberId })
  //     .expect(200);
  // });
  // it('Should be able to logout', async () => {
  //   await request
  //     .delete(`/${version}/Member`)
  //     .set({ Authorization: token.accessToken, id: token.memberId })
  //     .expect(200);
  // });
});

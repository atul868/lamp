const _ = require('lodash');
const config = require('config');
const moment = require('moment');
const referralCodeGenerator = require('referral-code-generator');
const memberFacade = require('./facade');
const MemberModel = require('./schema');
const emailService = require('../../utils/email');
const authUtils = require('../../utils/auth');
const OrderModel = require('../order/schema');
const rolesFacade = require('../roles/facade');
const exportExcel = require('../../utils/exportExcel');
const ProductModel = require('../product/schema');
const SchemeCount = require('../scheme/schema');

const generateNUmberOtp = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

const generateReferralCode = () => {
  return referralCodeGenerator.alphaNumeric('uppercase', 2, 2);
};

class MemberController {
  // SignUp
  async signUp(req, res, next) {
    let member;
    let referredUser;
    let points;
    // let name = "HCAH";
    // let email = "demo@gmail.com"
    const role = "retailer"
    const { phone, name, email } = req.body;
    let hcah = await MemberModel.findOne({ email });
    let { referredCode } = req.body;
    let isApproved = true;
    try {
      member = await memberFacade.findOne({ phone });
    } catch (err) {
      return next(err);
    }

    if (hcah && hcah.email === email) {
      const error = new Error('Email Already exists');
      error.statusCode = 400;
      return next(error);
    }
    if (member && parseInt(member.phone, 10) === phone) {
      const error = new Error('Phone Number Already exists');
      error.statusCode = 400;
      return next(error);
    }

    if (referredCode) {
      try {
        referredUser = await MemberModel.findOne({ referralCode: referredCode });
      } catch (error) {
        return next(error);
      }
    }
    points = 100;
    if (!referredUser) {
      points = undefined;
      referredCode = undefined;
    }
    const otp = generateNUmberOtp();
    const otpExpiresAt = moment()
      .add(5, 'minute')
      .toISOString();
    const userId = await memberFacade.userId(name);
    if (role === 'retailer' || role === 'stockist') isApproved = false;
    try {
      member = await memberFacade.create({
        userId,
        name,
        email,
        phone,
        role: 'mr',
        otp,
        otpExpiresAt,
        referralCode: generateReferralCode(),
        points,
        isApproved,
        referredCode
      });
    } catch (err) {
      return next(err);
    }
    // emailService.sendVerifyMail(member);
    authUtils.sendMobileOtp(member, otp);
    res.send(member);
  }

  // Login For admin and sub-admin
  async login(req, res, next) {
    let member;
    let accessToken;

    const { email, password } = req.body;
    try {
      member = await memberFacade.findOne({ email });
    } catch (err) {
      return next(err);
    }
    if (!member) {
      const e = new Error('Email or password is incorrect');
      e.statusCode = 401;
      return next(e);
    }
    // if (!member.isDisabled) {
    //   const e = new Error('Account is currently disabled by admin');
    //   e.statusCode = 403;
    //   return next(e);
    // }
    if (member.emailStatus === 'pending') {
      const err = new Error('Please verify your email first');
      err.statusCode = 403;
      return next(err);
    }
    if (!(await authUtils.matchPassword(password, member.password))) {
      const err = new Error('Email or password is incorrect');
      err.statusCode = 401;
      return next(err);
    }

    try {
      accessToken = await member.createAccessToken();
      // res.cookie('Authorization', accessToken.accessToken, {});
      res.header['Authorization'] = accessToken.accessToken;
    } catch (err) {
      return next(err);
    }
    // res.cookie('Authorization', accessToken.accessToken, {});
    accessToken.memberId = member._id;
    accessToken.role = await rolesFacade.findOne({ _id: member.role });
    res.send(accessToken);
  }

  // Login for normal user
  async userLogin(req, res, next) {
    let member;
    let accessToken;
    const { phone, otp, deviceToken, device } = req.body;
    try {
      member = await memberFacade.findOne({ phone });
    } catch (err) {
      return next(err);
    }
    if (!member) {
      const e = new Error('Phone Number or Otp is incorrect');
      e.statusCode = 401;
      return next(e);
    }

    if (!member.role) member.role = 'retailer'
    // if (!member.isDisabled) {
    //   const e = new Error('Account is currently disabled by admin');
    //   e.statusCode = 403;
    //   return next(e);
    // }
    if (member.otp !== otp) {
      const err = new Error('Phone Number or Otp is incorrect');
      err.statusCode = 401;
      return next(err);
    }

    if (moment().isAfter(member.otpExpiresAt)) {
      const err = new Error('Otp Expired');
      err.statusCode = 401;
      return next(err);
    }

    try {
      accessToken = await member.createAccessToken();
    } catch (err) {
      return next(err);
    }

    try {
      if (deviceToken) {
        MemberModel.updateMany(
          {},
          {
            $pull: {
              deviceTokens: deviceToken
            }
          }
        );
        if (!member.deviceTokens) {
          member.deviceTokens = [];
        }
        if (member.deviceTokens.indexOf(deviceToken) === -1) {
          member.deviceTokens.push(deviceToken);
          member.devices.push(device);
          await member.save();
        }
      }
    } catch (err) {
      return next(err);
    }
    // res.cookie('Authorization', accessToken, {});
    accessToken.memberId = member._id;
    accessToken.role = await rolesFacade.findOne({ _id: member.role });
    res.send(accessToken);
  }

  // Get Otp for login this otp is only valid for 5 minutes
  async getOtp(req, res, next) {
    let member;
    const isTesting = req.query.isTesting || false;
    const { phone } = req.query;
    try {
      member = await memberFacade.findOne({ phone });
    } catch (err) {
      return next(err);
    }
    if (!member) {
      member = await MemberModel({ phone });
      await member.save();
      // const err = new Error('No Member Found');
      // err.statusCode = 404;
      // return next(err);
    }

    if (!member.role) member.role = 'retailer'
    var otp = generateNUmberOtp();
    authUtils.sendMobileOtp(member, otp);
    member.otp = otp;
    member.otpExpiresAt = moment()
      .add(5, 'minute')
      .toISOString();
    try {
      await member.save();
    } catch (err) {
      return next(err);
    }

    if (!isTesting) otp = otp;

    res.json({ otp });
  }

  // Verify Email
  async verifyEmail(req, res, next) {
    let member;
    const { token, memberId } = req.body;
    try {
      member = await memberFacade.findOne({ _id: memberId, token });
    } catch (err) {
      return next(err);
    }
    if (!member) {
      const err = new Error('No Member Found');
      err.statusCode = 404;
      return next(err);
    }
    if (member.emailStatus === 'verified') {
      const err = new Error('Email Already Verified');
      err.statusCode = 403;
      return next(err);
    }
    if (member.token !== token) {
      const err = new Error('Not a valid user');
      err.statusCode = 401;
      return next(err);
    }
    member.token = null;
    member.emailStatus = 'verified';
    try {
      await member.save();
    } catch (err) {
      return next(err);
    }
    res.json({ message: 'Email Verified Please Login' });
  }

  // Verify Email
  async verifyMobileNumber(req, res, next) {
    let member;
    const { otp, memberId } = req.body;
    try {
      member = await memberFacade.findOne({ _id: memberId });
    } catch (err) {
      return next(err);
    }
    if (!member) {
      const err = new Error('No Member Found');
      err.statusCode = 404;
      return next(err);
    }
    if (member.phoneStatus === 'verified') {
      const err = new Error('Number Already Verified');
      err.statusCode = 403;
      return next(err);
    }
    if (member.otp !== otp) {
      const err = new Error('Not a valid user');
      err.statusCode = 401;
      return next(err);
    }
    member.otp = null;
    member.phoneStatus = 'verified';
    try {
      await member.save();
    } catch (err) {
      return next(err);
    }
    res.json({ message: 'Mobile Number is Verified' });
  }

  // Resend Verify Email
  async resendVerifyEmail(req, res, next) {
    const { email } = req.body;
    let member;

    try {
      member = await memberFacade.findOne({ email });
    } catch (e) {
      return next(e);
    }

    if (!member) {
      const error = new Error('Not found');
      error.statusCode = 404;
      return next(error);
    }

    if (member.emailStatus === 'verified') {
      const error = new Error('Email already verified');
      error.statusCode = 403;
      return next(error);
    }
    emailService.sendVerifyMail(member);
    res.json({ message: 'Email successfully sent, please check your Mail' });
  }

  // Resend Verify Number
  async resendVerifyNumber(req, res, next) {
    const { phone } = req.body;
    let member;

    try {
      member = await memberFacade.findOne({ phone });
    } catch (e) {
      return next(e);
    }

    if (!member) {
      const error = new Error('Not found');
      error.statusCode = 404;
      return next(error);
    }

    if (member.phoneStatus === 'verified') {
      const error = new Error('Number is already verified');
      error.statusCode = 403;
      return next(error);
    }
    const otp = generateNUmberOtp();
    authUtils.sendMobileOtp(member, otp);
    res.json({ message: 'Otp sent to your mobile Number please check' });
  }

  // Show Profile
  async me(req, res, next) {
    let member;
    let where = { memberId: req.member._id };
    const path = [
      {
        path: 'recentlyViewed.productId',
        select: { _id: 1, name: 1, images: 1 }
      },
      {
        path: 'mr',
        select: { _id: 1, name: 1, email: 1 }
      },
      {
        path: 'stockist',
        select: { _id: 1, name: 1, email: 1 }
      }
    ];
    try {
      member = await MemberModel.findOne({ _id: req.member._id }).populate(path);
    } catch (error) {
      return next(error);
    }
    if (member.role === 'stockist') {
      where = { stockistId: req.member._id };
    }
    const data = member.toJSON();
    try {
      data.order = await OrderModel.findOne(where)
        .sort({ createdAt: -1 })
        .populate('items.productId');
    } catch (error) {
      return next(error);
    }
    res.send(data);
  }

  async deleteAddress(req, res, next) {
    let member;
    let where = { memberId: req.member._id };
    const path = [
      {
        path: 'recentlyViewed.productId',
        select: { _id: 1, name: 1, images: 1 }
      },
      {
        path: 'mr',
        select: { _id: 1, name: 1, email: 1 }
      },
      {
        path: 'stockist',
        select: { _id: 1, name: 1, email: 1 }
      }
    ];
    try {
      member = await MemberModel.updateOne({ _id: req.member._id }, { $pull: { address: { _id: req.params.id } } });
    } catch (error) {
      return next(error);
    }
    try {
      member = await MemberModel.findOne({ _id: req.member._id }).populate(path);
    } catch (error) {
      return next(error);
    }
    if (member.role === 'stockist') {
      where = { stockistId: req.member._id };
    }
    const data = member.toJSON();
    try {
      data.order = await OrderModel.findOne(where)
        .sort({ createdAt: -1 })
        .populate('items.productId');
    } catch (error) {
      return next(error);
    }
    res.send(data);

  }
  // Get Members
  async select(req, res, next) {
    let members;
    let { page, limit, sortBy } = req.query;
    const { name, role, excel } = req.query;
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
    if (role) {
      query.role = role;
    }
    try {
      members = await MemberModel.find(query)
        .select({
          password: 0
        })
        .sort(sortBy)
        .skip(skip)
        .limit(limit);
    } catch (err) {
      return next(err);
    }
    if (excel) {
      const formattedData = [];
      for (const member of members) {
        const data = {
          name: member.name,
          companyName: member.companyName,
          email: member.email,
          emailStatus: member.emailStatus,
          phone: member.phone,
          role: member.role,
          points: member.points,
          userId: member.userId
        };
        formattedData.push(data);
      }
      exportExcel(formattedData, res);
    } else {
      const dataToSend = {
        data: members
      };
      if (page === 1) {
        meta = {
          currentPage: page,
          recordsPerPage: limit,
          totalRecords: await MemberModel.find(query).count()
        };
        meta.totalPages = Math.ceil(meta.totalRecords / meta.recordsPerPage);
        dataToSend.meta = meta;
      }
      res.send(dataToSend);
    }
  }

  // Get A Member
  async getMember(req, res, next) {
    let member;
    const { MemberId } = req.params;
    try {
      member = await MemberModel.findById(MemberId).select({
        password: 0
      });
    } catch (err) {
      return next(err);
    }
    if (!member) {
      const e = new Error('Member Does Not exists');
      e.statusCode = 400;
      return next(e);
    }
    res.send(member);
  }

  // Update Profile
  async updateProfile(req, res, next) {
    const { member } = req;
    let dbMember;
    const d = {
      name: null,
      phone: null,
      email: null,
      address: null
      // gst: null,
      // licence: null,
      // gstDoc: null,
      // licenceDoc: null,
      // contactPerson: null
    };

    for (const key in d) {
      d[key] = req.body[key];
    }
    let primary = false;
    if (d.address) {
      for (const address of d.address) {
        if (!primary) {
          if (address.isPrimary) {
            primary = address.isPrimary;
          }
        } else {
          address.isPrimary = false;
        }
      }
      if (primary) {
        const user = await MemberModel.findById(member._id);
        if (user) {
          for (const address of user.address) {
            address.isPrimary = false;
          }
          await user.save();
        }
      }
    }
    const obj = _.pickBy(d, h => !_.isUndefined(h));

    try {
      dbMember = await memberFacade.findOne({
        $or: [{ email: obj.email }, { phone: obj.phone }],
        _id: { $ne: member._id }
      });
    } catch (err) {
      return next(err);
    }
    if (dbMember) {
      const e = new Error('Email Already exists');
      e.statusCode = 400;
      return next(e);
    }

    if (dbMember && dbMember.email === obj.email) {
      const error = new Error('Phone Number Already exists');
      error.statusCode = 400;
      return next(error);
    }
    if (dbMember && dbMember.phone === obj.phone) {
      const error = new Error('Phone Number Already exists');
      error.statusCode = 400;
      return next(error);
    }

    try {
      await memberFacade.update({ _id: member._id }, obj);
    } catch (err) {
      return next(err);
    }
    res.json({ message: 'Profile Updated' });
  }

  // change password
  async changePassword(req, res, next) {
    const { member } = req;
    const { oldPassword, newPassword } = req.body;

    if (!(await authUtils.matchPassword(oldPassword, member.password))) {
      const err = new Error('Wrong Password');
      err.statusCode = 403;
      return next(err);
    }
    const hashedPassword = await authUtils.hashPassword(newPassword);
    try {
      await memberFacade.update({ _id: member.id }, { password: hashedPassword });
    } catch (err) {
      return next(err);
    }
    // emailService.loginCredentials(member.email, member.username, newPassword);
    res.json({ message: 'Password Successfully Changed ' });
  }

  // Forgot Password
  async forgotPassword(req, res, next) {
    const { email } = req.body;

    let member;

    try {
      member = await memberFacade.findOne({ email });
    } catch (e) {
      return next(e);
    }

    if (!member) {
      const error = new Error('No Member Found');
      error.statusCode = 404;
      return next(error);
    }
    if (member.emailStatus === 'pending' || member.emailStatus === 'changed') {
      const error = new Error('Your email is not verified, please verify your email');
      error.statusCode = 403;
      return next(error);
    }
    emailService.sendForgotPasswordMail(member);

    res.json({
      message: 'We have send you an email. Please check it to reset your password'
    });
  }

  // Reset Password
  async resetPassword(req, res, next) {
    const { password, token, memberId } = req.body;
    let member;
    try {
      member = await memberFacade.findOne({ token, _id: memberId });
    } catch (e) {
      return next(e);
    }
    if (!member) {
      const error = new Error('No Member Found');
      error.statusCode = 404;
      return next(error);
    }
    if (member.emailStatus === 'pending' || member.emailStatus === 'changed') {
      const error = new Error('Your email is not verified, please verify your email');
      error.statusCode = 403;
      return next(error);
    }
    member.password = await authUtils.hashPassword(password);
    member.token = null;

    member.markModified('token');
    try {
      await member.save();
    } catch (e) {
      return next(e);
    }
    res.json({ message: 'Password Changed' });
  }

  async addAddress(req, res, next) {
    const d = {
      location: null,
      line1: null,
      line2: null,
      city: null,
      state: null,
      pincode: null,
      isPrimary: true,
      name: null,
      phone: null,
    };
    for (const key in d) {
      d[key] = req.body[key];
    }
    if (d.isPrimary) {
      try {
        const member = await MemberModel.findById(req.member._id);
        for (const address of member.address) {
          address.isPrimary = false;
        }
        await member.save();
      } catch (error) {
        return next(error);
      }
    }
    const obj = _.pickBy(d, h => !_.isUndefined(h));
    req.member.address.push(obj);
    try {
      await MemberModel.updateOne({ _id: req.member._id }, { address: req.member.address });
    } catch (error) {
      return next(error);
    }
    res.json({ message: 'Address Added' });
  }

  // approve retailer, stockiest, mr and distributor
  async approveMember(req, res, next) {
    const { memberId } = req.params;
    let member;
    try {
      member = await memberFacade.findOne({ _id: memberId });
    } catch (error) {
      return next(error);
    }
    if (!member) {
      const error = new Error('Member Not Found');
      error.statusCode = 404;
      return next(error);
    }
    if (member.isApproved === true) {
      const error = new Error('Already Approved');
      error.statusCode = 403;
      return next(error);
    }
    if (_.isEmpty(member.address)) {
      const error = new Error(' please add address first');
      error.statusCode = 403;
      return next(error);
    }
    const primaryAddress = _.find(member.address, a => a.isPrimary);
    const where = {
      'address.location': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [primaryAddress.location.coordinates[0], primaryAddress.location.coordinates[1]]
          },
          $maxDistance: 622.14 * 1609.34 // 100 KM in Meter
        }
      },
      role: 'mr'
    };
    if (member.role === 'retailer') {
      let nearByMr;
      let nearByStockist;
      try {
        nearByMr = await memberFacade.findOne(where, ['_id', 'role']);
      } catch (error) {
        return next(error);
      }
      try {
        where.role = 'stockist';
        nearByStockist = await memberFacade.findOne(where, ['_id', 'role']);
      } catch (error) {
        return next(error);
      }
      if (nearByMr) member.mr.push({ mrId: nearByMr._id, isPrimary: true });
      if (nearByStockist) member.stockist.push({ stockistId: nearByStockist._id, isPrimary: true });
    } else if (member.role === 'stockist') {
      let nearByMr;
      try {
        nearByMr = await memberFacade.findOne(where, ['_id', 'role']);
      } catch (error) {
        return next(error);
      }
      if (nearByMr) member.mr.push({ mrId: nearByMr._id, isPrimary: true });
    }
    member.isApproved = true;
    try {
      await member.save();
    } catch (error) {
      return next(error);
    }
    res.json({ message: 'Approved' });
  }

  async logout(req, res, next) {
    const { deviceToken } = req.body;
    const { memberId } = req.params;
    try {
      await MemberModel.updateOne(
        {
          _id: memberId
        },
        {
          $pull: {
            deviceTokens: deviceToken
          }
        }
      );
    } catch (err) {
      return next(err);
    }
    res.json({ message: 'Logged Out' });
  }

  // disable or enable member
  async disableOrEnable(req, res, next) {
    let member = null;
    const { memberId, action } = req.body;
    let message;
    let disable = false;

    try {
      member = await memberFacade.findOne({ _id: memberId });
    } catch (err) {
      return next(err);
    }
    if (!member) {
      const err = new Error('Member Not Found');
      err.statusCode = 404;
      return next(err);
    }
    if (action === 'disable' && member.isDisabled === true) {
      message = 'member already disabled';
    } else if (action === 'enable' && member.isDisabled === false) {
      message = 'member already enabled';
    } else {
      if (action === 'disable') {
        disable = true;
        message = 'member disabled';
      } else {
        message = 'member enabled';
      }
      member.isDisabled = disable;
      try {
        await member.save();
      } catch (err) {
        return next(err);
      }
    }
    res.json({ message });
  }

  // create retailer
  async createRetailer(req, res, next) {
    let member;
    let referredUser;
    let points;
    const { name, email, phone } = req.body;
    let { referredCode } = req.body;
    try {
      member = await memberFacade.findOne({ $or: [{ email }, { phone }] });
    } catch (err) {
      return next(err);
    }

    if (member && member.email === email) {
      const error = new Error('Email Already exists');
      error.statusCode = 400;
      return next(error);
    }
    if (member && parseInt(member.phone, 10) === phone) {
      const error = new Error('Phone Number Already exists');
      error.statusCode = 400;
      return next(error);
    }

    if (referredCode) {
      try {
        referredUser = await MemberModel.findOne({ referralCode: referredCode });
      } catch (error) {
        return next(error);
      }
    }
    points = 100;
    if (!referredUser) {
      points = undefined;
      referredCode = undefined;
    }
    const otp = generateNUmberOtp();
    const otpExpiresAt = moment()
      .add(5, 'minute')
      .toISOString();
    const userId = await memberFacade.userId(name);
    try {
      member = await memberFacade.create({
        userId,
        name,
        email,
        phone,
        role: 'retailer',
        otp,
        otpExpiresAt,
        referralCode: generateReferralCode(),
        points,
        mr: [{ mrId: req.member._id, isPrimary: true }],
        referredCode,
        emailStatus: 'verified'
      });
    } catch (err) {
      return next(err);
    }
    // emailService.sendVerifyMail(member);
    // authUtils.sendMobileOtp(member, otp);
    res.send(member);
  }

  // get own retailer
  async getRetailer(req, res, next) {
    let retailers;
    try {
      retailers = await MemberModel.find({
        'mr.mrId': req.member._id,
        role: 'retailer'
      });
    } catch (err) {
      return next(err);
    }
    res.send(retailers);
  }

  // dashboard data
  async dashBoard(req, res, next) {
    let retailerCount;
    let mrCount;
    let productCount;
    let schemeCount;
    let { startDate, endDate } = req.query;
    if ((startDate && !endDate) || (!startDate && endDate)) {
      const error = new Error('Bad Request invalid request');
      error.statusCode = 400;
      return next(error);
    }
    if (!startDate) {
      startDate = moment().startOf('year');
      endDate = moment().endOf('year');
    } else {
      startDate = moment(startDate);
      endDate = moment(endDate);
    }
    try {
      retailerCount = await MemberModel.countDocuments({
        role: 'retailer',
        createdAt: { $gte: startDate.toDate(), $lt: endDate.toDate() }
      });
    } catch (error) {
      return next(error);
    }

    try {
      mrCount = await MemberModel.countDocuments({
        role: 'mr',
        createdAt: { $gte: startDate.toDate(), $lt: endDate.toDate() }
      });
    } catch (error) {
      return next(error);
    }
    try {
      productCount = await ProductModel.countDocuments({
        createdAt: { $gte: startDate.toDate(), $lt: endDate.toDate() }
      });
    } catch (error) {
      return next(error);
    }
    try {
      schemeCount = await SchemeCount.countDocuments({
        createdAt: { $gte: startDate.toDate(), $lt: endDate.toDate() }
      });
    } catch (error) {
      return next(error);
    }
    res.json({ retailerCount, mrCount, productCount, schemeCount });
  }

  // dashboard graph
  async graph(req, res, next) {
    let retailerCount;
    let { startDate, endDate } = req.query;
    if ((startDate && !endDate) || (!startDate && endDate)) {
      const error = new Error('Bad Request invalid request');
      error.statusCode = 400;
      return next(error);
    }
    if (!startDate) {
      startDate = moment().startOf('year');
      endDate = moment().endOf('year');
    } else {
      startDate = moment(startDate);
      endDate = moment(endDate);
    }
    const query = [
      {
        $match: {
          isDeleted: false,
          role: 'retailer',
          createdAt: {
            $gte: startDate.toDate(),
            $lt: endDate.toDate()
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%d-%m-%Y', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      }
    ];
    try {
      retailerCount = await MemberModel.aggregate(query);
    } catch (error) {
      return next(error);
    }

    res.json({ retailerCount });
  }

  // customer signup
  /*
  Take email,firstName,lastName,password,confirmPassword
  1. check if email already exists
  2. check if password and confirmPassword are same
  3. create user
  4. send email verification link
  5. send mobile otp
  6. send response to user access token and user details
  */
  async customerSignUp(req, res, next) {
    try {
      const { email, firstName, lastName, password, confirmPassword } = req.body;
      const member = await memberFacade.findOne
        ({ email });
      if (member) {
        const error = new Error('Email Already exists');
        error.statusCode = 400;
        return next(error);
      }
      if (password !== confirmPassword) {
        const error = new Error('Password and Confirm Password are not same');
        error.statusCode = 400;
        return next(error);
      }
      const otp = generateNUmberOtp();
      const otpExpiresAt = moment()
        .add(5, 'minute')
        .toISOString();
      const userId = await memberFacade.userId(`${firstName} ${lastName}`);
      let newMember = await memberFacade.create({
        userId,
        email,
        name: `${firstName} ${lastName}`,
        phone: '',
        role: 'customer',
        otp,
        password: await authUtils.hashPassword(password),
        otpExpiresAt,
        referralCode: generateReferralCode(),
        points: 0,
        isApproved: false,
        referredCode: '',
      });
      const criteriaForJWT = {
        _id: userId,
        date: new Date()
      };
      const token = authUtils.generateAuthToken(criteriaForJWT);
      const response = {
        token,
        user: newMember
      }

      //emailService.sendVerifyMail(newMember);
      //authUtils.sendMobileOtp(newMember, otp);
      res.json(response);
    } catch (error) {
      return next(error);
    }
  }

  // customer login
  /*
  Take email,password
  1. check if email exists
  2. check if password is correct
  3. send response to user access token and user details 
  */

  async customerLogin(req, res, next) {
    try {

      const { email, password } = req.body;
      const member = await memberFacade.findOne
        ({ email });
      if (!member) {
        const error = new Error('Email does not exists');
        error.statusCode = 400;
        return next(error);
      }
      if (!(await authUtils.matchPassword(password, member.password))) {
        const err = new Error('Email or password is incorrect');
        err.statusCode = 401;
        return next(err);
      }
      const criteriaForJWT = {
        _id: member.userId,
        date: new Date()
      };
      const token = authUtils.generateAuthToken(criteriaForJWT);
      const response = {
        token,
        user: member
      }
      res.json(response);

    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new MemberController(memberFacade);

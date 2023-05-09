const mongoose = require('mongoose');
const config = require('config');
const Promise = require('bluebird');
const authUtils = require('../utils/auth');
const defaultAdmins = [
  {
    name: 'Nikhil',
    email: 'nikhilmisra63@gmail.com',
    emailStatus: 'verified',
    phone: '+918931097382',
    password: 'qwertyuiop',
    otp: 1234567,
    token: '123456789sdfgh',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

module.exports = app =>
  new Promise(async (resolve, reject) => {
    console.log('Boot script - Starting initdb');
    try {
      await mongoose.connect(config.get('dbUri'), {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: true
      });
    } catch (error) {
      reject(error);
    }
    console.log('Boot script - initializing default_admin');
    // eslint-disable-next-line global-require
    const memberFacade = require('../models/member/facade');

    for (const defaultAdmin of defaultAdmins) {
      defaultAdmin.password = await authUtils.hashPassword(defaultAdmin.password);
      try {
        const alreadyExistEngineer = await memberFacade.findOne({ email: defaultAdmin.email }, {}, {});
        if (alreadyExistEngineer) continue;
      } catch (e) {
        return reject(e);
      }
      try {
        await memberFacade.create(defaultAdmin);
      } catch (e) {
        return reject(e);
      }
    }
    console.log('Boot script - resolving init db');

    resolve();
  });

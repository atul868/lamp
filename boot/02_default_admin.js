const authUtils = require('../utils/auth');
const defaultAdmins = [
  {
    name: 'Nikhil',
    email: 'nikhilmisra63@gmail.com',
    emailStatus: 'verified',
    contactNumber: '8931097382',
    password: 'qwertyuiop',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Jatin',
    email: 'jatinmotwani77@gmail.com',
    emailStatus: 'verified',
    phone: '+914578857498',
    password: 'itsgreat',
    otp: 1234567,
    token: '123456789sdfgh',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Raj',
    email: 'raj@gmail.com',
    emailStatus: 'verified',
    phone: '+914578857498',
    password: 'itsgreat',
    otp: 1234567,
    token: '123456789sdfgh',
    role: 'retailer',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Prakhar',
    email: 'prakhar@kilobytetech.com',
    emailStatus: 'verified',
    phone: '7895210001',
    password: 'qwertyuiop',
    otp: 1234567,
    token: '123456789sdfgh',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

/* eslint global-require: 0 */
module.exports = app =>
  new Promise(async (resolve, reject) => {
    console.log('Boot script - initialising default_admin');
    const userFacade = require('../models/member/facade');

    for (const defaultAdmin of defaultAdmins) {
      defaultAdmin.password = await authUtils.hashPassword(defaultAdmin.password);
      try {
        const alreadyExistEngineer = await userFacade.findOne({ email: defaultAdmin.email });
        if (alreadyExistEngineer) continue;
      } catch (e) {
        return reject(e);
      }
      try {
        await userFacade.create(defaultAdmin);
      } catch (e) {
        return reject(e);
      }
    }
    resolve();
  });

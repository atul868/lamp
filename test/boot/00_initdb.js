/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable no-await-in-loop */
const mongoose = require('mongoose');
const Promise = require('bluebird');
const config = require('config');
const authUtils = require('../../utils/auth');
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
    location: { type: 'Point', coordinates: [76.717873, 30.704649] },
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
    location: { type: 'Point', coordinates: [76.717873, 30.704649] },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];
module.exports = app =>
  new Promise(async (resolve, reject) => {
    console.log('Testing Boot script - Starting initdb');
    const dropCollection = async () => {
      for (const collection in mongoose.connection.collections) {
        mongoose.connection.collections[collection].remove();
      }
    };
    const createCollection = async () => {
      await mongoose.connect(
        config.get('dbUri'),
        {
          useNewUrlParser: true,
          useUnifiedTopology: true
        },
        async (err, db) => {
          if (!err) console.log(err);
          await dropCollection();
          console.log('Mongoose Connected with testing');
          const memberFacade = require('../../models/member/facade');

          for (const defaultAdmin of defaultAdmins) {
            defaultAdmin.password = await authUtils.hashPassword(defaultAdmin.password);
            try {
              const alreadyExistEngineer = await memberFacade.findOne({
                email: defaultAdmin.email
              });
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
        }
      );
    };
    await createCollection();

    console.log('Testing Boot script - Resolving init db');
    resolve();
  });

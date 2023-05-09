const Promise = require('bluebird');
const config = require('config');
const _ = require('lodash');
const axios = require('axios');
const bcrypt = Promise.promisifyAll(require('bcrypt'));
const jwt = require('jsonwebtoken');
const token = config.get('jwtBearer');

module.exports = {
  hashPassword: password =>
    new Promise(async (resolve, reject) => {
      try {
        await bcrypt.hash(password, 10, (err, hash) => {
          if (err) {
            reject(err);
          } else {
            resolve(hash);
          }
        });
      } catch (e) {
        reject(e);
      }
    }),
  matchPassword: (plain, password) =>
    new Promise(async (resolve, reject) => {
      if (password && plain) {
        const isMatch = bcrypt.compareAsync(plain, password);
        resolve(isMatch);
      } else {
        resolve(false);
      }
    }),
  fileFilterImage: (req, file, cb) => {
    if (_.includes(config.get('allowedImagesTypes'), file.mimetype)) return cb(null, true);
    req.mimeError = true;
    cb(null, false);
  },
  fileFilterVideo: (req, file, cb) => {
    if (_.includes(config.get('allowedVideoTypes'), file.mimetype)) return cb(null, true);
    req.mimeError = true;
    cb(null, false);
  },
  generateAuthToken: criteriaForJwt => {
    return jwt.sign(criteriaForJwt, config.get('jwtSecret'));
  },
  verifyToken: token => {
    return jwt.verify(token, config.jwtSecret);
  },
  sendMobileOtp: (member, otp) =>
    new Promise(async (resolve, reject) => {
      if (!member.phone) return resolve();
      if (config.get('isTesting')) return resolve();
      console.log('*** Sending Otp to ', member.phone)

      const config1 = {
          headers: { Authorization: `Bearer ${token}` }
      };
      
      const bodyParameters = {
        number: member.phone,
        sms_id: 37,
        data: [otp]
      };
      
      axios.post( 
        'https://msg.hcah.in/api/v1/client/sms',
        bodyParameters,
        config1
      )
        .then(function(response) {
          console.log(JSON.stringify(response.data));
        })
        .catch(function(error) {
          console.log(error);
        });

      // const res = await axios({
      //   number: member.phone,
      //   sms_id: 37,
      //   method: 'post',
      //   url: 'https://msg.hcah.in/api/v1/client/sms',
      //   data: [ otp ],
      //   config1: {headers: { Authorization: `Bearer ${token}` }}
      // });
      //console.log(res.data);
      // return resolve();
    }),
  findByToken: token => jwt.verify(token, config.jwtSecret)
};

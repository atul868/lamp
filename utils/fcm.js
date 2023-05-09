const FCM = require('fcm-node');
const config = require('config');
const fcm = new FCM(config.get('fcm').key);

const sendNotification = async data => {
  return new Promise((resolve, reject) => {
    fcm.send(data, function(err, response) {
      if (err) {
        // console.log("Something has gone wrong!");
        err = JSON.parse(err);
        err.multicast_id = err.multicast_id.toString();
        return reject(err);
      }
      response = JSON.parse(response);
      response.multicast_id = response.multicast_id.toString();
      return resolve(response);
    });
  });
};

module.exports = {
  sendNotification
};

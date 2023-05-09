const AWS = require('aws-sdk');
const Promise = require('bluebird');
const S3FS = require('s3fs');
const config = require('config');
const fs = Promise.promisifyAll(require('fs'));

AWS.config.update(config.get('awsConfig'));
const s3Client = new AWS.S3();
const Bucket = config.get('s3Bucket');
let s3fs = new S3FS(`${Bucket}/reports`, AWS.config);
s3fs = Promise.promisifyAll(s3fs);

module.exports = {
  getSignedUrl: Key =>
    new Promise(async (resolve, reject) => {
      const url = s3Client.getSignedUrl('getObject', {
        Bucket,
        Key,
        Expires: config.get('fileExpirySeconds')
      });
      return resolve(url);
    }),
  unlink: async file => {
    await s3fs.unlinkAsync(file);
  },
  getData: async Key =>
    new Promise(async (resolve, reject) => {
      const params = { Bucket, Key };
      s3Client.getObject(params, function(err, data) {
        if (err) reject(err, err.stack);
        return resolve(data.Body);
      });
    }),

  downloadFiles: async (prefix, fileName) => {
    return new Promise((resolve, reject) => {
      const destPath = `./temp/${fileName}`;
      const params = { Bucket, Key: `${prefix}/${fileName}` };
      try {
        s3Client
          .getObject(params)
          .createReadStream()
          .pipe(fs.createWriteStream(destPath))
          .on('close', () => {
            resolve(destPath);
          })
          .on('error', err => {
            reject(err);
          });
      } catch (err) {
        reject(err);
      }
    });
  }
};

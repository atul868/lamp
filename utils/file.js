const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const config = require('config');
const shortid = require('shortid');
const Promise = require('bluebird');
const _ = require('lodash');
AWS.config.update(config.get('awsConfig'));
const s3Client = new AWS.S3();
const s3Bucket = config.get('s3Bucket');

const fileFilter = (req, file, cb) => {
  if (_.includes(config.get('allowedFileTypes'), file.mimetype)) return cb(null, true);
  req.mimeerror = true;
  cb(null, false);
};

const storage = multerS3({
  s3: s3Client,
  bucket: `${s3Bucket}`,
  metadata(req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key(req, file, cb) {
    const origFilename = file.originalname;
    const parts = origFilename.split('.');
    const extension = parts[parts.length - 1];
    const id = shortid.generate();
    const newFilename = `${id}.${extension}`;
    req.pictureId = id;
    cb(null, newFilename);
  }
});
const multerS3Config = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.get('maxFileSize') }
});
const uploadFile = Promise.promisify(multerS3Config.array('file', 10));

module.exports = {
  uploadFile: async (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        await uploadFile(req, res);
      } catch (error) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          error.statusCode = 422;
          return reject(error);
        }
        return reject(error);
      }
      if (_.isEmpty(req.files)) {
        const error = new Error('Missing required attribute "payload"');
        return reject(error);
      }
      if (req.mimeError) {
        const error = new Error('Invalid mime type');
        error.statusCode = 422;
        return reject(error);
      }
      resolve(req.files);
    }),
  getSignedUrl: Key => {
    const url = s3Client.getSignedUrl('getObject', {
      Bucket: s3Bucket,
      Key: Key.split(`amazonaws.com/`).pop(),
      Expires: 604800
    });
    return url;
  }
};

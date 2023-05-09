const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator/check');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const controller = require('./controller');
const validator = require('../../utils/validator');
const authenticate = require('../../policies/authenticate');
const hasAccess = require('../../policies/hasAccess');

const dir = path.resolve('./uploads');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({
  storage
});

router
  .route('/')
  .post(
    authenticate,
    hasAccess(['category.create']),
    [
      body('name')
        .exists()
        .isString()
        .withMessage('Invalid Name'),
      body('tags')
        .optional()
        .isArray()
        .withMessage('Invalid Tags'),
      body('order')
        .optional()
        .isNumeric()
        .withMessage('Invalid Order'),
      body('visible')
        .optional()
        .isBoolean()
        .withMessage('Invalid visibility'),
      validator
    ],
    (...args) => controller.create(...args)
  )
  .get(
    
    [
      query('limit')
        .optional()
        .isNumeric()
        .withMessage('Invalid Limit'),
      query('page')
        .optional()
        .isNumeric()
        .withMessage('Invalid Page'),
      query('sortBy')
        .optional()
        .isString()
        .withMessage('Invalid Sort By'),
      query('name')
        .optional()
        .isString()
        .withMessage('Invalid Name'),
      validator
    ],
    (...args) => controller.select(...args)
  );

router.route('/BulkUpload').post(upload.any(), (...args) => controller.bulkUpload(...args));

router
  .route('/:CategoryId')
  .put(
    
    [
      param('CategoryId')
        .exists()
        .withMessage('Invalid Category Id'),
      body('name')
        .optional()
        .isString()
        .withMessage('Invalid Name'),
      body('tags')
        .optional()
        .isArray()
        .withMessage('Invalid Tags'),
      body('order')
        .optional()
        .isNumeric()
        .withMessage('Invalid Order'),
      body('visible')
        .optional()
        .isBoolean()
        .withMessage('Invalid visibility'),
      validator
    ],
    (...args) => controller.edit(...args)
  )
  .get(

    [
      param('CategoryId')
        .exists()
        .withMessage('Invalid Category Id'),
      validator
    ],
    (...args) => controller.getCategory(...args)
  )
  .delete(
    authenticate,
    hasAccess(['category.delete']),
    [
      param('CategoryId')
        .exists()
        .withMessage('Invalid Category Id'),
      validator
    ],
    (...args) => controller.remove(...args)
  );

module.exports = router;

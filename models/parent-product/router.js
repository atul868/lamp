const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator/check');
const controller = require('./controller');
const validator = require('../../utils/validator');
const authenticate = require('../../policies/authenticate');
const hasAccess = require('../../policies/hasAccess');

const multer  = require('multer')

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split(".")[1];
    cb(null, `${file.fieldname}-${Date.now()}.${ext}`);
  },
});
const multerFilter = (req, file, cb) => {
  if (file.originalname.split(".")[1] === "xlsx") {
    cb(null, true);
  } else {
    cb(new Error("Not a excel File!!"), false);
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});
router
.route('/import')
.post(upload.single('excel'),
  (...args) => controller.import(...args)
);

router
  .route('/')
  .post(
    authenticate,
    hasAccess(['parent-product.create']),
    [
      body('name')
        .exists()
        .isString()
        .withMessage('Invalid Name'),
      body('spellingMistakes')
        .optional()
        .isArray()
        .withMessage('Invalid Spelling Mistakes'),
      body('competitorNames')
        .optional()
        .isArray()
        .withMessage('Invalid Competitor Names'),
      body('salts')
        .optional()
        .isArray()
        .withMessage('Invalid Salts'),
      body('category')
        .exists()
        .isArray()
        .withMessage('Invalid Category'),
      body('subCategory')
        .exists()
        .isArray()
        .withMessage('Invalid SubCategory'),
      body('primaryProduct')
        .optional()
        .isString()
        .withMessage('Invalid Primary Product'),
      body('description')
        .optional()
        .isString()
        .withMessage('Invalid Description'),
      body('products')
        .optional()
        .isArray()
        .withMessage('Invalid Products'),
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
      query('search')
        .optional()
        .isString()
        .withMessage('Invalid Search'),
      query('category')
        .optional()
        .isString()
        .withMessage('Invalid Category'),
      query('subCategory')
        .optional()
        .isString()
        .withMessage('Invalid Sub Category'),
      validator
    ],
    (...args) => controller.select(...args)
  );
// done
router
  .route('/:ParentProductId')
  .put(
    authenticate,
    hasAccess(['parent-product.update']),
    [
      param('ParentProductId')
        .exists()
        .withMessage('Invalid Parent Product Id'),
      body('name')
        .optional()
        .isString()
        .withMessage('Invalid Name'),
      body('spellingMistakes')
        .optional()
        .isArray()
        .withMessage('Invalid Spelling Mistakes'),
      body('competitorNames')
        .optional()
        .isArray()
        .withMessage('Invalid Competitor Names'),
      body('salts')
        .optional()
        .isArray()
        .withMessage('Invalid Salts'),
      body('category')
        .optional()
        .isArray()
        .withMessage('Invalid Category'),
      body('subCategory')
        .optional()
        .isArray()
        .withMessage('Invalid SubCategory'),
      body('primaryProduct')
        .optional()
        .isString()
        .withMessage('Invalid Primary Product'),
      body('description')
        .optional()
        .isString()
        .withMessage('Invalid Description'),
      body('products')
        .optional()
        .isArray()
        .withMessage('Invalid Products'),
      validator
    ],
    (...args) => controller.edit(...args)
  )
  .get(
    [
      param('ParentProductId')
        .exists()
        .withMessage('Invalid Parent Product Id'),
      validator
    ],
    (...args) => controller.getParentProduct(...args)
  )
  .delete(
    authenticate,
    hasAccess(['parent-product.delete']),
    [
      param('ParentProductId')
        .exists()
        .withMessage('Invalid Parent Product Id'),
      validator
    ],
    (...args) => controller.remove(...args)
  );


router.route('/Upload/Images').post((...args) => controller.uploadImages(...args));

module.exports = router;

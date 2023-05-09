const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator/check');
const controller = require('./controller');
const validator = require('../../utils/validator');
const authenticate = require('../../policies/authenticate');
const hasAccess = require('../../policies/hasAccess');

router
  .route('/')
  .post(
    authenticate,
    hasAccess(['product.create']),
    [
      body('name')
        .exists()
        .isString()
        .withMessage('Invalid Name'),
      body('inStockQuantity')
        .optional()
        .isNumeric()
        .withMessage('Invalid In Stock Quantity'),
      body('visible')
        .optional()
        .isBoolean()
        .withMessage('Invalid visibility'),
      body('isPrimary')
        .optional()
        .isBoolean()
        .withMessage('Invalid Value For isPrimary'),
      body('measuringUnit')
        .optional()
        .isString()
        .withMessage('Invalid Measuring Unit'),
      body('parentProduct')
        .exists()
        .isString()
        .withMessage('Invalid Parent Product'),
      body('dosageSize')
        .exists()
        .isString()
        .withMessage('Invalid Dosage Size'),
      body('description')
        .exists()
        .isString()
        .withMessage('Invalid Dosage Size'),
      body('price')
        .exists()
        .isNumeric()
        .withMessage('Invalid Price'),
      body('pieces')
        .optional()
        .isNumeric()
        .withMessage('Invalid Pieces'),
      body('packagingSize')
        .exists()
        .isArray()
        .withMessage('Invalid Packaging Size'),
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

router
  .route('/:ProductId')
  .put(
    authenticate,
    hasAccess(['product.update']),
    [
      param('ProductId')
        .exists()
        .withMessage('Invalid Product Id'),
      body('name')
        .optional()
        .isString()
        .withMessage('Invalid Name'),
      body('inStockQuantity')
        .optional()
        .isNumeric()
        .withMessage('Invalid In Stock Quantity'),
      body('visible')
        .optional()
        .isBoolean()
        .withMessage('Invalid visibility'),
      body('isPrimary')
        .optional()
        .isBoolean()
        .withMessage('Invalid Value For isPrimary'),
      body('measuringUnit')
        .optional()
        .isString()
        .withMessage('Invalid Measuring Unit'),
      body('parentProduct')
        .optional()
        .isString()
        .withMessage('Invalid Parent Product'),
      body('dosageSize')
        .optional()
        .isString()
        .withMessage('Invalid Dosage Size'),
      body('description')
        .optional()
        .isString()
        .withMessage('Invalid Dosage Size'),
      body('price')
        .optional()
        .isNumeric()
        .withMessage('Invalid Price'),
      body('pieces')
        .optional()
        .isNumeric()
        .withMessage('Invalid Pieces'),
      body('packagingSize')
        .optional()
        .isArray()
        .withMessage('Invalid Packaging Size'),
      validator
    ],
    (...args) => controller.edit(...args)
  )

  .get(
    [
      param('ProductId')
        .exists()
        .withMessage('Invalid Product Id'),
      validator
    ],
    (...args) => controller.getProduct(...args)
  )
  
  .delete(
    authenticate,
    hasAccess(['product.delete']),
    [
      param('ProductId')
        .exists()
        .withMessage('Invalid Product Id'),
      validator
    ],
    (...args) => controller.remove(...args)
  );

module.exports = router;

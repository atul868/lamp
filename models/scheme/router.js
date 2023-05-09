const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator/check');
const controller = require('./controller');
const authenticate = require('../../policies/authenticate');
const hasAccess = require('../../policies/hasAccess');
const validator = require('../../utils/validator');

router
  .route('/')
  .post(
    authenticate,
    hasAccess(['scheme.create']),
    [
      body('name')
        .exists()
        .isString()
        .withMessage('Invalid Name'),
      body('productId')
        .optional()
        .withMessage('Invalid productIds'),
      body('relatedProductId')
        .optional()
        .isString()
        .withMessage('Invalid productIds'),
      body('type')
        .optional()
        .isString()
        .withMessage('Invalid Type'),
      body('pointTimes')
        .optional()
        .isNumeric()
        .toInt()
        .withMessage('Invalid Point Times'),
      body('discountPercentage')
        .optional()
        .isNumeric()
        .toInt()
        .withMessage('Invalid discountPercentage'),
      body('discountAmount')
        .optional()
        .isNumeric()
        .toInt()
        .withMessage('Invalid discountPercentage'),
      body('requiredAmount')
        .optional()
        .isNumeric()
        .toInt()
        .withMessage('Invalid requiredAmount'),
      body('requiredQuantity')
        .optional()
        .isNumeric()
        .toInt()
        .withMessage('Invalid requiredQuantity'),
      body('additionalPoints')
        .optional()
        .isNumeric()
        .toInt()
        .withMessage('Invalid additionalPoints'),
      validator
    ],
    (...args) => controller.create(...args)
  )
  .get(
    authenticate,
    hasAccess(['scheme.read']),
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
      validator
    ],
    (...args) => controller.get(...args)
  );

router
  .route('/:SchemeId')
  .put(
    authenticate,
    hasAccess(['scheme.update']),
    [
      body('name')
        .optional()
        .isString()
        .withMessage('Invalid Name'),
      body('productId')
        .optional()
        .withMessage('Invalid productIds'),
      body('relatedProductId')
        .optional()
        .isString()
        .withMessage('Invalid productIds'),
      body('type')
        .optional()
        .isString()
        .withMessage('Invalid Type'),
      body('pointTimes')
        .optional()
        .isNumeric()
        .toInt()
        .withMessage('Invalid Point Times'),
      body('discountPercentage')
        .optional()
        .isNumeric()
        .toInt()
        .withMessage('Invalid discountPercentage'),
      body('discountAmount')
        .optional()
        .isNumeric()
        .toInt()
        .withMessage('Invalid discountPercentage'),
      body('requiredAmount')
        .optional()
        .isNumeric()
        .toInt()
        .withMessage('Invalid requiredAmount'),
      body('requiredQuantity')
        .optional()
        .isNumeric()
        .toInt()
        .withMessage('Invalid requiredQuantity'),
      body('additionalPoints')
        .optional()
        .isNumeric()
        .toInt()
        .withMessage('Invalid additionalPoints'),
      validator
    ],
    (...args) => controller.edit(...args)
  )
  .get(authenticate, hasAccess(['scheme.read']), (...args) => controller.getScheme(...args))
  .delete(authenticate, hasAccess(['scheme.delete']), (...args) => controller.remove(...args));

module.exports = router;

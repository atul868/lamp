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
    hasAccess(['promoCode.create']),
    [
      body('name')
        .exists()
        .isString()
        .withMessage('Invalid name'),
      body('amount')
        .optional()
        .isNumeric()
        .toInt()
        .withMessage('Invalid amount'),
      body('minAmount')
        .optional()
        .isNumeric()
        .toInt()
        .withMessage('Invalid minAmount'),
      body('maxDiscount')
        .optional()
        .isNumeric()
        .toInt()
        .withMessage('Invalid maxDiscount'),
      body('percentage')
        .optional()
        .isNumeric()
        .toInt()
        .withMessage('Invalid percentage'),
      body('activatedAt')
        .exists()
        .isISO8601()
        .withMessage('Invalid activatedAt'),
      body('expiredAt')
        .exists()
        .isISO8601()
        .withMessage('Invalid expiredAt'),
      validator
    ],
    (...args) => controller.create(...args)
  )
  .get(
    authenticate,
    hasAccess(['promoCode.read']),
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
  .route('/update')
  .put(
    authenticate,
    hasAccess(['promoCode.update']),
    [
      body('name')
        .optional()
        .isString()
        .withMessage('Invalid name'),
      body('amount')
        .optional()
        .isNumeric()
        .toInt()
        .withMessage('Invalid amount'),
      body('minAmount')
        .optional()
        .isNumeric()
        .toInt()
        .withMessage('Invalid minAmount'),
      body('maxDiscount')
        .optional()
        .isNumeric()
        .toInt()
        .withMessage('Invalid maxDiscount'),
      body('percentage')
        .optional()
        .isNumeric()
        .toInt()
        .withMessage('Invalid percentage'),
      body('activatedAt')
        .optional()
        .isISO8601()
        .withMessage('Invalid activatedAt'),
      body('expiredAt')
        .optional()
        .isISO8601()
        .withMessage('Invalid expiredAt'),
      validator
    ],
    (...args) => controller.update(...args)
  )
  .get(authenticate, hasAccess(['promoCode.read']), (...args) => controller.getById(...args));
// .delete(authenticate, hasAccess(['cart.delete']), (...args) => controller.emptyCart(...args));

router
  .route('/Check/NameAvailability')
  .get(authenticate, hasAccess(['promoCode.read']), (...args) => controller.checkName(...args));

module.exports = router;

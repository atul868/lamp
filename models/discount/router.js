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
    hasAccess(['discount.create']),
    [
      body('name')
        .optional()
        .isString()
        .withMessage('Invalid name'),
      body('productIds')
        .optional()
        .isArray()
        .withMessage('Invalid productId'),
      body('categoryIds')
        .optional()
        .isArray()
        .withMessage('Invalid categoryId'),
      body('subCategoryIds')
        .optional()
        .isArray()
        .withMessage('Invalid subCategoryIds'),
      body('parentProductIds')
        .optional()
        .isArray()
        .withMessage('Invalid parentProductIds'),
      body('amount')
        .optional()
        .isNumeric()
        .toInt()
        .withMessage('Invalid amount'),
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
    hasAccess(['discount.read']),
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
  .route('/:discountId')
  .post(
    authenticate,
    hasAccess(['discount.update']),
    [
      body('name')
        .optional()
        .isString()
        .withMessage('Invalid name'),
      body('productIds')
        .optional()
        .isArray()
        .withMessage('Invalid productId'),
      body('categoryIds')
        .optional()
        .isArray()
        .withMessage('Invalid categoryId'),
      body('subCategoryIds')
        .optional()
        .isArray()
        .withMessage('Invalid subCategoryIds'),
      body('parentProductIds')
        .optional()
        .isArray()
        .withMessage('Invalid parentProductIds'),
      body('amount')
        .optional()
        .isNumeric()
        .toInt()
        .withMessage('Invalid amount'),
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
  .delete(authenticate, hasAccess(['discount.delete']), (...args) => controller.delete(...args));

module.exports = router;

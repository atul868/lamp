const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator/check');
const controller = require('./controller');
const validator = require('../../utils/validator');
const authenticate = require('../../policies/authenticate');
const hasAccess = require('../../policies/hasAccess');

router
  .route('/')
  .post(
    [
      body('image')
        .exists()
        .withMessage('Invalid Slider'),
      body('order')
        .optional()
        .isNumeric()
        .withMessage('Invalid Order ID'),
      body('type')
        .exists()
        .isString()
        .withMessage('Invalid Type'),
      body('productIds')
        .optional()
        .withMessage('Invalid productId'),
      body('categoryIds')
        .optional()
        .withMessage('Invalid categoryId'),
      body('subCategoryIds')
        .optional()
        .withMessage('Invalid subCategoryIds'),
      body('parentProductIds')
        .optional()
        .withMessage('Invalid parentProductIds'),
      body('useFor')
        .optional()
        .isIn(['TOP', 'SLIDER'])
        .withMessage('Invalid User For'),
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
  .route('/:SliderId')
  .put(
    [
      body('image')
        .optional()
        .withMessage('Invalid Slider'),
      body('order')
        .optional()
        .isNumeric()
        .withMessage('Invalid Order ID'),
      body('type')
        .optional()
        .isString()
        .withMessage('Invalid Type'),
      body('productIds')
        .optional()
        .optional()
        .withMessage('Invalid productId'),
      body('categoryIds')
        .optional()
        .optional()
        .withMessage('Invalid categoryId'),
      body('subCategoryIds')
        .optional()
        .optional()
        .withMessage('Invalid subCategoryIds'),
      body('parentProductIds')
        .optional()
        .optional()
        .withMessage('Invalid parentProductIds'),
      validator
    ],
    (...args) => controller.edit(...args)
  )
  .get((...args) => controller.getSlider(...args))
  .delete(authenticate, hasAccess(['slider.delete']), (...args) => controller.remove(...args));

module.exports = router;

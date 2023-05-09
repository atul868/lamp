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
    hasAccess(['cart.create']),
    [
      body('productId')
        .exists()
        .isString()
        .withMessage('Invalid productId'),
      body('packagingSize')
        .exists()
        .toInt()
        .withMessage('Invalid packagingSize'),
      body('quantity')
        .exists()
        .isNumeric()
        .toInt()
        .withMessage('Invalid quantity'),
      validator
    ],
    (...args) => controller.create(...args)
  )
  
  .get(
    authenticate,
    hasAccess(['cart.read']),
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
    (...args) => controller.getCart(...args)
  )
  .delete(authenticate, hasAccess(['cart.delete']), (...args) => controller.emptyCart(...args));

router
  .route('/deleteItem')
  .delete(authenticate, hasAccess(['cart.delete']), (...args) => controller.deleteProductFromCart(...args));

module.exports = router;

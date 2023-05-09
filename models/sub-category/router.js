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
    hasAccess(['sub-category.create']),
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
      body('parent')
        .exists()
        .isString()
        .withMessage('Invalid Category'),
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
  .route('/:SubCategoryId')
  .put(
    authenticate,
    hasAccess(['sub-category.update']),
    [
      param('SubCategoryId')
        .exists()
        .withMessage('Invalid SubCategory Id'),
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
      body('parent')
        .optional()
        .isString()
        .withMessage('Invalid Category'),
      validator
    ],
    (...args) => controller.edit(...args)
  )
  .get(
    authenticate,
    hasAccess(['sub-category.read']),
    [
      param('SubCategoryId')
        .exists()
        .withMessage('Invalid SubCategory Id'),
      validator
    ],
    (...args) => controller.getSubCategory(...args)
  )
  .delete(
    authenticate,
    hasAccess(['sub-category.delete']),
    [
      param('SubCategoryId')
        .exists()
        .withMessage('Invalid SubCategory Id'),
      validator
    ],
    (...args) => controller.remove(...args)
  );

module.exports = router;

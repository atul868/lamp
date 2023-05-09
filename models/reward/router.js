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
    authenticate,
    hasAccess(['reward.create']),
    [
      body('title')
        .exists()
        .isString()
        .withMessage('Invalid Title'),
      body('description')
        .exists()
        .isString()
        .withMessage('Invalid Description'),
      body('role')
        .exists()
        .isString()
        .withMessage('Invalid Role'),
      body('points')
        .exists()
        .isNumeric()
        .withMessage('Invalid Points'),
      body('image').optional(),
      validator
    ],
    (...args) => controller.create(...args)
  )
  .get(
    authenticate,
    hasAccess(['reward.read']),
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
      query('title')
        .optional()
        .isString()
        .withMessage('Invalid Title'),
      validator
    ],
    (...args) => controller.select(...args)
  );

router
  .route('/:RewardId')
  .put(
    authenticate,
    hasAccess(['reward.update']),
    [
      body('title')
        .optional()
        .isString()
        .withMessage('Invalid Title'),
      body('description')
        .optional()
        .isString()
        .withMessage('Invalid Description'),
      body('role')
        .optional()
        .isString()
        .withMessage('Invalid Role'),
      body('points')
        .optional()
        .isNumeric()
        .withMessage('Invalid Points'),
      body('image').optional(),
      validator
    ],
    (...args) => controller.edit(...args)
  )
  .get(authenticate, hasAccess(['reward.read']), (...args) => controller.getReward(...args))
  .delete(authenticate, hasAccess(['reward.delete']), (...args) => controller.remove(...args));

module.exports = router;

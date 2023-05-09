const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator/check');
const controller = require('./controller');
const validator = require('../../utils/validator');
const authenticate = require('../../policies/authenticate');
const hasAccess = require('../../policies/hasAccess');

router
  .route('/')
  .post([
    authenticate,
    hasAccess(['notification.send']),
    [
      query('from')
        .optional()
        .withMessage('Invalid From'),
      query('to')
        .optional()
        .withMessage('Invalid To'),
      query('search')
        .optional()
        .isString()
        .withMessage('Invalid Search'),
      body('users')
        .optional()
        .isArray()
        .withMessage('Invalid Name'),
      body('notificationData')
        .exists()
        .withMessage('Invalid Tags'),
      validator
    ],
    (...args) => controller.send(...args)
  ])
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
      query('from')
        .optional()
        .withMessage('Invalid From'),
      query('to')
        .optional()
        .withMessage('Invalid To'),
      query('sortBy')
        .optional()
        .isString()
        .withMessage('Invalid Sort By'),
      query('skip')
        .optional()
        .isNumeric()
        .withMessage('Invalid Skip'),
      validator
    ],
    (...args) => controller.get(...args)
  );

module.exports = router;

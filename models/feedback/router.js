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
    (...args) => controller.create(...args)
  )
  
  .get(
    authenticate,
    hasAccess(['feedback.read']),
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
  .route('/:FeedbackId')
  .put(
    authenticate,
    (...args) => controller.edit(...args)
  )
  .get(authenticate, hasAccess(['feedback.read']), (...args) => controller.getFeedback(...args))
  .delete(authenticate, hasAccess(['feedback.delete']), (...args) => controller.remove(...args));

module.exports = router;

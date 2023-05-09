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
    hasAccess(['measurement.create']),
    [
      body('name')
        .exists()
        .isString()
        .withMessage('Invalid Name'),
      body('slug')
        .exists()
        .isString()
        .withMessage('Invalid Slug'),
      validator
    ],
    (...args) => controller.create(...args)
  )
  .get(
    authenticate,
    hasAccess(['measurement.read']),
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
  .route('/:MeasurementId')
  .put(
    authenticate,
    hasAccess(['measurement.update']),
    [
      param('MeasurementId')
        .exists()
        .withMessage('Invalid Measurement Id'),
      body('name')
        .optional()
        .isString()
        .withMessage('Invalid Name'),
      body('slug')
        .optional()
        .isString()
        .withMessage('Invalid Slug'),
      validator
    ],
    (...args) => controller.edit(...args)
  )
  .get(
    authenticate,
    hasAccess(['measurement.read']),
    [
      param('MeasurementId')
        .exists()
        .withMessage('Invalid Measurement Id'),
      validator
    ],
    (...args) => controller.getMeasurement(...args)
  )
  .delete(
    authenticate,
    hasAccess(['measurement.delete']),
    [
      param('MeasurementId')
        .exists()
        .withMessage('Invalid Measurement Id'),
      validator
    ],
    (...args) => controller.remove(...args)
  );

module.exports = router;

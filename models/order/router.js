const express = require('express');
const router = express.Router();
const { query, body } = require('express-validator/check');
const controller = require('./controller');
const authenticate = require('../../policies/authenticate');
const hasAccess = require('../../policies/hasAccess');
const validator = require('../../utils/validator');

router
  .route('/')
  .post(authenticate, hasAccess(['order.create']), (...args) => controller.create(...args))
  
  .get(
    authenticate,
    hasAccess(['order.read']),
    [
      query('limit')
        .optional()
        .isNumeric()
        .toInt()
        .withMessage('Invalid Limit'),
      query('page')
        .optional()
        .toInt()
        .withMessage('Invalid Page'),
      query('sortBy')
        .optional()
        .isString()
        .withMessage('Invalid Sort By'),
      query('status')
        .optional()
        .isString()
        .isIn(['PLACED', 'ACCEPTED', 'CONFIRMED', 'SHIPPED', 'PAYMENT_CONFIRMED'])
        .withMessage('Invalid status'),
      query('startDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid startDate'),
      query('endDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid endDate'),
      validator
    ],
    (...args) => controller.get(...args)
  );

router.route('/PastOrders').get(
  authenticate,
  hasAccess(['order.read']),
  [
    query('limit')
      .optional()
      .isNumeric()
      .toInt()
      .withMessage('Invalid Limit'),
    query('page')
      .optional()
      .toInt()
      .withMessage('Invalid Page'),
    query('sortBy')
      .optional()
      .isString()
      .withMessage('Invalid Sort By'),
    query('status')
      .optional()
      .isString()
      .isIn(['REJECTED', 'DELIVERED', 'PENDING', 'CANCELLED', 'RETURN', 'INCOMPLETE'])
      .withMessage('Invalid status'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid startDate'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid endDate'),
    validator
  ],
  (...args) => controller.pastOrders(...args)
);

router
  .route('/:orderId')
  .put(authenticate, hasAccess(['order.update']), (...args) => controller.update(...args))
  .get(authenticate, hasAccess(['order.read']), (...args) => controller.getOrder(...args));

router
  .route('/ApproveBill/:orderId')
  .put(authenticate, hasAccess(['order.approveBill']), (...args) => controller.approveBill(...args));

router
  .route('/UploadBill/:orderId')
  .put(authenticate, hasAccess(['order.update']), (...args) => controller.uploadBill(...args));

router
  .route('/Accept/:orderId')
  .put(authenticate, hasAccess(['order.update']), (...args) => controller.acceptOrder(...args));

router.route('/Confirm/:orderId').put(
  authenticate,
  hasAccess(['order.update']),
  [
    body('status')
      .exists()
      .isString()
      .isIn(['CONFIRMED', 'CANCELLED'])
      .withMessage('Invalid Status'),
    validator
  ],
  (...args) => controller.confirmOrder(...args)
);

router.route('/GetById/:memberId').get(
  authenticate,
  hasAccess(['order.read']),
  [
    query('type')
      .optional()
      .isString()
      .isIn(['CURRENT', 'PAST'])
      .withMessage('Invalid type'),
    query('role')
      .exists()
      .isString()
      .isIn(['stockist', 'retailer'])
      .withMessage('Invalid role'),
    query('status')
      .optional()
      .isString()
      .isIn([
        'PLACED',
        'ACCEPTED',
        'REJECTED',
        'CONFIRMED',
        'DELIVERED',
        'SHIPPED',
        'PENDING',
        'CANCELLED',
        'RETURN',
        'INCOMPLETE'
      ])
      .withMessage('Invalid status'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid startDate'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid endDate'),
    validator
  ],
  (...args) => controller.getOrderById(...args)
);

router.route('/Admin/GetByCard').get(
  authenticate,
  hasAccess(['order.read']),
  [
    query('role')
      .optional()
      .isString()
      .isIn(['stockist', 'retailer'])
      .withMessage('Invalid role'),
    query('status')
      .optional()
      .isString()
      .isIn([
        'PLACED',
        'ACCEPTED',
        'REJECTED',
        'CONFIRMED',
        'DELIVERED',
        'SHIPPED',
        'PENDING',
        'CANCELLED',
        'RETURN',
        'INCOMPLETE',
        'PAYMENT_CONFIRMED'
      ])
      .withMessage('Invalid status'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid startDate'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid endDate'),
    validator
  ],
  (...args) => controller.getOrderForCard(...args)
);

module.exports = router;

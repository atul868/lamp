const express = require('express');
const router = express.Router();
const controller = require('./controller');
const authenticate = require('../../policies/authenticate');

router
  .route('/:orderId')
  .post(authenticate, (...args) => controller.createOrder(...args))
  .get(authenticate, (...args) => controller.paymentCapture(...args));

module.exports = router;

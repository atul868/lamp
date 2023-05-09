const express = require('express');
const router = express.Router();
const { query, body } = require('express-validator/check');
const controller = require('./controller');
const authenticate = require('../../policies/authenticate');
const hasAccess = require('../../policies/hasAccess');
const validator = require('../../utils/validator');

router
  .route('/')
  .post((...args) => controller.create(...args))
  .get(
    (...args) => controller.select(...args)
  );


module.exports = router;

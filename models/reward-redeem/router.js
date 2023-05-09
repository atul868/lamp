const express = require('express');
const router = express.Router();
const { query, body } = require('express-validator/check');
const controller = require('./controller');
const validator = require('../../utils/validator');
const authenticate = require('../../policies/authenticate');
const hasAccess = require('../../policies/hasAccess');

router
  .route('/')
  .get(
    authenticate,
    hasAccess(['rewardRedeem.read']),
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
    (...args) => controller.select(...args)
  )
  .post(
    authenticate,
    hasAccess('reward.redeem'),
    [
      body('reward')
        .exists()
        .isString()
        .withMessage('Invalid Reward')
    ],
    (...args) => controller.rewardRequest(...args)
  );

router
  .route('/:RewardRedeemId')
  .get(authenticate, hasAccess(['rewardRedeem.read']), (...args) => controller.getRewardRedeem(...args))
  .put(
    authenticate,
    hasAccess('reward.review'),
    [
      body('status')
        .exists()
        .isString()
        .withMessage('Invalid status')
    ],
    (...args) => controller.review(...args)
  );

module.exports = router;

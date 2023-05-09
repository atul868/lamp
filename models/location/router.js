const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator/check');
const controller = require('./controller');
const validator = require('../../utils/validator');
const authenticate = require('../../policies/authenticate');
const hasAccess = require('../../policies/hasAccess');


router
  .route('/getMachineIds/:machineIds')
  .get(
    (...args) => controller.getlocations(...args)
  );

router
  .route('/')
  .post((...args) => controller.create(...args))
  .get(
    (...args) => controller.select(...args)
  );
  router
  .route('/:locationsId')
  .put(
    authenticate,
    (...args) => controller.edit(...args)
  )
  .get(
    (...args) => controller.select(...args)
  )
  .delete(
    authenticate,
    (...args) => controller.remove(...args)
  );

  // fatch location by machine id
  // arrray search
  // create, edit , remove
  // edit - set array

module.exports = router;

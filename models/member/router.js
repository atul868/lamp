const { Router } = require('express');
const { body, query } = require('express-validator/check');
const controller = require('./controller');
const validator = require('../../utils/validator');
const authenticate = require('../../policies/authenticate');
const hasAccess = require('../../policies/hasAccess');

const router = new Router();

// SignUp, get Profile, updated profile and logout
router
  .route('/')
  .post(
    [
      body('email')
        .exists()
        .isEmail()
        .withMessage('Invalid Email'),
      body('name')
        .exists()
        .isString()
        .trim()
        .withMessage('Invalid First Name'),
      body('phone')
        .exists()
        .isLength({ min: 0, max: 10 })
        .isNumeric()
        .withMessage('Invalid Phone Number'),
      body('role')
        .exists()
        .isIn(['retailer', 'stockist', 'distributor', 'mr'])
        .withMessage('Invalid Role'),
      validator
    ],
    (...args) => controller.signUp(...args)
  )

  .get(authenticate, hasAccess(['user.read']), (...args) => controller.me(...args))
  
  .put(
    [
      [
        body('email')
          .optional()
          .isEmail()
          .withMessage('Invalid Email'),
        body('name')
          .optional()
          .isString()
          .trim()
          .withMessage('Invalid First Name'),
        body('phone')
          .optional()
          .isLength({ min: 0, max: 10 })
          .isNumeric()
          .withMessage('Invalid Phone Number'),
        validator
      ],
      authenticate,
      hasAccess(['user.read'])
    ],
    (...args) => controller.updateProfile(...args)
  );

// Get All Members
router.route('/All').get([
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
  query('role')
    .optional()
    .isString()
    .withMessage('Invalid Role'),
  validator,
  (...args) => controller.select(...args)
]);

router.route('/CustomerSignup').post(
  [
    body('email')
      .exists()
      .isEmail()
      .withMessage('Invalid Email'),
    body('firstName')
      .exists()
      .isString()
      .trim()
      .withMessage('Invalid First Name'),
    body('lastName')
      .exists()
      .isString()
      .trim()
      .withMessage('Invalid Last Name'),
    body('password')
      .exists()
      .isLength({ min: 6, max: 30 })
      .withMessage('Invalid password'),
    body('confirmPassword')
      .exists()
      .isLength({ min: 6, max: 30 })
      .withMessage('Invalid password'),
  ], (...args) => controller.customerSignUp(...args)
);

router.route('/CustomerLogin').post([
  body('email')
    .exists()
    .isEmail()
    .withMessage('Invalid Email'),
  body('password')
    .exists()
    .isLength({ min: 6, max: 30 })
    .withMessage('Invalid password'),
], (...args) => controller.customerLogin(...args));

// Get A Member
router.route('/:MemberId').get(authenticate, hasAccess(['user.read']), (...args) => controller.getMember(...args));

// Admin or sub-admin login
router.route('/Login').post(
  [
    body('email')
      .exists()
      .isEmail()
      .withMessage('Not A Valid Email'),
    body('password')
      .exists()
      .isLength({ min: 6, max: 30 })
      .withMessage('Invalid password'),
    validator
  ],
  (...args) => controller.login(...args)
);

// normal user login
router.route('/UserLogin').post(
  [
    body('phone')
      .exists()
      .isLength({ min: 10, max: 10 })
      .withMessage('Not A Valid Phone Number'),
    body('otp')
      .exists()
      .isLength({ min: 3 })
      .toInt()
      .withMessage('Invalid Otp'),
    body('deviceToken')
      .optional()
      .isString()
      .withMessage('Not A Valid Device Token'),
    body('device')
      .optional()
      .isString()
      .withMessage('Not A Valid Device'),
    validator
  ],
  (...args) => controller.userLogin(...args)
);

router.route('/User/Get/Otp').get(
  [
    query('phone')
      .exists()
      .isLength({ min: 10, max: 10 })
      .withMessage('Not A Valid Phone Number'),
    validator
  ],
  (...args) => controller.getOtp(...args)
);
// Verify Email
router.route('/VerifyEmail').post((...args) => controller.verifyEmail(...args));

// Resend Verify Email
router.route('/ResendVerifyEmail').post((...args) => controller.resendVerifyEmail(...args));

// Resend Verify Number
router.route('/ResendVerifyNumber').post((...args) => controller.resendVerifyNumber(...args));

// Forgot Password
router.route('/ForgotPassword').put((...args) => controller.forgotPassword(...args));

// Reset Password
router.route('/ResetPassword').put((...args) => controller.resetPassword(...args));

// change password
router.route('/ChangePassword').put(authenticate, (...args) => controller.changePassword(...args));

router.route('/Address').post(
  [
    body('line1')
      .exists()
      .withMessage('Line 1 is required'),
    body('line2')
      .optional()
      .isString(),
    body('city')
      .exists()
      .withMessage('city  is required'),
    body('state')
      .exists()
      .isString()
      .withMessage('State is required'),
    validator
  ],
  authenticate,
  (...args) => controller.addAddress(...args)
);
router.route('/Address/:id?').delete(
  authenticate,
  (...args) => controller.deleteAddress(...args)
);


router.route('/Logout/:memberId').post(
  [
    body('deviceToken')
      .optional()
      .isString()
      .withMessage('Not A Valid Device Token'),
    validator
  ],
  authenticate,
  (...args) => controller.logout(...args)
);

router
  .route('/Approve/:memberId')
  .post(authenticate, hasAccess('user.update'), (...args) => controller.approveMember(...args));

router
  .route('/Admin/DisableOrEnable')
  .post(authenticate, hasAccess('user.delete'), (...args) => controller.disableOrEnable(...args));

router
  .route('/Admin/Dashboard')
  .get(authenticate, hasAccess('dashboard.read'), (...args) => controller.dashBoard(...args));
router
  .route('/Admin/Dashboard/Graph')
  .get(authenticate, hasAccess('dashboard.read'), (...args) => controller.graph(...args));

router
  .route('/Mr/Retailer')
  .post(authenticate, hasAccess('user.create'), (...args) => controller.createRetailer(...args))
  .get(authenticate, hasAccess('user.read'), (...args) => controller.getRetailer(...args));

module.exports = router;

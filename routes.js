const { Router } = require('express');
const config = require('config');
const member = require('./models/member/router');
const category = require('./models/category/router');
const subCategory = require('./models/sub-category/router');
const parentProduct = require('./models/parent-product/router');
const product = require('./models/product/router');
const measurement = require('./models/measurement/router');
const cart = require('./models/cart/router');
const order = require('./models/order/router');
const notification = require('./models/notification/router');
const discount = require('./models/discount/router');
const reward = require('./models/reward/router');
const rewardRedeem = require('./models/reward-redeem/router');
const feedback = require('./models/feedback/router');
const scheme = require('./models/scheme/router');
const banner = require('./models/banner/router');
const payment = require('./models/payment/router');
const promoCode = require('./models/promoCode/router');
const reqDemo = require("./models/reqdemo");
const location = require("./models/location/router");
const router = new Router();
const version = config.get('version');

// swagger dynamic
const swaggerDef = require('./swagger/swagger.json');
swaggerDef.host = `${config.get('swaggerHost')}`;
swaggerDef.basePath = `/${config.get('version')}`;

router.route('/swagger').get((req, res) => res.json(swaggerDef));

router.route('/').get((req, res) => {
  res.json({ message: 'WELCOME TO Korner Lamp!' });
});

router.use(`/${version}/Member`, member);
router.use(`/${version}/Category`, category);
router.use(`/${version}/SubCategory`, subCategory);
router.use(`/${version}/ParentProduct`, parentProduct);
router.use(`/${version}/Product`, product);
router.use(`/${version}/Measurement`, measurement);
router.use(`/${version}/Cart`, cart);
router.use(`/${version}/Order`, order);
router.use(`/${version}/Notification`, notification);
router.use(`/${version}/Discount`, discount);
router.use(`/${version}/Reward`, reward);
router.use(`/${version}/RewardRedeem`, rewardRedeem);
router.use(`/${version}/Feedback`, feedback);
router.use(`/${version}/Scheme`, scheme);
router.use(`/${version}/Banner`, banner);
router.use(`/${version}/Payment`, payment);
router.use(`/${version}/PromoCode`, promoCode);
router.use(`/${version}/ReqDemo`, reqDemo);
router.use(`/${version}/Location`, location);
module.exports = router;

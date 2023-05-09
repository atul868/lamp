const Facade = require('../../lib/facade');
const discountSchema = require('./schema');
class DiscountFacade extends Facade {}

module.exports = new DiscountFacade(discountSchema);

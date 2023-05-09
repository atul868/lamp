const Facade = require('../../lib/facade');
const productSchema = require('./schema');
class ProductFacade extends Facade {}

module.exports = new ProductFacade(productSchema);

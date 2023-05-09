const Facade = require('../../lib/facade');
const categorySchema = require('./schema');
class CategoryFacade extends Facade {}

module.exports = new CategoryFacade(categorySchema);

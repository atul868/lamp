const Facade = require('../../lib/facade');
const subCategorySchema = require('./schema');
class SubCategoryFacade extends Facade {}

module.exports = new SubCategoryFacade(subCategorySchema);

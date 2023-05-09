const Facade = require('../../lib/facade');
const parentProducttSchema = require('./schema');
class ParentProductFacade extends Facade {}

module.exports = new ParentProductFacade(parentProducttSchema);

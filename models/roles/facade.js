const Facade = require('../../lib/facade');
const rolesSchema = require('./schema');
class RolesFacade extends Facade {}

module.exports = new RolesFacade(rolesSchema);

const Facade = require('../../lib/facade');
const reqDemoSchema = require('./schema');
class RewardFacade extends Facade {}

module.exports = new RewardFacade(reqDemoSchema);

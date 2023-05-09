const Facade = require('../../lib/facade');
const rewardSchema = require('./schema');
class RewardFacade extends Facade {}

module.exports = new RewardFacade(rewardSchema);

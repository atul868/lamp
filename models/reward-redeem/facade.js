const Facade = require('../../lib/facade');
const rewardRedeemSchema = require('./schema');
class RewardRedeemFacade extends Facade {}

module.exports = new RewardRedeemFacade(rewardRedeemSchema);

const Facade = require('../../lib/facade');
const promoCodeSchema = require('./schema');
class PromoCodeFacade extends Facade {}

module.exports = new PromoCodeFacade(promoCodeSchema);

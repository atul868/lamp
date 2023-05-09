const Facade = require('../../lib/facade');
const bannerSchema = require('./schema');
class BannerFacade extends Facade {}

module.exports = new BannerFacade(bannerSchema);

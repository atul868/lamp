const Facade = require('../../lib/facade');
const notificationSchema = require('./schema');
class NotificationFacade extends Facade {}

module.exports = new NotificationFacade(notificationSchema);

const Facade = require('../../lib/facade');
const feedbackSchema = require('./schema');
class FeedbackFacade extends Facade {}

module.exports = new FeedbackFacade(feedbackSchema);

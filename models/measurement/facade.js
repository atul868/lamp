const Facade = require('../../lib/facade');
const measurementSchema = require('./schema');
class MeasurementFacade extends Facade {}

module.exports = new MeasurementFacade(measurementSchema);

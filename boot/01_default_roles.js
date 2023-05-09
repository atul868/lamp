const roles = require('../fixtures/roles');

/* eslint global-require: 0 */
module.exports = app =>
  new Promise(async (resolve, reject) => {
    console.log('Boot script - initialising default_admin');
    const rolesFacade = require('../models/roles/facade');

    for (const role of roles) {
      try {
        const alreadyExistRole = await rolesFacade.findOne({ _id: role._id });
        if (alreadyExistRole) continue;
      } catch (e) {
        return reject(e);
      }
      try {
        await rolesFacade.create(role);
      } catch (e) {
        return reject(e);
      }
    }
    resolve();
  });

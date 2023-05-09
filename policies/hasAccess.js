const compose = require('composable-middleware');
const util = require('util');
const _ = require('lodash');

const hasAccess = moduleName => {
  return compose().use(async (req, res, next) => {
    let isAuthorised = false;
    if (_.isArray(moduleName)) {
      for (const m of moduleName) {
        if (isAuthorised) continue;
        if (req.role.modules.indexOf(m) !== -1) {
          isAuthorised = true;
        } else if (req.role.modules.indexOf(`${m}.y`) !== -1) {
          isAuthorised = true;
          req.self = true;
          req.role = req.role._id;
        }
      }
      if (isAuthorised) return next();
    } else if (req.role.modules.indexOf(moduleName) !== -1) {
        return next();
      } else if (req.role.modules.indexOf(`${moduleName}.y`) !== -1) {
        req.self = true;
        req.role = req.role._id;
        return next();
      }
      
    return res.status(403).send(util.format('Access denied for', moduleName));
  });
};

module.exports = hasAccess;

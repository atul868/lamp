/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const config = require('config');

module.exports = {
  boot: app =>
    new Promise(async (resolve, reject) => {
      let bootDirPath = `${__dirname}/../boot`;
      if (config.get('isTesting')) bootDirPath = `${__dirname}/../test/boot`;
      const files = await fs.readdirAsync(bootDirPath);
      for (const file of files) {
        try {
          await require(`${bootDirPath}/${file}`)(app);
        } catch (e) {
          return reject(e);
        }
      }
      resolve();
    })
};

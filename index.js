const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
// const cookieParser = require('cookie-parser');
global.mongoose = require('mongoose');
const morgan = require('morgan');
const config = require('config');
mongoose.set('debug', config.get('logging'));
global.Types = mongoose.Types;
const serverUtils = require('./utils/serverUtils');
const PORT = process.env.PORT || config.get('port');
global.app = express();
mongoose.set('useFindAndModify', false);

app.use(cors());

console.log('Starting index.js - Configuring logger');

app.use(bodyParser.urlencoded({ limit: config.get('requestLimit'), extended: true }));
app.use(bodyParser.json({ limit: config.get('requestLimit') }));
// app.use(cookieParser());
app.use(helmet());
/* istanbul ignore next */
app.use(morgan('tiny'));
const routes = require('./routes');
app.use('/uploads', express.static('uploads', { maxAge: 31536000 }));

// server up
const startApp = async () => {
  app.use('/', routes);
  require('./scripts/index');

  /* eslint global-require: 0 */

  // error handler
  app.use((err, req, res, next) => {
    if (!config.get('isTesting')) {
      console.log(err);
    }
    /* istanbul ignore next */
    if (!err.statusCode && config.get('isTesting')) {
      return res.status(500).send({ error: err.stack });
    }
    if (!err.statusCode) {
      return res.status(500).send({ message: err.message });
    }

    /* istanbul ignore else */
    if (config.get('isTesting')) {
      res.status(err.statusCode).send({ message: err.message });
    } else {
      res.status(err.statusCode).send({ message: err.message });
    }
  });

  // Swagger
  app.use('/explorer', express.static(path.join(__dirname, 'swagger')));
  // Asset Links
  app.listen(PORT, () => {
    console.log(`Welcome To Korner Lamp App ${config.get('port')}`);
  });
};

if (config.get('isTesting')) {
  startApp();
} else {
  serverUtils.boot(app).then(
    () => {
      console.log('Starting index.js - starting app from last else');
      startApp();
    },
    err => {
      console.error(err);
    }
  );
}

module.exports = app;

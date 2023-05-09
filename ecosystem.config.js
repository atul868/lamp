const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
module.exports = {
  apps: [
    {
      name: 'hcah-develop',
      script: './index.js',
      exec_mode: 'fork',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      watch: false,
      watch_ignore: true,
      env_development: {
        PORT: 6600,
        NODE_ENV: 'development'
      }
    },
    {
      name: 'hcah-stage',
      script: './index.js',
      exec_mode: 'fork',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      watch: false,
      watch_ignore: true,
      env_stage: {
        PORT: 3300,
        NODE_ENV: 'stage'
      }
    }
  ],

  deploy: {
    development: {
      user: 'root',
      host: '3.110.209.102',
      ref: 'origin/develop',
      repo: 'git@gitlab.com:scott-edil/hcah-backend.git',
      path: '/root/hcah/develop',
      'post-deploy': 'npm i && pm2 reload ecosystem.config.js --only hcah-develop --env develop'
    },
    stage: {
      user: 'root',
      host: '3.110.209.102',
      ref: 'origin/stage',
      repo: 'git@gitlab.com:scott-edil/hcah-backend.git',
      path: '/root/hcah/stage',
      'post-deploy': 'npm i && pm2 reload ecosystem.config.js --only hcah-stage --env stage'
    }
  }
};

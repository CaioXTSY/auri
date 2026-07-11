const path = require('node:path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

module.exports = {
  apps: [
    {
      name: 'auri_backend',
      script: 'dist/main.js',
      cwd: __dirname,
      time: true,
      env: process.env,
    },
    {
      name: 'auri_code_runner',
      script: 'dist-runner/worker/code-runner.worker.js',
      cwd: __dirname,
      time: true,
      env: process.env,
    },
  ],
};

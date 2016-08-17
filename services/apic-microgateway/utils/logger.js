var bunyan = require('bunyan');

var logger = bunyan.createLogger({
  name: 'microgatewayLogger',
  stream: process.stdout,
  level: 'trace'
});

module.exports = logger;

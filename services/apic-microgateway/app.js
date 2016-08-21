var logger       = require('./utils/logger');
var express      = require('express');
var bodyParser   = require('body-parser');
var microgateway = require('microgateway/lib/microgw');

if (!process.env.DATASTORE_PORT) {
  process.env.DATASTORE_PORT = 9999;
}

//initialize app
var app = express();

app.use(bodyParser.json());

//start microgateway
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
microgateway.start(4005);

var router = require('./routes');
app.use('/', router);

app.listen(3000, function (err) {
  if(err) {
    logger.error('Could not start server');
    logger.error('error: ' + err);
  }
});
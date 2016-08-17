var logger       = require('./utils/logger');
var express      = require('express');
var bodyParser   = require('body-parser');
var microgateway = require('microgateway/lib/microgw');

//initialize app
var app = express();

//root no-op
app.get('/', function get(req, resp) {
  resp.status(200).send({'status': 'up'});
});

//start microgateway
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
microgateway.start(4005);

app.listen(3000, function (err) {
  if(err) {
    logger.error('Could not start server');
    logger.error('error: ' + err);
  }
});
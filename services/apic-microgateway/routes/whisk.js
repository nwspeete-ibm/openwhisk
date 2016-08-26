var express = require('express');
var router = express.Router();
var whisk = require('../lib/whisk');
var url = require ('url');

router.get('/', function(req, res){
  res.status(200).send('Hello from whisk');
});

router.get('/env', function(req, res){
  res.send(process.env);
});

router.post('/api', function(req, res) {
  whisk.loadNewAPI(req.body)
    .then(function(resp){
      for(var i in resp.URLs){
        resp.URLs[i] = process.env.EXT_HOST + '/gateway/api' + resp.URLs[i];
      }
      res.send(resp);
    });
});

router.get('/snapshots/current', function(req, res){
  ds.get('/snapshots/current')
    .then(res.send);
});

router.get('/ds', function(req, res){
  res.send({
    port: process.env.DATASTORE_PORT
  });
});

module.exports = router;

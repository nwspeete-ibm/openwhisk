var express = require('express');
var whiskRouter = require('./whisk');
var router = express.Router();

//root no-op
router.get('/', function get(req, resp) {
  resp.status(200).send({'status': 'up'});
});

router.use('/whisk', whiskRouter);

module.exports = router;

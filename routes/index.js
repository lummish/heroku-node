var express = require('express');
var bodyParser = require('body-parser');
var gcloud = require('gcloud')({
	keyFilename: 'Receipt Read Test-674e7b00346d.json',
	projectId: 'receipt-read-test'
});

var vision = gcloud.vision();
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
	extended: true
}));

router.use(express.json());
router.use(express.urlencoded());

router.post('/', function(req, res) {
	vision.detectText(req.files.displayImage.path, function(err, text, apiResponse) {
  		console.log(text);
	});
});

module.exports = router;

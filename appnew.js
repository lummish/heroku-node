var http = require('http'),
	express = require('express'),
	bodyParser = require('body-parser'),
	ejs = require('ejs'),
	hjs = require('hjs'),
	path = require('path'),
	FileReader = require('filereader'),
	gcloud = require('gcloud')({
		keyFilename: 'Receipt Read Test-674e7b00346d.json',
		projectId: 'receipt-read-test'
	});

//for uploading of photos
var multer  = require('multer');
var upload = multer({ dest: 'uploads/' });

var vision = gcloud.vision();
var app = express();


app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

app.get('/', function(req, res) {
	res.render('index');
});

//post image data and process using cloudvision
app.post('/upload', upload.single('displayImage'), function(req, res, next) {
	var reader = new FileReader();
	vision.detectText(reader.readAsDataURL(req.file.path), function(err, text, apiResponse) {
  		console.log(text);
	});	
});

app.get('/webhook/', function (req, res) {
	if (req.query['hub.verify_token'] === 'verify_token_test') {
		res.send(req.query['hub.challenge']);
	}
	res.send('Error, wrong validation_token');
});

app.post('/webhook/', function (req, res) {
  messaging_events = req.body.entry[0].messaging;
  for (i = 0; i < messaging_events.length; i++) {
  	event = req.body.entry[0].messaging[i];
    sender = event.sender.id;
    if (event.message && event.message.text) {
      text = event.message.text;
      // Handle a text message from this sender
    }
  }
  res.sendStatus(200);
});

var server = app.listen(process.env.PORT || 8080, function() {
	var host = server.address().address;
	var port = server.address().port;

	console.log('App listening at http://%s:%s', host, port);
});


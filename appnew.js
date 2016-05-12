var http = require('http'),
	express = require('express'),
	bodyParser = require('body-parser'),
	ejs = require('ejs'),
	hjs = require('hjs'),
	path = require('path'),
	request = require('request'),
	FileReader = require('filereader'),
  fs = require('fs'),
	gcloud = require('gcloud')({
		keyFilename: 'Receipt Read Test-674e7b00346d.json',
		projectId: 'receipt-read-test'
	});

//for uploading of photos
var multer  = require('multer');
var upload = multer({ dest: 'uploads/' });

var vision = gcloud.vision();
var gcs = gcloud.storage();
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

//need to put into separate model
var download = function(uri, filename, callback) {
  request.head(uri, function(err, res, body) {
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

//post image data and process using cloudvision
app.post('/upload', upload.single('displayImage'), function(req, res, next) {
  
  download()

  var bucket = gcs.bucket('test-bucket');
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

/**THIS NEEDS TO GO IN MODELS OR CONTROLLERS I CANT REMEMBER WHICH**/
var token = "EAACjBDR8ZBqkBAAFRoqSYFkj4iZAYC6mOKhfH9MdJdY95in3JZB3DD1CAEMlMvJJDEKibUbZAVFKKoKfl1wzRK58oyVpQW4esPUNHySmI4bGsU3WIg7Bb9sfWSNLN9p2EZBySkfDrK2aaOLSx54R7Kn8MzpZCzfPIMFZC4Qs4cBOAZDZD";

function sendTextMessage(sender, text) {
  messageData = {
    text:text
  }
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token:token},
    method: 'POST',
    json: {
      recipient: {id:sender},
      message: messageData,
    }
  }, function(error, response, body) {
    if (error) {
      console.log('Error sending message: ', error);
    } else if (response.body.error) {
      console.log('Error: ', response.body.error);
    }
  });
}

//handle messages sent to page
app.post('/webhook/', function (req, res) {
  messaging_events = req.body.entry[0].messaging;
  for (i = 0; i < messaging_events.length; i++) {
  	event = req.body.entry[0].messaging[i];
    sender = event.sender.id;
    if (event.message && event.message.text) {
      text = event.message.text;
      // Handle a text message from this sender
      sendTextMessage(sender, "Text received, echo: "+ text.substring(0, 200));
    }
    if (event.message && //event.hasOwnProperty('attachments') &&
      event.message.attachments.length == 1 &&
    	event.message.attachments[0].type == "image") {
    	imgUrl = event.message.attachments[0].payload.url;
      console.log(imgUrl);
    	//result = urlfetch.fetch(imgUrl);
    	//if (result.status_code == 200) {
    		//save file
        //may need to get file extension
        var image_name = 'test-img';
        var filename = '/uploads/' + image_name;
    		dowload(imgUrl, filename, function() { //need file extension
          var bucket = gcs.bucket('receipt-reader');
          var localReadStream = fs.createReadStream(filename);
          var remoteWriteStream = bucket.file(image_name).createWriteStream();
          localReadStream.pipe(remoteWriteStream); //not sure what this does
        });
        console.log("successfully saved image");
    	//}
    }
  }
  res.sendStatus(200);
});



var server = app.listen(process.env.PORT || 8080, function() {
	var host = server.address().address;
	var port = server.address().port;

	console.log('App listening at http://%s:%s', host, port);
});


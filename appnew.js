var http = require('http'),
	express = require('express'),
	bodyParser = require('body-parser'),
	ejs = require('ejs'),
	hjs = require('hjs'),
	path = require('path'),
  base64 = require('node-base64-image'),
	request = require('request'),
	FileReader = require('filereader'),
  fs = require('fs'),
  btoa = require('btoa'),
  XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest,
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
}

var processImageFromUrl = function(b64) {
  console.log("Supposed url" + b64);
  vision.detectText(b64, function(err, text) {
    if (err) {
      console.log(err);
    }
    console.log(text);
  });
}

var processImageFromB64 = function(b64) {
  request({
    url: 'https://vision.googleapis.com/v1/images:annotate?key=AIzaSyDe32dvHgUx8RmSpzk1qA3d4N2_8paL1Ow',
    method: 'POST',
    json: {
      requests: [{
        features:[{
          type: 'TEXT_DETECTION'
        }],
        image: {
          content: b64
        }
      }]
    }
  }, function(err, res, body) {
    if (err) {
      console.log('Error processing image: ', err);
    } else if (res.body.error) {
      console.log('Error: ', res.body.error);
    } else {
      console.log(res);
      console.log(body);
    }
  });
}

var convertImgToDataURLviaFileReader = function(url) {//, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  //xhr.responseType = 'blob';
  xhr.responseType = 'arraybuffer';
  xhr.onload = function(e) {
    if (this.status == 200) {
      var uInt8Array = new Uint8Array(this.response);
      var i = uInt8Array.length;
      var binaryString = new Array(i);
      while (i--) {
        binaryString[i] = String.fromCharCode(uInt8Array[i]);
      }
      var data = binaryString.join('');
      var base64 = btoa(data);
      console.log(base64);
    }
  };
  /*
  xhr.onload = function() { 
    var reader = new FileReader();
    reader.onloadend = function() {
      callback(reader.result);
      console.log(xhr.response);
      reader.readAsDataURL(xhr.response);
    }
  */
    //reader.readAsDataURL(xhr.response);
  //};
  //xhr.open('GET', url);
  xhr.send();
}



//post image data and process using cloudvision
app.post('/upload', upload.single('displayImage'), function(req, res, next) {
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
var token = "EAACjBDR8ZBqkBAFJNhLzEQLvqhhld8mBfZCdxcCWz2mcjvkTHw9W2nY0Q5JfkkUHferXTXZCr3TuDZC7pzHaeH12cPhT5iZAiZASPeaK4mbmtAVB0ChIQJZAgudIC0DzZBS5ZBhICmXeJjv03UtkTG6kT6Xfm1ThAeh5SVcG8eWZB10QZDZD";

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
      typeof(event.message.attachments) !== 'undefined' &&
      event.message.attachments.length == 1 &&
    	event.message.attachments[0].type == "image") {
    	var imgUrl = event.message.attachments[0].payload.url;
      console.log(imgUrl);
    	//result = urlfetch.fetch(imgUrl);
    	//if (result.status_code == 200) {
    		//save file
        //may need to get file extension
      //var image_name = 'test-img.png';
      //var filename = image_name; //will need to update path
    	//convertImgToDataURLviaFileReader(imgUrl);
      var options = {string: true};
      var b64img;

      base64.base64encoder(imgUrl, options, function(err, img) {
        if (err) {
          console.log(err);
        }
        console.log(img);
        b64img = img;
      });

      processImageFromB64(b64img);
      //download(imgUrl, filename, function() { //need file extension
      //  console.log("Downloaded.");
        //var bucket = gcs.bucket('receipt-read-bucket');
        //var localReadStream = fs.createReadStream(filename);
        //var remoteWriteStream = bucket.file(image_name).createWriteStream();
        //localReadStream.pipe(remoteWriteStream); //not sure what this does
      //});
      
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


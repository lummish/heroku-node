var Firebase = require('Firebase');
var geocoder = require('geocoder');

var db = new Firebase('https://blinding-inferno-7128.firebaseio.com/');


exports.create = function(user, order, price, location) {
	var order = {
		user: user,
		order: order,
		payment: {
			subtotal: ,
			tip: 
		}
		location: {
			location_name: ,
			address:
		},
		date: new Date().toString()
	}
}

get_name_of_location = function(lat, lon) {
	var reqArgs = 'latlng=' + lat + ',' + lon + '&key=' + api_key;
	var options = {
		hostname: "maps.gooogleapis.com",
		port: 80,
		path: '/maps/api/geocode/json?' + reqArgs,
		method: 'GET'
	}

	var geoRequest = http.get(options, function(res) {
		var body = '';
		var placeId = '';
		response.on('data', function(d) {
			body += d;
		});
		response.on('end', function() {
			var parsed = JSON.parse(body);
			placeId += parsed.place_id
		});
		return placeId;
	});


}
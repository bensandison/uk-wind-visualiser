function loadMap(){		/* constructs mapBox api uri and loads map as an image */
	mapKey = "pk.eyJ1IjoiYmVuLXNhbmRpc29uIiwiYSI6ImNrbXdzb25ucDBpNTMyb252NWUxZDJpMzAifQ.VihZeh8XW1EXJ3HDCTi6Yg"
	styleUrl = "ben-sandison/cknf0a2vx3ibf17o753pyt5ep"		/* url for my custom styling */
	mapUrl = "https://api.mapbox.com/styles/v1/" + styleUrl + "/static/" + mapData.lonMid + "," + mapData.latMid + "," + mapData.mapZoom + ",0/" + mapData.mapX + "x" + mapData.mapY + "?access_token=" + mapKey;
	
	mapImg = loadImage(mapUrl);		// load map to "mapImage"
}

function loadWeather(){		/* constructs openWeatherMaps api uri and loads data */
	let weatherKey = '5e48243f4e2c1794ffeb1248ec1503a7';   //api key
	let lonLeft = '-6', latBottom = '49.8', lonRight = '3', latTop  = '51.5', weatherZoom = '10';  //API call bounding box coords
	let weatherUrl = 'http://api.openweathermap.org/data/2.5/box/city?bbox=' + lonLeft + ',' + latBottom + ',' + lonRight + ',' + latTop + ',' + weatherZoom + '&appid=' + weatherKey + '&units=metric';

	data = loadJSON(weatherUrl);	//load weather data to "data" object
}

function calcCoords(){		/* Calculates X and Y position of cities */
	//These functions are used to convert Longitude and Latitude to X and Y positions
	//They use 'Mercator projection'
	function mercX(lon) {
		lon = radians(lon);
		let a = (256 / PI) * pow(2, mapData.mapZoom);
		let b = lon + PI;
		return a * b;
	}
	function mercY(lat){
		lat = radians(lat);
		let a = (256 / PI) * pow(2, mapData.mapZoom);
		let b = tan(PI/4 + lat/2);
		let c = PI - log(b);
		return a * c;
	}

	//These variables give us the central position of our map
	let cx = mercX(mapData.lonMid);
	let cy = mercY(mapData.latMid);

	//We then loop through and add the X and Y positions as properties of the data object
	for(let i=0; i<data.list.length; i++){
		data.list[i].xPos = mercX(data.list[i].coord.Lon) - cx;	//calculate x position
		data.list[i].yPos = mercY(data.list[i].coord.Lat) - cy;
	}
}

function calcAverages() {	/* function calculates averages and maximums of weather data */	
	//temp vars used to calc averages:
	let totalTemp = 0, totalWindSpeed = 0;
	let windDegrees = [];	//array of degrees will be needed to calculate average
	
	//created max and min wind / temp (give them extreme values to be overiden)
	data.maxWindSpeed = -100;
	data.minWindSpeed = 100;
	data.maxTemp = -100;
	data.minTemp = 100;

	//loop is used to calculate max and minimims for each city:
	for(let i = 0; i<data.list.length; i++){
		//max / mins:
		if (data.maxWindSpeed < data.list[i].wind.speed) data.maxWindSpeed = data.list[i].wind.speed;	//check if max -> add to var
		if (data.minWindSpeed > data.list[i].wind.speed) data.minWindSpeed = data.list[i].wind.speed;	//check if min -> add to var
		if (data.maxTemp < data.list[i].main.feels_like) data.maxTemp = data.list[i].main.feels_like;		//max temp
		if (data.minTemp > data.list[i].main.feels_like) data.minTemp = data.list[i].main.feels_like;

		totalTemp += data.list[i].main.feels_like;	//add temp to total
		totalWindSpeed += data.list[i].wind.speed;	//add wind to total

		windDegrees.push(data.list[i].wind.deg);	//add wind direction to array (to be used for avg)
	}

	//add averages to data object:
	data.averageWindSpeed = totalWindSpeed / data.list.length;	//calcs average
	data.averageTemp = totalTemp / data.list.length;

	//rounds averages to 2 dp:
	data.averageWindSpeed = Math.round((data.averageWindSpeed + Number.EPSILON) * 100) / 100;
	data.averageTemp = Math.round((data.averageTemp + Number.EPSILON) * 100) / 100;

	data.averageWindDirection = averageDegrees(windDegrees);	//send array to averageDegrees function to find mean wind direction
	data.averageWindDirection = Math.round((data.averageWindDirection + Number.EPSILON) * 100) / 100;
}

function averageDegrees(arr){	/* function that calculates the average angle from an array of angles */
	let x = 0, y = 0;	//stores total vector coordinates

	for(let i = 0; i < arr.length; i++){
		arr[i] = degToRad(arr[i]);	//convert to radians
		x += Math.cos(arr[i]);	//add x vector coord to x var
		y += Math.sin(arr[i]);	//add y vector cooord
	}
	let avg = radToDeg(Math.atan2(y, x));	//average angle in degrees
	return Math.round((avg + Number.EPSILON) * 100) / 100	//return average angle rounded to 2dp

	//radian conversion functions
	function degToRad(degrees) {
		return degrees * (Math.PI / 180);
	};
	function radToDeg(rad) {
		return rad * (180 / Math.PI);
	};
}
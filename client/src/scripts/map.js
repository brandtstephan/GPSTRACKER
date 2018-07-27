module.exports = class Map {
	constructor() {
		//Data
		this.tracks = {};
		this.oneTrack = {};
		this.allTrackNames = [];

		//First request from server
		getAllTracks(this);

		//TrackList variablen
		this.anzahl = 0;
		this.page = 1;
		this.numberpages = 0;
		//leaflet (Open source maps)
		this.l = require("leaflet");
		var trier = [49.75, 6.6333333];
		this.map = this.l.map("map").setView(trier, 13);
		this.l.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
			attribution: 'Map data & copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
			maxZoom: 18
		}).addTo(this.map);

		this.marker = this.l.marker(trier).addTo(this.map)
		.bindPopup("<canvas width='200' height='250' id='canvas'></canvas>");

		this.layer = this.l.geoJSON().addTo(this.map);
		this.lineColor = {
			color: "#FF0000",
			weight: 5,
			opacity: 1
		};

		//We save the buttons
		var nextBtn = document.getElementById("nextBtn");
		var prevBtn = document.getElementById("prevBtn");

		//Add their respective listeners and onClick methods
		nextBtn.addEventListener("click", () => {
			this.next();
		});

		prevBtn.addEventListener("click", () => {
			this.previous();
		});

		///Overwrite of the load and resize method of object Window
		//For intializing values and the recalculating
		//When the page gets resized
		let m = this;
		let handler1 = function () {
			m.init();
		};
		let handler = function () {
			m.fill();
		};
		window.addEventListener("load", handler1);
		window.addEventListener("resize", handler);
	}

	//This method sends a request to the server
	//And asks to get the information from /tracks/+id
	//And retrieve one specific track by its ID
	getTrackByID(id) {
		let map = this;
		let xtmlrequest = new XMLHttpRequest();
		let method = "GET";
		let url = "http://localhost:8080/tracks/";
		xtmlrequest.open(method, url + id, true);
		xtmlrequest.onreadystatechange = function () {
			if (xtmlrequest.readyState === XMLHttpRequest.DONE && xtmlrequest.status === 200) {
				map.oneTrack = JSON.parse(xtmlrequest.response);
				map.drawHighlight(map.oneTrack);

				var c = map.oneTrack.features[0].geometry.coordinates[0];
				var i = 1;
				//We get only the info needed
				//Coordinates and the height of the profile
				var coordinates = [];
				//While we arent adding undefined data
				//Iterate throught the JSON and push the info
				while (c !== undefined) {
					coordinates.push({
						long: map.oneTrack.features[0].geometry.coordinates[i][0],
						lat: map.oneTrack.features[0].geometry.coordinates[i][1],
						height: map.oneTrack.features[0].geometry.coordinates[i][2]
					});
					i += 1;
					c = map.oneTrack.features[0].geometry.coordinates[i];
				}
				//Called to draw the hoehenprofil of the track
				map.draw(coordinates);
			}
		};

		xtmlrequest.send();
	}
	//Draws from a GeoJSON a "highlight" on the map
	//with a specific track
	drawHighlight(track) {
		this.layer.clearLayers();
		this.layer.addData(track);
		this.layer.setStyle(this.lineColor);
		let bounds = this.layer.getBounds();
		this.map.fitBounds(bounds);
	}
	//Returns all tacks
	getTracks() {
		return this.tracks;
	}
	//Returns specific track
	getOneTrack() {
		return this.oneTrack;
	}

	//Used to fill dynamically the table with items
	//Not allowing each page to be able to get scroll down
	//Dynamically will create extra pages to place those "out of place" tracks
	fill() {
		this.anzahl = Math.floor(window.innerHeight / 24);
		var tab = document.getElementById("table");
		var fragment = document.createDocumentFragment();
		tab.innerHTML = "";

		//bestimme, wie viele Elemente in der Tabelle eingefügt werden

		//bestimme Anzahl Seiten
		this.numberpages = Math.ceil(this.allTrackNames.length / this.anzahl); //aufrunden

		//Kein Zugriff auf nichtexistente Seiten
		if (this.page > this.numberpages) {
			this.page = this.numberpages;
		}
		if (this.page < 1) {
			this.page = 1;
		}

		var begin = (this.page - 1) * this.anzahl; //erstes element der Tabelle bestimmen

		for (var i = begin; i < begin + this.anzahl; i++) {
			if (i >= this.allTrackNames.length) { break; }
			var tr = document.createElement("tr");
			var td = document.createElement("td");
			var text = document.createTextNode(this.allTrackNames[i].name);

			//Searchs for the element, the fired the event and takes the text inside
			//getId to find the id of that element
			//getTrackById to pick up the specific track from the server
			//to draw on the map.
			let map = this;
			td.addEventListener("click", function (e) {
				console.log(e);
				var i = map.getId(e.target.childNodes[0].data) + 1;
				map.getTrackByID(i);
			});
			td.appendChild(text);
			tr.appendChild(td);
			fragment.appendChild(tr);
		}

		tab.appendChild(fragment);
		document.getElementById("current").innerHTML = " Page: " + this.page;
		document.getElementById("total").innerHTML = " Total: " + this.numberpages;
	}

	getId(name) {
		console.log(name);
		for (var i = 0; i < this.allTrackNames.length; i++) {
			if (this.allTrackNames[i].name === name) {
				return i;
			}
		}
		return -1;
	}
	//Event fired when clicking "next" button
	next() {
		this.page += 1;
		this.fill();
	}
	//Event fired when clicking "previous" button
	previous() {
		this.page -= 1;
		this.fill();
	}
	//For initialization porpouses
	init() {
		this.page = 1;
		this.fill();
	}
	draw(tracks) {
		//Where the marker should be initialize
		var middlePoint = { lat: tracks[0].lat, long: tracks[0].long };
		this.marker.setLatLng([middlePoint.lat, middlePoint.long]);
		this.marker.openPopup();

		//We put a canvas on the marker to show the Hoehprofil
		var c = document.getElementById("canvas");
		var ctx = c.getContext("2d");

		//Hintergrundfarbe festlegen
		ctx.clearRect(0, 0, c.width, c.height);

		ctx.fillStyle = "#dbffef";
		ctx.fillRect(0, 0, c.width, c.height);

		//To create the height profil (Hoehenprofile)
		//We make a path of lines that get connected utilizing the heigh of the track
		ctx.moveTo(0, c.height - (this.returnHeight(tracks)[0] / 2));
		for (var i = 1; i < tracks.length; i++) {
			ctx.lineTo(i, c.height - (this.returnHeight(tracks)[i] / 2));
		}
		ctx.stroke();
	}

	//Saves the heights of the different coordinates into a variable
	returnHeight(track) {
		let hoehe = {};
		for (var i = 0; i < track.length; i++) {
			hoehe[i] = track[i].height;
		}
		return hoehe;
	}
};

//Used to grab all the tracks from the server and save them on a variable
function getAllTracks(m) {
	let xtmlrequest = new XMLHttpRequest();
	let method = "GET";
	let url = "http://localhost:8080/tracks";

	//We make a request to the server RESTful to grab data from the URI specified
	xtmlrequest.open(method, url, true);
	xtmlrequest.onreadystatechange = function () {
		//When everything works out
		if (xtmlrequest.readyState === XMLHttpRequest.DONE && xtmlrequest.status === 200) {
			//We parse that data into JSON
			//And save it on a variable
			m.tracks = JSON.parse(xtmlrequest.response);
			var c = m.tracks[1];
			var i = 1;
			//And save all the names too (to fill the table)
			while (c !== undefined) {
				m.allTrackNames.push({
					name: m.tracks[i].features[0].properties.name
				});
				i += 1;
				c = m.tracks[i];
			}
			console.log("The tracks are: ", m.getTracks());
			console.log("alltracklistlength", m.allTrackNames.length);
			//And then we call the fill method to fill the list of tracks
			m.fill();
		}
	};
	xtmlrequest.send();
}

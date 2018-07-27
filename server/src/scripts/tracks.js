let trackList = {};
let trackJson = {};

const assetsFolder = __dirname + "/../assets/";
const fs = require("fs");

module.exports = class tracks {
	constructor() {
		//We iterate through our assets folder
		fs.readdirSync(assetsFolder).forEach(file => {
			//We cut parts of the name to become the ID of the specific track
			var id = file.substr(0, file.indexOf("."));
			//Read all the elements and store it on a list
			trackList[file] = fs.readFileSync(assetsFolder + file, "utf-8");
			//We parse that list into objects and store it on an array
			trackJson[id] = JSON.parse(trackList[file]);
		});
	}
	//Returns the list of all tracks
	get getAllTracks() {
		return trackJson;
	}

	//Gets a track by id
	getTrackById(id) {
		//Only values bigger than 0 are allowed for filtering
		//Track on the position 0 is undefinied, since ID's are composed
		//By cutting parts of the JSON's name
		if (id > 0) {
			return trackJson[id];
		}
		else {
			return trackJson[1];
		}
	}

};


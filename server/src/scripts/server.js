"use strict";
console.log("Loading server...");
const port = process.argv[2];
const express = require("express");
let app = express();
const path = require("path");
//Important is the router here
let router = new express.Router();

const Tracks = require("./tracks");
let track = new Tracks();

module.exports = class Server {
	constructor() {
		//Routing table where the data is stored
		//Requests coming from the server will nbe filteres and 
		//Act accordingly
		router.get("/tracks", function (request, response) {
			console.log("All tracks has been sent.");
			response.send(track.getAllTracks);
		});

		router.get("/tracks/:id", (request, response) => {
			let id = request.params.id;
			if (!track.getTrackById(id)) {
				response.sendStatus(404);
			}
			else {
				console.log("Track " + id + " has been sent.");
				response.send(track.getTrackById(id));
			}
		});
		//Starting the server
		app.use(express.static(path.join("dist")), router);
		app.listen(port);
		console.log("Server loaded!");
	}
};
